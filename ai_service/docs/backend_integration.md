# AI 서비스 ↔ 백엔드 연동 가이드

> 대상: 백엔드 담당자
> 범위: 퀴즈 생성 요청/조회 API 계약과 연동 시 주의사항
> 기준: `ai_service/app/http/quiz_routes.py`, `app/quiz/`, `app/engine/` 현재 구현

데이터 출처·DB 컬럼 매핑은 `quiz_generation_contract.md` 참고. 이 문서는 **실제로 붙일 때 필요한 것만** 다룬다.

---

## 0. 한눈에 보기

```
백엔드                                AI 서비스
  │                                      │
  ├─ POST /api/quiz?project=201 ────────▶│  접수만 하고 즉시 응답
  │◀──── {quiz_set_id: 42, PENDING} ─────┤  (생성은 백그라운드)
  │                                      │
  │   ...30초 ~ 1분 30초...              │  GENERATE → SOLVE → JUDGE
  │                                      │  (부족하면 부족분 재생성 1회)
  ├─ GET /api/quiz/42/status ───────────▶│
  │◀──── {status: GENERATING} ───────────┤  아직 진행 중 → 재폴링
  │                                      │
  ├─ GET /api/quiz/42/status ───────────▶│
  │◀──── {status: READY, quizzes:[...]} ─┤  완료
  │                                      │
  └─ DB 저장 (quiz, quiz_choice)         │  AI는 저장하지 않음
```

**AI 서비스는 무상태다.** 코드 스냅샷을 조회하지 않고, 결과를 영속 저장하지도 않는다. 코드는 요청 body로 받고, 결과는 백엔드가 받아서 DB에 넣는다.

---

## 1. 엔드포인트

### 1.1 생성 요청

```
POST /api/quiz?project={projectId}
Content-Type: application/json
```

`project`는 **body가 아니라 쿼리 파라미터**다. 누락하면 422.

#### 요청 body

```json
{
  "mode": "ASSESSMENT",
  "requested_count": 5,
  "ratio": { "easy": 30, "normal": 50, "hard": 20 },
  "user_prompt": null,
  "version_hash": "a1b2c3d",
  "target_files": ["src/solution.py"],
  "files": {
    "src/solution.py": "def fib(n, memo={}):\n    ...\n"
  }
}
```

| 필드 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `mode` | enum | ✅ | `ASSESSMENT` \| `PRACTICE` |
| `requested_count` | int | ✅ | 1~20 |
| `ratio` | object | | 난이도 **상대 가중치**. 합 100 불필요 (`3:5:2` == `30:50:20`). 생략 시 30/50/20. 전부 0이면 422 |
| `user_prompt` | string\|null | | 출제 주제 힌트. 최대 500자. 프롬프트 내에서 untrusted 블록으로 격리됨 |
| `version_hash` | string | ✅ | 1~64자. **AI는 조회에 쓰지 않고 보관만 한다** (스냅샷 조회는 백엔드 책임) |
| `target_files` | string[] | | 출제 대상 파일 경로. 최대 20개. 역슬래시는 `/`로 정규화됨 |
| `files` | object | ✅ | `{경로: 파일 전체 내용}`. 비었거나 내용이 공백뿐이면 **422** — §3.1 |

#### 응답 (200)

```json
{ "quiz_set_id": 42, "project": "201", "status": "PENDING" }
```

`quiz_set_id`를 보관했다가 조회에 쓴다.

### 1.2 결과 조회

```
GET /api/quiz/{quiz_set_id}/status
```

#### 응답 (200)

```json
{
  "project": "201",
  "quiz_set_id": 42,
  "status": "READY",
  "error_message": null,
  "quizzes": [
    {
      "purpose": "MICRO",
      "difficulty": "NORMAL",
      "tested_concept": "메모이제이션 캐시 히트 조건",
      "question": "...",
      "choices": ["...", "...", "...", "..."],
      "answer_index": 2,
      "explanation": "...",
      "file_path": "src/solution.py",
      "line_start": 3,
      "line_end": 6
    },
    {
      "purpose": "CONCEPTUAL",
      "difficulty": "EASY",
      "tested_concept": "기본 인자 가변 객체",
      "question": "...",
      "choices": ["...", "...", "...", "..."],
      "answer_index": 0,
      "explanation": "...",
      "file_path": null,
      "line_start": null,
      "line_end": null
    }
  ]
}
```

