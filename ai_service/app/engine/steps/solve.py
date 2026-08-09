from __future__ import annotations

from app.core import config
from app.engine.llm import call_llm
from app.engine.prompts import build_solve_prompt, number_code
from app.engine.solve_parse import parse_solver_answers
from app.engine.state import PipelineState

__all__ = ["node_solve", "parse_solver_answers"]


def node_solve(state: PipelineState) -> PipelineState:
    quizzes = state["quizzes"]
    if config.DEMO_MODE:
        # 데모 모드에서는 교차검증을 하지 않는다. 호출 자체를 건너뛰어 크레딧도 안 쓴다.
        state["solver_answers"] = [-1] * len(quizzes)
        return state

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
    try:
        raw = call_llm(
            config.SOLVER_MODEL, prompt, state["meter"], "SOLVE",
            max_tokens=config.max_tokens_for("SOLVE", len(solvable)),
        )
        by_local = parse_solver_answers(raw)
    except Exception:
        # 솔버 파싱/호출 실패는 세트 전체를 죽이지 않는다.
        # 전부 불일치로 두고 judge가 거절 → refine이 재시도한다.
        by_local = {}

    for local_i, (orig_i, _) in enumerate(solvable):
        answers_out[orig_i] = by_local.get(local_i, -1)
    state["solver_answers"] = answers_out
    return state
