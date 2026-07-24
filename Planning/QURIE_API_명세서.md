# Qurie API 명세서

- 문서 버전: v0.1
- 작성 기준일: 2026-07-23
- 상태: Draft
- 기준: Qurie ERD, 요구사항 명세서 v1.0, UI 목업 피드백
- Base URL: `/api/v1`

## 1. 설계 원칙

### 1.1 리소스 계층

```text
Enterprise
├─ Master
├─ OrdinaryUser (MANAGER | STUDENT)
├─ Track
│  └─ Class
│     ├─ ClassUser
│     ├─ Session
│     │  ├─ Project
│     │  │  └─ Quiz
│     │  │     └─ QuizProgress
│     │  └─ Report
│     └─ Group
│        └─ GroupParticipant
└─ Notice
```

모든 탐색 및 분석 화면은 `트랙 → 클래스 → 세션` 순서를 따른다.

### 1.2 역할과 관리 범위

| 역할 | 관리 범위 | 허용 작업 |
|---|---|---|
| `MASTER` | 기업, 회원, 트랙 | 기업 계정 관리, 매니저/학생 초대 및 상태 관리, 트랙 CRUD, 트랙·클래스 집계 분석 조회 |
| `MANAGER` | 담당 클래스 이하 | 클래스 CRUD, 학생 배정, 그룹·세션·프로젝트·퀴즈·공지·리포트 운영 |
| `STUDENT` | 본인 학습 범위 | 나의 세션 조회/참여, 퀴즈 응시, 본인 리포트·공지·계정 조회 |

권한 규칙:

- `MASTER`는 클래스 이하의 상세 데이터를 집계·분석 목적으로 조회할 수 있지만 생성·수정·삭제할 수 없다.
- `MANAGER`는 자신이 담당자로 배정된 클래스에 대해서만 클래스 이하 리소스를 관리한다.
- `STUDENT`는 자신이 배정된 클래스·그룹·세션 및 본인 데이터만 조회한다.
- `TEMP_ADMIN` 역할은 사용하지 않는다.
- 그룹 역할 `LEADER | PARTICIPANT`는 시스템 역할과 별개다.

### 1.3 공통 규칙

- 인증: `Authorization: Bearer {accessToken}`
- 날짜/시간: ISO 8601 UTC 문자열. 예: `2026-07-23T06:30:00Z`
- Content-Type: `application/json`
- ID: JSON에서는 정밀도 손실 방지를 위해 문자열로 반환한다.
- 목록 기본 정렬: `createdAt,desc`
- 목록 기본 페이지 크기: `20`, 최대 `100`
- 삭제는 참조 데이터와 감사 이력을 고려하여 논리 삭제를 우선한다.

### 1.4 공통 응답

성공:

```json
{
  "data": {},
  "meta": {
    "requestId": "req_01J..."
  }
}
```

페이지 목록:

```json
{
  "data": {
    "items": [],
    "page": 0,
    "size": 20,
    "totalElements": 0,
    "totalPages": 0
  },
  "meta": {
    "requestId": "req_01J..."
  }
}
```

오류:

```json
{
  "error": {
    "code": "CLASS_ACCESS_DENIED",
    "message": "해당 클래스에 접근할 권한이 없습니다.",
    "fieldErrors": []
  },
  "meta": {
    "requestId": "req_01J..."
  }
}
```

## 2. 인증 및 계정

### 2.1 엔드포인트

| Method | Path | 권한 | 설명 |
|---|---|---|---|
| `POST` | `/auth/sign-up/master` | Admin | 기업과 마스터 계정 동시 생성 |
| `POST` | `/auth/sign-up/manager` | Master + 초대 토큰 | 매니저 가입 |
| `POST` | `/auth/sign-up/student` | Public + 초대 토큰 | 학생 가입 |
| `POST` | `/auth/login` | Public | 공통 로그인 |
| `POST` | `/auth/token/refresh` | Public + Refresh Token | 토큰 재발급 |
| `POST` | `/auth/logout` | 로그인 사용자 | 현재 세션 로그아웃 |
| `POST` | `/auth/password/forgot` | Public | 비밀번호 재설정 메일 요청 |
| `POST` | `/auth/password/reset` | Public + 재설정 토큰 | 비밀번호 재설정 |
| `GET` | `/me` | 로그인 사용자 | 내 계정 조회 |
| `PATCH` | `/me` | 로그인 사용자 | 이름 등 계정 정보 수정 |
| `PATCH` | `/me/password` | 로그인 사용자 | 비밀번호 변경 |

회원가입 UI 경로는 역할별로 분리한다.

```text
/sign-up/master
/sign-up/manager?token=...
/sign-up/student?token=...
```

#### `POST /auth/sign-up/master`

```json
{
  "enterpriseName": "Acme Academy",
  "email": "master@acme.com",
  "password": "Qurie!2026",
  "name": "김마스터"
}
```

```json
{
  "data": {
    "accessToken": "eyJ...",
    "refreshToken": "eyJ...",
    "expiresInSec": 3600,
    "user": {
      "id": "1",
      "enterpriseId": "1",
      "role": "MASTER",
      "email": "master@acme.com",
      "name": "김마스터"
    }
  }
}
```

#### `POST /auth/sign-up/manager`

#### `POST /auth/sign-up/student`

두 API의 요청 형식은 동일하며 초대 토큰이 기대 역할과 일치해야 한다.

```json
{
  "invitationToken": "inv_7c82...",
  "password": "Qurie!2026",
  "name": "김지민"
}
```

#### `POST /auth/login`

```json
{
  "email": "manager@acme.com",
  "password": "Qurie!2026"
}
```

응답의 `role`을 기준으로 역할별 대시보드로 이동한다.

#### `GET /me`

```json
{
  "data": {
    "id": "21",
    "enterpriseId": "1",
    "email": "manager@acme.com",
    "name": "김지민",
    "role": "MANAGER",
    "status": "ACTIVE",
    "createdAt": "2026-07-01T00:00:00Z"
  }
}
```

## 3. 초대 및 회원 관리

