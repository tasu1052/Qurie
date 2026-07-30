from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Literal

QuizSetStatus = Literal["PENDING", "GENERATING", "READY", "FAILED"]


@dataclass
class QuizSetRecord:
    project: str
    status: QuizSetStatus
    quizzes: list[dict[str, Any]] = field(default_factory=list)
    rejected: list[dict[str, Any]] = field(default_factory=list)
    error_message: str | None = None
    meter: list[dict[str, Any]] | None = None
