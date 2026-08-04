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
REPORT_TOOL_NAME = "emit_report"


def _index_field(allowed: list[int] | None) -> dict:
    """quiz_index 를 허용된 번호로 제한한다.

    프롬프트로 "이 문항들에 대해 쓰세요"라고 지시해도 다른 문항을 쓰거나 번호를
    빼먹는 일이 반복됐다. enum 으로 박으면 다른 값을 넣는 것 자체가 불가능하다.
    대상이 없으면 null 만 허용해 특정 문항과 엮이지 않게 한다.
    """
    if not allowed:
        return {"type": "null"}
    return {"enum": list(allowed)}


def _indexed_bullet(allowed: list[int] | None, max_len: int = 200) -> dict:
    """{quiz_index, text} 항목.

    번호를 자유 문장에 맡기면 엉뚱한 번호를 적고, 0-based 인덱스가 학생 화면에
    그대로 노출된다. 번호는 필드로만 받는다.
    """
    return {
        "type": "object",
        "properties": {
            "quiz_index": _index_field(allowed),
            "text": {"type": "string", "minLength": 10, "maxLength": max_len},
        },
        "required": ["quiz_index", "text"],
    }


def _count_of(targets: list[int] | None, fallback: int) -> int:
    """대상이 있으면 그 개수만, 없으면 기본 상한."""
    return min(len(targets), fallback) if targets else fallback


def report_tool(praise: list[int] | None = None,
                improvement_targets: list[int] | None = None,
                concepts: list[str] | None = None,
                max_items: int = 4) -> dict:
    """학습 리포트 스키마.

    항목 수를 minItems/maxItems 로 묶는다. 열어두면 한두 개만 쓰거나 열 개를 쏟아내
    화면 분량이 매번 달라진다.

    improvements 의 quiz_index 로 원래 문항과 이어지므로 프론트가
    "이 문제 다시 보기"까지 연결할 수 있다.
    """
    return {
        "name": REPORT_TOOL_NAME,
        "description": "학생 1명의 학습 리포트를 넘긴다. 이 도구로만 답하라.",
        "input_schema": {
            "type": "object",
            "properties": {
                "comment": {"type": "string", "minLength": 30, "maxLength": 600},
                # 대상이 정해져 있으면 그 개수만큼만 쓰게 한다.
                "strengths": {
                    "type": "array", "items": _indexed_bullet(praise),
                    "minItems": 1, "maxItems": _count_of(praise, max_items)},
                # 진단 한 줄 + 행동 한 줄을 담는다. 오답노트를 없애고 여기로 합쳤다.
                "improvements": {
                    "type": "array",
                    "items": _indexed_bullet(improvement_targets, max_len=250),
                    "minItems": 1, "maxItems": _count_of(improvement_targets, max_items)},
                # 전부 나열하면 우선순위의 의미가 없어진다. 3개로 묶는다.
                "focus_concepts": {
                    "type": "array",
                    "items": ({"enum": list(concepts)} if concepts
                              else {"type": "string", "maxLength": 60}),
                    "minItems": 1, "maxItems": 3,
                },
            },
            "required": ["comment", "strengths", "improvements", "focus_concepts"],
        },
    }


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


def quiz_tool(requested_count: int, file_paths: str | list[str]) -> dict:
    paths = [file_paths] if isinstance(file_paths, str) else list(file_paths)
    # MICRO면 값을 채우고, CONCEPTUAL이면 null. 폴더 선택 시 여러 경로를 허용한다.
    file_path_enum = [*paths, None]
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
            "file_path": {"enum": file_path_enum},
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
