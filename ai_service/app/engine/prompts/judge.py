from __future__ import annotations


def build_judge_prompt(code_block: str, items: list[dict]) -> str:
    return f"""코드:
{code_block}

0~10 정수로 품질 채점(정답유일성/오답매력/코드이해필요).
JSON만: {{"scores":[{{"index":0,"quality_score":8,"critique":""}}]}}
문항:{items}"""
