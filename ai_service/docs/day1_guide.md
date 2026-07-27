# Day 1 손코딩 가이드 — 껍데기 API 만들기

> 목표: `uvicorn`으로 서버 띄우고 Swagger에서 가짜 퀴즈가 응답으로 나오면 성공.
> 파일 순서대로 따라 치면 된다. 각 코드 블록 위에 "왜 이렇게 쓰는지" 설명 있음.

---

## 0. 시작 전 준비 (터미널)

```bash
cd ~/Desktop/S15P11A604/ai_service

# 가상환경 (이미 있으면 activate만)
python -m venv .venv
source .venv/Scripts/activate

# 설치
pip install fastapi "uvicorn[standard]" python-dotenv

# 설치된 버전 기록
pip freeze > requirements.txt
```

- `pydantic`은 fastapi가 자동으로 같이 설치함 (따로 안 깔아도 됨)
- `uvicorn[standard]` = 개발용 자동 리로드 등 부가기능 포함 버전

---

## 1. `.env` — 비밀키 보관

**경로**: `ai_service/.env`

```
GMS_API_KEY=여기에_발급받은_키
```

- 오늘은 안 쓰지만 Day 2에 쓰니까 미리 만들어 둠
- `.gitignore`에 `.env` 있는지 꼭 확인 (git에 올라가면 사고)

---

## 2. `app/config.py` — 설정을 한 곳에

**왜**: 모델명·주소·상수가 코드 여기저기 흩어지면 나중에 못 고친다. 전부 여기로 모은다.

```python
"""앱 전체 설정 — 환경변수와 상수를 한 곳에서 관리."""

import os

from dotenv import load_dotenv

load_dotenv()  # .env 파일을 읽어 환경변수로 등록

# --- GMS (LLM 게이트웨이) ---
GMS_API_KEY = os.environ.get("GMS_API_KEY", "")
OPENAI_BASE = "https://gms.ssafy.io/gmsapi/api.openai.com/v1"
ANTHROPIC_BASE = "https://gms.ssafy.io/gmsapi/api.anthropic.com"

# --- 모델 배치 (A/B 실측 결과 기준, 바뀌면 여기만 수정) ---
GEN_MODEL = "claude-sonnet-4-6"
SOLVER_MODEL = "claude-haiku-4-5-20251001"
JUDGE_MODEL = "claude-haiku-4-5-20251001"

# --- 파이프라인 상수 ---
NUM_QUIZZES_DEFAULT = 5   # 요청에 count 없을 때 기본 문항 수
JUDGE_PASS_SCORE = 7      # 10점 만점 통과선
MAX_RETRY = 2             # refine 최대 재시도
MAX_TOKENS = 2000         # 출력 폭주 방지 안전핀

# --- 개발 모드 ---
MOCK = os.environ.get("AI_MOCK", "0") == "1"  # AI_MOCK=1이면 LLM 호출 안 함
```

**포인트**
- `load_dotenv()`: `.env` 내용을 `os.environ`으로 읽어오게 해주는 함수
- `os.environ.get("키", "기본값")`: 환경변수 없어도 안 죽고 기본값 사용
- `MOCK`: 환경변수는 문자열이라 `"1"`과 비교해서 bool로 변환

---

## 3. `app/schemas/request.py` — 백엔드가 보내는 요청 모양

**왜**: Pydantic 모델로 정의하면 FastAPI가 요청 JSON을 자동 검증해준다.
잘못된 요청(필드 누락, 타입 오류)은 코드에 도달하기 전에 422 에러로 걸러짐.

**회의 반영**: 파일 단위 출제라서 `line_start/end`는 옵션(`None` 허용).

```python
"""POST /quizzes/generate 요청 스키마."""

from pydantic import BaseModel, Field


class Target(BaseModel):
    """어느 파일로 출제할지. MVP는 파일 단위라 line은 옵션."""
    file_path: str
    line_start: int | None = None
    line_end: int | None = None


class QuizConfig(BaseModel):
    """사용자가 고른 출제 옵션."""
    count: int = 5
    types: list[str] = ["MULTIPLE_CHOICE"]
    ratio: dict[str, int] = {"easy": 30, "normal": 50, "hard": 20}
    user_prompt: str | None = None   # "cleanup 위주로" 같은 자유 입력


class GenerateRequest(BaseModel):
    """백엔드 → AI 서버 퀴즈 생성 요청 (meeting.md 합의 형태)."""
    quiz_set_id: int
    language: str                      # "python", "javascript" 등
    target: Target
    files: dict[str, str] = Field(     # {"solution.py": "코드 전문..."}
        description="파일명 → 코드 전문. MVP는 target 파일 하나만 사용"
    )
    config: QuizConfig = QuizConfig()  # 안 보내면 전부 기본값
```