초대 현황은 대시보드가 아니라 회원 관리 화면에서 조회한다.

### 3.1 초대

| Method | Path | 권한 | 설명 |
|---|---|---|---|
| `POST` | `/invitations` | `MASTER`, 담당 `MANAGER` | 초대 발송 |
| `GET` | `/invitations` | `MASTER`, 담당 `MANAGER` | 초대 목록 |
| `GET` | `/invitations/verify?token={token}` | Public | 초대 토큰 검증 |
| `POST` | `/invitations/{invitationId}/resend` | 발송 권한자 | 초대 재발송 |
| `POST` | `/invitations/{invitationId}/cancel` | 발송 권한자 | 대기 중 초대 취소 |

`POST /invitations`

```json
{
  "email": "student@acme.com",
  "role": "STUDENT",
  "trackId": "10",
  "classId": "31",
  "expiresInHours": 72
}
```

규칙:

- `MASTER`는 `MANAGER`, `STUDENT` 초대를 발송할 수 있다.
- `MANAGER`는 담당 클래스의 `STUDENT`만 초대할 수 있다.
- 동일 기업 내 가입 이메일 또는 유효한 `PENDING` 초대가 있으면 `409`를 반환한다.
- 상태는 `PENDING → ACCEPTED | EXPIRED | CANCELED`로 전이한다.

### 3.2 회원

| Method | Path | 권한 | 설명 |
|---|---|---|---|
| `GET` | `/members` | `MASTER` | 기업 회원 목록 |
| `GET` | `/members/summary` | `MASTER` | 역할별 회원 수와 학생 수 변동 |
| `GET` | `/members/{memberId}` | `MASTER` | 회원 상세 |
| `PATCH` | `/members/{memberId}/status` | `MASTER` | 계정 활성/비활성 처리 |
| `GET` | `/managers/{managerId}/activity` | `MASTER` | 강사 활동 상세 |

`GET /members` 쿼리:

| 이름 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `role` | enum | N | `MANAGER`, `STUDENT` |
| `status` | enum | N | `ACTIVE`, `INACTIVE` |
| `trackId` | bigint | N | 소속 트랙 필터 |
| `classId` | bigint | N | 소속 클래스 필터 |
| `keyword` | string | N | 이름 또는 이메일 |
| `page`, `size` | integer | N | 페이지 |

`GET /members/summary?period=30d`

```json
{
  "data": {
    "totalManagers": 12,
    "totalStudents": 184,
    "studentDelta": 7,
    "joinedStudents": 11,
    "leftStudents": 4,
    "period": {
      "from": "2026-06-24",
      "to": "2026-07-23"
    }
  }
}
```

`GET /managers/{managerId}/activity?from=2026-07-17&to=2026-07-23`

```json
{
  "data": {
    "manager": {
      "id": "21",
      "name": "김지민"
    },
    "summary": {
      "sessionsCreated": 4,
      "sessionsOperated": 6,
      "quizzesCreated": 18,
      "reportsCommented": 12,
      "lastActiveAt": "2026-07-23T05:10:00Z"
    },
    "daily": [
      {
        "date": "2026-07-23",
        "activityCount": 9
      }
    ]
  }
}
```

## 4. 역할별 대시보드

| Method | Path | 권한 | 설명 |
|---|---|---|---|
| `GET` | `/master/dashboard` | `MASTER` | 트랙 카드, 강사 활동, 경고 클래스 |
| `GET` | `/manager/dashboard` | `MANAGER` | 오늘의 세션과 학생 목록 |
| `GET` | `/student/dashboard` | `STUDENT` | 나의 세션 캐러셀 데이터 |

### 4.1 마스터 대시보드

`GET /master/dashboard?from=2026-07-17&to=2026-07-23`

```json
{
  "data": {
    "summary": {
      "trackCount": 4,
      "activeClassCount": 9,
      "managerCount": 12,
      "studentCount": 184
    },
    "tracks": [
      {
        "id": "10",
        "name": "자바 전공",
        "classCount": 3,
        "studentCount": 72,
        "activeSessionCount": 2,
        "accuracyRate": 84.2,
        "completionRate": 91.0,
        "activityRate": 88.9,
        "rating": null
      }
    ],
    "managerActivities": [
      {
        "managerId": "21",
        "managerName": "김지민",
        "activityCount": 19,
        "sessionsOperated": 4,
        "lastActiveAt": "2026-07-23T05:10:00Z"
      }
    ],
    "warningClasses": [
      {
        "classId": "31",
        "trackId": "10",
        "classNumber": 2,
        "severity": "WARNING",
        "reasons": [
          {
            "code": "LOW_ACTIVITY",
            "value": 42.5,
            "threshold": 60.0
          }
        ]
      }
    ]
  }
}
```

`activityRate`는 조회 기간 중 한 번 이상 학습 활동을 기록한 학생 수를 재적 학생 수로 나눈 비율이다.

### 4.2 매니저 대시보드

`GET /manager/dashboard?classId=31&date=2026-07-23`

```json
{
  "data": {
    "class": {
      "id": "31",
      "trackId": "10",
      "trackName": "자바 전공",
      "classNumber": 2
    },
    "todaySessions": [
      {
        "id": "101",
        "slug": "spring-security-basics",
        "isActive": true,
        "participantCount": 24,
        "quizCount": 10,
        "completionRate": 75.0
      }
    ],
    "students": [
      {
        "id": "301",
        "name": "박민수",
        "groupName": "A조",
        "todayActivityStatus": "ACTIVE",
        "lastActiveAt": "2026-07-23T05:45:00Z"
      }
    ]
  }
}
```

오늘의 세션 응답에는 UI에서 제거하기로 한 세션 시간 표시용 필드를 제공하지 않는다. 전체 세션은 스크롤 목록으로 노출하며 `todaySessions`를 별도 축약하지 않는다.

### 4.3 학생 대시보드

`GET /student/dashboard`

```json
{
  "data": {
    "mySessions": [
      {
        "id": "101",
        "classId": "31",
        "trackName": "자바 전공",
        "className": "2반",
        "slug": "spring-security-basics",
        "isActive": true,
        "progressStatus": "IN_PROGRESS",
        "quizCount": 10,
        "completedQuizCount": 4
      }
    ]
  }
}
```

