from __future__ import annotations

from app import config
from app.llm.client import call_llm, parse_json
from app.pipeline.prompts import number_code
from app.pipeline.state import PipelineState


def node_judge(state: PipelineState) -> PipelineState:
    quizzes = state["quizzes"]
    solver = state.get("solver_answers", [])
    matched = [
        i for i, q in enumerate(quizzes)
        if i < len(solver) and solver[i] == int(q["answer_index"])
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
        prompt = f"""코드:\n{code}\n\n0~10 정수로 품질 채점(정답유일성/오답매력/코드이해필요).
JSON만: {{"scores":[{{"index":0,"quality_score":8,"critique":""}}]}}\n문항:{sub}"""
        raw = call_llm(config.JUDGE_MODEL, prompt, state["meter"], "JUDGE")
        scores = {int(s["index"]): s for s in parse_json(raw)["scores"]}

    out = []
    for i, q in enumerate(quizzes):
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