**포인트**
- `int | None = None`: "없어도 되는 필드". 파이썬 3.10+ 문법
- `= QuizConfig()`: config 통째로 생략해도 기본값으로 채워짐
- `Field(description=...)`: Swagger 문서에 설명이 표시됨

---

## 4. `app/schemas/quiz.py` — 우리가 돌려주는 응답 모양

**왜**: 응답도 모델로 정의하면 Swagger에 응답 예시가 자동 표시되고,
필드 빠뜨린 채 반환하면 서버가 바로 에러를 내서 실수를 잡아준다.

```python
"""퀴즈 및 상태 응답 스키마."""

from typing import Literal

from pydantic import BaseModel


class Quiz(BaseModel):
    """객관식 문항 하나. 코드는 복제하지 않고 줄 번호로만 참조."""
    question: str
    choices: list[str]                 # 보기 4개
    answer_index: int                  # 정답 보기 번호 (0~3)
    explanation: str
    difficulty: Literal["easy", "normal", "hard"]
    tested_concept: str                # 개념 태그 (예: "재귀 종료 조건")
    line_start: int | None = None      # 문항이 참조하는 코드 줄 범위
    line_end: int | None = None


class GenerateAccepted(BaseModel):
    """POST 즉시 응답 — '접수했다'만 알림 (생성은 비동기)."""
    quiz_set_id: int
    status: Literal["PENDING"] = "PENDING"


class QuizSetStatus(BaseModel):
    """GET /quizzes/{id}/status 응답."""
    quiz_set_id: int
    status: Literal["PENDING", "GENERATING", "READY", "FAILED"]
    quizzes: list[Quiz] = []           # READY 전에는 빈 리스트
```

**포인트**
- `Literal[...]`: 이 값들만 허용. 오타(`"REDY"` 등)를 서버가 잡아줌
- `POST` 응답을 퀴즈가 아니라 "접수됨(PENDING)"으로 한 이유:
  Day 4에 비동기로 바꿀 때 응답 모양이 안 바뀌게 → 백엔드와 인터페이스 유지

---

## 5. `app/api/quizzes.py` — 엔드포인트 2개

**왜**: 라우터를 main.py에서 분리하면 나중에 엔드포인트가 늘어도 파일별로 정리된다.

```python
"""퀴즈 생성/조회 엔드포인트."""

from fastapi import APIRouter

from app.schemas.quiz import GenerateAccepted, Quiz, QuizSetStatus
from app.schemas.request import GenerateRequest

router = APIRouter(prefix="/quizzes", tags=["quizzes"])

# Day 4에서 진짜 파이프라인으로 교체할 가짜 문항
FAKE_QUIZZES = [
    Quiz(
        question="[가짜] fib(4)의 반환값은?",
        choices=["2", "3", "5", "8"],
        answer_index=1,
        explanation="fib(4) = fib(3) + fib(2) = 2 + 1 = 3",
        difficulty="easy",
        tested_concept="재귀 호출",
        line_start=1,
        line_end=7,
    ),
    Quiz(
        question="[가짜] memo 기본 인자를 쓰면 생기는 효과는?",
        choices=["매번 초기화", "호출 간 캐시 공유", "에러 발생", "무한 재귀"],
        answer_index=1,
        explanation="가변 기본 인자는 함수 호출 간에 공유된다.",
        difficulty="normal",
        tested_concept="가변 기본 인자",
        line_start=1,
        line_end=2,
    ),
]


@router.post("/generate", response_model=GenerateAccepted)
def generate_quizzes(req: GenerateRequest) -> GenerateAccepted:
    """생성 요청 접수. 지금은 접수 응답만, Day 4에 백그라운드 생성 연결."""
    return GenerateAccepted(quiz_set_id=req.quiz_set_id)


@router.get("/{quiz_set_id}/status", response_model=QuizSetStatus)
def get_status(quiz_set_id: int) -> QuizSetStatus:
    """생성 상태 조회. 지금은 항상 READY + 가짜 문항."""
    return QuizSetStatus(
        quiz_set_id=quiz_set_id,
        status="READY",
        quizzes=FAKE_QUIZZES,
    )
```

