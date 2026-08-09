from __future__ import annotations

from app.core import config
from app.engine.llm import call_llm_json
from app.engine.progress import publish_approved_progress
from app.engine.prompts import build_judge_prompt, number_code
from app.engine.state import PipelineState
from app.engine.tools import judge_tool


def node_judge(state: PipelineState) -> PipelineState:
    quizzes = state["quizzes"]
    if config.DEMO_MODE:
        # 구조 검증(validate)만 통과했으면 그대로 승인한다. 품질 점수는 매기지 않는다.
        # judge_score 를 0 이 아니라 None 으로 두어 "채점 안 함"과 "0점"을 구분한다.
        state["quizzes"] = [
            q if q.get("status") == "REJECTED"
            else {**q, "status": "APPROVED", "judge_score": None, "reject_reason": None}
            for q in quizzes
        ]
        publish_approved_progress(state)
        return state

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
        data = call_llm_json(
            config.JUDGE_MODEL, prompt, state["meter"], "JUDGE",
            judge_tool(len(sub)),
            max_tokens=config.max_tokens_for("JUDGE", len(sub)),
        )
        scores = {}
        for s in data.get("scores") or []:
            if not isinstance(s, dict) or s.get("index") is None:
                continue
            try:
                scores[int(s["index"])] = s
            except (TypeError, ValueError):
                continue

    out = []
    for i, q in enumerate(quizzes):
        if q.get("status") == "REJECTED":
            out.append(q)
            continue
        if i not in matched:
            out.append({**q, "status": "REJECTED", "judge_score": None,
                        "reject_reason": "SOLVER_MISMATCH"})
            continue
        entry = scores.get(i)
        if not isinstance(entry, dict):
            entry = {}
        sc = entry.get("quality_score")
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
            critique = entry.get("critique", "")
            out.append({**q, "status": "REJECTED", "judge_score": sc,
                        "reject_reason": f"JUDGE: {critique}"[:200]})
    state["quizzes"] = out
    # 승인분이 생기면 READY 전에 status에 올려 폴링이 순차 표시할 수 있게 한다.
    publish_approved_progress(state)
    return state
