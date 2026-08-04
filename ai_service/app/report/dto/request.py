from typing import Literal

from pydantic import BaseModel, Field, field_validator


class ConceptCount(BaseModel):
    """개념/난이도별 집계. 백엔드 concept_stats·difficulty_ratio 와 같은 모양."""

    total: int = Field(ge=0)
    attempted: int = Field(ge=0)
    correct: int = Field(ge=0)


class ReportSummary(BaseModel):
    """서버가 quiz_progress 에서 이미 계산한 값.

    AI에게 다시 계산시키지 않는다. LLM 산술은 틀리고, 화면의 집계 숫자와 어긋나는
    순간 리포트 전체의 신뢰가 무너진다. AI는 이 숫자를 사실로 받아 해석만 한다.
    """

    quiz_total_count: int = Field(ge=0)
    quiz_attempted_count: int = Field(ge=0)
    quiz_correct_count: int = Field(ge=0)
    quiz_skipped_count: int = Field(default=0, ge=0)
    # 백엔드는 응시 기록이 없으면 이 셋을 null 로 보낸다(BigDecimal/Integer 가 nullable).
    # 타입을 int/float 로만 두면 그 경우 422 가 나므로 None 을 받아 0 으로 접는다.
    accuracy: float | None = Field(default=0.0, ge=0, le=100)
    completion_rate: float | None = Field(default=0.0, ge=0, le=100)
    avg_elapsed_ms: int | None = Field(default=0, ge=0)
    difficulty_ratio: dict[str, ConceptCount] | None = Field(default_factory=dict)
    concept_stats: dict[str, ConceptCount] | None = Field(default_factory=dict)

    @field_validator("accuracy", "completion_rate", "avg_elapsed_ms", mode="after")
    @classmethod
    def zero_if_missing(cls, v):
        return 0 if v is None else v

    @field_validator("difficulty_ratio", "concept_stats", mode="after")
    @classmethod
    def empty_if_missing(cls, v):
        return v or {}


class Attempt(BaseModel):
    """문항 1개에 대한 응시 기록. quiz + quiz_choice + quiz_progress 조인 결과."""

    index: int = Field(ge=0)
    question: str
    choices: list[str] = Field(default_factory=list)
    answer_index: int = Field(ge=0)
    chosen_index: int | None = None  # 미응시(SKIPPED/TIMEOUT)면 None
    is_correct: bool | None = None
    explanation: str | None = None
    tested_concept: str = ""
    difficulty: Literal["EASY", "NORMAL", "HARD"] = "NORMAL"
    purpose: Literal["CONCEPTUAL", "MICRO"] = "MICRO"
    file_path: str | None = None
    line_start: int | None = None
    line_end: int | None = None
    elapsed_ms: int = Field(default=0, ge=0)


class CreateReportRequest(BaseModel):
    """POST /api/report body"""

    student_name: str = Field(min_length=1, max_length=50)
    session_id: int | None = None
    quiz_set_id: int | None = None
    summary: ReportSummary
    attempts: list[Attempt] = Field(default_factory=list, max_length=50)

    @field_validator("attempts")
    @classmethod
    def sort_by_index(cls, v: list[Attempt]) -> list[Attempt]:
        """AI가 참조하는 문항 번호를 안정시킨다. 순서가 흔들리면 오답 지적이 어긋난다."""
        return sorted(v, key=lambda a: a.index)
