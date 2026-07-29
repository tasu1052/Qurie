# Day 1 손코딩 가이드 — 껍데기 API

> 목표: `POST /api/quiz?project=...` 호출 시 가짜 퀴즈 JSON이 나오면 성공.  
> 계약 원본: `docs/quiz_generation_contract.md` (§2 API, §2.2 요청 스키마)  
> 계획: `docs/dev_plan_5days.md`

---

## 오늘 범위 / 안 하는 것

| 함 | 안 함 |
|---|---|
| FastAPI 껍데기 + Swagger | LLM 호출 |
| `POST /api/quiz?project=` | Generator/Solver/Judge |
| 요청·응답 Pydantic 스키마 | DB, BackgroundTasks |
| mock 가짜 문항 READY 응답 | 비동기 PENDING→READY |

---

## 0. 준비

```bash
cd ~/Desktop/S15P11A604/ai_service
python -m venv venv          # 또는 .venv
source venv/Scripts/activate # Git Bash
pip install fastapi "uvicorn[standard]" python-dotenv
pip freeze > requirements.txt
```

`.env` (git 금지):

```
GMS_API_KEY=발급키
```

---

## 1. 파일 위치 (계약 §2.2)

```
ai_service/app/
├── main.py
├── config.py
├── api/
│   └── quizzes.py      ← POST /api/quiz
└── schemas/
    ├── request.py      ← CreateQuizSetRequest 등 (계약 §2.2 정본)
    └── quiz.py         ← Quiz, QuizSetAccepted, QuizResponse
```

**주의**: 응답 모델(`Quiz`)은 `schemas/quiz.py`에. `request.py`에는 요청만.

---

## 2. `app/config.py`

```python
import os
from dotenv import load_dotenv

load_dotenv()

GMS_API_KEY = os.environ.get("GMS_API_KEY", "")
OPENAI_BASE = "https://gms.ssafy.io/gmsapi/api.openai.com/v1"
ANTHROPIC_BASE = "https://gms.ssafy.io/gmsapi/api.anthropic.com"
GEMINI_BASE = "https://gms.ssafy.io/gmsapi/generativelanguage.googleapis.com"

GEN_MODEL = "claude-sonnet-4-6"
SOLVER_MODEL = "gemini-2.5-flash-lite"   # 생성과 계열 분리 (계약 권고)
JUDGE_MODEL = "gemini-2.5-flash-lite"

JUDGE_PASS_SCORE = 7
MAX_RETRY = 1                 # 계약 MAX_REGEN_PER_ITEM
MAX_TOKENS = 2000
GEN_INPUT_CODE_TOKEN_BUDGET = 6000

MOCK = os.environ.get("AI_MOCK", "0") == "1"
```

---

## 3. API 모양 (계약 §2.1)

```
POST /api/quiz?project={projectId}
```

| Day 1 | 정식(Day 4+) |
|---|---|
| Query `project`만 필수 | + JSON body `CreateQuizSetRequest` |
| 즉시 `READY` + 가짜 문항 | `PENDING` 접수 → 백그라운드 생성 |

Day 1은 body를 **아직 안 받아도 됨**. 다만 `request.py` 스키마는 오늘 만들어 두어 Day 4에 붙인다.

---

## 4. `app/schemas/request.py` (계약 §2.2 — 이미 있으면 확인만)

정본은 저장소의 `app/schemas/request.py`를 따른다. 핵심만:

- `QuizMode`: ASSESSMENT / PRACTICE
- `DifficultyRatio`: 상대 가중치 (합 100 불필요, 전부 0만 금지) + `to_counts()`
- `CreateQuizSetRequest`: mode, requested_count∈{5,10,15,20}, ratio, user_prompt, version_hash, target_files

**어디에 쓰이나**: Day 4에 `quizzes.py`가 `body: CreateQuizSetRequest`로 import.  
지금은 클래스가 “정의만” 되어 있어도 OK (직접 실행되는 코드 아님).

검증 확인 (선택):

```bash
cd ai_service
../venv/Scripts/python.exe -c "from app.schemas.request import CreateQuizSetRequest; print(CreateQuizSetRequest(mode='ASSESSMENT', requested_count=10, version_hash='x').ratio.to_counts(10))"
```

