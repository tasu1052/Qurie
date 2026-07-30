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


class RejectedQuiz(Quiz):
    """검증에서 걸러진 문항. 왜 떨어졌는지 확인·프롬프트 개선용."""

    judge_score: int | None = None
    reject_reason: str | None = None


class LlmCall(BaseModel):
    """LLM 호출 1건. quiz_llm_log 한 행에 대응."""

    stage: Literal["GENERATE", "SOLVE", "JUDGE"]
    model: str
    input_tokens: int = 0
    output_tokens: int = 0
    latency_ms: int = 0
    succeeded: bool = True


class QuizSetAccepted(BaseModel):
    quiz_set_id: int
    project: str
    status: Literal["PENDING"] = "PENDING"


class QuizResponse(BaseModel):
    project: str
    quiz_set_id: int | None = None
    status: Literal["READY", "PENDING", "GENERATING", "FAILED"] = "READY"
    quizzes: list[Quiz] = []
    rejected: list[RejectedQuiz] = []
    meter: list[LlmCall] = []
    error_message: str | None = None
