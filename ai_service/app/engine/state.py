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
    retry_notes: str
    user_prompt: str | None
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
