# ai_service 5일 개발 계획 (7/27 ~ 7/31)

> 이 문서는 "무슨 파일을, 언제, 왜 만드는지"를 정한 실행 계획이다.
> 설계 배경은 `setup.md` / `quiz_design_final.md`, 팀 합의는 `meeting.md` 참고.

---

## 0. 이번 회의(7/27)에서 바뀐 것 — 계획에 반영됨

| 항목 | 원래 계획 | 변경 후 (이 문서 기준) |
|---|---|---|
| AST 분석 | `analysis/ast_tools.py`로 import·외부 참조 감지 | **보류.** 시간 남으면 마지막에 추가 |
| 출제 단위 | 드래그 범위 + 의존성 확장 | **파일 하나 통째로.** 파일 안에 다른 파일 import가 있어도 무시 |
| analyze_code 노드 | 파이프라인 첫 노드 (AST) | **뺀다.** 파이프라인은 generate부터 시작 |

즉 파이프라인이 이렇게 단순해진다:

```
[원래]  analyze_code(AST) → generate → solve_blind → judge → (refine 루프)
[지금]  generate → solve_blind → judge → (refine 루프)
```

받은 파일 코드를 그대로 프롬프트에 넣고 출제한다.
import된 함수의 정의를 못 찾아도 신경 쓰지 않는다. (그건 AST 확장 때 해결)

---

## 1. 최종 목표 (5일 후 완성 상태)

백엔드가 `POST /quizzes/generate`로 코드를 보내면:

1. 즉시 "접수됨(PENDING)" 응답을 돌려주고
2. 백그라운드에서 Generator → Solver → Judge 루프를 돌려 퀴즈를 만들고
3. `GET /quizzes/{quiz_set_id}/status`로 물어보면 READY + 문항을 돌려준다

전 과정 mock 모드 지원 (크레딧 0으로 개발).

---

## 2. 폴더 구조 (이번 5일 동안 만들 것 전부)

`setup.md`의 구조에서 AST 관련(`analysis/`, `nodes/analyze.py`)을 빼고,
각 파일에 만드는 날짜를 붙였다.

```
ai_service/
├── docs/                        # (이미 있음)
├── app/
│   ├── __init__.py              # Day 1
│   ├── main.py                  # Day 1 — FastAPI 진입점, 라우터 등록
│   ├── config.py                # Day 1 — 환경변수, 모델명, 상수 한 곳에
│   ├── api/
│   │   ├── __init__.py          # Day 1
│   │   └── quizzes.py           # Day 1 — POST /quizzes/generate, GET status
│   ├── schemas/
│   │   ├── __init__.py          # Day 1
│   │   ├── request.py           # Day 1 — 요청 모델 (GenerateRequest 등)
│   │   └── quiz.py              # Day 1 — 응답 모델 (Quiz, QuizSetStatus 등)
│   ├── llm/
│   │   ├── __init__.py          # Day 2
│   │   └── client.py            # Day 2 — GMS 호출 래퍼 (분기·usage·mock)
│   └── pipeline/
│       ├── __init__.py          # Day 3
│       ├── state.py             # Day 3 — PipelineState (TypedDict)
│       ├── prompts.py           # Day 3 — 프롬프트 빌더 함수 모음
│       ├── graph.py             # Day 4 — LangGraph 그래프 조립
│       └── nodes/
│           ├── __init__.py      # Day 3
│           ├── generate.py      # Day 3 — 출제 노드
│           ├── solve.py         # Day 3 — 블라인드 풀이 노드
│           ├── judge.py         # Day 4 — 판정 노드
│           └── refine.py        # Day 4 — 재생성 노드
├── tests/
│   ├── __init__.py              # Day 5
│   └── test_pipeline.py         # Day 5 — mock 모드 전체 흐름 테스트
├── .env                         # Day 1 — GMS_API_KEY (git 금지!)
├── .gitignore                   # (이미 있음 — .env, .venv 포함 확인)
├── requirements.txt             # Day 1 — 정리해서 다시 작성
└── README.md                    # Day 5 — 실행법 문서화
```

