import os
os.environ["AI_MOCK"] = "1"

import pytest
from fastapi.testclient import TestClient

from app.core import config
from app.engine.prompts import build_report_prompt
from app.main import app
from app.report.dto.request import CreateReportRequest
from app.report.service import ReportService

client = TestClient(app)


def _attempt(index, concept, correct, chosen=1, difficulty="NORMAL"):
    return {
        "index": index,
        "question": f"문항 {index}",
        "choices": ["보기0", "보기1", "보기2", "보기3"],
        "answer_index": 1 if correct else 2,
        "chosen_index": chosen,
        "is_correct": correct,
        "explanation": "해설",
        "tested_concept": concept,
        "difficulty": difficulty,
        "purpose": "MICRO",
        "file_path": "solution.py",
        "line_start": 1,
        "line_end": 3,
        "elapsed_ms": 40000,
    }


BODY = {
    "student_name": "테스트12345",
    "session_id": 7,
    "quiz_set_id": 42,
    "summary": {
        "quiz_total_count": 5,
        "quiz_attempted_count": 5,
        "quiz_correct_count": 3,
        "quiz_skipped_count": 0,
        "accuracy": 60.0,
        "completion_rate": 100.0,
        "avg_elapsed_ms": 42000,
        "difficulty_ratio": {"NORMAL": {"total": 5, "attempted": 5, "correct": 3}},
        "concept_stats": {
            "재귀 종료 조건": {"total": 2, "attempted": 2, "correct": 0},
            "반복문 흐름": {"total": 3, "attempted": 3, "correct": 3},
        },
    },
    "attempts": [
        _attempt(0, "반복문 흐름", True),
        _attempt(1, "반복문 흐름", True),
        _attempt(2, "반복문 흐름", True),
        _attempt(3, "재귀 종료 조건", False),
        _attempt(4, "재귀 종료 조건", False),
    ],
}


# --- API ------------------------------------------------------------------

def test_returns_ai_fields_for_backend():
    r = client.post("/api/report", json=BODY)
    assert r.status_code == 200
    data = r.json()
    # 백엔드 SessionReportCreateRequest 의 ai_* 에 그대로 들어가는 필드
    assert set(data) >= {"comment", "strengths", "improvements", "focus_concepts"}
    assert data["comment"]
    assert data["strengths"] and data["improvements"]
    assert data["skipped_reason"] is None


def test_rejects_missing_summary():
    body = dict(BODY)
    body.pop("summary")
    assert client.post("/api/report", json=body).status_code == 422


def test_rejects_accuracy_out_of_range():
    body = dict(BODY, summary=dict(BODY["summary"], accuracy=140.0))
    assert client.post("/api/report", json=body).status_code == 422


# --- 데이터 부족 가드 --------------------------------------------------------

def test_skips_llm_when_too_few_attempts():
    """2~3문항으로 학습 성향을 단정하면 안 된다. 크레딧도 아낀다."""
    body = dict(BODY, attempts=[_attempt(0, "반복문 흐름", True)])
    data = client.post("/api/report", json=body).json()

    assert data["comment"] == ""
    assert data["strengths"] == [] and data["improvements"] == []
    assert "응시 문항이 1개뿐" in data["skipped_reason"]


def test_unanswered_items_do_not_count_as_attempts():
    """미응시(chosen_index=None)는 응시로 세면 안 된다."""
    attempts = [dict(_attempt(i, "반복문 흐름", None), chosen_index=None, is_correct=None)
                for i in range(5)]
    data = client.post("/api/report", json=dict(BODY, attempts=attempts)).json()
    assert data["skipped_reason"] is not None


# --- 환각 방지 -------------------------------------------------------------

def test_drops_concepts_not_present_in_attempts(monkeypatch):
    """응시 기록에 없는 개념을 복습하라고 안내하면 안 된다."""
    from app.report import service as svc_module

    monkeypatch.setattr(svc_module, "call_llm_json", lambda *a, **k: {
        "comment": "총평",
        "strengths": ["강점"],
        "improvements": ["보완점"],
        "focus_concepts": ["재귀 종료 조건", "존재하지 않는 개념"],
    })
    result = ReportService().create(CreateReportRequest(**BODY))
    assert result.focus_concepts == ["재귀 종료 조건"]


# --- 프롬프트 --------------------------------------------------------------

def test_prompt_carries_server_computed_numbers():
    """AI가 숫자를 다시 세지 않도록 집계값을 사실로 제시해야 한다."""
    prompt = build_report_prompt(CreateReportRequest(**BODY))
    assert "정답률 60.0%" in prompt
    assert "5문항 중 5문항 응시" in prompt
    assert "재귀 종료 조건 0/2정답" in prompt
    assert "숫자를 새로 계산하지 마세요" in prompt


def test_prompt_lists_allowed_concepts_only():
    prompt = build_report_prompt(CreateReportRequest(**BODY))
    assert "재귀 종료 조건, 반복문 흐름" in prompt or "반복문 흐름, 재귀 종료 조건" in prompt


def test_prompt_marks_unanswered_separately():
    attempts = [dict(_attempt(0, "반복문 흐름", None), chosen_index=None, is_correct=None)]
    prompt = build_report_prompt(CreateReportRequest(**dict(BODY, attempts=attempts)))
    assert "미응시" in prompt


def test_attempts_are_sorted_by_index():
    shuffled = [_attempt(4, "재귀 종료 조건", False), _attempt(0, "반복문 흐름", True),
                _attempt(2, "반복문 흐름", True)]
    req = CreateReportRequest(**dict(BODY, attempts=shuffled))
    assert [a.index for a in req.attempts] == [0, 2, 4]


# --- 설정 ------------------------------------------------------------------

def test_report_token_budget_is_defined():
    """기본값(문항 수 무관 2000)으로 떨어지면 긴 리포트가 잘린다."""
    assert "REPORT" in config.TOKEN_BUDGET
    assert config.max_tokens_for("REPORT", 5) > 1000


# --- 백엔드가 보내는 null 방어 -------------------------------------------

def test_accepts_null_aggregates_from_backend():
    """백엔드는 응시 기록이 없으면 accuracy/completion_rate/avg_elapsed_ms 를 null 로 보낸다."""
    body = dict(BODY, summary=dict(
        BODY["summary"], accuracy=None, completion_rate=None, avg_elapsed_ms=None,
        difficulty_ratio=None, concept_stats=None))
    r = client.post("/api/report", json=body)
    assert r.status_code == 200

    req = CreateReportRequest(**body)
    assert req.summary.accuracy == 0
    assert req.summary.avg_elapsed_ms == 0
    assert req.summary.concept_stats == {}


def test_prompt_survives_null_aggregates():
    body = dict(BODY, summary=dict(
        BODY["summary"], accuracy=None, avg_elapsed_ms=None, concept_stats=None))
    prompt = build_report_prompt(CreateReportRequest(**body))
    assert "정답률 0.0%" in prompt