**포인트**
- `APIRouter(prefix="/quizzes")`: 이 파일의 모든 경로 앞에 `/quizzes` 자동으로 붙음
- `req: GenerateRequest`: 요청 body가 자동으로 이 모델로 검증·변환됨
- `response_model=...`: 응답 검증 + Swagger 문서화
- `{quiz_set_id}`: URL 경로의 숫자가 함수 인자로 들어옴 (path parameter)

---

## 6. `app/main.py` — 진입점

**왜**: 앱 생성과 라우터 등록만 하는 얇은 파일. 로직은 여기 안 넣는다.

```python
"""FastAPI 진입점. 실행: uvicorn app.main:app --reload"""

from fastapi import FastAPI

from app.api.quizzes import router as quizzes_router

app = FastAPI(
    title="Qurie AI Service",
    description="코드 리뷰 기반 퀴즈 생성 AI 서버",
    version="0.1.0",
)

app.include_router(quizzes_router)


@app.get("/health")
def health() -> dict:
    """서버 살아있는지 확인용 (배포 후 인프라에서도 씀)."""
    return {"status": "ok"}
```

---

## 7. `__init__.py` 4개 — 전부 빈 파일

폴더를 파이썬 패키지로 인식시키는 표식. 내용 없이 만들면 됨.

```
app/__init__.py
app/api/__init__.py
app/schemas/__init__.py
```

(터미널에서 `touch app/__init__.py app/api/__init__.py app/schemas/__init__.py`)

---

## 8. 실행 & 확인

```bash
# ai_service 폴더에서 (가상환경 켜진 상태)
uvicorn app.main:app --reload
```

1. 브라우저에서 `http://127.0.0.1:8000/docs` 열기 (Swagger UI)
2. `GET /health` → `{"status": "ok"}` 나오는지
3. `POST /quizzes/generate` → "Try it out"에 아래 JSON 넣고 실행:

```json
{
  "quiz_set_id": 1,
  "language": "python",
  "target": { "file_path": "solution.py" },
  "files": { "solution.py": "def fib(n):\n    ..." },
  "config": { "count": 3 }
}
```

→ `{"quiz_set_id": 1, "status": "PENDING"}` 나오면 성공

4. `GET /quizzes/1/status` → READY + 가짜 문항 2개 나오면 성공
5. 일부러 `quiz_set_id`를 빼고 POST → 422 에러 나오는지 (검증 동작 확인)

---

## 9. 커밋 (작업 단위로 3개 권장)

레포 규칙 `<타입>(<스코프>): <제목>` 기준.

```bash
# 1) 환경 구성 (requirements, __init__ 뼈대)
git add ai_service/requirements.txt ai_service/app/__init__.py ai_service/app/api/__init__.py ai_service/app/schemas/__init__.py
git commit -m "chore(ai): FastAPI 개발 환경 및 패키지 뼈대 구성"

# 2) 스키마
git add ai_service/app/schemas/
git commit -m "feat(ai): 퀴즈 생성 요청/응답 Pydantic 스키마 정의"

# 3) API + 설정
git add ai_service/app/main.py ai_service/app/config.py ai_service/app/api/
git commit -m "feat(ai): 퀴즈 생성/상태 조회 껍데기 엔드포인트 추가"
```

한 번에 몰아 커밋하고 싶으면:

```bash
git add ai_service/app ai_service/requirements.txt
git commit -m "feat(ai): FastAPI 껍데기 API 구성 (스키마 + 엔드포인트 + 설정)"
```

**주의**: `.env`는 절대 add 하지 말 것. `git status`에서 `.env`가 안 보여야 정상 (`.gitignore` 동작 중).

---

## 10. 계획서와 달라진 점 1개 (알고 넘어가기)

`dev_plan_5days.md`에는 "POST → 가짜 퀴즈로 응답"이라 했지만,
여기서는 **POST → 접수(PENDING)만 응답**하고 퀴즈는 GET에서 주는 걸로 했다.

이유: Day 4에 비동기(BackgroundTasks)로 바꾸면 POST는 어차피 접수만 응답하게 된다.
처음부터 최종 모양으로 만들어야 백엔드와 맞춘 인터페이스가 중간에 안 바뀐다.