**빠진 것 (의도적)**:
- `analysis/ast_tools.py`, `nodes/analyze.py` → AST 보류라서 제외. Day 5에 시간 남으면 여기 추가
- `Dockerfile` → 인프라 담당과 협의 후 (5일 범위 밖)
- 시맨틱 캐시 → MVP 이후

---

## 3. 날짜별 계획

### Day 1 (7/27 월) — 껍데기 API: 가짜 퀴즈라도 응답이 돈다

**만드는 파일**: `app/main.py`, `app/config.py`, `app/api/quizzes.py`, `app/schemas/request.py`, `app/schemas/quiz.py`, `.env`, `requirements.txt`, 각 `__init__.py`

**하는 일**:
1. 가상환경 만들고 `fastapi`, `uvicorn`, `pydantic`, `python-dotenv` 설치
2. `schemas/request.py` — meeting.md의 요청 JSON을 Pydantic 모델로 옮긴다
   - `GenerateRequest`: quiz_set_id, language, target, files, config
   - 파일 단위 출제로 바뀌었으니 `target`은 `file_path`만 필수, line은 옵션으로
3. `schemas/quiz.py` — 응답 모델
   - `Quiz`: question, choices(4개), answer_index, explanation, difficulty, tested_concept, line_start/end
   - `QuizSetStatus`: status(PENDING/GENERATING/READY/FAILED), quizzes
4. `api/quizzes.py` — 엔드포인트 2개
   - `POST /quizzes/generate` → 일단 하드코딩된 가짜 퀴즈로 응답
   - `GET /quizzes/{quiz_set_id}/status` → 일단 항상 READY + 가짜 퀴즈
5. `config.py` — GMS 주소, 모델명, NUM_QUIZZES 같은 상수를 전부 여기로

**끝나면 확인**: `uvicorn app.main:app --reload` 띄우고 `/docs`(Swagger)에서 두 엔드포인트 호출이 되는지

---

### Day 2 (7/28 화) — LLM 클라이언트: GMS 실제 호출이 된다

**만드는 파일**: `app/llm/client.py`

**하는 일**:
1. `Quiz_lab.py`의 `call_llm` / `Usage` / provider 분기 로직을 정식 모듈로 옮겨 다듬는다
   - `call_llm(model, prompt, purpose)` — claude면 Anthropic, 아니면 OpenAI 경로
   - `Usage` — 토큰 실측 기록 (연습 코드에서 검증된 부분이라 거의 그대로)
   - mock 모드 — 환경변수 `AI_MOCK=1`이면 가짜 JSON 반환 (크레딧 0)
2. JSON 강제(response_format) 시도 → 실패 시 폴백 로직 유지
3. 실제 GMS 호출 1~2번만 해서 응답이 오는지 확인 (그 뒤로는 mock으로)

**끝나면 확인**: 파이썬 셸에서 `call_llm(...)` 한 번 호출 → 응답 텍스트 + usage 로그 찍히는지

---

### Day 3 (7/29 수) — 파이프라인 전반부: 생성·풀이 노드

**만드는 파일**: `app/pipeline/state.py`, `app/pipeline/prompts.py`, `app/pipeline/nodes/generate.py`, `app/pipeline/nodes/solve.py`

**하는 일**:
1. `langgraph` 설치
2. `state.py` — 파이프라인이 노드 사이에서 주고받는 상태 정의
   - code(파일 전체), config, quizzes, solver_answers, critiques, retry_count, usage 등
3. `prompts.py` — 프롬프트를 함수로 분리
   - `build_generate_prompt(code, config)` — **파일 전체를 넣고** N문항 배치 생성. "코드에 없는 외부 함수의 내부 동작은 묻지 마라" 한 줄을 프롬프트에 넣어 import 문제를 우회
   - `build_solve_prompt(quizzes)` — 정답 가리고 배치 풀이