다가오는 일정과 내 성과 요약은 대시보드 계약에 포함하지 않는다.

## 5. 트랙

| Method | Path | 권한 | 설명 |
|---|---|---|---|
| `POST` | `/tracks` | `MASTER` | 트랙 생성 |
| `GET` | `/tracks` | 로그인 사용자 | 접근 가능한 트랙 목록 |
| `GET` | `/tracks/{trackId}` | 접근 가능한 사용자 | 트랙 상세 |
| `PATCH` | `/tracks/{trackId}` | `MASTER` | 트랙 수정 |
| `DELETE` | `/tracks/{trackId}` | `MASTER` | 트랙 삭제 |
| `GET` | `/tracks/{trackId}/classes` | 접근 가능한 사용자 | 트랙의 클래스 목록 |
| `GET` | `/tracks/{trackId}/managers` | `MASTER`, 배정된 `MANAGER` | 트랙 담당 매니저 목록 |
| `POST` | `/tracks/{trackId}/managers/{managerId}` | `MASTER` | 트랙 담당 매니저 배정 |
| `DELETE` | `/tracks/{trackId}/managers/{managerId}` | `MASTER` | 트랙 담당 매니저 해제 |

`POST /tracks`

```json
{
  "name": "자바 전공",
  "description": "Java/Spring 기반 전공자 과정"
}
```

```json
{
  "data": {
    "id": "10",
    "enterpriseId": "1",
    "name": "자바 전공",
    "description": "Java/Spring 기반 전공자 과정",
    "createdAt": "2026-07-23T06:00:00Z",
    "updatedAt": "2026-07-23T06:00:00Z"
  }
}
```

동일 기업 내 트랙 이름은 중복될 수 없다.

마스터가 매니저를 트랙에 배정하면 해당 매니저가 트랙 아래의 클래스를 관리할 수 있다. 클래스 생성자는 생성된 클래스의 담당 매니저로 자동 배정된다.

## 6. 클래스 및 학생 관리

### 6.1 클래스

| Method | Path | 권한 | 설명 |
|---|---|---|---|
| `POST` | `/tracks/{trackId}/classes` | `MANAGER` | 담당 트랙에 클래스 생성 |
| `GET` | `/classes/{classId}` | 접근 가능한 사용자 | 클래스 상세 |
| `PATCH` | `/classes/{classId}` | 담당 `MANAGER` | 클래스 수정 |
| `DELETE` | `/classes/{classId}` | 담당 `MANAGER` | 클래스 삭제 |
| `GET` | `/classes/{classId}/managers` | `MASTER`, 담당 `MANAGER` | 담당 매니저 목록 |
| `POST` | `/classes/{classId}/managers/{managerId}` | 담당 `MANAGER` | 같은 트랙의 매니저를 클래스에 배정 |
| `DELETE` | `/classes/{classId}/managers/{managerId}` | 담당 `MANAGER` | 클래스 담당 매니저 해제 |

`POST /tracks/{trackId}/classes`

```json
{
  "classNumber": 2,
  "description": "2026년 하반기 2반",
  "startedAt": "2026-08-01T00:00:00Z",
  "endedAt": "2026-12-31T14:59:59Z"
}
```

`classNumber`는 전역이 아니라 같은 트랙 안에서만 고유해야 한다.

클래스 담당자로 추가할 수 있는 사용자는 먼저 해당 트랙의 매니저로 배정되어 있어야 한다. 마지막 담당 매니저는 해제할 수 없다.

### 6.2 학생 목록과 오늘의 액티비티

| Method | Path | 권한 | 설명 |
|---|---|---|---|
| `GET` | `/classes/{classId}/students` | 담당 `MANAGER`, `MASTER` | 학생 목록 |
| `GET` | `/classes/{classId}/students/activity` | 담당 `MANAGER`, `MASTER` | 오늘의 액티비티 탭 |
| `POST` | `/classes/{classId}/students/{studentId}` | 담당 `MANAGER` | 학생 배정 |
| `DELETE` | `/classes/{classId}/students/{studentId}` | 담당 `MANAGER` | 학생 배정 해제 |
| `GET` | `/classes/{classId}/students/{studentId}` | 담당 `MANAGER`, 본인 | 학생 현황 |
| `GET` | `/classes/{classId}/students/{studentId}/sessions` | 담당 `MANAGER`, 본인 | 학생의 세션 이력 |

`GET /classes/{classId}/students` 쿼리:

| 이름 | 타입 | 설명 |
|---|---|---|
| `groupId` | bigint | 그룹 필터 |
| `keyword` | string | 이름/이메일 검색 |
| `status` | enum | `ACTIVE`, `INACTIVE` |
| `page`, `size` | integer | 페이지 |

`GET /classes/{classId}/students/activity?date=2026-07-23`

```json
{
  "data": {
    "date": "2026-07-23",
    "summary": {
      "activeStudents": 21,
      "inactiveStudents": 3,
      "activityRate": 87.5
    },
    "students": [
      {
        "studentId": "301",
        "name": "박민수",
        "status": "ACTIVE",
        "sessionJoinCount": 1,
        "quizAttemptCount": 8,
        "quizCompletionRate": 80.0,
        "lastActiveAt": "2026-07-23T05:45:00Z"
      }
    ]
  }
}
```

학생 상세 화면은 학생 관리 목록에서 학생을 클릭하여 진입한다. 별도 “학생 현황” 전역 탭은 두지 않는다.

## 7. 그룹

