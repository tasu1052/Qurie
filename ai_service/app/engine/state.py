from __future__ import annotations

from typing import Any, TypedDict

from app.engine.llm import UsageMeter


class PipelineState(TypedDict, total=False):
    project: str
    quiz_set_id: int
    mode: str
    requested_count: int
    ratio_counts: dict[str, int]
    purpose_counts: dict[str, int]
    ratio_target: dict[str, int]
    purpose_target: dict[str, int]
    gen_count: int
    approved_pool: list[dict[str, Any]]
    rejected_pool: list[dict[str, Any]]
    last_approved: int
    user_prompt: str | None
    # 재생성 시 중복 출제를 피할 이전 문항 목록 (백엔드 avoid_questions)
    avoid_questions: list[str]
    # 재시도 라운드에서 judge 반려 사유를 모아 두는 신뢰 구간 노트 (user_prompt와 분리)
    critiques_note: str
    version_hash: str
    files: dict[str, str]
    primary_file: str
    quizzes: list[dict[str, Any]]
    choice_perms: list[list[int]]
    solver_answers: list[int]
    critiques: list[str]
    retry_count: int
    meter: UsageMeter
    error: str | None
