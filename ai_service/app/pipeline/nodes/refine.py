from __future__ import annotations

from app.pipeline.state import PipelineState


def should_refine(state: PipelineState) -> str:
    """조건부 엣지용: refine | end"""
    approved = sum(1 for q in state.get("quizzes", []) if q.get("status") == "APPROVED")
    if approved > 0:
        return "end"
    if state.get("retry_count", 0) >= 1:  # config.MAX_RETRY
        return "end"
    return "refine"


def node_refine(state: PipelineState) -> PipelineState:
    # critique를 user_prompt에 붙여 다음 generate가 보게 함 (MVP)
    critiques = [
        q.get("reject_reason") or ""
        for q in state.get("quizzes", [])
        if q.get("status") == "REJECTED"
    ]
    extra = "이전 실패 사유(반복 금지): " + " | ".join(c for c in critiques if c)[:500]
    prev = state.get("user_prompt") or ""
    state["user_prompt"] = (prev + "\n" + extra).strip()
    state["retry_count"] = state.get("retry_count", 0) + 1
    return state