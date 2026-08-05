import os
os.environ["AI_MOCK"] = "1"

import pytest
from fastapi.testclient import TestClient

from app.core import config
from app.engine.prompts import build_report_prompt
from app.engine.prompts.report import build_plan
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
        "strengths": [{"quiz_index": None, "text": "강점"}],
        "improvements": [{"quiz_index": None, "text": "보완점"}],
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


# --- 오답 노트 -------------------------------------------------------------











# --- 반 통계(cohort) ------------------------------------------------------

def _with_cohort(attempt, attempted, correct, dist=None):
    c = {"attempted": attempted, "correct": correct}
    if dist:
        c["choice_distribution"] = dist
    return dict(attempt, cohort=c)


def test_cohort_is_optional():
    """백엔드가 안 보내도 지금과 똑같이 동작해야 한다."""
    assert client.post("/api/report", json=BODY).status_code == 200
    req = CreateReportRequest(**BODY)
    assert all(a.cohort is None for a in req.attempts)


def test_cohort_rate_is_derived_when_absent():
    attempts = [_with_cohort(_attempt(i, "반복문 흐름", True), 18, 4) for i in range(5)]
    req = CreateReportRequest(**dict(BODY, attempts=attempts))
    assert req.attempts[0].cohort.correct_rate == pytest.approx(22.22, abs=0.01)


def test_thin_cohort_is_dropped():
    """응시자 3명으로 '반 평균 33%'라고 하면 안 된다."""
    attempts = [_with_cohort(_attempt(i, "반복문 흐름", True), 3, 1) for i in range(5)]
    req = CreateReportRequest(**dict(BODY, attempts=attempts))
    assert all(a.cohort is None for a in req.attempts)


def test_prompt_shows_cohort_line():
    attempts = [_with_cohort(_attempt(i, "반복문 흐름", True), 18, 4, [12, 4, 1, 1])
                for i in range(5)]
    prompt = build_report_prompt(CreateReportRequest(**dict(BODY, attempts=attempts)))
    assert "반 평균: 18명 중 4명 정답 (22.2%)" in prompt
    assert "보기별 선택 [12, 4, 1, 1]" in prompt


def test_prompt_omits_cohort_line_when_absent():
    prompt = build_report_prompt(CreateReportRequest(**BODY))
    assert "반 평균:" not in prompt


def test_prompt_forbids_inventing_cohort_numbers():
    prompt = build_report_prompt(CreateReportRequest(**BODY))
    assert "반 평균 수치(%)는 문장에 쓰지 마세요" in prompt


# --- 작성 대상 계획 --------------------------------------------------------

def _cohort_body():
    """BODY 기준: 0·1·2 정답, 3·4 오답.

    2(정답·22.2%)는 강점, 3(오답·88.9%)은 우선 확인, 4(오답·16.7%)는 다수 오답이 되어야 한다.
    0·1은 정답이면서 반 정답률도 높아 어느 분류에도 안 들어간다.
    """
    rates = {0: (18, 17), 1: (18, 15), 2: (18, 4), 3: (18, 16), 4: (18, 3)}
    attempts = [dict(a, cohort={"attempted": rates[a["index"]][0],
                                "correct": rates[a["index"]][1]})
                for a in BODY["attempts"]]
    return dict(BODY, attempts=attempts)


def _targets_of(prompt):
    return prompt.split("[작성 대상")[1].split("[공통 규칙]")[0]


def test_plan_classifies_by_cohort_rate():
    plan = build_plan(CreateReportRequest(**_cohort_body()))
    assert plan.praise == [2]         # 정답인데 반 정답률 22.2%
    assert plan.priority == [3]       # 오답인데 반 정답률 88.9%
    assert plan.common_wrong == [4]   # 오답이고 반 정답률 16.7%


def test_improvement_targets_put_priority_first():
    """반 대부분이 맞힌 걸 틀린 문항이 1순위여야 한다."""
    plan = build_plan(CreateReportRequest(**_cohort_body()))
    assert plan.improvement_targets[0] == 3
    assert set(plan.improvement_targets) == {3, 4}


def test_targets_block_lists_write_order():
    prompt = build_report_prompt(CreateReportRequest(**_cohort_body()))
    targets = _targets_of(prompt)
    assert "strengths: [2]" in targets
    assert "improvements: [3] → [4]" in targets


def test_plan_skips_items_without_signal():
    """정답이면서 반 정답률도 높은 문항은 언급할 이유가 없다."""
    targets = _targets_of(build_report_prompt(CreateReportRequest(**_cohort_body())))
    assert "[0]" not in targets and "[1]" not in targets


def test_cohort_shown_only_for_planned_items():
    """판정 대상이 아닌 문항의 반 평균은 아예 보여주지 않는다.

    보여주면 모델이 끌어다 쓴다. '쓰지 마세요'로는 막히지 않았다.
    """
    prompt = build_report_prompt(CreateReportRequest(**_cohort_body()))
    assert "94.4%" in prompt or "88.9%" in prompt          # 판정 대상은 보임
    assert "17명 정답" not in prompt                        # [0] 은 안 보임
    assert "15명 정답" not in prompt                        # [1] 은 안 보임


