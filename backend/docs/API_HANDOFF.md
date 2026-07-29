# 백엔드 API 연동 핸드오프

`frontend/docs/API_HOOK_CONTRACTS.md`(이하 **명세**)와 실제 백엔드를 대조한 결과다.
**명세와 다른 부분이 있으니 0번을 먼저 읽을 것.**

---

## 0. 명세와 다른 점 (먼저 합의 필요)

| # | 명세 | 실제 | 영향 |
|---|---|---|---|
| 1 | Base URL `/api/v1` | `/api` | 명세대로 붙이면 **전부 404** |
| 2 | Class role `ADMIN \| STUDENT` | `MANAGER \| STUDENT` | 역할 분기 코드가 안 맞음 |
| 3 | 에러 `{code, message, requestId}` | `/api/auth/**`만 그 형식 | 나머지는 `requestId`도 `message`도 없음 |
| 4 | `GET /users/{id}/report-summary` | `POST /api/v1/users/{id}/report-summary` | 메서드·경로 둘 다 다름 |

**1번 예외**: `report-summary` 하나만 `/api/v1`을 쓴다. 나머지 전 엔드포인트는 `/api`다.

**3번 보충**: `/api/auth/**` 밖의 에러는 Spring 기본 포맷으로 나가고, **한글 에러 메시지가 응답에 포함되지 않는다.**

```json
{ "timestamp": "...", "status": 403, "error": "Forbidden", "path": "/api/sessions" }
```

지금은 **HTTP 상태 코드로만 분기**해야 한다. 백엔드에서 `server.error.include-message=always`를 켜거나 전역 핸들러를 추가하면 해결되니 백엔드 쪽에 요청할 것.

---

## 1. 공통

### Base URL

```
VITE_API_BASE_URL=http://localhost:8080/api
```

### 인증 — httpOnly 쿠키

토큰은 헤더가 아니라 **쿠키**로 오간다. JS에서 읽을 수 없다.

- `ACCESS_TOKEN` — `path=/`, 24시간
- `REFRESH_TOKEN` — `path=/api/auth`, 14일

**모든 요청에 credentials를 켜야 한다.**

```ts
// fetch
fetch(url, { credentials: 'include' })

// axios
axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL, withCredentials: true })
```

401을 받으면 `POST /api/auth/refresh` 후 재시도. 리프레시 토큰은 회전되므로 **동시 갱신 요청이 겹치지 않게** 큐잉할 것.

로그인 상태 복원은 `GET /api/auth/me`로 한다(쿠키를 직접 못 읽으므로).

### CORS

`http://localhost:5173`만 허용되어 있다(`app.cors.allowed-origin-patterns`). 다른 포트를 쓰면 백엔드에 알릴 것.

### 목록 응답 — 두 가지가 섞여 있음

명세의 `PageResponse` 형식:

```json
{ "data": [ ... ], "meta": { "page": 0, "size": 20, "total": 137 } }
```

이 형식을 쓰는 것: `GET /api/tracks`, `GET /api/users`, `GET /api/notices`

**그냥 배열로 반환하는 것**: `GET /api/sessions`, `GET /api/sessions/{id}/participants`,
`GET /api/sessions/{id}/messages`, `GET /api/classes/me`

네트워크 레이어에서 흡수하거나, 백엔드에 통일을 요청할 것.

---

## 2. 지금 붙일 수 있는 엔드포인트

### 인증

| 메서드 | 경로 | 권한 | 비고 |
|---|---|---|---|
| POST | `/api/auth/login` | - | `{email, password}` |
| POST | `/api/auth/refresh` | 쿠키 | 액세스 토큰 재발급 |
| POST | `/api/auth/logout` | 쿠키 | 204 |
| GET | `/api/auth/me` | 로그인 | 세션 복원용 |

`login` / `refresh` / `me` 응답:

```json
{ "id": 10, "name": "김태수", "email": "a@qurie.com", "role": "MANAGER", "enterpriseId": 1 }
```

