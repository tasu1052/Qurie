import os
os.environ["AI_MOCK"] = "1"

from app.engine.tools import QUIZ_TOOL_NAME, quiz_tool

TOOL = quiz_tool(5, "solution.py")
ITEM = TOOL["input_schema"]["properties"]["quizzes"]["items"]


def test_tool_name_matches_prompt_instruction():
    assert TOOL["name"] == QUIZ_TOOL_NAME == "emit_quizzes"


def test_evidence_keys_are_required():
    """이게 이번 수정의 핵심 — 모델이 이 세 키를 뺄 수 없어야 한다."""
    for key in ("file_path", "line_start", "line_end"):
        assert key in ITEM["required"]


def test_all_properties_are_required():
    assert set(ITEM["required"]) == set(ITEM["properties"])


def test_conceptual_can_null_out_evidence_keys():
    assert None in ITEM["properties"]["file_path"]["enum"]
    assert "null" in ITEM["properties"]["line_start"]["type"]
    assert "null" in ITEM["properties"]["line_end"]["type"]


def test_file_path_restricted_to_primary_file():
    assert ITEM["properties"]["file_path"]["enum"] == ["solution.py", None]


def test_count_is_pinned_to_requested():
    q = TOOL["input_schema"]["properties"]["quizzes"]
    assert q["minItems"] == q["maxItems"] == 5


def test_choices_and_answer_index_constrained():
    c = ITEM["properties"]["choices"]
    assert c["minItems"] == c["maxItems"] == 4
    ai = ITEM["properties"]["answer_index"]
    assert (ai["minimum"], ai["maximum"]) == (0, 3)


def test_mock_path_still_returns_dict():
    """MOCK 모드는 tool use를 타지 않고 그대로 동작해야 한다."""
    from app.engine.llm import UsageMeter, call_llm_json
    from app.core import config

    data = call_llm_json(config.GEN_MODEL, "문항 수: 3", UsageMeter(), "GENERATE", TOOL)
    assert len(data["quizzes"]) == 3
