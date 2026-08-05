"""모델명만 바꿔도 provider 에 맞는 형식 강제가 걸리는지 검증한다."""

import os
os.environ["AI_MOCK"] = "1"

import pytest

from app.engine import llm
from app.engine.tools import quiz_tool, report_tool


# --- strict 스키마 변환 -----------------------------------------------------

def test_strict_drops_unsupported_keywords():
    """길이·범위 키워드를 남기면 OpenAI 가 400 을 낸다."""
    out = llm.to_openai_strict(report_tool()["input_schema"])
    comment = out["properties"]["comment"]
    assert "minLength" not in comment and "maxLength" not in comment
    imp = out["properties"]["improvements"]
    assert "maxItems" not in imp


def test_strict_marks_every_object_closed_and_required():
    out = llm.to_openai_strict(report_tool()["input_schema"])
    assert out["additionalProperties"] is False
    assert set(out["required"]) == set(out["properties"])

    bullet = out["properties"]["improvements"]["items"]
    assert bullet["additionalProperties"] is False
    assert set(bullet["required"]) == set(bullet["properties"])


def test_strict_fills_type_for_bare_enum():
    """quiz_tool 의 file_path 는 enum 만 있고 type 이 없다 — strict 가 거부한다."""
    raw = quiz_tool(3, "solution.py")["input_schema"]
    assert "type" not in raw["properties"]["quizzes"]["items"]["properties"]["file_path"]

    out = llm.to_openai_strict(raw)
    file_path = out["properties"]["quizzes"]["items"]["properties"]["file_path"]
    assert file_path["type"] == ["null", "string"]
    assert file_path["enum"] == ["solution.py", None]


def test_strict_keeps_enum_and_type():
    out = llm.to_openai_strict(quiz_tool(3, "a.py")["input_schema"])
    item = out["properties"]["quizzes"]["items"]["properties"]
    assert item["purpose"]["enum"] == ["CONCEPTUAL", "MICRO"]
    assert item["answer_index"]["type"] == "integer"


# --- provider 라우팅 --------------------------------------------------------

@pytest.fixture
def routed(monkeypatch):
    """어느 경로로 갔는지만 기록한다."""
    calls = []

    def spy(name, result):
        def fn(*a, **k):
            calls.append(name)
            return result
        return fn

    monkeypatch.setattr(llm, "call_anthropic_tool", spy("anthropic", ({"ok": 1}, 1, 1, False)))
    monkeypatch.setattr(llm, "call_gemini_schema", spy("gemini", ({"ok": 1}, 1, 1, False)))
    monkeypatch.setattr(llm, "call_openai_schema", spy("openai", ({"ok": 1}, 1, 1, False)))
    monkeypatch.setattr(llm.config, "MOCK", False)
    monkeypatch.setattr(llm.config, "GMS_API_KEY", "x")
    return calls


@pytest.mark.parametrize("model,expected", [
    ("claude-haiku-4-5-20251001", "anthropic"),
    ("claude-sonnet-4-6", "anthropic"),
    ("gemini-2.5-flash-lite", "gemini"),
    ("gpt-5.4-nano", "openai"),
    ("gpt-4o-mini", "openai"),
])
def test_model_name_picks_schema_path(routed, model, expected):
    llm.call_llm_json(model, "prompt", llm.UsageMeter(), "REPORT", report_tool())
    assert routed == [expected]


def test_openai_no_longer_falls_back_to_plain_text(routed):
    """예전에는 openai 계열이 parse_json 경로로 떨어져 스키마가 안 걸렸다."""
    llm.call_llm_json("gpt-5.4-nano", "prompt", llm.UsageMeter(), "REPORT", report_tool())
    assert routed == ["openai"]


def test_mock_mode_skips_provider_calls(monkeypatch):
    monkeypatch.setattr(llm.config, "MOCK", True)
    data = llm.call_llm_json("gpt-5.4-nano", "문항 수: 3", llm.UsageMeter(),
                             "REPORT", report_tool())
    assert "comment" in data
