from pydantic import BaseModel, Field


class ReportResponse(BaseModel):
    """백엔드 SessionReportCreateRequest 의 ai_* 필드에 그대로 들어간다.

    comment -> ai_comment, strengths -> ai_strengths, improvements -> ai_improvements
    focus_concepts 는 대응 컬럼이 없어 지금은 참고용이다(2단계 오답 노트에서 사용).
    """

    comment: str = ""
    strengths: list[str] = Field(default_factory=list)
    improvements: list[str] = Field(default_factory=list)
    focus_concepts: list[str] = Field(default_factory=list)
    # LLM을 부르지 않고 돌려준 경우(응시 문항 부족 등) 그 사유. 정상이면 None.
    skipped_reason: str | None = None
