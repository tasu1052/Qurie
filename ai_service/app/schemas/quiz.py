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