import os
os.environ["AI_MOCK"] = "1"

from app.core import config
from app.engine.quota import scale_counts as shortfall_counts
from app.engine.steps.refine import (
    approved_of, node_collect, node_refine, should_refine)


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
    # 부족분 3 + 여유분 QUIZ_OVERSHOOT
    assert out["gen_count"] == 3 + config.QUIZ_OVERSHOOT
    assert sum(out["purpose_counts"].values()) == out["gen_count"]
    assert sum(out["ratio_counts"].values()) == out["gen_count"]
    # 이미 확보한 CONCEPTUAL/EASY는 상대적으로 덜 요청해야 한다
    assert out["purpose_counts"]["micro"] > out["purpose_counts"]["conceptual"]
    assert out["retry_count"] == 1
    # 탈락 사유는 user_prompt(USER_HINT)가 아니라 별도 필드로 넘긴다
    assert "SOLVER_MISMATCH" in out["retry_notes"]
    assert "user_prompt" not in out


def test_refine_appends_new_critiques_to_existing_note():
    state = {
        "requested_count": 5,
        "purpose_target": {"conceptual": 2, "micro": 3},
        "purpose_counts": {"conceptual": 2, "micro": 3},
        "ratio_target": {"easy": 1, "normal": 3, "hard": 1},
        "ratio_counts": {"easy": 1, "normal": 3, "hard": 1},
        "retry_notes": "ROUND1_REASON",
        "quizzes": [_q("REJECTED", reason="ROUND2_REASON"), _q("APPROVED")],
        "retry_count": 1,
        "last_approved": 0,
    }
    out = node_refine(state)
    assert "ROUND1_REASON" in out["retry_notes"]
    assert "ROUND2_REASON" in out["retry_notes"]
    assert len(out["retry_notes"]) <= 500


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
    assert out["gen_count"] == 2 + config.QUIZ_OVERSHOOT
    # 목표 CONCEPTUAL 3개 중 0개 확보 → 부족분은 CONCEPTUAL 위주여야 한다
    assert out["purpose_counts"]["conceptual"] > out["purpose_counts"]["micro"]


def test_collect_merges_pool_into_final_list():
    state = {"requested_count": 3,
             "approved_pool": [_q("APPROVED")] * 2,
             "quizzes": [_q("APPROVED"), _q("REJECTED")]}
    out = node_collect(state)
    assert len(out["quizzes"]) == 4
    assert len([q for q in out["quizzes"] if q["status"] == "APPROVED"]) == 3
    assert out["approved_pool"] == []


# --- 여유분 생성 · 절삭 · 보충 ---------------------------------------------

def _scored(score, reason=None, status="APPROVED"):
    return {"status": status, "purpose": "MICRO", "difficulty": "EASY",
            "question": f"q{score}", "judge_score": score, "reject_reason": reason}


def test_first_round_generates_extra():
    """1라운드부터 여유분을 더해 뽑는다."""
    from app.engine.factory import build_pipeline_state
    from app.quiz.dto.request import CreateQuizSetRequest

    body = CreateQuizSetRequest(mode="ASSESSMENT", requested_count=10,
                                version_hash="t", files={"a.py": "x = 1\n"})
    state = build_pipeline_state(0, "p", body, body.files)

    assert state["gen_count"] == 10 + config.QUIZ_OVERSHOOT
    # 프롬프트의 난이도 합이 생성 개수와 맞아야 모델이 혼란스럽지 않다
    assert sum(state["ratio_counts"].values()) == state["gen_count"]
    assert sum(state["purpose_counts"].values()) == state["gen_count"]
    # 목표는 요청 개수 그대로
    assert sum(state["ratio_target"].values()) == 10


def test_collect_trims_surplus_by_score():
    """넘치면 점수 높은 순으로 남긴다."""
    state = {"requested_count": 2,
             "quizzes": [_scored(5), _scored(9), _scored(7)]}
    out = node_collect(state)

    approved = [q for q in out["quizzes"] if q["status"] == "APPROVED"]
    assert [q["judge_score"] for q in approved] == [9, 7]
    # 잘린 문항은 탈락이 아니라 '선발되지 않음'
    dropped = [q for q in out["quizzes"] if q.get("reject_reason") == "NOT_SELECTED"]
    assert [q["judge_score"] for q in dropped] == [5]


def test_collect_backfills_from_judge_low():
    """모자라면 Judge 점수가 있는 탈락분으로 채운다."""
    state = {"requested_count": 3,
             "quizzes": [_scored(9),
                         _scored(6, "JUDGE: 보기가 약함", "REJECTED"),
                         _scored(4, "JUDGE: 모호함", "REJECTED")]}
    out = node_collect(state)

    approved = [q for q in out["quizzes"] if q["status"] == "APPROVED"]
    assert [q["judge_score"] for q in approved] == [9, 6, 4]
    assert [q.get("backfilled") for q in approved] == [None, True, True]


def test_backfill_never_uses_solver_mismatch():
    """독립 모델이 다른 답을 냈다는 뜻이라 정답 자체가 틀렸을 수 있다."""
    state = {"requested_count": 3,
             "quizzes": [_scored(9),
                         {"status": "REJECTED", "question": "x", "judge_score": None,
                          "reject_reason": "SOLVER_MISMATCH"},
                         {"status": "REJECTED", "question": "y", "judge_score": None,
                          "reject_reason": "DUPLICATE"},
                         {"status": "REJECTED", "question": "z", "judge_score": None,
                          "reject_reason": "LINE_OOB"}]}
    out = node_collect(state)

    approved = [q for q in out["quizzes"] if q["status"] == "APPROVED"]
    assert len(approved) == 1   # 채우지 못하고 1개로 끝난다


def test_backfill_picks_highest_score_first():
    state = {"requested_count": 2,
             "quizzes": [_scored(3, "JUDGE: a", "REJECTED"),
                         _scored(6, "JUDGE: b", "REJECTED"),
                         _scored(5, "JUDGE: c", "REJECTED")]}
    out = node_collect(state)
    approved = [q for q in out["quizzes"] if q["status"] == "APPROVED"]
    assert [q["judge_score"] for q in approved] == [6, 5]


def test_backfilled_item_is_not_listed_twice():
    state = {"requested_count": 2,
             "quizzes": [_scored(9), _scored(6, "JUDGE: 약함", "REJECTED")]}
    out = node_collect(state)
    assert len(out["quizzes"]) == 2
