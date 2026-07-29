from __future__ import annotations

from typing import Any

from app.quiz.models import QuizSetRecord

_SETS: dict[int, QuizSetRecord] = {}
_NEXT_ID = 1


class QuizRepository:
    """인메모리 퀴즈 세트 저장 (MVP). 나중에 DB로 교체."""

    def new_id(self) -> int:
        global _NEXT_ID
        i = _NEXT_ID
        _NEXT_ID += 1
        return i

    def get(self, quiz_set_id: int) -> QuizSetRecord | None:
        return _SETS.get(quiz_set_id)

    def save(self, quiz_set_id: int, record: QuizSetRecord) -> None:
        _SETS[quiz_set_id] = record

    def patch(self, quiz_set_id: int, **fields: Any) -> None:
        current = _SETS.get(quiz_set_id)
        if current is None:
            current = QuizSetRecord(project="", status="PENDING")
        for key, value in fields.items():
            if key == "status":
                current.status = value  # type: ignore[assignment]
            elif key == "project":
                current.project = value
            elif key == "quizzes":
                current.quizzes = value
            elif key == "error_message":
                current.error_message = value
            elif key == "meter":
                current.meter = value
        _SETS[quiz_set_id] = current
