from fastapi import APIRouter, Query

from app.schemas.quiz import Quiz, QuizResponse

router = APIRouter(prefix="/api", tags=["quiz"])

# Day 4에서 진짜 파이프라인으로 교체할 가짜 문항
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
    """세션 화면 퀴즈 생성. Day 1은 project만 받고 가짜 문항 반환."""
    return QuizResponse(
        project=project,
        status="READY",
        quizzes=FAKE_QUIZZES,
    )