| Method | Path | 권한 | 설명 |
|---|---|---|---|
| `POST` | `/classes/{classId}/groups` | 담당 `MANAGER` | 그룹 생성 |
| `GET` | `/classes/{classId}/groups` | 접근 가능한 사용자 | 그룹 목록 |
| `GET` | `/groups/{groupId}` | 접근 가능한 사용자 | 그룹 상세 |
| `PATCH` | `/groups/{groupId}` | 담당 `MANAGER` | 그룹 수정 |
| `DELETE` | `/groups/{groupId}` | 담당 `MANAGER` | 그룹 삭제 |
| `POST` | `/groups/{groupId}/participants` | 담당 `MANAGER` | 참여자 배정 |
| `PATCH` | `/groups/{groupId}/participants/{studentId}` | 담당 `MANAGER` | 그룹 역할 변경 |
| `DELETE` | `/groups/{groupId}/participants/{studentId}` | 담당 `MANAGER` | 참여자 제외 |
| `POST` | `/classes/{classId}/groups/randomize` | 담당 `MANAGER` | 학생 무작위 그룹 생성 |

`POST /classes/{classId}/groups/randomize`

```json
{
  "groupCount": 4,
  "studentIds": ["301", "302", "303", "304"],
  "leaderSelection": "RANDOM",
  "preserveExistingGroups": false
}
```

```json
{
  "data": {
    "previewId": "grp_preview_01J...",
    "groups": [
      {
        "name": "1조",
        "participants": [
          {
            "studentId": "301",
            "name": "박민수",
            "role": "LEADER"
          }
        ]
      }
    ],
    "expiresAt": "2026-07-23T06:10:00Z"
  }
}
```

무작위 생성은 먼저 미리보기를 반환한다. 확정은 다음 API를 사용한다.

| Method | Path | 권한 | 설명 |
|---|---|---|---|
| `POST` | `/classes/{classId}/groups/randomize/{previewId}/confirm` | 담당 `MANAGER` | 무작위 그룹 확정 |

## 8. 세션

| Method | Path | 권한 | 설명 |
|---|---|---|---|
| `POST` | `/classes/{classId}/sessions` | 담당 `MANAGER` | 세션 생성 |
| `GET` | `/classes/{classId}/sessions` | 접근 가능한 사용자 | 클래스 세션 목록 |
| `GET` | `/sessions/{sessionId}` | 접근 가능한 사용자 | 세션 상세 |
| `PATCH` | `/sessions/{sessionId}` | 담당 `MANAGER` | 세션 수정 |
| `POST` | `/sessions/{sessionId}/start` | 담당 `MANAGER` | 세션 시작 |
| `POST` | `/sessions/{sessionId}/end` | 담당 `MANAGER` | 세션 종료 |
| `POST` | `/sessions/{sessionId}/join` | 접근 가능한 사용자 | 세션 입장 |
| `POST` | `/sessions/{sessionId}/leave` | 참여 사용자 | 세션 퇴장 |
| `POST` | `/sessions/{sessionId}/export` | 담당 `MANAGER` | 세션 내보내기 생성 |
| `GET` | `/exports/{exportId}` | 요청 사용자 | 내보내기 상태/다운로드 URL |

`POST /classes/{classId}/sessions`

```json
{
  "slug": "spring-security-basics"
}
```

UI에서 세션 시간을 제거했으므로 세션 생성 요청에 시작 예정 시각이나 소요 시간은 요구하지 않는다.

### 8.1 세션 입장과 다른 세션 경고

`POST /sessions/{sessionId}/join`

```json
{
  "switchConfirmed": false
}
```

이미 다른 활성 세션에 입장 중이면:

```json
{
  "error": {
    "code": "ACTIVE_SESSION_CONFLICT",
    "message": "이미 참여 중인 세션이 있습니다.",
    "details": {
      "activeSession": {
        "id": "100",
        "slug": "previous-session"
      }
    }
  }
}
```

사용자가 경고를 확인한 후 `switchConfirmed: true`로 다시 요청하면 기존 세션을 퇴장 처리하고 새 세션 입장 토큰을 반환한다.

```json
{
  "data": {
    "sessionId": "101",
    "joinToken": "sess_eyJ...",
    "expiresInSec": 300,
    "webSocketUrl": "wss://api.example.com/ws/sessions/101"
  }
}
```

세션을 새 창으로 여는 동작과 경고를 한 번만 표시하는 상태는 프론트엔드가 담당한다.

### 8.2 세션 내보내기

`POST /sessions/{sessionId}/export`

```json
{
  "format": "ZIP",
  "include": [
    "PROJECT",
    "QUIZZES",
    "QUIZ_RESULTS",
    "REPORTS"
  ]
}
```

처리가 길어질 수 있으므로 `202 Accepted`와 `exportId`를 반환한다.

## 9. 프로젝트, 파일 및 Git

### 9.1 프로젝트와 파일 불러오기

| Method | Path | 권한 | 설명 |
|---|---|---|---|
| `POST` | `/sessions/{sessionId}/projects/import` | 담당 `MANAGER` | 업로드 파일 또는 Git 저장소 불러오기 |
| `GET` | `/sessions/{sessionId}/projects` | 세션 참여자 | 프로젝트 목록 |
| `GET` | `/projects/{projectId}/files?path={path}` | 세션 참여자 | 파일 트리/내용 조회 |
| `PUT` | `/projects/{projectId}/files` | 쓰기 권한 참여자 | 파일 저장 |
| `POST` | `/uploads` | 로그인 사용자 | 파일 업로드 URL 발급 |

`POST /sessions/{sessionId}/projects/import`

Git 저장소:

```json
{
  "sourceType": "GIT",
  "repositoryUrl": "https://github.com/acme/demo.git",
  "branch": "main",
  "credentialId": "cred_01J..."
}
```

업로드 파일:

```json
{
  "sourceType": "UPLOAD",
  "uploadId": "upload_01J..."
}
```

### 9.2 Git 명령

| Method | Path | 권한 | 설명 |
|---|---|---|---|
| `POST` | `/projects/{projectId}/git/clone` | 담당 `MANAGER` | 저장소 Clone |
| `POST` | `/projects/{projectId}/git/pull` | 쓰기 권한 참여자 | Pull |
| `POST` | `/projects/{projectId}/git/commit` | 쓰기 권한 참여자 | Commit |
| `POST` | `/projects/{projectId}/git/push` | 쓰기 권한 참여자 | Push |
| `GET` | `/projects/{projectId}/git/status` | 세션 참여자 | 브랜치·변경 파일 상태 |
| `GET` | `/projects/{projectId}/git/history` | 세션 참여자 | Commit 이력 |

