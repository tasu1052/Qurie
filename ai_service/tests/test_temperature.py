import os
os.environ["AI_MOCK"] = "1"

import pytest

from app.core import config
from app.engine import llm


class _Msg:
    def __init__(self, **kw):
        self.captured = kw


@pytest.fixture
def anthropic_kw(monkeypatch):
    """messages.create 에 넘어간 인자를 잡아둔다."""
    seen = {}

    class FakeMessages:
        def create(self, **kw):
            seen.update(kw)
            block = type("B", (), {"type": "text", "text": '{"ok":1}'})()
            usage = type("U", (), {"input_tokens": 1, "output_tokens": 1})()
            return type("R", (), {"content": [block], "usage": usage,
                                  "stop_reason": "end_turn"})()

    monkeypatch.setattr(llm, "get_anthropic", lambda: type("C", (), {"messages": FakeMessages()})())
    return seen


@pytest.fixture
def openai_kw(monkeypatch):
    seen = {}

    class FakeCompletions:
        def create(self, **kw):
            seen.clear()
            seen.update(kw)
            msg = type("M", (), {"content": '{"ok":1}'})()
            choice = type("C", (), {"message": msg, "finish_reason": "stop"})()
            usage = type("U", (), {"prompt_tokens": 1, "completion_tokens": 1})()
            return type("R", (), {"choices": [choice], "usage": usage})()

    chat = type("Chat", (), {"completions": FakeCompletions()})()
    monkeypatch.setattr(llm, "get_openai", lambda: type("C", (), {"chat": chat})())
    return seen


def test_anthropic_receives_configured_temperature(anthropic_kw, monkeypatch):
    monkeypatch.setattr(config, "TEMPERATURE", 0.3)
    llm.call_anthropic("claude-haiku-4-5-20251001", "prompt", 1000)
    assert anthropic_kw["temperature"] == 0.3


def test_anthropic_tool_path_receives_temperature(monkeypatch):
    seen = {}

    class FakeMessages:
        def create(self, **kw):
            seen.update(kw)
            block = type("B", (), {"type": "tool_use", "input": {"quizzes": []}})()
            usage = type("U", (), {"input_tokens": 1, "output_tokens": 1})()
            return type("R", (), {"content": [block], "usage": usage,
                                  "stop_reason": "tool_use"})()

    monkeypatch.setattr(llm, "get_anthropic",
                        lambda: type("C", (), {"messages": FakeMessages()})())
    monkeypatch.setattr(config, "TEMPERATURE", 0.3)
    llm.call_anthropic_tool("claude-haiku-4-5-20251001", "p", 1000,
                            {"name": "t", "input_schema": {}})
    assert seen["temperature"] == 0.3


def test_openai_non_reasoning_receives_temperature(openai_kw, monkeypatch):
    monkeypatch.setattr(config, "TEMPERATURE", 0.3)
    llm.call_openai("gpt-4o-mini", "prompt", 1000)
    assert openai_kw["temperature"] == 0.3


def test_openai_reasoning_model_omits_temperature(openai_kw, monkeypatch):
    """reasoning 모델은 temperature 를 거부하므로 아예 보내면 안 된다."""
    monkeypatch.setattr(config, "TEMPERATURE", 0.3)
    llm.call_openai("gpt-5.4-nano", "prompt", 1000)
    assert "temperature" not in openai_kw
    assert "max_completion_tokens" in openai_kw


def test_default_temperature_is_low_enough_to_be_reproducible():
    """provider 기본값(약 1.0)으로 되돌아가면 재현성이 무너진다."""
    assert config.TEMPERATURE is not None
    assert 0 <= config.TEMPERATURE <= 0.5
