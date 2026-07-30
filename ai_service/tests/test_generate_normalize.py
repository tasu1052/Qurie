import os
os.environ["AI_MOCK"] = "1"

from app.engine.steps.generate import normalize_micro
from app.engine.validate import validate_quiz_item

FILES = {"solution.py": "a = 1\nb = 2\nc = 3\n"}


def _item(**over):
    q = {
        "purpose": "MICRO",
        "difficulty": "EASY",
        "tested_concept": "변수 할당",
        "question": "q",
        "choices": ["a", "b", "c", "d"],
        "answer_index": 0,
        "explanation": "e",
    }
    q.update(over)
    return q


def test_fills_missing_file_path_when_span_present():
    q = normalize_micro(_item(line_start=1, line_end=2), "solution.py")
    assert q["purpose"] == "MICRO"
    assert q["file_path"] == "solution.py"
    assert validate_quiz_item(q, FILES) is None


def test_keeps_existing_file_path():
    q = normalize_micro(
        _item(file_path="solution.py", line_start=1, line_end=1), "other.py")
    assert q["file_path"] == "solution.py"


def test_demotes_to_conceptual_when_span_missing():
    """근거 줄을 지어내지 않고 CONCEPTUAL로 살린다 (기존엔 UNKNOWN_FILE로 폐기)."""
    raw = _item()
    assert validate_quiz_item(raw, FILES) == "UNKNOWN_FILE"

    q = normalize_micro(raw, "solution.py")
    assert q["purpose"] == "CONCEPTUAL"
    assert "file_path" not in q and "line_start" not in q and "line_end" not in q
    assert validate_quiz_item(q, FILES) is None


def test_demotes_when_only_one_bound_present():
    q = normalize_micro(_item(file_path="solution.py", line_start=1), "solution.py")
    assert q["purpose"] == "CONCEPTUAL"
    assert validate_quiz_item(q, FILES) is None


def test_conceptual_untouched():
    q = _item(purpose="CONCEPTUAL")
    assert normalize_micro(q, "solution.py") == q


def test_out_of_range_span_still_rejected():
    """보정은 누락만 메운다. 범위가 틀린 근거까지 통과시키면 안 된다."""
    q = normalize_micro(_item(line_start=1, line_end=99), "solution.py")
    assert validate_quiz_item(q, FILES) == "LINE_OOB"
