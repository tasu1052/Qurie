"""라운드마다 승인된 문항을 GENERATING 상태로 노출한다.

백엔드 폴링이 READY 전에 부분 문항을 가져가 프론트에 순차 표시할 수 있게 한다.
"""

from __future__ import annotations

from app.engine.state import PipelineState
from app.engine.steps.refine import approved_of

# 응답/저장에 남기지 않을 파이프라인 전용 키
_DROP = frozenset({"status", "judge_score", "reject_reason"})


def _public_quiz(q: dict) -> dict:
    return {k: v for k, v in q.items() if k not in _DROP}


def publish_approved_progress(state: PipelineState) -> None:
    quiz_set_id = state.get("quiz_set_id")
    if quiz_set_id is None:
        return
    approved = [_public_quiz(q) for q in approved_of(state)]
    if not approved:
        return
    # dependencies ↔ graph ↔ judge 순환을 피하려고 지연 import
    from app.core.dependencies import get_repository

    meter = state.get("meter")
    get_repository().patch(
        quiz_set_id,
        status="GENERATING",
        quizzes=approved,
        meter=meter.rows if meter is not None else None,
    )
