"""재생성 라운드가 같은 문항을 다시 만들지 않도록 하는 장치 검증."""

import os
os.environ["AI_MOCK"] = "1"

from app.engine.prompts import build_generate_prompt
from app.engine.steps.refine import node_refine

FILES = {"solution.py": "def fib(n):\n    return n\n"}
COUNTS = {"easy": 1, "normal": 1, "hard": 1}
PURPOSE = {"conceptual": 1, "micro": 2}


def _prompt(**kw):
    return build_generate_prompt(
        FILES, "solution.py", 3, COUNTS, PURPOSE, "ASSESSMENT", kw.pop("user_prompt", None),
        **kw)


def _q(question, concept, status="APPROVED", reason=None):
    return {"question": question, "tested_concept": concept,
            "status": status, "reject_reason": reason}


# --- 이미 출제된 문항 노출 --------------------------------------------------

def test_first_round_has_no_existing_block():
    assert "이미 출제된 문항" not in _prompt()


def test_existing_questions_are_listed():
    """알려주지 않으면 같은 코드에서 같은 문항이 또 나온다."""
    prompt = _prompt(existing=[
        _q("fib(0) 의 반환값은?", "재귀 종료 조건"),
        _q("memo 는 언제 갱신되는가?", "메모이제이션"),
    ])
    assert "이미 출제된 문항" in prompt
    assert "(재귀 종료 조건) fib(0) 의 반환값은?" in prompt
    assert "(메모이제이션) memo 는 언제 갱신되는가?" in prompt
    assert "표현만 바꾼 사실상 같은 문항은 금지" in prompt


def test_rejected_questions_are_listed_too():
    """탈락한 문항을 또 만들면 또 탈락한다."""
    prompt = _prompt(existing=[_q("탈락했던 문항", "개념", "REJECTED", "SOLVER_MISMATCH")])
    assert "탈락했던 문항" in prompt


def test_existing_list_is_capped():
    """라운드가 쌓여도 프롬프트가 무한정 길어지면 안 된다."""
    many = [_q(f"문항 {i}", "개념") for i in range(50)]
    prompt = _prompt(existing=many)
    assert "문항 29" in prompt
    assert "문항 45" not in prompt


def test_blank_questions_are_skipped():
    assert "이미 출제된 문항" not in _prompt(existing=[_q("", "개념")])


# --- 재시도 사유를 USER_HINT 밖으로 ----------------------------------------

def test_retry_notes_are_outside_untrusted_block():
    """시스템 피드백이 untrusted 로 라벨링되면 모델이 무시해도 된다고 읽는다."""
    prompt = _prompt(retry_notes="SOLVER_MISMATCH | JUDGE: 모호함",
                     user_prompt="재귀 위주로")

    notes_at = prompt.index("이전 라운드 탈락 사유")
    hint_at = prompt.index("USER_HINT")
    assert notes_at < hint_at          # 탈락 사유가 untrusted 블록 앞에 있다

    untrusted = prompt[hint_at:]
    assert "SOLVER_MISMATCH" not in untrusted
    assert "재귀 위주로" in untrusted   # 사용자 입력만 남는다


def test_refine_does_not_pollute_user_prompt():
    state = {
        "requested_count": 5,
        "purpose_target": PURPOSE, "purpose_counts": PURPOSE,
        "ratio_target": COUNTS, "ratio_counts": COUNTS,
        "user_prompt": "재귀 위주로",
        "quizzes": [_q("살아남은 문항", "개념"),
                    _q("떨어진 문항", "개념", "REJECTED", "SOLVER_MISMATCH")],
        "retry_count": 0,
    }
    out = node_refine(state)

    assert out["user_prompt"] == "재귀 위주로"          # 그대로 유지
    assert out["retry_notes"] == "SOLVER_MISMATCH"      # 별도 필드로


def test_refine_keeps_rejected_for_next_round():
    state = {
        "requested_count": 5,
        "purpose_target": PURPOSE, "purpose_counts": PURPOSE,
        "ratio_target": COUNTS, "ratio_counts": COUNTS,
        "quizzes": [_q("떨어진 문항", "개념", "REJECTED", "JUDGE: 모호함")],
        "retry_count": 0,
    }
    out = node_refine(state)
    assert [q["question"] for q in out["rejected_pool"]] == ["떨어진 문항"]


# --- 코드로 자르는 중복 판정 -----------------------------------------------

from app.engine.dedupe import is_duplicate, mark_duplicates, similarity

WHILE_A = "10번 줄의 while 조건 '0 <= idx <= N - 1 and 0 <= idy <= N - 1'이 필요한 이유는 무엇입니까?"
WHILE_B = "10번 줄의 while 조건에서 '0 <= idx <= N - 1 and 0 <= idy <= N - 1'을 모두 확인하는 이유는 무엇입니까?"
OTHER = "20~22번 줄에서 if not checkmate()가 True를 반환하면 어떤 일이 발생합니까?"


def test_catches_the_observed_duplicate():
    """실제로 새어 나갔던 쌍. 유사도 0.84."""
    assert similarity(WHILE_A, WHILE_B) > 0.8
    assert is_duplicate({"question": WHILE_B}, [{"question": WHILE_A}])


def test_does_not_flag_different_questions():
    """서로 다른 문항은 0.43 이하였다. 잘못 자르면 멀쩡한 문항이 버려진다."""
    assert similarity(WHILE_A, OTHER) < 0.5
    assert not is_duplicate({"question": OTHER}, [{"question": WHILE_A}])


def test_ignores_whitespace_and_punctuation():
    a = {"question": "fib(0) 의 반환값은?"}
    b = {"question": "fib(0)의   반환값은!!"}
    assert is_duplicate(b, [a])


def test_same_line_span_counts_as_duplicate():
    """표현이 달라도 같은 파일 같은 줄을 묻는다면 같은 문항이다."""
    a = {"question": "전혀 다른 문장", "file_path": "s.py", "line_start": 5, "line_end": 6}
    b = {"question": "완전히 관계없는 표현", "file_path": "s.py", "line_start": 5, "line_end": 6}
    assert is_duplicate(b, [a])


def test_conceptual_items_without_span_are_not_span_duplicates():
    a = {"question": "A", "file_path": None, "line_start": None, "line_end": None}
    b = {"question": "B", "file_path": None, "line_start": None, "line_end": None}
    assert not is_duplicate(b, [a])


def test_mark_duplicates_flags_within_same_round():
    """한 응답 안에서도 비슷한 문항이 둘 나올 수 있다."""
    out = mark_duplicates(
        [{"question": WHILE_A}, {"question": WHILE_B}, {"question": OTHER}], [])
    assert [q.get("reject_reason") for q in out] == [None, "DUPLICATE", None]


def test_mark_duplicates_compares_against_previous_rounds():
    out = mark_duplicates([{"question": WHILE_B}], [{"question": WHILE_A}])
    assert out[0]["status"] == "REJECTED"
    assert out[0]["reject_reason"] == "DUPLICATE"


def test_already_rejected_items_are_left_alone():
    out = mark_duplicates(
        [{"question": WHILE_B, "status": "REJECTED", "reject_reason": "LINE_OOB"}],
        [{"question": WHILE_A}])
    assert out[0]["reject_reason"] == "LINE_OOB"