`POST /projects/{projectId}/git/commit`

```json
{
  "message": "feat: add quiz validation",
  "paths": [
    "src/quiz/validator.ts",
    "src/quiz/validator.test.ts"
  ]
}
```

Git 명령은 서버 측 작업 큐에서 처리하며 공통 작업 응답을 반환한다.

```json
{
  "data": {
    "operationId": "gitop_01J...",
    "status": "QUEUED"
  }
}
```

| Method | Path | 권한 | 설명 |
|---|---|---|---|
| `GET` | `/git/operations/{operationId}` | 요청 사용자 | Git 작업 상태와 로그 |

민감한 저장소 자격 증명은 요청마다 직접 받지 않고 별도 암호화 저장소의 `credentialId`로 참조한다.

## 10. 퀴즈

화면 용어는 “퀴즈”로 통일하며 “미션”은 사용하지 않는다.

### 10.1 생성 및 관리

| Method | Path | 권한 | 설명 |
|---|---|---|---|
| `GET` | `/projects/{projectId}/quizzes` | 세션 참여자 | 퀴즈 목록 |
| `POST` | `/projects/{projectId}/quizzes/generate` | 담당 `MANAGER` | AI 퀴즈 생성 |
| `GET` | `/quiz-generation-jobs/{jobId}` | 요청 `MANAGER` | 생성 상태 |
| `GET` | `/quizzes/{quizId}` | 세션 참여자 | 퀴즈 상세 |
| `PATCH` | `/quizzes/{quizId}` | 담당 `MANAGER` | 생성된 퀴즈 수정 |
| `DELETE` | `/quizzes/{quizId}` | 담당 `MANAGER` | 퀴즈 삭제 |

퀴즈 목록이 비어 있으면 UI는 퀴즈 생성 버튼을 노출한다.

`POST /projects/{projectId}/quizzes/generate`

```json
{
  "count": 10,
  "types": [
    "MULTIPLE_CHOICE"
  ],
  "purposeRatio": {
    "CONCEPTUAL": 60,
    "MICRO": 40
  },
  "difficultyRatio": {
    "EASY": 20,
    "NORMAL": 50,
    "HARD": 30
  },
  "defaultTimeLimitSec": 60,
  "additionalPrompt": "예외 처리와 테스트 코드 비중을 높여 주세요."
}
```

검증:

- `count`: 1~50
- `types`: 최소 1개 선택
- 1차 출시 지원 유형은 `MULTIPLE_CHOICE`
- `purposeRatio` 합계는 100
- `difficultyRatio` 합계는 100
- `additionalPrompt`: 최대 2,000자
- AI는 난이도 사전 산정 → 문제 생성 → 난이도 재검증 순서로 처리한다.

```json
{
  "data": {
    "jobId": "qjob_01J...",
    "status": "QUEUED",
    "requestedCount": 10
  }
}
```

`GET /quiz-generation-jobs/{jobId}`

```json
{
  "data": {
    "id": "qjob_01J...",
    "status": "COMPLETED",
    "requestedCount": 10,
    "generatedCount": 10,
    "quizIds": ["501", "502"],
    "failureReason": null
  }
}
```

### 10.2 응시

| Method | Path | 권한 | 설명 |
|---|---|---|---|
| `POST` | `/sessions/{sessionId}/quiz-attempts` | `STUDENT` | 세션 퀴즈 응시 시작 |
| `GET` | `/quiz-attempts/{attemptId}` | 응시 학생 | 현재 문항과 진행률 |
| `POST` | `/quiz-attempts/{attemptId}/answers` | 응시 학생 | 답안 제출 |
| `POST` | `/quiz-attempts/{attemptId}/skip` | 응시 학생 | 현재 문항 건너뛰기 |
| `POST` | `/quiz-attempts/{attemptId}/finish` | 응시 학생 | 응시 종료 |
| `GET` | `/quiz-attempts/{attemptId}/result` | 응시 학생, 담당 `MANAGER` | 채점 결과 |

`POST /sessions/{sessionId}/quiz-attempts`

```json
{
  "projectId": "201"
}
```

```json
{
  "data": {
    "attemptId": "attempt_01J...",
    "totalCount": 10,
    "startedAt": "2026-07-23T06:00:00Z",
    "currentQuiz": {
      "id": "501",
      "type": "MULTIPLE_CHOICE",
      "purpose": "CONCEPTUAL",
      "question": "다음 중 올바른 설명은?",
      "choices": [
        {
          "id": "A",
          "text": "..."
        }
      ],
      "difficulty": "NORMAL",
      "timeLimitSec": 60,
      "deadlineAt": "2026-07-23T06:01:00Z"
    }
  }
}
```

`POST /quiz-attempts/{attemptId}/answers`

```json
{
  "quizId": "501",
  "answer": "A"
}
```

서버가 `deadlineAt`을 기준으로 제출 가능 여부를 판단한다.

## 11. 공지사항

개인 발송은 지원하지 않는다. 공지 작성 화면은 하단 원형 고정 버튼에서 모달로 열리지만 이는 프론트엔드 책임이다.

### 11.1 발송 대상

| 작성자 | 허용 대상 |
|---|---|
| `MASTER` | `ENTERPRISE`, `TRACK` |
| `MANAGER` | 담당 `CLASS` |

### 11.2 엔드포인트

| Method | Path | 권한 | 설명 |
|---|---|---|---|
| `POST` | `/notices` | `MASTER`, `MANAGER` | 공지 작성/예약 발송 |
| `GET` | `/notices` | 로그인 사용자 | 내게 노출되는 공지 목록 |
| `GET` | `/notices/{noticeId}` | 대상 사용자 | 공지 상세 |
| `PATCH` | `/notices/{noticeId}` | 작성자 | 발송 전 공지 수정 |
| `DELETE` | `/notices/{noticeId}` | 작성자 | 공지 삭제 |
| `POST` | `/notices/{noticeId}/read` | 대상 사용자 | 읽음 처리 |

`POST /notices`

