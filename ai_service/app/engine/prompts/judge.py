from __future__ import annotations


def build_judge_prompt(code_block: str, items: list[dict]) -> str:
    return f"""[코드]
{code_block}

위 코드를 바탕으로 생성된 객관식 퀴즈들을 검증하고 0~10점 사이로 채점하세요.

[채점 기준 및 감점 요소]
1. 정답 유일성: 정답이 없거나, 복수 정답이 가능하면 -> 0~3점 (즉시 탈락)
2. 코드 이해 필요성: 코드를 안 보고도 풀 수 있거나, 단순 오타/줄번호 맞추기면 -> 4~6점
3. 오답 매력도: 오답 보기가 너무 터무니없어 정답이 너무 쉽게 눈에 띄면 -> 5~7점
4. 코드 부합성: 문제 내용이 제시된 코드의 실제 동작과 다르면 -> 0~3점

[주의사항]
- quality_score가 7점 미만인 경우, critique에 "어느 보기가 왜 문제인지/어떻게 고쳐야 하는지" 구체적 거절 사유를 반드시 작성하세요. (7점 이상이면 critique는 빈 문자열 "")

[출력 스키마 - JSON만 출력]
{{"scores": [{{"index": 0, "quality_score": 8, "critique": ""}}]}}

[검증할 문항 목록]
{items}
"""
