"""중복 문항 판정.

프롬프트로 "겹치지 마세요"라고 지시해도 표현만 바꾼 같은 문항이 나왔다.
실측 예시는 유사도 0.84 였다.

    "10번 줄의 while 조건 '...'이 필요한 이유는?"
    "10번 줄의 while 조건에서 '...'을 모두 확인하는 이유는?"

지시가 아니라 계산으로 막는다. LLM을 부르지 않으므로 크레딧이 들지 않는다.
"""

from __future__ import annotations

import re
from difflib import SequenceMatcher

# 실측 기준선: 진짜 중복은 0.84, 서로 다른 문항은 0.43 이하였다.
DUPLICATE_RATIO = 0.70

_NON_WORD = re.compile(r"[^0-9a-zA-Z가-힣]")


def normalize(text: str) -> str:
    """공백·기호·대소문자 차이를 지운다. 표현만 바꾼 문항을 같게 만든다."""
    return _NON_WORD.sub("", (text or "").lower())


def similarity(a: str, b: str) -> float:
    na, nb = normalize(a), normalize(b)
    if not na or not nb:
        return 0.0
    return SequenceMatcher(None, na, nb).ratio()


def same_span(a: dict, b: dict) -> bool:
    """같은 파일의 같은 줄 범위를 묻는다면 표현이 달라도 같은 문항으로 본다."""
    if not a.get("file_path") or a.get("file_path") != b.get("file_path"):
        return False
    if a.get("line_start") is None or b.get("line_start") is None:
        return False
    return (a.get("line_start"), a.get("line_end")) == (b.get("line_start"), b.get("line_end"))


def is_duplicate(quiz: dict, others: list[dict], ratio: float = DUPLICATE_RATIO) -> bool:
    question = quiz.get("question") or ""
    for other in others:
        if similarity(question, other.get("question") or "") >= ratio:
            return True
        if same_span(quiz, other):
            return True
    return False


def mark_duplicates(quizzes: list[dict], existing: list[dict]) -> list[dict]:
    """중복을 REJECTED 로 표시한다.

    이미 확보한 문항(existing)뿐 아니라 같은 라운드에서 앞서 나온 문항과도 비교한다.
    한 번의 응답 안에서도 비슷한 문항이 두 개 나올 수 있다.
    """
    seen = list(existing)
    out = []
    for q in quizzes:
        if q.get("status") != "REJECTED" and is_duplicate(q, seen):
            out.append({**q, "status": "REJECTED", "reject_reason": "DUPLICATE",
                        "judge_score": None})
            continue
        out.append(q)
        seen.append(q)
    return out
