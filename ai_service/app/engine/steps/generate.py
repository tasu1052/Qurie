from __future__ import annotations

import random

from app.core import config
from app.engine.llm import call_llm_json
from app.engine.prompts import build_generate_prompt
from app.engine.state import PipelineState
from app.engine.tools import quiz_tool
from app.engine.validate import apply_validation


def normalize_micro(q: dict, primary_file: str) -> dict:
    """MICRO인데 근거 키가 빠진 응답을 보정한다.

    생성 모델이 MICRO 문항의 file_path/line_start/line_end를 통째로 누락하는 일이
    잦다(프롬프트로 강제해도 응답 단위로 전부 빠지는 경우가 있음). 그대로 두면
    validate가 UNKNOWN_FILE로 전량 폐기해 요청 개수를 못 채운다.

    - file_path만 없으면 primary_file로 채운다. 어차피 단일 파일 기준이라 안전하다.
    - line 범위가 없으면 지어내지 않는다. 없는 근거를 만들면 틀린 곳을 가리키게 되므로,
      근거 없는 개념 문항으로 보고 CONCEPTUAL로 강등해 문항 자체는 살린다.
    """
    if q.get("purpose") != "MICRO":
        return q
    has_span = q.get("line_start") is not None and q.get("line_end") is not None
    if not has_span:
        return {k: v for k, v in q.items()
                if k not in ("file_path", "line_start", "line_end")} | {"purpose": "CONCEPTUAL"}
    return {**q, "file_path": q.get("file_path") or primary_file}


def _avoid_questions(state: PipelineState) -> list[str]:
    """중복 금지 목록 = 백엔드가 보낸 이전 세트 문항 + 이번 실행에서 이미 승인된 문항.

    approved_pool을 합치지 않으면 재시도 라운드가 1라운드에서 승인된 문항과
    사실상 같은 문항을 다시 만들어 최종 세트 안에서 중복이 난다.
    """
    avoid = list(state.get("avoid_questions") or [])
    for q in state.get("approved_pool") or []:
        if isinstance(q, dict) and q.get("question"):
            avoid.append(str(q["question"]))
    return avoid


def node_generate(state: PipelineState) -> PipelineState:
    # 재시도 라운드에서는 이미 확보한 문항을 빼고 부족분만 뽑는다.
    count = state.get("gen_count") or state["requested_count"]
    prompt = build_generate_prompt(
        state["files"],
        state["primary_file"],
        count,
        state["ratio_counts"],
        state["purpose_counts"],
        state["mode"],
        state.get("user_prompt"),
        avoid_questions=_avoid_questions(state),
        critiques_note=state.get("critiques_note"),
    )
    data = call_llm_json(
        config.GEN_MODEL, prompt, state["meter"], "GENERATE",
        quiz_tool(count, list(state["files"].keys())),
        max_tokens=config.max_tokens_for("GENERATE", count),
    )
    quizzes = data.get("quizzes") or []
    if not isinstance(quizzes, list):
        quizzes = []

    perms: list[list[int]] = []
    shuffled: list[dict] = []
    for q in quizzes:
        # 스키마 밖 응답(문항이 int/str로 오는 경우)은 섞지 말고 건너뛴다.
        if not isinstance(q, dict):
            continue
        raw_choices = q.get("choices")
        if not isinstance(raw_choices, list) or len(raw_choices) != 4:
            shuffled.append(dict(q))
            perms.append(list(range(4)))
            continue
        choices = list(raw_choices)
        order = list(range(len(choices)))
        random.shuffle(order)
        new_choices = [choices[i] for i in order]
        try:
            old_ans = int(q["answer_index"])
            new_ans = order.index(old_ans)
        except (KeyError, TypeError, ValueError):
            shuffled.append(dict(q))
            perms.append(list(range(4)))
            continue
        nq = dict(q)
        nq["choices"] = new_choices
        nq["answer_index"] = new_ans
        perms.append(order)
        shuffled.append(nq)

    normalized = [normalize_micro(q, state["primary_file"]) for q in shuffled]
    state["quizzes"] = apply_validation(normalized, state["files"])
    state["choice_perms"] = perms
    return state