def test_plan_puts_unanswered_last():
    """미응시는 강점·우선확인 어디에도 들어가지 않고 보완점 맨 뒤에 온다."""
    body = _cohort_body()
    body["attempts"] = list(body["attempts"]) + [
        dict(_attempt(9, "재귀 종료 조건", None), chosen_index=None, is_correct=None,
             cohort={"attempted": 18, "correct": 16})]
    plan = build_plan(CreateReportRequest(**body))
    assert 9 not in plan.praise and 9 not in plan.priority
    assert plan.improvement_targets[-1] == 9


def test_comment_rule_requires_numbers():
    prompt = build_report_prompt(CreateReportRequest(**BODY))
    assert "첫 문장에 응시 현황과 정답률을 그대로 넣습니다" in prompt


# --- 문항 번호 노출 방지 ---------------------------------------------------

def test_improvements_are_structured_with_index():
    """번호를 자유 문장에 맡기면 엉뚱한 번호를 적는다. 필드로 받는다."""
    data = client.post("/api/report", json=BODY).json()
    for item in data["improvements"]:
        assert set(item) == {"quiz_index", "text", "cohort_rate"}


def test_improvement_index_is_unlinked_when_unknown(monkeypatch):
    """없는 문항을 가리키면 조언은 살리고 연결만 끊는다."""
    from app.report import service as svc_module

    monkeypatch.setattr(svc_module, "call_llm_json", lambda *a, **k: {
        "comment": "총평", "strengths": [{"quiz_index": None, "text": "강점"}], "focus_concepts": [],
        "improvements": [
            {"quiz_index": 3, "text": "실제 문항"},
            {"quiz_index": 99, "text": "없는 문항"},
            {"quiz_index": None, "text": "일반 조언"},
        ],
    })
    result = ReportService().create(CreateReportRequest(**BODY))
    assert [i.quiz_index for i in result.improvements] == [3, None, None]
    assert [i.text for i in result.improvements] == ["실제 문항", "없는 문항", "일반 조언"]


def test_prompt_forbids_question_numbers_in_text():
    prompt = build_report_prompt(CreateReportRequest(**BODY))
    assert "문장에 문항 번호를 쓰지 마세요" in prompt
    assert "학생 화면 번호와 다릅니다" in prompt


def test_prompt_restricts_improvements_to_wrong_and_unanswered():
    prompt = build_report_prompt(CreateReportRequest(**BODY))
    assert "improvements: [3] → [4]" in prompt


# --- 계획 위반 후처리 ------------------------------------------------------

def test_strength_index_dropped_when_not_in_praise_list(monkeypatch):
    """판정 대상이 아닌 문항을 강점으로 지목하면 연결을 끊는다.

    평범한 성과가 '반 대부분이 틀린 걸 맞힌 것'처럼 보이면 안 된다.
    """
    from app.report import service as svc_module

    monkeypatch.setattr(svc_module, "call_llm_json", lambda *a, **k: {
        "comment": "총평", "focus_concepts": [],
        "improvements": [{"quiz_index": None, "text": "보완점"}],
        "strengths": [
            {"quiz_index": 2, "text": "판정 대상"},   # praise 목록에 있음
            {"quiz_index": 0, "text": "판정 밖"},     # 정답이지만 반도 잘 맞힌 문항
        ],
    })
    result = ReportService().create(CreateReportRequest(**_cohort_body()))
    assert [s.quiz_index for s in result.strengths] == [2, None]


def test_improvements_reordered_to_plan(monkeypatch):
    """우선 확인 문항을 뒤에 적어 보내도 앞으로 끌어올린다."""
    from app.report import service as svc_module

    monkeypatch.setattr(svc_module, "call_llm_json", lambda *a, **k: {
        "comment": "총평", "focus_concepts": [],
        "strengths": [{"quiz_index": None, "text": "강점"}],
        "improvements": [
            {"quiz_index": 4, "text": "다수 오답 문항"},
            {"quiz_index": 3, "text": "우선 확인 문항"},
        ],
    })
    result = ReportService().create(CreateReportRequest(**_cohort_body()))
    assert [i.quiz_index for i in result.improvements] == [3, 4]


# --- 스키마 enum 강제 ------------------------------------------------------

def test_schema_pins_strength_index_to_plan():
    """프롬프트로 못 막던 걸 enum 으로 막는다. 다른 값은 넣을 수 없다."""
    from app.engine.tools import report_tool

    schema = report_tool(praise=[3, 7], improvement_targets=[2, 6],
                         concepts=["가", "나"])["input_schema"]
    strengths = schema["properties"]["strengths"]
    assert strengths["items"]["properties"]["quiz_index"]["enum"] == [3, 7]
    assert strengths["maxItems"] == 2


