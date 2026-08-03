"""SOLVE 응답 정규화 — int 배열 등으로도 파이프라인이 죽지 않게."""

from app.engine.solve_parse import parse_solver_answers


def test_object_list_canonical():
    assert parse_solver_answers({"answers": [{"i": 0, "choice": 2}, {"i": 1, "choice": 0}]}) == {
        0: 2,
        1: 0,
    }


def test_int_list_positional():
    """gpt가 answers를 int 배열로 줄 때 — 기존엔 TypeError로 FAILED."""
    assert parse_solver_answers({"answers": [1, 3, 0, 2]}) == {0: 1, 1: 3, 2: 0, 3: 2}


def test_alternate_keys():
    assert parse_solver_answers({
        "answers": [
            {"index": 0, "answer": 1},
            {"index": 1, "answer_index": 3},
        ]
    }) == {0: 1, 1: 3}


def test_raw_json_string():
    assert parse_solver_answers('{"answers":[0,2]}') == {0: 0, 1: 2}


def test_malformed_returns_empty():
    assert parse_solver_answers("not-json") == {}
    assert parse_solver_answers({"answers": "oops"}) == {}
    assert parse_solver_answers(None) == {}
