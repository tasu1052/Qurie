from __future__ import annotations

from app.core import config
from app.engine.llm import UsageMeter, call_llm_json
from app.engine.prompts import build_report_prompt
from app.engine.prompts.report import build_plan
from app.engine.tools import report_tool
from app.report.dto.request import CreateReportRequest
from app.report.dto.response import Bullet, ReportResponse


class ReportService:
    """세션 리포트의 정성 항목(총평·강점·보완점)을 생성한다.

    정량 지표는 백엔드가 quiz_progress 에서 집계해 요청에 실어 보낸다. 여기서는
    그 숫자를 사실로 받아 해석만 한다 — LLM 산술은 틀리고, 화면 통계와 어긋나면
    리포트 전체의 신뢰가 깨진다.

    프롬프트 지시만으로는 대상 문항을 자주 어겨서, 어느 문항에 대해 쓸지를
    build_plan 이 먼저 정하고 결과도 그 계획으로 검증한다.
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

        plan = build_plan(req)
        concepts = sorted({a.tested_concept for a in req.attempts if a.tested_concept})
        targets = plan.improvement_targets

        # 계획을 스키마에 박는다. 프롬프트 지시만으로는 대상 문항을 자주 어겼다.
        data = call_llm_json(
            config.REPORT_MODEL, build_report_prompt(req), UsageMeter(), "REPORT",
            report_tool(praise=plan.praise, improvement_targets=targets,
                        concepts=concepts),
            max_tokens=config.max_tokens_for("REPORT", len(req.attempts)),
        )

        rates = {a.index: a.cohort.correct_rate for a in req.attempts if a.cohort}

        return ReportResponse(
            comment=data.get("comment", ""),
            strengths=self._bullets(data.get("strengths"), set(plan.praise), rates),
            improvements=self._bullets(
                data.get("improvements"), set(plan.wrong) | set(plan.unanswered),
                rates, order=targets),
            focus_concepts=self._rank_concepts(data.get("focus_concepts"), req),
        )

    @staticmethod
    def _rank_concepts(raw, req: CreateReportRequest) -> list[str]:
        """복습 우선순위를 정답률 낮은 순으로 코드가 정한다.

        "정답률이 낮은 순서로" 지시해도 100% 맞힌 개념을 1순위로 올리는 일이 있었다.
        집계값이 이미 있으니 순서는 계산으로 정한다.
        """
        stats = req.summary.concept_stats or {}
        known = {a.tested_concept for a in req.attempts if a.tested_concept}

        def rate(concept: str) -> float:
            s = stats.get(concept)
            if not s or not s.attempted:
                return 1.0  # 응시 기록이 없으면 우선순위를 낮춘다
            return s.correct / s.attempted

        return sorted((c for c in (raw or []) if c in known), key=rate)

    @staticmethod
    def _bullets(raw, allowed: set[int], rates: dict[int, float],
                 order: list[int] | None = None) -> list[Bullet]:
        """quiz_index 를 검증하고 반 정답률을 채운 뒤, 필요하면 계획 순서대로 재정렬한다."""
        items = []
        for b in (raw or []):
            idx = b.get("quiz_index")
            idx = idx if idx in allowed else None
            items.append(Bullet(quiz_index=idx, text=b.get("text", ""),
                                cohort_rate=rates.get(idx) if idx is not None else None))
        if not order:
            return items

        rank = {idx: pos for pos, idx in enumerate(order)}
        # 계획에 있는 문항을 먼저, 그 안에서는 계획 순서대로. 나머지는 원래 순서 유지.
        return sorted(
            items,
            key=lambda b: (rank.get(b.quiz_index, len(order)), items.index(b)),
        )