```json
{
  "title": "7월 프로젝트 안내",
  "content": "프로젝트 제출 전 Push 상태를 확인해 주세요.",
  "target": {
    "type": "CLASS",
    "id": "31"
  },
  "publishAt": "2026-07-24T00:00:00Z",
  "attachmentUploadIds": [
    "upload_01J..."
  ]
}
```

`target.type`은 `ENTERPRISE | TRACK | CLASS`만 허용하며 `USER`는 허용하지 않는다.

## 12. 분석

분석 진입 순서는 `트랙 분석 → 클래스 분석 → 클래스 상세 분석`이다.

### 12.1 공통 지표

| 지표 | API 값 | 정의 |
|---|---|---|
| 정답률 | `ACCURACY_RATE` | 정답 수 / 채점 완료 문항 수 × 100 |
| 완료율 | `COMPLETION_RATE` | 완료 문항 수 / 전체 배정 문항 수 × 100 |
| 액티비티 | `ACTIVITY_RATE` | 활동 학생 수 / 재적 학생 수 × 100 |
| 세션 개수 | `SESSION_COUNT` | 기간 내 생성 또는 진행된 세션 수 |
| 평점 | `RATING` | 팀에서 확정할 버전형 공식의 결과 |

평점 공식 확정 전 `rating`은 `null`일 수 있다. API는 향후 공식 변경에 대비해 `ratingFormulaVersion`을 함께 반환한다.

### 12.2 엔드포인트

| Method | Path | 권한 | 설명 |
|---|---|---|---|
| `GET` | `/analytics/tracks` | `MASTER` | 트랙별 분석 요약 |
| `GET` | `/analytics/tracks/{trackId}` | `MASTER` | 트랙 분석과 클래스 비교 |
| `GET` | `/analytics/tracks/{trackId}/trend` | `MASTER` | 트랙 지표 추이 |
| `GET` | `/analytics/classes/{classId}` | `MASTER`, 담당 `MANAGER` | 클래스 분석 |
| `GET` | `/analytics/classes/{classId}/trend` | `MASTER`, 담당 `MANAGER` | 클래스 액티비티/지표 추이 |
| `GET` | `/analytics/classes/{classId}/sessions` | `MASTER`, 담당 `MANAGER` | 세션별 지표 |

`GET /analytics/tracks/{trackId}?from=2026-07-01&to=2026-07-23`

```json
{
  "data": {
    "track": {
      "id": "10",
      "name": "자바 전공"
    },
    "summary": {
      "accuracyRate": 84.2,
      "completionRate": 91.0,
      "activityRate": 88.9,
      "sessionCount": 18,
      "rating": null,
      "ratingFormulaVersion": null
    },
    "classes": [
      {
        "classId": "31",
        "classNumber": 1,
        "accuracyRate": 86.5,
        "completionRate": 92.1,
        "activityRate": 90.0,
        "sessionCount": 6,
        "rating": null
      }
    ]
  }
}
```

트랙 분석 화면에서 `classes[].classId`를 사용하여 클래스 상세 분석으로 이동한다.

`GET /analytics/classes/{classId}/trend`

쿼리:

| 이름 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `metric` | enum | Y | `ACCURACY_RATE`, `COMPLETION_RATE`, `ACTIVITY_RATE`, `SESSION_COUNT`, `RATING` |
| `from` | date | Y | 시작일 |
| `to` | date | Y | 종료일 |
| `interval` | enum | N | `DAY`, `WEEK`, `MONTH`, 기본 `DAY` |

```json
{
  "data": {
    "metric": "ACTIVITY_RATE",
    "interval": "DAY",
    "points": [
      {
        "at": "2026-07-21",
        "value": 82.5
      },
      {
        "at": "2026-07-22",
        "value": 87.5
      }
    ]
  }
}
```

출제 난이도 비율은 분석 API와 화면에서 제외한다.

## 13. 리포트

지원 리포트:

- 학생 개인 전체 리포트
- 세션별 학생 개인 상세 리포트
- 세션별 그룹 전체 리포트

### 13.1 엔드포인트

| Method | Path | 권한 | 설명 |
|---|---|---|---|
| `GET` | `/reports/students/{studentId}/overall` | 본인, 담당 `MANAGER` | 학생 전체 리포트 |
| `GET` | `/reports/sessions/{sessionId}/students/{studentId}` | 본인, 담당 `MANAGER` | 세션별 학생 상세 리포트 |
| `GET` | `/reports/sessions/{sessionId}/groups/{groupId}` | 그룹원, 담당 `MANAGER` | 세션별 그룹 전체 리포트 |
| `PUT` | `/reports/{reportId}/manager-comment` | 담당 `MANAGER` | 매니저 코멘트·첨부 갱신 |
| `POST` | `/reports/{reportId}/issue` | 담당 `MANAGER` | 리포트 발급 |
| `POST` | `/reports/{reportId}/export` | 조회 권한자 | PDF 생성 |
| `GET` | `/report-exports/{exportId}` | 요청 사용자 | PDF 생성 상태/URL |

최근 발급 리포트는 대시보드에서 제거하지만 리포트 자체의 발급 이력과 조회 API는 유지한다.

### 13.2 학생 개인 전체 리포트

`GET /reports/students/{studentId}/overall?trackId=10&classId=31&from=2026-07-01&to=2026-07-23`

```json
{
  "data": {
    "student": {
      "id": "301",
      "name": "박민수"
    },
    "summary": {
      "sessionCount": 8,
      "quizCompletionRate": 94.0,
      "accuracyRate": 87.2,
      "activityRate": 91.0,
      "rating": null,
      "ratingFormulaVersion": null
    },
    "sessions": [
      {
        "sessionId": "101",
        "slug": "spring-security-basics",
        "quizCompletionRate": 100.0,
        "accuracyRate": 90.0,
        "activityRate": 100.0,
        "rating": null,
        "issuedAt": "2026-07-21T09:42:00Z"
      }
    ]
  }
}
```

### 13.3 세션별 학생 상세 리포트

`GET /reports/sessions/{sessionId}/students/{studentId}`

