from __future__ import annotations

from app.engine.state import PipelineState


def should_refine(state: PipelineState) -> str:
    approved = sum(1 for q in state.get("quizzes", []) if q.get("status") == "APPROVED")
    if approved > 0:
        return "end"
    if state.get("retry_count", 0) >= 1:
        return "end"
    return "refine"


def node_refine(state: PipelineState) -> PipelineState:
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
