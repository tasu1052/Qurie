from __future__ import annotations

import random

from app import config
from app.llm.client import call_llm, parse_json
from app.pipeline.prompts import build_generate_prompt, number_code
from app.pipeline.state import PipelineState


def node_generate(state: PipelineState) -> PipelineState:
    prompt = build_generate_prompt(
        state["files"],
        state["primary_file"],
        state["requested_count"],
        state["ratio_counts"],
        state.get("user_prompt"),
    )
    raw = call_llm(config.GEN_MODEL, prompt, state["meter"], "GENERATE")
    data = parse_json(raw)
    quizzes = data["quizzes"]

    # 보기 셔플 + perm 보관 (계약 §3.6)
    perms: list[list[int]] = []
    shuffled: list[dict] = []
    for q in quizzes:
        choices = list(q["choices"])
        order = list(range(len(choices)))
        random.shuffle(order)
        new_choices = [choices[i] for i in order]
        # answer_index를 셔플 공간으로 이동
        old_ans = int(q["answer_index"])
        new_ans = order.index(old_ans)
        nq = dict(q)
        nq["choices"] = new_choices
        nq["answer_index"] = new_ans
        # perm[j] = 셔플 위치 j에 있는 원래 인덱스
        perms.append(order)
        shuffled.append(nq)

    state["quizzes"] = shuffled
    state["choice_perms"] = perms
    return state