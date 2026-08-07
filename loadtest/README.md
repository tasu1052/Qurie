# Qurie 부하 테스트 (k6)

핵심 기능 3가지(실시간 채팅·동시 편집, 퀴즈 풀이, 세션 리포트)를 대상으로 한 k6 시나리오.

## 설치

```bash
winget install k6 --source winget
```

## 사전 준비 (테스트 데이터)

부하 테스트는 실제 데이터를 만든다. **운영 반이 아니라 테스트 전용 반**에서 돌릴 것.

1. 테스트 반(class) 1개, 강사 계정 1개 (`INSTRUCTOR_EMAIL`)
2. 학생 계정 N개 — 이메일이 `student1@test.com`, `student2@test.com`, … 처럼
   `접두사 + 순번 + 도메인` 규칙이어야 한다 (`lib/auth.js` 의 `studentEmail`).
   비밀번호는 전원 동일 (`PASSWORD` env, 기본 `password123!`).
   → 초대 일괄 발송(엑셀) 기능으로 만들면 편하다.
3. 학생 전원이 테스트 반에 가입 완료
4. 강사가 세션 오픈 (`SESSION_ID`), 프로젝트 임포트 (`PROJECT_ID`)
5. 퀴즈 시나리오는 COMPLETED 상태 퀴즈셋 필요 (`QUIZ_SET_ID`)
6. 리포트 시나리오는 AI 서버가 떠 있어야 한다

## 어디서 돌리나

| 목적 | 구성 |
|---|---|
| 스크립트 검증, 레이스 재현, 쿼리 수 카운트 | 내 PC → 로컬 서버 (`BASE_URL=http://localhost:8080`) |
| 응답시간/처리량 수치 측정 (발표용) | 내 PC → EC2 (`BASE_URL=http://<EC2>`) |
| 금지 | EC2 안에서 자기 자신에게 쏘기 (부하 발생기가 측정을 오염시킴) |

측정 중 서버 지표는 actuator 로 함께 관찰한다 (없으면 먼저 추가):

```bash
curl -s http://localhost:8080/actuator/metrics/hikaricp.connections.active
curl -s http://localhost:8080/actuator/metrics/tomcat.threads.busy
```

## 시나리오

### 01 실시간 채팅 (STOMP/WebSocket)

학생 30명이 세션 입장 후 2초 간격으로 60초간 채팅. 내 메시지가 브로드캐스트로
돌아오는 왕복 지연(`chat_broadcast_latency` p95 < 500ms)을 측정한다.

```bash
k6 run -e BASE_URL=http://localhost:8080 -e SESSION_ID=1 -e STUDENTS=30 01-chat.js
```

### 02 동시 편집 스냅샷 저장

저장 1회마다 서버가 **프로젝트 전체 파일 본문을 읽어 versionHash 를 재계산**하는
경로(`ProjectService.updateFileContent`). 파일 수가 많은 프로젝트일수록 급격히 느려진다.

```bash
# VU 별로 다른 파일 저장 (기본)
k6 run -e BASE_URL=http://localhost:8080 -e PROJECT_ID=1 -e EDITORS=20 -e DURATION=60s 02-edit.js
# 전원이 같은 파일 저장 → lost update 재현
k6 run -e BASE_URL=http://localhost:8080 -e PROJECT_ID=1 -e EDITORS=20 -e SAME_FILE=1 02-edit.js
```

종료 후 정합성 검증 — 서로 다른 파일을 동시에 저장했을 때 `projects.version_hash` 가
실제 파일 내용과 어긋나는지(트랜잭션 경합) 확인:

```sql
-- 마지막 응답의 versionHash 와 아래 재계산 대상(전체 파일)을 비교
SELECT path, MD5(content) FROM project_files WHERE project_id = 1 ORDER BY path;
```

참고: 실시간 공동 편집 자체는 프론트 Yjs 가 담당하고 백엔드는 스냅샷 저장만 받는다.
이 스크립트가 재는 것은 스냅샷 저장 API 다.

### 03 퀴즈 풀이

학생 30명이 문항 조회(GET /questions, 문항당 choices N+1) 후 문항을 순서대로 제출
(POST /progress, 제출 1건 = 11쿼리 + 반 전체 집계 브로드캐스트).

```bash
k6 run -e BASE_URL=http://localhost:8080 -e QUIZ_SET_ID=1 -e STUDENTS=30 03-quiz-solve.js
# 동시 폭주(전원 딜레이 없이 연속 제출)
k6 run -e BASE_URL=http://localhost:8080 -e QUIZ_SET_ID=1 -e STUDENTS=30 -e THINK_SECONDS=0 03-quiz-solve.js
```

- 재실행 시 이미 제출된 문항은 409 → `quiz_submit_duplicate` 로 따로 집계된다 (실패 아님).
  깨끗하게 다시 재려면 초기화 후 실행 (quiz_progress 는 quiz_id 로만 연결된다):
  `DELETE qp FROM quiz_progress qp JOIN quiz q ON qp.quiz_id = q.id WHERE q.quiz_set_id = ?`
- 서버 로그(show-sql)에서 쿼리 수를 세면 N+1 개선 전/후 비교가 된다:
  로컬에서 세션 1회 풀이 동안 `grep -c "select" 로그파일`.

### 04 세션 리포트

```bash
# 일괄 발급 소요 시간 (개선 전 baseline: 학생 수 × AI 호출에 정비례)
k6 run -e BASE_URL=http://localhost:8080 -e SESSION_ID=1 -e INSTRUCTOR_EMAIL=teacher@test.com 04-report.js

# 단건 발급 동시 10발 → 중복 발급 레이스 (기대: 201×1 + 409×9, 현재 예상: 500 다수)
k6 run -e BASE_URL=http://localhost:8080 -e SESSION_ID=1 -e INSTRUCTOR_EMAIL=teacher@test.com \
  -e MODE=race -e STUDENT_ID=5 04-report.js
```

race 모드 검증:

```sql
SELECT COUNT(*) FROM session_reports WHERE session_id = 1 AND ordinary_user_id = 5; -- 기대 1
-- AI 서버 access log 에서 /report 호출 횟수도 함께 확인 (기대 1, 현재 예상 10)
```

## 결과 읽는 법

- `http_req_duration` 의 `p(95)` 가 핵심 지표. 평균은 스파이크를 가린다.
- `checks` 실패율 > 0 이면 수치보다 원인(응답 코드) 먼저 확인.
- 개선 작업(인덱스, batch_fetch_size, fetch join, 리포트 비동기화) 전후로
  같은 명령을 돌려 p95 비교표를 만들면 그대로 발표 자료가 된다.

## 주의

- 메일이 발송되는 경로(초대, 비밀번호 재설정)는 이 시나리오에 없다. 추가할 경우
  실제 SMTP 로 대량 발송되지 않도록 로컬 SMTP(mailhog 등)로 격리할 것.
- EC2 대상 테스트는 팀에 공지 후 진행 (같은 인스턴스에서 시연 중일 수 있음).
