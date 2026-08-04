from pydantic import BaseModel, Field


class Bullet(BaseModel):
    """강점·보완점 1개.

    quiz_index 는 요청의 attempts[].index 다. 화면에 보일 문항 번호는 프론트가
    이 값으로 붙인다 — AI가 문장에 번호를 쓰면 번호를 틀리거나 내부 인덱스가
    그대로 노출된다. 특정 문항과 무관한 내용이면 null.

    cohort_rate 는 그 문항의 반 정답률이다. AI가 아니라 서버가 요청 데이터에서
    그대로 채운다 — 문장에 맡기면 수치를 빠뜨리거나 다른 문항 값을 적었다.
    """

    quiz_index: int | None = None
    text: str = ""
    cohort_rate: float | None = None


class ReportResponse(BaseModel):
    """백엔드 SessionReportCreateRequest 의 ai_* 필드에 대응한다.

    comment -> ai_comment, strengths -> ai_strengths, improvements -> ai_improvements
    focus_concepts 는 아직 대응 컬럼이 없다.
    """

    comment: str = ""
    strengths: list[Bullet] = Field(default_factory=list)
    improvements: list[Bullet] = Field(default_factory=list)
    focus_concepts: list[str] = Field(default_factory=list)
    # LLM을 부르지 않고 돌려준 경우(응시 문항 부족 등) 그 사유. 정상이면 None.
    skipped_reason: str | None = None