---

## 5. `app/schemas/quiz.py` — 응답

```python
"""퀴즈 응답 스키마. 계약 §4 / ERD quiz 컬럼과 맞춤."""

from typing import Literal

from pydantic import BaseModel, Field


class Quiz(BaseModel):
    """객관식 1문항. 코드 원문 복제 금지 → 줄번호만."""
    purpose: Literal["CONCEPTUAL", "MICRO"] = "MICRO"
    difficulty: Literal["EASY", "NORMAL", "HARD"]
    tested_concept: str = Field(max_length=60)
    question: str
    choices: list[str]                 # 정확히 4개 (Day4 검증)
    answer_index: int                  # 0~3
    explanation: str | None = None
    file_path: str | None = None
    line_start: int | None = None
    line_end: int | None = None


class QuizSetAccepted(BaseModel):
    """POST 접수 응답 (Day4 비동기). Day1은 안 써도 됨."""
    quiz_set_id: int
    project: str
    status: Literal["PENDING"] = "PENDING"


class QuizResponse(BaseModel):
    """Day1: 바로 READY. Day4 GET status와 비슷하게 맞춤."""
    project: str
    quiz_set_id: int | None = None
    status: Literal["READY", "PENDING", "GENERATING", "FAILED"] = "READY"
    quizzes: list[Quiz] = []
    error_message: str | None = None
```

ERD는 difficulty가 `EASY/NORMAL/HARD` 대문자. Day1 가짜 데이터도 대문자로 맞춘다.

---

## 6. `app/api/quizzes.py`

```python
from fastapi import APIRouter, Query

from app.schemas.quiz import Quiz, QuizResponse

router = APIRouter(prefix="/api", tags=["quiz"])

FAKE_QUIZZES = [
    Quiz(
        purpose="MICRO",
        difficulty="EASY",
        tested_concept="재귀 호출",
        question="[가짜] fib(4)의 반환값은?",
        choices=["2", "3", "5", "8"],
        answer_index=1,
        explanation="fib(4)=fib(3)+fib(2)=3",
        file_path="solution.py",
        line_start=1,
        line_end=7,
    ),
    Quiz(
        purpose="MICRO",
        difficulty="NORMAL",
        tested_concept="가변 기본 인자",
        question="[가짜] memo={} 기본인자의 효과는?",
        choices=["매호출 초기화", "호출 간 공유", "에러", "무한재귀"],
        answer_index=1,
        explanation="가변 기본값은 함수 정의 시 1회 생성되어 공유된다.",
        file_path="solution.py",
        line_start=1,
        line_end=2,
    ),
]


@router.post("/quiz", response_model=QuizResponse)
def create_quiz(project: str = Query(..., description="프로젝트 식별값")) -> QuizResponse:
    """세션 화면 퀴즈 생성 — Day1은 project만, 가짜 READY."""
    return QuizResponse(project=project, status="READY", quizzes=FAKE_QUIZZES)
```

---

## 7. `app/main.py`

```python
from fastapi import FastAPI
from app.api.quizzes import router as quizzes_router

app = FastAPI(title="Qurie AI Service", version="0.1.0")
app.include_router(quizzes_router)

@app.get("/health")
def health():
    return {"status": "ok"}
```

---

## 8. 확인

```bash
uvicorn app.main:app --reload
```

1. `GET /health` → ok  
2. Swagger `POST /api/quiz` → project=`demo-1` → READY + 가짜 2문항  
3. `project` 없이 호출 → 422  
4. (선택) `CreateQuizSetRequest` 단위 테스트로 ratio `to_counts` 확인  

```bash
curl -X POST "http://127.0.0.1:8000/api/quiz?project=demo-1"
```

---

## 9. 커밋 메시지 예

```bash
git add ai_service/app ai_service/docs/day1_guide.md
git commit -m "feat(ai): POST /api/quiz 껍데기 API 및 요청/응답 스키마"
```

---

## 10. 내일(Day2) 미리보기

`app/llm/client.py` — GMS 호출 래퍼 (OpenAI/Anthropic/Gemini + mock + usage 실측).  
연습 코드: `files/quiz_experiment.py`의 `call_llm` / `call_gemini`.
