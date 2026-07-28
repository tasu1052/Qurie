from __future__ import annotations

from app import config
from app.llm.client import call_llm, parse_json
from app.pipeline.prompts import build_solve_prompt, number_code
from app.pipeline.state import PipelineState


def node_solve(state: PipelineState) -> PipelineState:
    code_block = number_code(state["primary_file"], state["files"][state["primary_file"]])
    # Solver에 정답·해설 숨김
    blind = [
        {"question": q["question"], "choices": q["choices"]}
        for q in state["quizzes"]
    ]
    prompt = build_solve_prompt(code_block, blind)
    raw = call_llm(config.SOLVER_MODEL, prompt, state["meter"], "SOLVE")
    answers = parse_json(raw)["answers"]
    # i 순서로 정렬
    by_i = {int(a["i"]): int(a["choice"]) for a in answers}
    state["solver_answers"] = [by_i.get(i, -1) for i in range(len(state["quizzes"]))]
    return state