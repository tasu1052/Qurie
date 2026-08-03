from __future__ import annotations


def build_solve_prompt(code_block: str, items: list[dict]) -> str:
    parts = []
    for i, q in enumerate(items):
        opts = " ".join(f"{j}.{c}" for j, c in enumerate(q["choices"]))
        parts.append(f"[{i}] {q['question']} / {opts}")
    return f"""코드:
{code_block}

아래 객관식의 정답 번호(0~3)만 JSON으로.
각 항목은 반드시 {{"i":문항번호,"choice":선택지번호}} 객체여야 한다.
choice만 나열한 숫자 배열은 쓰지 말 것.
{chr(10).join(parts)}

{{"answers":[{{"i":0,"choice":1}}]}}
"""
