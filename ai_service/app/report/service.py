from __future__ import annotations

from app.core import config
from app.engine.llm import UsageMeter, call_llm_json
from app.engine.prompts import build_report_prompt
from app.engine.tools import report_tool
from app.report.dto.request import CreateReportRequest
from app.report.dto.response import ReportResponse, WrongNote


class ReportService:
    """세션 리포트의 정성 항목(총평·강점·보완점)을 생성한다.

    정량 지표는 백엔드가 quiz_progress 에서 집계해 요청에 실어 보낸다. 여기서는
    그 숫자를 사실로 받아 해석만 한다 — LLM 산술은 틀리고, 화면 통계와 어긋나면
    리포트 전체의 신뢰가 깨진다.

    퀴즈 생성과 달리 동기 처리다. LLM 호출이 1회뿐이라 몇 초면 끝나고,
    폴링·콜백을 붙이는 비용이 이득보다 크다.
    """

    def create(self, req: CreateReportRequest) -> ReportResponse:
        attempted = [a for a in req.attempts if a.chosen_index is not None]
        if len(attempted) < config.REPORT_MIN_ATTEMPTS:
            # 2~3문항으로 학습 성향을 단정할 근거가 없다. 크레딧도 아낀다.
            return ReportResponse(
                comment="",
                skipped_reason=(
                    f"응시 문항이 {len(attempted)}개뿐이라 리포트를 생성하지 않았습니다 "
                    f"(최소 {config.REPORT_MIN_ATTEMPTS}개)."
                ),
            )

        prompt = build_report_prompt(req)
        data = call_llm_json(
            config.REPORT_MODEL, prompt, UsageMeter(), "REPORT",
            report_tool(),
            max_tokens=config.max_tokens_for("REPORT", len(req.attempts)),
        )

        known = {a.tested_concept for a in req.attempts if a.tested_concept}
        wrong_indices = {a.index for a in req.attempts
                         if a.chosen_index is not None and not a.is_correct}

        return ReportResponse(
            comment=data.get("comment", ""),
            strengths=list(data.get("strengths", [])),
            improvements=list(data.get("improvements", [])),
            # 응시 기록에 없는 개념은 버린다. 프롬프트로 막아도 새면 학생이 겪지 않은
            # 개념을 복습하라고 안내하게 된다.
            focus_concepts=[c for c in data.get("focus_concepts", []) if c in known],
            # 맞힌 문항이나 미응시 문항에 오답 해설이 붙으면 학생이 혼란스럽다.
            # 실제로 틀린 문항 번호만 남긴다.
            wrong_notes=[WrongNote(**n) for n in data.get("wrong_notes", [])
                         if n.get("quiz_index") in wrong_indices],
        )
