"""tool use용 출력 스키마.

프롬프트로 "이 키를 꼭 넣으세요"라고 부탁하는 대신 스키마로 못박는다.
required에 들어간 키는 모델이 뺄 수 없으므로, MICRO 근거 키가 통째로
누락되던 문제가 구조적으로 사라진다.

CONCEPTUAL은 근거 키가 없어야 하는데 JSON Schema로 purpose별 조건부
required를 걸면 복잡해지므로, 세 키를 모두 required로 두되 타입에 null을
허용한다. validate.py의 CONCEPTUAL_WITH_SPAN 검사는 truthy 여부만 보므로
null은 그대로 통과한다.
"""

from __future__ import annotations

QUIZ_TOOL_NAME = "emit_quizzes"
JUDGE_TOOL_NAME = "emit_scores"


def judge_tool(item_count: int) -> dict:
    """채점 결과 스키마.

    gemini가 critique 안의 따옴표를 이스케이프하지 않아 JSON이 깨지는 일이 있었다.
    스키마를 걸면 디코딩 단계에서 형식이 보장되므로 그 실패가 사라진다.
    """
    return {
        "name": JUDGE_TOOL_NAME,
        "description": "각 문항의 품질 점수를 넘긴다.",
        "input_schema": {
            "type": "object",
            "properties": {
                "scores": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "index": {"type": "integer", "minimum": 0},
                            "quality_score": {
                                "type": "integer", "minimum": 0, "maximum": 10},
                            "critique": {"type": "string"},
                        },
                        "required": ["index", "quality_score", "critique"],
                    },
                    "minItems": item_count,
                    "maxItems": item_count,
                },
            },
            "required": ["scores"],
        },
    }


def quiz_tool(requested_count: int, primary_file: str) -> dict:
    item = {
        "type": "object",
        "properties": {
            "purpose": {"type": "string", "enum": ["CONCEPTUAL", "MICRO"]},
            "difficulty": {"type": "string", "enum": ["EASY", "NORMAL", "HARD"]},
            "tested_concept": {"type": "string", "maxLength": 60},
            "question": {"type": "string"},
            "choices": {
                "type": "array",
                "items": {"type": "string"},
                "minItems": 4,
                "maxItems": 4,
            },
            "answer_index": {"type": "integer", "minimum": 0, "maximum": 3},
            "explanation": {"type": "string"},
            # MICRO면 값을 채우고, CONCEPTUAL이면 null.
            "file_path": {"enum": [primary_file, None]},
            "line_start": {"type": ["integer", "null"], "minimum": 1},
            "line_end": {"type": ["integer", "null"], "minimum": 1},
        },
        "required": [
            "purpose", "difficulty", "tested_concept", "question",
            "choices", "answer_index", "explanation",
            "file_path", "line_start", "line_end",
        ],
    }
    return {
        "name": QUIZ_TOOL_NAME,
        "description": "생성한 퀴즈 문항 전체를 넘긴다. 이 도구로만 답하라.",
        "input_schema": {
            "type": "object",
            "properties": {
                "quizzes": {
                    "type": "array",
                    "items": item,
                    "minItems": requested_count,
                    "maxItems": requested_count,
                },
            },
            "required": ["quizzes"],
        },
    }