| 필드 | 설명 |
|---|---|
| `status` | `PENDING` \| `GENERATING` \| `READY` \| `FAILED` |
| `error_message` | `FAILED`일 때만 채워짐 |
| `quizzes` | **검증을 통과한(APPROVED) 문항만** 담긴다. 탈락 문항은 오지 않는다 |
| `purpose` | `MICRO`면 `file_path`/`line_start`/`line_end`가 채워짐. `CONCEPTUAL`이면 셋 다 `null` |
| `answer_index` | `choices` 배열에서 정답의 인덱스 (0~3) |

---

## 2. 상태 전이와 폴링

```
PENDING ──▶ GENERATING ──┬──▶ READY    (APPROVED ≥ 1)
                         └──▶ FAILED   (APPROVED == 0 또는 예외)
```

**한 라운드에 30초~1분** 걸린다(GENERATE/SOLVE/JUDGE 3콜). 요청 개수를 못 채우면
부족분 라운드가 추가되므로 최악의 경우 그 몇 배가 된다 (§3.4).

- 폴링 간격 2~3초 권장.
- 타임아웃은 **최소 5분** 잡을 것. 보통 1분 안에 끝나지만 재시도가 붙으면 길어진다.
- `PENDING`과 `GENERATING`은 둘 다 "진행 중"으로 처리하면 된다.

### `error_message` 값

| 값 | 의미 |
|---|---|
| `NO_APPROVED_ITEMS` | 생성은 됐으나 품질 검증을 통과한 문항이 0개 |
| `NOT_FOUND` | 해당 `quiz_set_id` 없음 — §3.3 |
| 그 외 | 파이프라인 예외 메시지 (최대 500자). 예: `GENERATE: ... 출력 상한에 걸려 잘렸습니다` |

---

## 3. 반드시 알아야 할 동작

### 3.1 `files`는 필수다 — 없으면 만들지 않고 거절한다

AI 서비스는 `code_snapshot` DB를 조회하지 않는다. 코드는 요청 body로만 들어온다.
`files`가 없거나 비어 있으면 **접수 단계에서 422로 거절**한다. 임의의 기본 코드로
대신 만들어 주지 않는다 — 의미 없는 문항이 정상 응답으로 나가면 호출자가 잘못을
눈치채지 못하기 때문이다.

422가 나는 경우:

- `files` 필드 자체를 생략
- `files: {}`
- 값이 공백뿐인 경우 (`{"a.py": "   "}`)

