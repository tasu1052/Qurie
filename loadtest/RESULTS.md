# 부하 테스트 결과 기록

측정 규칙: 같은 서버·같은 데이터·같은 명령으로 3회 실행, **중앙값**을 기록한다.
첫 1회는 워밍업(JIT·커넥션 풀 채우기)으로 버린다. 개선은 한 번에 하나씩 적용한다.

## 측정 환경

| 항목 | 값 |
|---|---|
| 대상 서버 | (로컬 / EC2 인스턴스 타입) |
| DB | (로컬 MySQL / RDS) |
| 데이터 양 | 학생 N명, 퀴즈셋 K개, 문항 M개, quiz_progress 행 수 |
| k6 실행 위치 | (내 PC) |

## 시나리오 03 — 퀴즈 풀이 (STUDENTS=30, THINK_SECONDS=0)

| 지표 | before | after ① batch_fetch_size | after ② fetch join | after ③ 인덱스 |
|---|---|---|---|---|
| GET /questions p95 (ms) | 201.54 | 180.59 | **138.75 (−31%)** | |
| GET /questions avg (ms) | 127.27 | 99.83 | **74.94 (−41%)** | |
| POST /progress p95 (ms) | 61.79 | 58.79 | 63.27 | |
| 5xx 수 | 0 | 0 | 0 | |

(측정: 로컬, 학생 30VU 동시 폭주, 회차당 660요청, 3회 중앙값. after②는 ①+② 누적 적용.)

적용 커밋: ① ____ ② ____ ③ ____

## 시나리오 02 — 동시 편집 (EDITORS=20, 60s)

| 지표 | before | after (전체 파일 로드 제거) |
|---|---|---|
| PUT /files/content p95 (ms) | | |
| 처리량 (req/s) | | |
| version_hash 정합성 (불일치 여부) | | |

## 시나리오 01 — 채팅 (STUDENTS=30, 60s)

| 지표 | before | after |
|---|---|---|
| chat_broadcast_latency p95 (ms) | | |
| STOMP 에러 수 | | |

## 시나리오 04 — 리포트 일괄 발급 (학생 30명)

| 지표 | before | after (비동기화/병렬화) |
|---|---|---|
| 일괄 발급 총 소요 (s) | | |
| race 모드 500 응답 수 | | |
| AI 서버 호출 횟수 (기대 = 학생 수) | | |

## 측정 로그 (원본 기록)

| 일시 | 시나리오 | 조건 | GET /questions p95 | POST /progress p95 | 총 요청 | 비고 |
|---|---|---|---|---|---|---|
| 2026-08-07 | 03 quiz | 로컬, 30VU, THINK=0 | 201.54ms | 72ms | 660 (실패 0) | before 회차1 |
| 2026-08-07 | 03 quiz | 로컬, 30VU, THINK=0 | 191.51ms | 58.45ms | 660 (실패 0) | before 회차2 |
| 2026-08-07 | 03 quiz | 로컬, 30VU, THINK=0 | 246.27ms | 61.79ms | 660 (실패 0) | before 회차3 |

**before 확정 (3회 중앙값): GET /questions p95 = 201.54ms, POST /progress p95 = 61.79ms**

| 2026-08-07 | 03 quiz | 로컬, 30VU, THINK=0, batch_fetch_size=100 | 174.03ms | 40.70ms | 660 (실패 0) | after① 회차1 |
| 2026-08-07 | 03 quiz | 로컬, 30VU, THINK=0, batch_fetch_size=100 | 180.59ms | 58.79ms | 660 (실패 0) | after① 회차2 |
| 2026-08-07 | 03 quiz | 로컬, 30VU, THINK=0, batch_fetch_size=100 | 188.79ms | 67.94ms | 660 (실패 0) | after① 회차3 |

**after① 확정 (3회 중앙값): GET /questions p95 = 180.59ms (before 201.54 → −10%), POST /progress p95 = 58.79ms (61.79 → −5%)**

| 2026-08-07 | 03 quiz | 로컬, 30VU, THINK=0, ①+fetch join | 138.75ms | 48.58ms | 660 (실패 0) | after② 회차1 |
| 2026-08-07 | 03 quiz | 로컬, 30VU, THINK=0, ①+fetch join | 136.91ms | 63.27ms | 660 (실패 0) | after② 회차2 |
| 2026-08-07 | 03 quiz | 로컬, 30VU, THINK=0, ①+fetch join | 157.58ms | 69.44ms | 660 (실패 0) | after② 회차3 |

**after② 확정 (3회 중앙값): GET /questions p95 = 138.75ms (before 201.54 → −31%), avg = 74.94ms (127.27 → −41%)**
**avg 기준: GET /questions 127.27 → 99.83ms (−22%)** — 로컬(DB 왕복 ≈0ms)에서도 이 정도이며, 쿼리 수 감소는 EC2/RDS 처럼 왕복 지연이 있는 환경에서 더 크게 나타난다.

## 서버 지표 (측정 중 최대값)

| 지표 | before | after |
|---|---|---|
| hikaricp.connections.active (max/10) | | |
| tomcat.threads.busy | | |
