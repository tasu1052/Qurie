import os
os.environ["AI_MOCK"] = "1"

from app.engine.factory import build_pipeline_state
from app.engine.prompts.generate import _MAX_AVOID_CHARS, build_generate_prompt
from app.engine.steps.generate import _avoid_questions
from app.quiz.dto.request import CreateQuizSetRequest

FILES = {"solution.py": "x = 1\n"}


def _req(**over):
    base = dict(mode="PRACTICE", requested_count=3, version_hash="t",
                files=dict(FILES))
    base.update(over)
    return CreateQuizSetRequest(**base)


def _prompt(avoid=None, critiques=None, user_prompt=None):
    return build_generate_prompt(
        FILES, "solution.py", 3,
        {"easy": 1, "normal": 1, "hard": 1},
        {"conceptual": 1, "micro": 2},
        "PRACTICE", user_prompt,
        avoid_questions=avoid, critiques_note=critiques,
    )


# --- request DTO ------------------------------------------------------------

def test_request_defaults_to_empty_avoid_list():
    assert _req().avoid_questions == []


def test_request_drops_blank_items_and_truncates_long_ones():
    req = _req(avoid_questions=["  [개념] 질문  ", "   ", "긴 " * 300])
    assert req.avoid_questions[0] == "[개념] 질문"
    assert len(req.avoid_questions) == 2
    assert all(len(q) <= 200 for q in req.avoid_questions)


# --- factory ----------------------------------------------------------------

def test_factory_threads_avoid_questions_into_state():
    body = _req(avoid_questions=["[개념] 이전 문항"])
    state = build_pipeline_state(1, "demo", body, body.files)
    assert state["avoid_questions"] == ["[개념] 이전 문항"]


# --- prompt rendering -------------------------------------------------------

def test_prompt_omits_history_section_when_empty():
    assert "[기존 출제 이력" not in _prompt(avoid=[])
    assert "[기존 출제 이력" not in _prompt(avoid=None)


def test_prompt_renders_history_as_trusted_section_between_rules_and_hint():
    p = _prompt(avoid=["[동시성] 락 순서는?"], user_prompt="힌트")
    assert "- [동시성] 락 순서는?" in p
    # 신뢰 구간: [규칙] 뒤, USER_HINT(untrusted) 앞에 있어야 한다
    assert p.index("[규칙]") < p.index("[기존 출제 이력") < p.index("### USER_HINT")


def test_prompt_caps_history_length():
    huge = [f"질문{i} " + "가" * 190 for i in range(60)]
    p = _prompt(avoid=huge)
    section = p.split("[기존 출제 이력")[1].split("[출력]")[0]
    assert "… (truncated)" in section
    assert len(section) < _MAX_AVOID_CHARS + 500


def test_prompt_renders_critiques_note_outside_user_hint():
    p = _prompt(critiques="SOLVER_MISMATCH", user_prompt="힌트")
    assert "[이전 시도 반려 사유 — 반복 금지]" in p
    hint_block = p.split("### USER_HINT")[1].split("### END_USER_HINT")[0]
    assert "SOLVER_MISMATCH" not in hint_block


def test_prompt_omits_critiques_section_when_empty():
    assert "[이전 시도 반려 사유" not in _prompt(critiques=None)
    assert "[이전 시도 반려 사유" not in _prompt(critiques="  ")


# --- generate node: intra-run dedup ------------------------------------------

def test_generate_merges_approved_pool_into_avoid_list():
    state = {
        "avoid_questions": ["[개념] 지난 세트 문항"],
        "approved_pool": [
            {"question": "1라운드에서 승인된 문항", "status": "APPROVED"},
            {"status": "APPROVED"},  # question 없는 항목은 건너뛴다
        ],
    }
    merged = _avoid_questions(state)
    assert merged == ["[개념] 지난 세트 문항", "1라운드에서 승인된 문항"]


def test_generate_avoid_list_empty_without_history_or_pool():
    assert _avoid_questions({}) == []