경로는 `target_files`와 같은 규칙(`\` → `/`)으로 정규화된다. 양쪽 경로 표기가
달라도 대표 파일 선택은 정상 동작한다.

### 3.2 파일을 여러 개 보내도 대표 파일 1개만 출제에 쓰인다

현재 엔진은 **대표 파일 하나**만 프롬프트에 넣는다.

- 선택 규칙: `target_files` 중 `files`에 존재하는 첫 번째 → 없으면 `files`의 첫 항목.
- 따라서 `quizzes[].file_path`는 항상 그 대표 파일 하나다.
- 멀티파일 출제가 필요하면 별도 논의 필요. 지금은 **백엔드가 출제 대상 파일을 골라서** 보내는 게 확실하다.

### 3.3 존재하지 않는 id도 HTTP 404가 아니라 200이다

```json
{ "project": "", "quiz_set_id": 999, "status": "FAILED", "error_message": "NOT_FOUND", "quizzes": [] }
```

HTTP 상태코드로 분기하지 말고 **body의 `status`/`error_message`를 볼 것.**

### 3.4 요청 개수를 채울 때까지 반복한다 (단, 보장은 아님)

`quizzes`에는 아래를 모두 통과한 문항만 담긴다.

1. 구조 검증 (보기 4개, 중복 없음, line 범위 유효 등)
2. **Solver 교차 풀이** — 다른 모델이 같은 문제를 풀어 정답이 일치해야 함
3. **Judge 채점** — 품질 점수 7점 이상 (10점 만점)

통과 개수가 `requested_count`에 못 미치면 **승인분은 그대로 두고 부족분만 다시
생성**하는 라운드를 반복한다. 난이도·purpose 배분도 남은 목표에 맞춰 다시 계산한다.

다만 아래 경우 목표에 못 미친 채로 종료한다.

| 중단 조건 | 이유 |
|---|---|
| 한 라운드에서 승인이 0건 | 같은 조건으로 더 돌려도 결과가 같을 가능성이 높다. 한 라운드가 LLM 3콜이라 무의미한 소모 |
| 재시도 상한 도달 (`MAX_RETRY`, 기본 5) | 무한 루프 방지 |

따라서 `requested_count != len(quizzes)`인 경우를 **여전히 정상 케이스로** 보고 UI를
구성해야 한다. 라운드가 늘어나면 응답도 그만큼 늦어진다(§2 타임아웃 참고).

### 3.5 결과가 서버 재시작 시 사라진다 (인메모리)

저장소가 프로세스 메모리의 dict다 (`app/quiz/repository.py`). 결과적으로:

- **AI 서버는 단일 프로세스로 띄워야 한다.** 워커/인스턴스를 여러 개 두면 POST를 받은
  프로세스와 GET을 받은 프로세스가 달라 `NOT_FOUND`가 난다.
- 재배포·재시작하면 진행 중이던 세트가 소실된다.
- 따라서 **결과는 받는 즉시 백엔드가 DB에 저장**해야 한다. AI 쪽을 조회 저장소로 쓰면 안 된다.

---

## 4. 백엔드가 채워야 하는 값

AI는 문항 내용만 만든다. 시스템 메타는 전부 백엔드 몫이다.

`id`, `quiz_set_id`(문항별), `order_no`, `time_limit_sec`, `status`, `judge_score`,
`reject_reason`, `gen_model`, `embedding`, `created_at`, `updated_at`

### `quiz_choice` 저장 방법

`choices` 배열 순서를 그대로 `idx` 0~3으로 저장하고, `is_answer`는 **`answer_index`로 유도**한다.

```
for i, content in enumerate(quiz.choices):
    quiz_choice(idx=i, content=content, is_answer=(i == quiz.answer_index))
```

AI가 `is_answer` bool을 직접 주지 않는 것은 의도적이다. 보기 순서와 bool이 어긋나는 사고를 막기 위해 인덱스로만 주고받는다. (AI 내부에서 보기를 셔플하므로 순서는 매번 다르다.)

---

## 5. 검증 실패 응답 (422)

FastAPI 기본 validation 형식으로 나간다.

| 조건 | 결과 |
|---|---|
| `project` 쿼리 누락 | 422 |
| `requested_count` ∉ [1, 20] | 422 |
| `ratio` 전부 0 | 422 `easy/normal/hard 중 하나 이상은 0보다 커야 합니다` |
| `files` 누락/빈 객체/공백 내용 | 422 `files는 비울 수 없습니다. {파일경로: 파일내용} 형태로 코드를 보내세요` |
| `user_prompt` > 500자 | 422 |
| `version_hash` 누락/65자 이상 | 422 |
| `target_files` 21개 이상 | 422 |

---

## 6. 미해결 / 협의 필요

| # | 항목 | 내용 |
|---|---|---|
| 1 | `quiz_llm_log` 채울 방법 없음 | AI 내부에 stage/model/input_tokens/output_tokens/latency_ms/succeeded가 모두 집계되지만 `/status` 응답에 노출되지 않는다. 필요하면 응답에 `meter` 필드를 추가할 수 있음 — **요청 주면 반영** |
| 2 | 인증/인가 없음 | 현재 AI 엔드포인트에 인증이 없다. 내부망 전용으로 둘지, 백엔드가 프록시할지 결정 필요 |
| 3 | 멀티파일 출제 | §3.2. 필요 여부 확인 |
| 4 | 영속 저장 | §3.5. AI에 DB를 붙일지, 백엔드 저장만으로 충분한지 결정 필요 |
| 5 | base URL / 포트 | 배포 시 확정 |

---

## 부록. 로컬에서 직접 찔러보기

```
cd ai_service
.\venv\Scripts\uvicorn.exe app.main:app --reload
```

Swagger: http://127.0.0.1:8000/docs

`.env`의 `AI_MOCK=1`이면 LLM을 호출하지 않고 가짜 응답을 준다. 실제 퀴즈를 보려면 `AI_MOCK=0`.

```bash
curl -X POST "http://127.0.0.1:8000/api/quiz?project=demo" \
  -H "Content-Type: application/json" \
  -d '{"mode":"ASSESSMENT","requested_count":5,"version_hash":"test-1",
       "target_files":["solution.py"],
       "files":{"solution.py":"def fib(n, memo={}):\n    if n in memo:\n        return memo[n]\n    if n <= 1:\n        return n\n    memo[n] = fib(n-1, memo) + fib(n-2, memo)\n    return memo[n]\n"}}'

curl "http://127.0.0.1:8000/api/quiz/1/status"
```
