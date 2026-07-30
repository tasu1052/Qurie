import os
os.environ["AI_MOCK"] = "1"

from app.core import config
from app.engine.steps.refine import (
    approved_of, node_collect, node_refine, should_refine, shortfall_counts)


def _q(status, purpose="CONCEPTUAL", difficulty="EASY", reason=None):
    return {"status": status, "purpose": purpose, "difficulty": difficulty,
            "question": "q", "reject_reason": reason}


# --- shortfall_counts -------------------------------------------------------

def test_shortfall_subtracts_what_we_already_have():
    got = shortfall_counts({"conceptual": 3, "micro": 7}, {"conceptual": 3, "micro": 4}, 3)
    assert got == {"conceptual": 0, "micro": 3}


def test_shortfall_always_sums_to_requested_shortfall():
    for have in ({}, {"easy": 1}, {"easy": 3, "normal": 5, "hard": 2}):
        for n in (1, 3, 7):
            got = shortfall_counts({"easy": 3, "normal": 5, "hard": 2}, have, n)
            assert sum(got.values()) == n, (have, n, got)


def test_shortfall_falls_back_to_original_ratio_when_all_targets_met():
    """목표를 다 채운 뒤에도 더 뽑아야 하면 원래 비율을 따른다."""
    got = shortfall_counts({"conceptual": 3, "micro": 7}, {"conceptual": 9, "micro": 9}, 2)
    assert sum(got.values()) == 2
    assert got["micro"] >= got["conceptual"]


# --- should_refine ----------------------------------------------------------

def test_refines_while_short():
    state = {"requested_count": 5, "quizzes": [_q("APPROVED")] * 3, "retry_count": 0}
    assert should_refine(state) == "refine"


def test_stops_when_target_met():
    state = {"requested_count": 3, "quizzes": [_q("APPROVED")] * 3, "retry_count": 0}
    assert should_refine(state) == "collect"


def test_stops_at_retry_cap():
    state = {"requested_count": 5, "quizzes": [_q("APPROVED")],
             "retry_count": config.MAX_RETRY}
    assert should_refine(state) == "collect"


def test_keeps_going_across_multiple_rounds():
    """MAX_RETRY 이내라면 여러 라운드를 계속 돈다 (진전이 있는 한)."""
    state = {"requested_count": 5, "quizzes": [_q("APPROVED")] * 2,
             "approved_pool": [_q("APPROVED")], "retry_count": 2, "last_approved": 1}
    assert should_refine(state) == "refine"


def test_stops_when_a_round_makes_no_progress():
    """승인 0건 라운드가 나오면 상한 전이라도 멈춘다 (크레딧 낭비 방지)."""
    state = {"requested_count": 5, "quizzes": [_q("REJECTED")] * 3,
             "approved_pool": [_q("APPROVED")] * 2, "retry_count": 1, "last_approved": 2}
    assert should_refine(state) == "collect"


def test_first_round_is_not_treated_as_no_progress():
    state = {"requested_count": 5, "quizzes": [_q("APPROVED")], "retry_count": 0}
    assert should_refine(state) == "refine"


def test_refine_records_progress_baseline():
    state = {
        "requested_count": 5,
        "purpose_target": {"conceptual": 2, "micro": 3},
        "purpose_counts": {"conceptual": 2, "micro": 3},
        "ratio_target": {"easy": 1, "normal": 3, "hard": 1},
        "ratio_counts": {"easy": 1, "normal": 3, "hard": 1},
        "quizzes": [_q("APPROVED"), _q("APPROVED"), _q("REJECTED")],
        "retry_count": 0,
    }
    assert node_refine(state)["last_approved"] == 2


def test_counts_earlier_rounds_toward_target():
    """이전 라운드 승인분도 목표 달성에 포함되어야 한다 (중복 생성 방지)."""
    state = {"requested_count": 4, "approved_pool": [_q("APPROVED")] * 3,
             "quizzes": [_q("APPROVED"), _q("REJECTED")], "retry_count": 0}
    assert len(approved_of(state)) == 4
    assert should_refine(state) == "collect"


# --- node_refine / node_collect --------------------------------------------

def test_refine_preserves_approved_and_asks_only_for_shortfall():
    state = {
        "requested_count": 5,
        "purpose_counts": {"conceptual": 2, "micro": 3},
        "purpose_target": {"conceptual": 2, "micro": 3},
        "ratio_counts": {"easy": 1, "normal": 3, "hard": 1},
        "ratio_target": {"easy": 1, "normal": 3, "hard": 1},
        "quizzes": [
            _q("APPROVED", "CONCEPTUAL", "EASY"),
            _q("APPROVED", "MICRO", "NORMAL"),
            _q("REJECTED", "MICRO", "NORMAL", "SOLVER_MISMATCH"),
        ],
        "retry_count": 0,
    }
    out = node_refine(state)

    assert len(out["approved_pool"]) == 2
    assert out["gen_count"] == 3
    assert sum(out["purpose_counts"].values()) == 3
    assert sum(out["ratio_counts"].values()) == 3
    # 이미 확보한 CONCEPTUAL/EASY는 덜 요청해야 한다
    assert out["purpose_counts"]["conceptual"] == 1
    assert out["purpose_counts"]["micro"] == 2
    assert out["retry_count"] == 1
    assert "SOLVER_MISMATCH" in out["user_prompt"]


def test_refine_uses_original_target_not_previous_round():
    """2회차가 1회차의 부족분을 목표로 착각하면 안 된다."""
    state = {
        "requested_count": 10,
        "purpose_target": {"conceptual": 3, "micro": 7},
        "purpose_counts": {"conceptual": 0, "micro": 2},   # 1회차 부족분
        "ratio_target": {"easy": 3, "normal": 5, "hard": 2},
        "ratio_counts": {"easy": 0, "normal": 2, "hard": 0},
        "approved_pool": [_q("APPROVED", "MICRO", "NORMAL")] * 8,
        "quizzes": [],
        "retry_count": 1,
    }
    out = node_refine(state)
    assert out["gen_count"] == 2
    # 목표 CONCEPTUAL 3개 중 0개 확보 → 부족분은 CONCEPTUAL 위주여야 한다
    assert out["purpose_counts"]["conceptual"] == 2


def test_collect_merges_pool_into_final_list():
    state = {"approved_pool": [_q("APPROVED")] * 2,
             "quizzes": [_q("APPROVED"), _q("REJECTED")]}
    out = node_collect(state)
    assert len(out["quizzes"]) == 4
    assert len([q for q in out["quizzes"] if q["status"] == "APPROVED"]) == 3
    assert out["approved_pool"] == []
