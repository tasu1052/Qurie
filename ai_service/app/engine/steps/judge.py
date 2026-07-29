from __future__ import annotations

from app.core import config
from app.engine.llm import call_llm, parse_json
from app.engine.prompts import build_judge_prompt, number_code
from app.engine.state import PipelineState


def node_judge(state: PipelineState) -> PipelineState:
    quizzes = state["quizzes"]
    solver = state.get("solver_answers", [])
    matched = [
        i for i, q in enumerate(quizzes)
        if q.get("status") != "REJECTED"
        and i < len(solver)
        and solver[i] == int(q["answer_index"])
    ]

    scores: dict[int, dict] = {}
    if matched:
        code = number_code(state["primary_file"], state["files"][state["primary_file"]])
        sub = [{
            "index": i,
            "q": quizzes[i]["question"],
            "c": quizzes[i]["choices"],
            "a": quizzes[i]["answer_index"],
            "lines": [quizzes[i].get("line_start"), quizzes[i].get("line_end")],
        } for i in matched]
        prompt = build_judge_prompt(code, sub)
        raw = call_llm(config.JUDGE_MODEL, prompt, state["meter"], "JUDGE")
        scores = {int(s["index"]): s for s in parse_json(raw)["scores"]}

    out = []
    for i, q in enumerate(quizzes):
        if q.get("status") == "REJECTED":
            out.append(q)
            continue
        if i not in matched:
            out.append({**q, "status": "REJECTED", "judge_score": None,
                        "reject_reason": "SOLVER_MISMATCH"})
            continue
        sc = scores.get(i, {}).get("quality_score")
        if isinstance(sc, float) and 0 <= sc <= 1:
            sc = int(round(sc * 10))
        try:
            sc = int(sc)
        except (TypeError, ValueError):
            sc = -1
        if not (0 <= sc <= 10):
            out.append({**q, "status": "REJECTED", "judge_score": None,
                        "reject_reason": "JUDGE_INVALID_SCORE"})
        elif sc >= config.JUDGE_PASS_SCORE:
            out.append({**q, "status": "APPROVED", "judge_score": sc, "reject_reason": None})
        else:
            critique = scores.get(i, {}).get("critique", "")
            out.append({**q, "status": "REJECTED", "judge_score": sc,
                        "reject_reason": f"JUDGE: {critique}"[:200]})
    state["quizzes"] = out
    return state
