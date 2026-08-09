"""발표 시연용 데모 모드.

요청 개수를 반드시 채우는 것이 목적이라 교차검증을 건너뛴다. 품질 보증이 없으므로
평소에는 꺼져 있어야 하고, 끄면 원래 동작이 그대로 돌아와야 한다.
"""

import importlib
import os

os.environ["AI_MOCK"] = "1"

import pytest

from app.core import config
from app.quiz.dto.request import CreateQuizSetRequest

FILES = {"solution.py": "def f(n):\n    if n < 2:\n        return n\n    return f(n-1)\n"}


@pytest.fixture
def demo(monkeypatch):
    """DEMO_MODE 를 켠다. 모듈이 import 시점에 읽는 값이 아니라 참조라 이걸로 충분하다."""
    monkeypatch.setattr(config, "DEMO_MODE", True)


def _body(**over):
    base = dict(mode="PRACTICE", requested_count=5, version_hash="t", files=FILES)
    base.update(over)
    return CreateQuizSetRequest(**base)


def _run(count=5):
    from app.engine.factory import build_pipeline_state
    from app.engine.run import run

    body = _body(requested_count=count)
    return run(build_pipeline_state(1, "demo", body, body.files))


# --- 기본값은 꺼짐 ----------------------------------------------------------

def test_off_by_default():
    """켠 채로 배포되면 검증 없는 문항이 학생에게 나간다."""
    fresh = importlib.reload(importlib.import_module("app.core.config"))
    assert fresh.DEMO_MODE is False


def test_env_var_turns_it_on(monkeypatch):
    monkeypatch.setenv("AI_DEMO_MODE", "1")
    fresh = importlib.reload(importlib.import_module("app.core.config"))
    assert fresh.DEMO_MODE is True
    monkeypatch.delenv("AI_DEMO_MODE")
    importlib.reload(fresh)


# --- 켰을 때 ----------------------------------------------------------------

def test_no_solve_or_judge_calls(demo):
    """건너뛰는 것이 아니라 호출 자체를 안 해야 크레딧도 안 쓴다."""
    stages = {r["stage"] for r in _run()["meter"].rows}
    assert stages == {"GENERATE"}


def test_delivers_the_requested_count(demo):
    final = _run(5)
    approved = [q for q in final["quizzes"] if q.get("status") == "APPROVED"]
    assert len(approved) == 5


def test_nothing_is_rejected_by_validation(demo):
    """발표 중 '탈락' 사유가 화면에 뜨면 안 된다. 여유분만 NOT_SELECTED 로 남는다."""
    final = _run(5)
    reasons = {q.get("reject_reason") for q in final["quizzes"]
               if q.get("status") != "APPROVED"}
    assert reasons <= {"NOT_SELECTED"}


def test_score_is_absent_not_zero(demo):
    """채점을 안 한 것과 0점을 받은 것은 다르다."""
    approved = [q for q in _run()["quizzes"] if q.get("status") == "APPROVED"]
    assert all(q.get("judge_score") is None for q in approved)


def test_same_span_no_longer_kills_items(demo):
    """구간 중복 누적이 라운드를 전멸시키던 것이 개수 미달의 주원인이었다."""
    from app.engine.dedupe import mark_duplicates

    def micro(text, s, e):
        return {"question": text, "purpose": "MICRO", "file_path": "solution.py",
                "line_start": s, "line_end": e}

    out = mark_duplicates([micro("종료 조건이 필요한 이유는?", 2, 3)],
                          [micro("이 줄에서 반환하는 값은?", 2, 3)], use_span=False)
    assert out[0].get("reject_reason") is None


def test_text_duplicates_are_still_blocked(demo):
    """무대에서 똑같은 문항이 두 개 뜨는 것이 개수 부족보다 나쁘다."""
    from app.engine.dedupe import mark_duplicates

    a = {"question": "종료 조건이 필요한 이유는 무엇인가?"}
    b = {"question": "종료 조건이 필요한 이유는?"}
    assert mark_duplicates([a], [b], use_span=False)[0]["reject_reason"] == "DUPLICATE"


# --- 껐을 때 원상복구 -------------------------------------------------------

def test_cross_validation_returns_when_off():
    """발표가 끝나면 환경변수만 지워도 원래대로여야 한다.

    MOCK 솔버는 보기를 섞은 뒤라 대부분 불일치를 내고, 그러면 judge 는 채점할
    문항이 없어 호출을 건너뛴다. SOLVE 가 돌아온 것으로 교차검증 복귀를 확인한다.
    """
    assert config.DEMO_MODE is False
    stages = {r["stage"] for r in _run()["meter"].rows}
    assert "SOLVE" in stages


def test_rejection_returns_when_off():
    """데모 모드를 끄면 검증 탈락이 다시 생긴다 — 그게 원래 동작이다."""
    assert config.DEMO_MODE is False
    final = _run(5)
    reasons = {q.get("reject_reason") for q in final["quizzes"]
               if q.get("status") != "APPROVED"}
    assert reasons - {"NOT_SELECTED"}