```json
{
  "data": {
    "reportId": "701",
    "student": {
      "id": "301",
      "name": "박민수"
    },
    "session": {
      "id": "101",
      "slug": "spring-security-basics"
    },
    "summary": {
      "quizCompletionRate": 100.0,
      "accuracyRate": 90.0,
      "activityRate": 100.0,
      "rating": null
    },
    "quizResults": [
      {
        "quizId": "501",
        "purpose": "CONCEPTUAL",
        "difficulty": "NORMAL",
        "isCorrect": true,
        "isSkipped": false,
        "answeredAt": "2026-07-21T08:15:00Z",
        "explanation": "..."
      }
    ],
    "aiFeedback": {
      "strengths": ["예외 처리 개념을 정확히 이해했습니다."],
      "improvements": ["트랜잭션 전파 옵션을 복습해 주세요."]
    },
    "managerComment": {
      "content": "다음 세션에서는 테스트 코드도 함께 확인해 주세요.",
      "attachments": []
    },
    "issuedAt": "2026-07-21T09:42:00Z"
  }
}
```

### 13.4 세션별 그룹 전체 리포트

`GET /reports/sessions/{sessionId}/groups/{groupId}`

```json
{
  "data": {
    "session": {
      "id": "101",
      "slug": "spring-security-basics"
    },
    "group": {
      "id": "401",
      "name": "A조"
    },
    "summary": {
      "memberCount": 5,
      "quizCompletionRate": 96.0,
      "accuracyRate": 84.0,
      "activityRate": 100.0,
      "rating": null
    },
    "members": [
      {
        "studentId": "301",
        "name": "박민수",
        "quizCompletionRate": 100.0,
        "accuracyRate": 90.0,
        "activityRate": 100.0,
        "rating": null
      }
    ]
  }
}
```

## 14. 세션 실시간 기능

실시간 기능은 REST 입장 API에서 받은 `joinToken`으로 WebSocket에 연결한다.

### 14.1 연결

```text
GET wss://{host}/ws/sessions/{sessionId}?token={joinToken}
```

### 14.2 이벤트

| 방향 | 이벤트 | 설명 |
|---|---|---|
| Server → Client | `presence.snapshot` | 현재 접속자 목록 |
| Server → Client | `presence.joined` | 사용자 입장 |
| Server → Client | `presence.left` | 사용자 퇴장 |
| Client → Server | `voice.mute.changed` | 마이크 음소거 상태 변경 |
| Server → Client | `voice.participant.updated` | 참여자 음성 상태 변경 |
| Client → Server | `voice.signal` | WebRTC offer/answer/ICE 중계 |
| Server → Client | `session.ended` | 세션 종료 |
| Server → Client | `quiz.published` | 퀴즈 공개 |

예시:

```json
{
  "type": "voice.mute.changed",
  "eventId": "evt_01J...",
  "payload": {
    "muted": true
  }
}
```

```json
{
  "type": "presence.snapshot",
  "eventId": "evt_01J...",
  "payload": {
    "participants": [
      {
        "userId": "301",
        "name": "박민수",
        "role": "STUDENT",
        "muted": true,
        "joinedAt": "2026-07-23T06:00:00Z"
      }
    ]
  }
}
```

음성 미디어는 WebRTC로 전송하고 WebSocket은 시그널링과 접속 상태에만 사용한다.

## 15. 상태 코드와 오류 코드

### 15.1 HTTP 상태 코드

| 상태 | 사용 기준 |
|---|---|
| `200 OK` | 조회·수정 성공 |
| `201 Created` | 리소스 생성 성공 |
| `202 Accepted` | AI 생성, 내보내기, Git 등 비동기 작업 접수 |
| `204 No Content` | 삭제·로그아웃 성공 |
| `400 Bad Request` | 요청 형식 또는 비즈니스 검증 실패 |
| `401 Unauthorized` | 인증 실패 또는 만료 |
| `403 Forbidden` | 역할/소속 범위 위반 |
| `404 Not Found` | 리소스 없음 또는 접근 범위 밖 |
| `409 Conflict` | 중복, 상태 충돌, 활성 세션 충돌 |
| `422 Unprocessable Entity` | AI 프롬프트·비율 등 의미 검증 실패 |
| `429 Too Many Requests` | 로그인·AI 생성·Git 요청 제한 |

### 15.2 주요 오류 코드

| 코드 | HTTP | 설명 |
|---|---:|---|
| `AUTH_INVALID_CREDENTIALS` | 401 | 이메일 또는 비밀번호 불일치 |
| `AUTH_TOKEN_EXPIRED` | 401 | 액세스/재설정 토큰 만료 |
| `EMAIL_ALREADY_EXISTS` | 409 | 이미 가입된 이메일 |
| `INVITATION_INVALID` | 400 | 유효하지 않은 초대 |
| `INVITATION_EXPIRED` | 410 | 만료된 초대 |
| `INVITATION_ROLE_MISMATCH` | 403 | 가입 경로와 초대 역할 불일치 |
| `TRACK_NAME_DUPLICATED` | 409 | 기업 내 트랙 이름 중복 |
| `CLASS_NUMBER_DUPLICATED` | 409 | 트랙 내 반 번호 중복 |
| `CLASS_ACCESS_DENIED` | 403 | 담당/소속 클래스가 아님 |
| `ACTIVE_SESSION_CONFLICT` | 409 | 다른 세션에 이미 참여 중 |
| `SESSION_NOT_ACTIVE` | 409 | 시작 전 또는 종료된 세션 |
| `QUIZ_TIME_LIMIT_EXCEEDED` | 409 | 답안 제출 제한 시간 초과 |
| `QUIZ_RATIO_INVALID` | 422 | 목적/난이도 비율 합계 오류 |
| `QUIZ_GENERATION_FAILED` | 422 | AI 퀴즈 생성 실패 |
| `NOTICE_TARGET_NOT_ALLOWED` | 403 | 역할에 허용되지 않는 발송 대상 |
| `GIT_OPERATION_CONFLICT` | 409 | 다른 Git 쓰기 작업 진행 중 |
| `REPORT_NOT_READY` | 409 | 집계가 완료되지 않은 리포트 |

