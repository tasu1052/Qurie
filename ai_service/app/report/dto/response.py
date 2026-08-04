from pydantic import BaseModel, Field


class WrongNote(BaseModel):
    """오답 문항 1개에 대한 해설.

    quiz_index 가 요청의 attempts[].index 와 같아서, 프론트가 원래 문항을 찾아
    "이 문제 다시 보기"로 연결할 수 있다.
    """

    quiz_index: int
    concept: str = ""
    why_wrong: str = ""
    key_point: str = ""


class ReportResponse(BaseModel):
    """백엔드 SessionReportCreateRequest 의 ai_* 필드에 대응한다.

    comment -> ai_comment, strengths -> ai_strengths, improvements -> ai_improvements
    wrong_notes 는 새 컬럼(ai_wrong_notes JSON)이 필요하다.
    focus_concepts 는 아직 대응 컬럼이 없다.
    """

    comment: str = ""
    strengths: list[str] = Field(default_factory=list)
    improvements: list[str] = Field(default_factory=list)
    focus_concepts: list[str] = Field(default_factory=list)
    wrong_notes: list[WrongNote] = Field(default_factory=list)
    # LLM을 부르지 않고 돌려준 경우(응시 문항 부족 등) 그 사유. 정상이면 None.
    skipped_reason: str | None = None
