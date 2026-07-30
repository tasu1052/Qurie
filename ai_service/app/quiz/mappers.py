from __future__ import annotations

from app.quiz.dto.response import LlmCall, Quiz, QuizResponse, RejectedQuiz
from app.quiz.models import QuizSetRecord


def rejected_from_dict(q: dict) -> RejectedQuiz:
    score = q.get("judge_score")
    return RejectedQuiz(
        **quiz_from_dict(q).model_dump(),
        judge_score=score if isinstance(score, int) else None,
        reject_reason=q.get("reject_reason"),
    )


def llm_call_from_dict(row: dict) -> LlmCall:
    return LlmCall(
        stage=row["stage"],
        model=row["model"],
        input_tokens=row.get("input_tokens") or 0,
        output_tokens=row.get("output_tokens") or 0,
        latency_ms=row.get("latency_ms") or 0,
        succeeded=bool(row.get("succeeded", True)),
    )


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
        rejected=[rejected_from_dict(q) for q in record.rejected],
        meter=[llm_call_from_dict(r) for r in (record.meter or [])],
        error_message=record.error_message,
    )
