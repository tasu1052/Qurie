from __future__ import annotations

from typing import Any, TypedDict

from app.engine.llm import UsageMeter


class PipelineState(TypedDict, total=False):
    project: str
    quiz_set_id: int
    mode: str
    requested_count: int
    ratio_counts: dict[str, int]
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
