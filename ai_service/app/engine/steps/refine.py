from __future__ import annotations

from app.core import config
from app.engine.state import PipelineState

PURPOSE_KEY = {"CONCEPTUAL": "conceptual", "MICRO": "micro"}
DIFFICULTY_KEY = {"EASY": "easy", "NORMAL": "normal", "HARD": "hard"}


def approved_of(state: PipelineState) -> list[dict]:
    """이번 라운드 승인분 + 이전 라운드까지 쌓인 승인분."""
    fresh = [q for q in state.get("quizzes", []) if q.get("status") == "APPROVED"]
    return list(state.get("approved_pool", [])) + fresh


def shortfall_counts(target: dict[str, int], have: dict[str, int],
                     shortfall: int) -> dict[str, int]:
    """목표 대비 부족분을 shortfall 개수에 맞춰 배분한다.

    이미 채운 카테고리는 빼고, 남은 부족분의 비율을 유지하며 정확히 shortfall개가
    되도록 맞춘다(합이 어긋나면 소수부가 큰 쪽부터 +1).
    """
    need = {k: max(0, v - have.get(k, 0)) for k, v in target.items()}
    total = sum(need.values())
    if total == shortfall:
        return need
    if total == 0:  # 모든 카테고리를 이미 채웠으면 원래 비율대로 뽑는다
        need = dict(target)
        total = sum(need.values())
    if total == 0:
        return {k: 0 for k in target}

    scaled = {k: v * shortfall / total for k, v in need.items()}
    counts = {k: int(v) for k, v in scaled.items()}
    order = sorted(scaled, key=lambda k: scaled[k] - counts[k], reverse=True)
    for i in range(shortfall - sum(counts.values())):
        counts[order[i % len(order)]] += 1
    return counts


def _tally(items: list[dict], field: str, mapping: dict[str, str]) -> dict[str, int]:
    out: dict[str, int] = {}
    for q in items:
        key = mapping.get(q.get(field) or "")
        if key:
            out[key] = out.get(key, 0) + 1
    return out


def should_refine(state: PipelineState) -> str:
    """요청 개수를 채울 때까지 부족분만 다시 뽑는다.

    멈추는 조건은 셋이다.
      1. 목표 개수를 채웠다.
      2. 직전 라운드가 한 개도 못 건졌다 — 같은 조건으로 더 돌려도 결과가 같을
         가능성이 높고, 한 라운드가 LLM 3콜이라 그냥 크레딧만 태운다.
      3. 안전핀(MAX_RETRY)에 걸렸다.
    """
    approved = len(approved_of(state))
    if approved >= state["requested_count"]:
        return "collect"
    if state.get("retry_count", 0) >= config.MAX_RETRY:
        return "collect"
    if state.get("retry_count", 0) > 0 and approved <= state.get("last_approved", -1):
        return "collect"
    return "refine"


def node_refine(state: PipelineState) -> PipelineState:
    pool = approved_of(state)
    shortfall = state["requested_count"] - len(pool)

    state["approved_pool"] = pool
    state["last_approved"] = len(pool)  # 다음 라운드의 진전 여부 판단 기준
    state["gen_count"] = shortfall
    # 목표치는 라운드마다 덮어쓰지 않는다. 매번 '원래 목표 - 확보분'으로 다시 계산한다.
    state["purpose_counts"] = shortfall_counts(
        state.get("purpose_target") or state["purpose_counts"],
        _tally(pool, "purpose", PURPOSE_KEY), shortfall)
    state["ratio_counts"] = shortfall_counts(
        state.get("ratio_target") or state["ratio_counts"],
        _tally(pool, "difficulty", DIFFICULTY_KEY), shortfall)

    # 탈락분도 라운드 넘어 보존한다. 왜 재시도가 붙었는지의 근거라 버리면 안 된다.
    state["rejected_pool"] = list(state.get("rejected_pool", [])) + [
        q for q in state.get("quizzes", []) if q.get("status") != "APPROVED"
    ]

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


def node_collect(state: PipelineState) -> PipelineState:
    """보존해 둔 승인분·탈락분과 마지막 라운드 결과를 합쳐 최종 목록을 만든다."""
    state["quizzes"] = (
        list(state.get("approved_pool", []))
        + list(state.get("rejected_pool", []))
        + state.get("quizzes", [])
    )
    state["approved_pool"] = []
    state["rejected_pool"] = []
    return state
