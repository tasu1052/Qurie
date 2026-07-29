from __future__ import annotations

import random

from app.core import config
from app.engine.llm import call_llm, parse_json
from app.engine.prompts import build_generate_prompt
from app.engine.state import PipelineState
from app.engine.validate import apply_validation


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

    perms: list[list[int]] = []
    shuffled: list[dict] = []
    for q in quizzes:
        choices = list(q["choices"])
        order = list(range(len(choices)))
        random.shuffle(order)
        new_choices = [choices[i] for i in order]
        old_ans = int(q["answer_index"])
        new_ans = order.index(old_ans)
        nq = dict(q)
        nq["choices"] = new_choices
        nq["answer_index"] = new_ans
        perms.append(order)
        shuffled.append(nq)

    state["quizzes"] = apply_validation(shuffled, state["files"])
    state["choice_perms"] = perms
    return state
