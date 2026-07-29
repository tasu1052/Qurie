from app import config
config.MOCK = True  # 또는 export AI_MOCK=1

from app.llm.client import UsageMeter
from app.pipeline.nodes.generate import node_generate
from app.pipeline.nodes.solve import node_solve
from app.schemas.request import DifficultyRatio

files = {
    "solution.py": "def fib(n, memo={}):\n    if n in memo:\n        return memo[n]\n    if n <= 1:\n        return n\n    memo[n] = fib(n-1, memo)+fib(n-2, memo)\n    return memo[n]\n"
}
ratio = DifficultyRatio(easy=1, normal=1, hard=1)
state = {
    "project": "demo",
    "requested_count": 3,
    "ratio_counts": ratio.to_counts(3),
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