"""generate → solve 스모크 테스트 (AI_MOCK=1 권장)."""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.core import config
from app.engine.llm import UsageMeter
from app.engine.steps.generate import node_generate
from app.engine.steps.solve import node_solve
from app.quiz.dto.request import DifficultyRatio

if __name__ == "__main__":
    config.MOCK = True

    files = {
        "solution.py": (
            "def fib(n, memo={}):\n"
            "    if n in memo:\n"
            "        return memo[n]\n"
            "    if n <= 1:\n"
            "        return n\n"
            "    memo[n] = fib(n-1, memo)+fib(n-2, memo)\n"
            "    return memo[n]\n"
        )
    }
    ratio = DifficultyRatio(easy=1, normal=1, hard=1)
    from app.engine.purpose import purpose_counts

    requested = 3
    state = {
        "project": "demo",
        "mode": "PRACTICE",
        "requested_count": requested,
        "ratio_counts": ratio.to_counts(requested),
        "purpose_counts": purpose_counts("PRACTICE", requested),
        "user_prompt": None,
        "files": files,
        "primary_file": "solution.py",
        "meter": UsageMeter(),
        "retry_count": 0,
    }
    state = node_generate(state)
    state = node_solve(state)
    for i, q in enumerate(state["quizzes"]):
        print(i, "gen", q["answer_index"], "solver", state["solver_answers"][i], q["question"][:40])
    print(state["meter"].rows)