`role`은 `MASTER | MANAGER | STUDENT`. **`classId`는 없다** — 아래 `/api/classes/me`로 따로 받아야 한다.

### 초대 → 회원가입

가입은 **초대 링크가 있어야만** 가능하다. 이메일·역할·소속 반은 초대에 이미 박혀 있어 가입 폼에서 받지 않는다.

| 메서드 | 경로 | 권한 |
|---|---|---|
| POST | `/api/invitations` | MASTER(→매니저), MANAGER(→학생) |
| GET | `/api/invitations/{token}` | **비로그인** (가입 폼 프리필) |
| POST | `/api/users` | **비로그인** (가입 완료) |

```jsonc
// POST /api/invitations
{ "email": "new@qurie.com", "classId": 5, "role": "STUDENT" }

// 201 — token/signUpUrl은 이 응답에서만 나온다. 다시 조회 불가
{
  "id": 3, "email": "new@qurie.com", "role": "STUDENT",
  "classId": 5, "className": "서울 1반",
  "expiresAt": "2026-08-04T10:00:00",
  "token": "xk3...", "signUpUrl": "http://localhost:5173/signup?token=xk3..."
}
```

**가입 화면 라우트는 `/signup?token=...`으로 맞춰야 한다.** 백엔드가 이 형태로 링크를 만들어 메일에 넣는다.

```jsonc
// GET /api/invitations/{token} — 폼 프리필용. 이메일·반은 읽기 전용으로 표시
{ "email": "new@qurie.com", "role": "STUDENT", "classId": 5, "className": "서울 1반",
  "expiresAt": "2026-08-04T10:00:00" }

// POST /api/users
{ "token": "xk3...", "password": "at-least-8", "name": "홍길동" }
// 201 { userId, enterpriseId, email, name, role, createdAt }
```

만료·이미 사용된 토큰은 전부 **404**로 온다(유효한 토큰 탐색 방지). 화면에서는 "유효하지 않거나 만료된 초대"로 처리할 것.

### 사용자

| 메서드 | 경로 | 권한 | 응답 |
|---|---|---|---|
| GET | `/api/users?role=&q=&page=&size=` | MASTER | `PageResponse<UserSummary>` |
| GET | `/api/users/{userId}` | 본인 또는 소속 마스터 | `UserProfile` |
| PATCH | `/api/users/{userId}` | 본인 또는 소속 마스터 | `UserProfile` |

```jsonc
// UserSummary — 마스터 대시보드 매니저 카드는 role=MANAGER&size=3
{ "id": 10, "name": "김태수", "email": "...", "role": "MANAGER",
  "weeklySessionCount": 4, "lastSessionCreatedAt": "2026-07-27T09:00:00" }

// UserProfile
{ "userId": 10, "enterpriseId": 1, "email": "...", "name": "김태수",
  "role": "MANAGER", "createdAt": "...", "updatedAt": "..." }

// PATCH — 보낸 항목만 반영. 비밀번호 변경 시 currentPassword 필수(마스터는 생략 가능)
{ "name": "김태수2", "currentPassword": "old", "newPassword": "new12345" }
```

명세의 `PATCH /auth/password`는 **없다.** 비밀번호 변경은 위 PATCH에 통합돼 있다.

`GET /api/users` 정렬은 활동량 desc 고정이다. `sort` 파라미터는 아직 안 먹는다.

### 트랙 / 클래스

| 메서드 | 경로 | 권한 |
|---|---|---|
| POST | `/api/tracks` | MASTER |
| GET | `/api/tracks?q=&tech=&page=&size=` | MASTER, MANAGER |
| POST | `/api/classes` | MASTER |
| GET | `/api/classes/me` | 로그인 |

```jsonc
// GET /api/tracks → PageResponse<TrackSummary>
{ "id": 1, "name": "Java 트랙", "description": "...", "tech": "JAVA", "classCount": 3 }

// POST /api/classes
{ "trackId": 1, "classNumber": 1, "name": "서울 1반",
  "capacity": 30, "description": "...", "startedAt": "...", "endedAt": "..." }

// GET /api/classes/me → ClassResponse[] (배열, PageResponse 아님)
[{ "id": 5, "trackId": 1, "classNumber": 1, "name": "서울 1반", "capacity": 30,
   "description": "...", "startedAt": null, "endedAt": null,
   "createdAt": "...", "updatedAt": "..." }]
```

