from __future__ import annotations

from app.core import config
from app.engine.llm import call_llm, parse_json
from app.engine.prompts import build_solve_prompt, number_code
from app.engine.state import PipelineState


def node_solve(state: PipelineState) -> PipelineState:
    quizzes = state["quizzes"]
    solvable = [
        (i, q) for i, q in enumerate(quizzes) if q.get("status") != "REJECTED"
    ]
    answers_out = [-1] * len(quizzes)
    if not solvable:
        state["solver_answers"] = answers_out
        return state

    code_block = number_code(state["primary_file"], state["files"][state["primary_file"]])
    blind = [{"question": q["question"], "choices": q["choices"]} for _, q in solvable]
    prompt = build_solve_prompt(code_block, blind)
    raw = call_llm(
        config.SOLVER_MODEL, prompt, state["meter"], "SOLVE",
        max_tokens=config.max_tokens_for("SOLVE", len(solvable)),
    )
    by_local = {int(a["i"]): int(a["choice"]) for a in parse_json(raw)["answers"]}
    for local_i, (orig_i, _) in enumerate(solvable):
        answers_out[orig_i] = by_local.get(local_i, -1)
    state["solver_answers"] = answers_out
    return state
