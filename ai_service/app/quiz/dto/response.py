from typing import Literal

from pydantic import BaseModel, Field


class Quiz(BaseModel):
    purpose: Literal["CONCEPTUAL", "MICRO"] = "MICRO"
    difficulty: Literal["EASY", "NORMAL", "HARD"]
    tested_concept: str = Field(max_length=60)
    question: str
    choices: list[str]
    answer_index: int
    explanation: str | None = None
    file_path: str | None = None
    line_start: int | None = None
    line_end: int | None = None


class QuizSetAccepted(BaseModel):
    quiz_set_id: int
    project: str
    status: Literal["PENDING"] = "PENDING"


class QuizResponse(BaseModel):
    project: str
    quiz_set_id: int | None = None
    status: Literal["READY", "PENDING", "GENERATING", "FAILED"] = "READY"
    quizzes: list[Quiz] = []
    error_message: str | None = None