**`GET /api/classes/me`가 핵심이다.** 로그인 응답에 `classId`가 없으므로, 세션 목록을 부르기 전에 반드시 이걸로 `classId`를 얻어야 한다. 마스터는 빈 배열이 온다(마스터는 반 명단에 속하지 않음).

`GET /api/tracks/{id}`, `GET /api/classes` 목록, 클래스 수정·삭제는 **아직 없다.**

### 세션(방)

| 메서드 | 경로 | 권한 |
|---|---|---|
| POST | `/api/sessions` | **해당 반 소속** |
| GET | `/api/sessions?classId=` | **해당 반 소속** |
| GET | `/api/sessions/{id}` | 없음(무인증) |
| PATCH | `/api/sessions/{id}` | 없음(무인증) |
| DELETE | `/api/sessions/{id}` | 없음(무인증) |
| GET | `/api/sessions/{id}/participants` | 해당 반 소속 |

```jsonc
// POST /api/sessions — createdBy는 보내지 않는다(JWT에서 가져감)
{ "classId": 5, "title": "1교시 방" }

// SessionResponse
{ "id": 7, "classId": 5, "title": "1교시 방", "createdBy": 10, "active": true,
  "createdAt": "...", "endedAt": null, "updatedAt": "..." }

// GET /api/sessions?classId=5 → SessionResponse[] (열린 방만, 배열)

// PATCH — 제목 변경 또는 방 닫기. active:true(재오픈)는 400
{ "title": "새 제목", "active": false }
```

명세의 `status=ACTIVE` 파라미터는 없다 — **목록은 항상 열린 방만** 반환한다.
`?mine=true`도 없다. 학생 대시보드는 `/api/classes/me` → 각 반의 `/api/sessions?classId=`로 조합할 것.

`GET/PATCH/DELETE /api/sessions/{id}`는 아직 인가가 없다. **곧 막힐 예정이니 미리 로그인 상태로 호출할 것.**

### 채팅

**이력 (REST)**

```
GET /api/sessions/{sessionId}/messages?beforeId=&size=
```

- 해당 반 소속만 호출 가능
- `size` 기본 50, 최대 100 (벗어나면 400)
- **최신 → 과거(id desc) 순으로 온다. 화면에 뿌릴 때 뒤집을 것**
- 위로 스크롤할 때 화면의 가장 오래된 메시지 id를 `beforeId`로 넘기면 그 이전 것을 준다

```jsonc
[{ "id": 120, "sessionId": 7, "senderId": 10, "senderName": "김태수",
   "content": "안녕하세요", "createdAt": "2026-07-28T10:00:00" }]
```

**실시간 (WebSocket + STOMP)**

- 엔드포인트: `ws://localhost:8080/ws`
- **SockJS 아님.** 순수 WebSocket으로 붙어야 한다 (`@stomp/stompjs`의 `brokerURL` 사용)
- 인증은 핸드셰이크 쿠키로 처리된다. 별도 헤더 불필요 (같은 브라우저 세션이면 자동)

```ts
import { Client } from '@stomp/stompjs';

const client = new Client({ brokerURL: 'ws://localhost:8080/ws' });

client.onConnect = () => {
  // 1) 에러 채널 먼저
  client.subscribe('/user/queue/errors', (f) => {
    const { message, occurredAt } = JSON.parse(f.body);
  });

  // 2) 메시지 / 참여자
  client.subscribe(`/topic/sessions/${sessionId}/messages`, (f) => {
    const msg = JSON.parse(f.body);      // ChatMessageResponse
  });
  client.subscribe(`/topic/sessions/${sessionId}/participants`, (f) => {
    const ev = JSON.parse(f.body);       // { type: 'ENTER'|'LEAVE', participant, participants[], occurredAt }
  });

  // 3) 입장 — 이걸 보내기 전에는 메시지 전송이 403이다
  client.publish({ destination: `/app/sessions/${sessionId}/enter`, body: '{}' });
};

// 전송
client.publish({
  destination: `/app/sessions/${sessionId}/messages`,
  body: JSON.stringify({ content: '안녕하세요' }),   // 1~1000자
});

// 퇴장 버튼
client.publish({ destination: `/app/sessions/${sessionId}/leave`, body: '{}' });
```

