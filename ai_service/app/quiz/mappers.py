from __future__ import annotations

from app.quiz.dto.response import Quiz, QuizResponse
from app.quiz.models import QuizSetRecord


def quiz_from_dict(q: dict) -> Quiz:
    return Quiz(
        purpose=q.get("purpose", "MICRO"),
        difficulty=q.get("difficulty", "EASY"),
        tested_concept=q.get("tested_concept", "")[:60],
        question=q["question"],
        choices=q["choices"],
        answer_index=q["answer_index"],
        explanation=q.get("explanation"),
        file_path=q.get("file_path"),
        line_start=q.get("line_start"),
        line_end=q.get("line_end"),
    )


def to_quiz_response(quiz_set_id: int, record: QuizSetRecord | None) -> QuizResponse:
    if record is None:
        return QuizResponse(
            project="",
            quiz_set_id=quiz_set_id,
            status="FAILED",
            error_message="NOT_FOUND",
            quizzes=[],
        )
    return QuizResponse(
        project=record.project,
        quiz_set_id=quiz_set_id,
        status=record.status,
        quizzes=[quiz_from_dict(q) for q in record.quizzes],
        error_message=record.error_message,
    )
