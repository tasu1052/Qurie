from __future__ import annotations

from app.core import config
from app.engine.quota import scale_counts
from app.engine.state import PipelineState

PURPOSE_KEY = {"CONCEPTUAL": "conceptual", "MICRO": "micro"}
DIFFICULTY_KEY = {"EASY": "easy", "NORMAL": "normal", "HARD": "hard"}


def approved_of(state: PipelineState) -> list[dict]:
    """이번 라운드 승인분 + 이전 라운드까지 쌓인 승인분."""
    fresh = [q for q in state.get("quizzes", []) if q.get("status") == "APPROVED"]
    return list(state.get("approved_pool", [])) + fresh


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
    # 부족분에도 여유분을 더한다. 1개만 뽑으면 그 1개가 통과율에 통째로 걸린다.
    gen_count = shortfall + config.QUIZ_OVERSHOOT
    state["gen_count"] = gen_count
    # 목표치는 라운드마다 덮어쓰지 않는다. 매번 '원래 목표 - 확보분'으로 다시 계산한다.
    state["purpose_counts"] = scale_counts(
        state.get("purpose_target") or state["purpose_counts"],
        _tally(pool, "purpose", PURPOSE_KEY), gen_count)
    state["ratio_counts"] = scale_counts(
        state.get("ratio_target") or state["ratio_counts"],
        _tally(pool, "difficulty", DIFFICULTY_KEY), gen_count)

    # 탈락분도 라운드 넘어 보존한다. 왜 재시도가 붙었는지의 근거라 버리면 안 된다.
    state["rejected_pool"] = list(state.get("rejected_pool", [])) + [
        q for q in state.get("quizzes", []) if q.get("status") != "APPROVED"
    ]

    # 탈락 사유는 user_prompt 에 섞지 않는다. 그쪽은 USER_HINT(untrusted) 블록으로
    # 들어가서 "무시해도 되는 힌트"로 라벨링되고, 사용자 입력과 뒤엉켜 누적된다.
    # judge 출력이 USER_HINT로 재주입되는 경로를 막기 위해 별도 신뢰 노트에 담는다.
    critiques = [
        q.get("reject_reason") or ""
        for q in state.get("quizzes", [])
        if q.get("status") == "REJECTED"
    ]
    # 라운드를 넘어 누적한다 — 2라운드가 1라운드와 같은 이유로 또 떨어지는 것을 막는다.
    fresh = " | ".join(c for c in critiques if c)
    prev = state.get("retry_notes") or ""
    state["retry_notes"] = " | ".join(x for x in (prev, fresh) if x)[:500]
    state["retry_count"] = state.get("retry_count", 0) + 1
    return state


def _score(quiz: dict) -> int:
    return quiz.get("judge_score") or 0


def backfill_candidates(rejected: list[dict]) -> list[dict]:
    """개수가 모자랄 때 채워 넣어도 되는 탈락분.

    Judge 가 점수를 매긴 문항만 대상이다. 풀 수 있고 정답도 맞는데 표현이
    모호하거나 오답 보기가 약해서 기준점(7점)에 못 미친 것들이다.

    SOLVER_MISMATCH 는 제외한다 — 독립된 모델이 다른 답을 냈다는 뜻이라
    정답 자체가 틀렸을 수 있다. 개수를 채우려고 틀린 정답을 내보낼 수는 없다.
    DUPLICATE·구조 오류도 제외한다.
    """
    return sorted(
        (q for q in rejected
         if q.get("judge_score") is not None
         and str(q.get("reject_reason") or "").startswith("JUDGE:")),
        key=_score, reverse=True,
    )


def node_collect(state: PipelineState) -> PipelineState:
    """요청 개수만큼 골라 낸다.

    넘치면 judge_score 높은 순으로 자르고, 모자라면 Judge 점수가 있는 탈락분으로
    채운다. 난이도·purpose 비율보다 점수를 우선한다.
    """
    approved = sorted(approved_of(state), key=_score, reverse=True)
    rejected = list(state.get("rejected_pool", [])) + [
        q for q in state.get("quizzes", []) if q.get("status") != "APPROVED"
    ]
    target = state["requested_count"]

    if len(approved) < target:
        picked = backfill_candidates(rejected)[: target - len(approved)]
        chosen = {id(q) for q in picked}
        rejected = [q for q in rejected if id(q) not in chosen]
        approved += [{**q, "status": "APPROVED", "backfilled": True} for q in picked]

    # 여유분으로 더 뽑힌 문항은 탈락이 아니라 '선발되지 않은' 것이다.
    surplus = [{**q, "status": "REJECTED", "reject_reason": "NOT_SELECTED"}
               for q in approved[target:]]

    state["quizzes"] = approved[:target] + surplus + rejected
    state["approved_pool"] = []
    state["rejected_pool"] = []
    return state