주의할 점:

- **`enter`를 먼저 보내야 한다.** 안 보내고 메시지를 쏘면 403
- 보낸 사람도 `/topic/.../messages`로 자기 메시지를 되받는다 → **낙관적 렌더링 하지 말고 서버 에코를 그리면 된다** (중복 방지)
- 참여자 이벤트는 **첫 연결/마지막 연결에서만** 발생한다. 같은 사용자가 탭을 2개 열어도 입장 이벤트는 1번
- 창을 그냥 닫으면 서버가 disconnect를 감지해 퇴장 처리한다. `leave`를 못 보내도 괜찮다
- 서버가 재시작되면 참여자 목록이 초기화된다(인메모리). 채팅 이력은 DB라 유지된다
- 허용되지 않은 destination을 구독하면 STOMP ERROR와 함께 **연결이 끊긴다**

### 공지 / 분석

| 메서드 | 경로 | 응답 |
|---|---|---|
| GET | `/api/notices?scope=&trackId=&classId=&page=&size=` | `PageResponse<Notice>` |
| GET | `/api/analytics/overview` | 대시보드 KPI |

`scope`는 `ENTERPRISE | TRACK | CLASS`. 공지 생성·수정·삭제는 아직 없다.

### 기타 (생성만 있음)

`POST /api/groups`, `POST /api/projects`, `POST /api/quiz`,
`POST /api/v1/users/{userId}/report-summary`, `POST /api/sessions/{sessionId}/reports`

전부 **생성만** 있고 조회·수정·삭제가 없다.

---

## 3. 아직 없는 것 — 목업 유지 필요

- 트랙 상세 (`/tracks/{id}`, `/tracks/{id}/classes`, `/tracks/{id}/managers`), 트랙 삭제
- 클래스 목록·수정·삭제, **클래스 멤버 목록** (`/classes/{id}/members`)
- 초대 목록 (`?status=PENDING`), 재발송, 취소
- 공지 생성·수정·삭제
- 트랙/클래스/사용자 분석 (`/analytics/tracks/{id}` 등) — `overview`만 있음
- 그룹 목록·수정·삭제
- 리포트 조회 (`GET /reports?userId=`), `GET /users/{id}/report-summary`
- `?mine=true`, `?status=`, `sort=` 파라미터 전반

---

## 4. 로컬에서 돌려보려면

`class_users`(반 명단)에 없으면 방 생성·목록·입장이 전부 403이다. 순서대로 만들어야 한다.

1. `enterprises`, `masters` 행 — 컨트롤러가 없어 **DB 직접 INSERT** (비밀번호는 BCrypt 해시)
2. 마스터 로그인 → `POST /api/tracks` → `POST /api/classes`
3. `POST /api/invitations` `{email, classId, role:"MANAGER"}` → 응답의 `signUpUrl` 사용
4. `GET /api/invitations/{token}` → `POST /api/users` → 매니저 로그인
5. 매니저가 `POST /api/invitations` `{..., role:"STUDENT"}` → 학생 가입
6. `GET /api/classes/me` → `POST /api/sessions` → `GET /api/sessions?classId=` → WebSocket

SMTP(`SPRING_MAIL_HOST` 등)를 설정하지 않으면 메일은 발송되지 않고, 응답의 `signUpUrl`을 수동으로 전달하면 된다.

**기존에 가입해 둔 계정은 반 명단이 비어 있어 전부 403이다.** 초대로 다시 가입시키거나 `class_users`에 직접 넣을 것.
