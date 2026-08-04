from fastapi import APIRouter, Depends

from app.core.dependencies import get_report_service
from app.report.dto.request import CreateReportRequest
from app.report.dto.response import ReportResponse
from app.report.service import ReportService

router = APIRouter(prefix="/api", tags=["report"])


@router.post("/report", response_model=ReportResponse)
def create_report(
    body: CreateReportRequest,
    svc: ReportService = Depends(get_report_service),
) -> ReportResponse:
    """세션 리포트의 정성 항목을 생성한다.

    퀴즈 생성과 달리 동기 응답이다 — LLM 호출이 1회라 몇 초면 끝난다.
    응답 3개 필드가 백엔드 SessionReportCreateRequest 의 ai_* 에 그대로 들어간다.
    """
    return svc.create(body)
