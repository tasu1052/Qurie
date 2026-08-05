from typing import Literal

from pydantic import BaseModel, Field, field_validator, model_validator

from app.core import config


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


class Cohort(BaseModel):
    """같은 퀴즈를 푼 학생 전체의 문항별 집계.

    같은 오답이라도 반 정답률이 20%인 문항과 85%인 문항은 무게가 다르다.
    이 값이 있으면 지적의 강도를 조절하고, 없으면 개인 기록만으로 판단한다.
    """

    attempted: int = Field(ge=0)
    correct: int = Field(ge=0)
    correct_rate: float | None = Field(default=None, ge=0, le=100)
    # 보기별 선택 인원. 오답이 한 보기로 몰렸다면 그 오해가 반 전체에 퍼져 있다는 뜻.
    choice_distribution: list[int] | None = None

    @model_validator(mode="after")
    def fill_rate(self):
        if self.correct_rate is None:
            self.correct_rate = (
                self.correct / self.attempted * 100 if self.attempted else 0.0)
        return self


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
    cohort: Cohort | None = None

    @field_validator("cohort", mode="after")
    @classmethod
    def drop_thin_cohort(cls, v: Cohort | None) -> Cohort | None:
        """응시자가 적으면 통계로 쓸 수 없다. 프롬프트에 아예 넣지 않는다."""
        if v is None or v.attempted < config.REPORT_COHORT_MIN_ATTEMPTS:
            return None
        return v


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