def test_schema_pins_improvement_index_and_count():
    from app.engine.tools import report_tool

    schema = report_tool(praise=[3], improvement_targets=[2, 6, 4, 8],
                         concepts=["가"])["input_schema"]
    imp = schema["properties"]["improvements"]
    assert imp["items"]["properties"]["quiz_index"]["enum"] == [2, 6, 4, 8]
    assert imp["maxItems"] == 4


def test_schema_forces_null_index_when_no_targets():
    """강점 대상이 없으면 특정 문항과 엮이지 않게 null 만 허용한다."""
    from app.engine.tools import report_tool

    schema = report_tool(praise=[], improvement_targets=[2])["input_schema"]
    assert schema["properties"]["strengths"]["items"]["properties"]["quiz_index"] \
        == {"type": "null"}


def test_schema_pins_focus_concepts():
    from app.engine.tools import report_tool

    schema = report_tool(concepts=["재귀", "반복"])["input_schema"]
    assert schema["properties"]["focus_concepts"]["items"]["enum"] == ["재귀", "반복"]


def test_openai_strict_keeps_index_enum():
    """strict 변환 후에도 enum 이 살아 있어야 강제가 유지된다."""
    from app.engine.llm import to_openai_strict
    from app.engine.tools import report_tool

    out = to_openai_strict(report_tool(praise=[3, 7],
                                       improvement_targets=[2])["input_schema"])
    idx = out["properties"]["strengths"]["items"]["properties"]["quiz_index"]
    assert idx["enum"] == [3, 7]
    assert idx["type"] == "integer"


# --- focus_concepts 순서 ---------------------------------------------------

def test_focus_concepts_sorted_by_correct_rate():
    """100% 맞힌 개념이 복습 1순위로 올라오면 안 된다."""
    from app.report import service as svc_module

    monkeypatch_target = {
        "comment": "총평",
        "strengths": [{"quiz_index": None, "text": "강점"}],
        "improvements": [{"quiz_index": None, "text": "보완점"}],
        # 정답률 높은 개념을 앞에 적어 보낸다
        "focus_concepts": ["반복문 흐름", "재귀 종료 조건"],
    }
    import pytest as _pytest
    mp = _pytest.MonkeyPatch()
    mp.setattr(svc_module, "call_llm_json", lambda *a, **k: monkeypatch_target)
    try:
        result = ReportService().create(CreateReportRequest(**BODY))
    finally:
        mp.undo()
    # 재귀 종료 조건 0/2, 반복문 흐름 3/3 -> 낮은 쪽이 먼저
    assert result.focus_concepts == ["재귀 종료 조건", "반복문 흐름"]


# --- 반 정답률은 서버가 채운다 ---------------------------------------------

def test_cohort_rate_filled_by_server(monkeypatch):
    """AI가 수치를 쓰게 하면 빠뜨리거나 다른 문항 값을 적었다. 코드가 채운다."""
    from app.report import service as svc_module

    monkeypatch.setattr(svc_module, "call_llm_json", lambda *a, **k: {
        "comment": "총평", "focus_concepts": [],
        "strengths": [{"quiz_index": 2, "text": "강점"}],
        "improvements": [{"quiz_index": 3, "text": "보완점"}],
        
    })
    result = ReportService().create(CreateReportRequest(**_cohort_body()))

    assert result.strengths[0].cohort_rate == pytest.approx(22.22, abs=0.01)   # 18명 중 4명
    assert result.improvements[0].cohort_rate == pytest.approx(88.89, abs=0.01)  # 18명 중 16명


def test_cohort_rate_none_without_cohort(monkeypatch):
    from app.report import service as svc_module

    monkeypatch.setattr(svc_module, "call_llm_json", lambda *a, **k: {
        "comment": "총평", "focus_concepts": [],
        "strengths": [{"quiz_index": None, "text": "강점"}],
        "improvements": [{"quiz_index": 3, "text": "보완점"}],
    })
    result = ReportService().create(CreateReportRequest(**BODY))
    assert result.improvements[0].cohort_rate is None
    assert result.strengths[0].cohort_rate is None


def test_prompt_moves_rate_out_of_sentences():
    prompt = build_report_prompt(CreateReportRequest(**_cohort_body()))
    assert "반 평균 수치(%)는 문장에 쓰지 마세요" in prompt
    assert "반 대부분이 틀린 문항을 맞혔다는 점이 드러나게" in prompt


# --- improvements / wrong_notes 역할 분리 ----------------------------------



def test_improvement_text_fits_diagnosis_and_action():
    """진단 한 줄 + 행동 한 줄이 들어가야 한다."""
    from app.engine.tools import report_tool

    schema = report_tool(praise=[1], improvement_targets=[2])["input_schema"]
    imp_len = schema["properties"]["improvements"]["items"]["properties"]["text"]["maxLength"]
    str_len = schema["properties"]["strengths"]["items"]["properties"]["text"]["maxLength"]
    assert imp_len == 250
    assert str_len < imp_len