4. `generate.py` / `solve.py` — 각 노드는 "state 받아서 → 프롬프트 만들고 → call_llm → 파싱해서 state 갱신" 패턴
5. 노드 단위로 mock 실행해 파싱까지 되는지 확인

**끝나면 확인**: 그래프 없이 `generate → solve` 두 함수를 손으로 이어 호출했을 때 mock 데이터가 흘러가는지

---

### Day 4 (7/30 목) — 파이프라인 완성 + API 연결: 진짜로 돈다

**만드는 파일**: `app/pipeline/nodes/judge.py`, `app/pipeline/nodes/refine.py`, `app/pipeline/graph.py`
**수정하는 파일**: `app/api/quizzes.py` (가짜 퀴즈 → 진짜 파이프라인)

**하는 일**:
1. `judge.py` — 정답 일치는 코드로 비교(`==`, LLM 0콜), 일치한 것만 품질 채점 1콜
2. `refine.py` — 불합격 문항의 critique를 모아 재생성 프롬프트에 누적. 최대 재시도 횟수는 `config.py`에 (예: 2회)
3. `graph.py` — LangGraph로 조립
   - `generate → solve → judge` + 조건부 엣지 (fail → refine → generate로 루프 / retry 초과 → 탈락 처리 → END)
4. `api/quizzes.py` 교체
   - POST 받으면 quiz_set_id 상태를 PENDING으로 메모리 dict에 저장 → FastAPI `BackgroundTasks`로 파이프라인 실행 → 끝나면 READY로 갱신
   - GET status는 그 dict를 읽어서 반환 (DB 없이 메모리로. 서버 재시작하면 날아가지만 MVP는 OK)

**끝나면 확인**: Swagger에서 POST(mock) → 몇 초 뒤 GET에서 READY + 문항 나오는지. 전체 흐름 1회는 실제 LLM으로도 확인

---

### Day 5 (7/31 금) — 검증·정리 + (남으면) AST

**만드는 파일**: `tests/test_pipeline.py`, `README.md`

**하는 일**:
1. mock 모드로 전체 파이프라인 테스트 작성 (요청 → READY까지)
2. 에러 처리 보강: LLM 응답 JSON 파싱 실패, GMS 타임아웃 → status=FAILED로 남기기
3. 실제 LLM으로 통과율 확인하고 프롬프트 1차 튜닝 (usage 로그로 문항당 비용도 확인)
4. `README.md` — 설치, .env 설정, 실행법, mock 사용법
5. 백엔드 담당에게 인터페이스(요청/응답 JSON) 공유

**시간이 남으면 (여기서부터 AST)**:
- `app/analysis/ast_tools.py` 생성 — Python `ast` 모듈로 import 목록만 감지 (1단계)
- generate 프롬프트에 "이 코드는 외부 모듈 X를 씁니다. 그 내부 동작은 출제하지 마세요"라고 감지 결과를 주입
- 파이프라인 맨 앞에 `analyze` 노드로 붙이는 건 그다음

---

## 4. 진행하면서 지킬 것

- **개발 중 LLM 호출은 전부 mock** (`AI_MOCK=1`). 실제 호출은 프롬프트 검증 때만
- 연습 파일(`Quiz_lab.py`, `Model_ab_test.py`, `langchain_practice.py`)은 건드리지 않고 참고만. 정식 코드는 전부 `app/` 아래
- 하루 끝나면 그날 "끝나면 확인" 항목이 되는지 보고 커밋 (`feat(api): ...` 규칙)
- 계획이 틀어지면 이 문서를 고치고 진행 (문서가 현실을 따라가게)

## 5. 5일 안에 안 하는 것 (헷갈리지 않게 명시)

- AST 분석 (Day 5 여유분으로만)
- 시맨틱 캐시, 임베딩, 문항 은행
- DB 연결 (상태는 메모리 dict로)
- Dockerfile / 배포
- ASSESSMENT/PRACTICE 모드 분기 (생성 파이프라인은 공통이므로 이후에)
- 단답형/빈칸 유형 (객관식만)