## 16. 현재 ERD 필수 보완

UI 요구사항과 본 API를 구현하려면 아래 변경이 필요하다.

### 16.1 기존 테이블 수정

| 테이블 | 변경 |
|---|---|
| `ordinary_user` | `role`을 `MANAGER | STUDENT` enum으로 확정하고 `status`, `last_active_at`, `deleted_at` 추가 |
| `invitation` | `enterprise_id`, `invited_by`, `role`, `track_id`, `class_id`, `canceled_at` 추가 |
| `invitation` | 상태 enum에 `CANCELED` 추가 |
| `class` | 전역 `class_number` unique 제거, `(track_id, class_number)` unique 추가 |
| `class_user` | `(class_id, ordinary_user_id)` unique 추가, 배정 해제 이력을 위한 `left_at` 추가 |
| `session` | 같은 클래스 내 slug 고유 제약 `(class_id, slug)` 추가 |
| `project` | `source_type`, `repository_url`, `branch`, `status` 추가 검토 |
| `quiz_progress` | `ordinary_user_id` FK를 `ordinary_user.id`로 수정, `(ordinary_user_id, quiz_id)` unique 추가 |
| `quiz_progress` | `started_at`, `answered_at`, `submitted_answer`, `elapsed_sec` 추가, 응시 중 상태를 위해 `finished_at` nullable로 변경 |
| `report` | 비율/평점 컬럼을 `decimal`로 변경하고 `activity_rate`, `rating_formula_version`, `group_id`, `report_type` 추가 |
| `report` | 그룹 리포트에서는 `user_id`를 nullable로 두고 `user_id`와 `group_id` 중 하나만 존재하도록 check 제약 추가 |
| `report` | UI에서 제거된 `quiz_difficulty_ratio` 삭제 또는 집계 대상에서 제외 |

`class`, `group`, `session`은 DBMS 예약어 충돌 가능성이 있어 실제 물리 테이블명을 `classes`, `study_groups`, `learning_sessions` 등으로 정하는 것을 권장한다.

### 16.2 신규 테이블

| 테이블 | 목적 | 핵심 컬럼 |
|---|---|---|
| `refresh_token` | 로그인 세션·로그아웃 | `user_type`, `user_id`, `token_hash`, `expires_at`, `revoked_at` |
| `password_reset_token` | 비밀번호 재설정 | `email`, `token_hash`, `expires_at`, `used_at` |
| `track_manager` | 마스터의 트랙 단위 권한 위임 | `track_id`, `ordinary_user_id`, `assigned_at`, unique `(track_id, ordinary_user_id)` |
| `activity_event` | 강사/학생 액티비티 집계 | `enterprise_id`, `user_id`, `event_type`, `track_id`, `class_id`, `session_id`, `created_at` |
| `notice` | 공지 본문·대상 | `author_id`, `target_type`, `target_id`, `title`, `content`, `publish_at` |
| `notice_read` | 공지 읽음 | `notice_id`, `ordinary_user_id`, `read_at` |
| `file_asset` | 첨부·업로드·내보내기 | `owner_id`, `storage_key`, `original_name`, `content_type`, `size`, `status` |
| `quiz_choice` | 객관식 선택지 | `quiz_id`, `choice_key`, `content`, `is_answer` |
| `quiz_generation_job` | AI 비동기 생성 | `project_id`, `requested_by`, `request_json`, `status`, `failure_reason` |
| `quiz_attempt` | 한 번의 퀴즈 응시 | `session_id`, `ordinary_user_id`, `started_at`, `finished_at`, `status` |
| `session_participation` | 세션 입퇴장·활성 충돌 | `session_id`, `ordinary_user_id`, `joined_at`, `left_at`, 사용자별 활성 참여 1건 unique 제약 |
| `git_operation` | Git 명령 상태/로그 | `project_id`, `requested_by`, `operation`, `status`, `log`, `created_at` |
| `export_job` | 세션/리포트 내보내기 | `resource_type`, `resource_id`, `format`, `status`, `file_asset_id` |

### 16.3 저장하지 않고 계산 가능한 항목

- 트랙 카드 집계
- 경고가 필요한 클래스
- 클래스별 정답률
- 정답률·완료율·액티비티·세션 개수 추이
- 학생 개인 전체 리포트 요약
- 세션별 그룹 리포트 요약

초기에는 조회 시 집계할 수 있으나 데이터량이 증가하면 일별 집계 테이블 또는 Materialized View를 추가한다.

## 17. 확정 필요 항목

| ID | 항목 | 현재 계약 |
|---|---|---|
| `OPEN-01` | 평점 공식 | `rating` nullable, `ratingFormulaVersion` 포함 |
| `OPEN-02` | Git 인증 방식 | 암호화 저장된 `credentialId` 참조 |
| `OPEN-03` | 학생 초대 권한 | `MASTER`와 담당 `MANAGER` 모두 허용 |
| `OPEN-04` | 마스터의 클래스 상세 조회 수준 | 집계·분석 읽기만 허용, 원본 답안/파일은 차단 권장 |
| `OPEN-05` | 퀴즈 지원 유형 | 1차는 `MULTIPLE_CHOICE`, 확장 enum은 유지 |
| `OPEN-06` | 음성 인프라 | WebRTC SFU 공급자 또는 자체 구축 결정 필요 |
| `OPEN-07` | 파일 저장소 | S3 호환 Object Storage 기준, 공급자 미정 |

## 18. UI 전용 결정

다음 항목은 별도 백엔드 엔드포인트를 만들지 않는다.

- 역할별 회원가입 페이지의 동일 디자인
- 공지 작성 원형 고정 버튼과 모달
- 나의 세션 캐러셀
- 세션 메뉴를 내비게이션에서 제거
- 세션을 새 창으로 열기
- 오늘의 세션 영역 스크롤
- shadcn 기반 차트·컴포넌트
- 화면에서 “퀴즈 / 미션” 대신 “퀴즈” 사용
- 세션 상단의 “지민서 + 15” 제거
