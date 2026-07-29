from __future__ import annotations


def build_solve_prompt(code_block: str, items: list[dict]) -> str:
    parts = []
    for i, q in enumerate(items):
        opts = " ".join(f"{j}.{c}" for j, c in enumerate(q["choices"]))
        parts.append(f"[{i}] {q['question']} / {opts}")
    return f"""코드:
{code_block}

아래 객관식의 정답 번호(0~3)만 JSON으로.
{chr(10).join(parts)}

{{"answers":[{{"i":0,"choice":1}}]}}
"""
