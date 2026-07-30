import os
os.environ["AI_MOCK"] = "1"

from app.engine.steps.refine import node_collect, node_refine
from app.quiz.mappers import to_quiz_response
from app.quiz.models import QuizSetRecord


def _q(status, reason=None, score=None):
    return {
        "status": status, "purpose": "MICRO", "difficulty": "EASY",
        "tested_concept": "c", "question": "q", "choices": ["a", "b", "c", "d"],
        "answer_index": 0, "explanation": "e",
        "file_path": "solution.py", "line_start": 1, "line_end": 2,
        "reject_reason": reason, "judge_score": score,
    }


RECORD = QuizSetRecord(
    project="demo",
    status="READY",
    quizzes=[_q("APPROVED")],
    rejected=[_q("REJECTED", "SOLVER_MISMATCH"), _q("REJECTED", "JUDGE: 모호함", 5)],
    meter=[
        {"stage": "GENERATE", "model": "claude-haiku-4-5", "input_tokens": 1500,
         "output_tokens": 2500, "latency_ms": 23841, "succeeded": True},
        {"stage": "SOLVE", "model": "gpt-5.4-nano", "input_tokens": 1100,
         "output_tokens": 40, "latency_ms": 1191, "succeeded": True},
    ],
)


def test_meter_is_exposed():
    r = to_quiz_response(1, RECORD)
    assert [m.stage for m in r.meter] == ["GENERATE", "SOLVE"]
    assert r.meter[0].output_tokens == 2500
    assert r.meter[0].latency_ms == 23841


def test_rejected_carries_reason_and_score():
    r = to_quiz_response(1, RECORD)
    assert [q.reject_reason for q in r.rejected] == ["SOLVER_MISMATCH", "JUDGE: 모호함"]
    assert r.rejected[1].judge_score == 5
    assert r.rejected[0].judge_score is None


def test_approved_list_excludes_rejected():
    r = to_quiz_response(1, RECORD)
    assert len(r.quizzes) == 1
    assert not hasattr(r.quizzes[0], "reject_reason")


def test_empty_record_gives_empty_lists_not_null():
    r = to_quiz_response(1, QuizSetRecord(project="demo", status="PENDING"))
    assert r.meter == [] and r.rejected == [] and r.quizzes == []


def test_round_count_derivable_from_meter():
    """GENERATE 행 수 = 라운드 수. 백엔드가 재시도 횟수를 알 수 있어야 한다."""
    r = to_quiz_response(1, RECORD)
    assert len([m for m in r.meter if m.stage == "GENERATE"]) == 1


def test_backend_consumed_fields_survive_serialization():
    """백엔드 AiQuizStatusResponse가 읽는 필드는 반드시 있어야 한다."""
    payload = to_quiz_response(42, RECORD).model_dump(mode="json")
    for key in ("project", "quiz_set_id", "status", "quizzes", "error_message"):
        assert key in payload
    for key in ("purpose", "difficulty", "tested_concept", "question", "choices",
                "answer_index", "explanation", "file_path", "line_start", "line_end"):
        assert key in payload["quizzes"][0]


def test_rejects_from_earlier_rounds_survive_to_final_list():
    """재시도가 붙은 이유가 1라운드 탈락분이므로 라운드를 넘어 보존되어야 한다."""
    state = {
        "requested_count": 5,
        "purpose_target": {"conceptual": 2, "micro": 3},
        "purpose_counts": {"conceptual": 2, "micro": 3},
        "ratio_target": {"easy": 1, "normal": 3, "hard": 1},
        "ratio_counts": {"easy": 1, "normal": 3, "hard": 1},
        "quizzes": [_q("APPROVED"), _q("REJECTED", "SOLVER_MISMATCH")],
        "retry_count": 0,
    }
    state = node_refine(state)           # 1라운드 마감
    state["quizzes"] = [_q("APPROVED")]  # 2라운드 결과
    out = node_collect(state)

    reasons = [q.get("reject_reason") for q in out["quizzes"]
               if q.get("status") != "APPROVED"]
    assert reasons == ["SOLVER_MISMATCH"]
    assert len([q for q in out["quizzes"] if q.get("status") == "APPROVED"]) == 2
