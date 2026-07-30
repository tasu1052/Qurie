from __future__ import annotations

import traceback

from app.core import config
from app.engine.factory import build_pipeline_state
from app.engine.run import run as run_engine
from app.quiz.dto.request import CreateQuizSetRequest
from app.quiz.models import QuizSetRecord
from app.quiz.repository import QuizRepository


class QuizJobRunner:
    def __init__(self, repo: QuizRepository) -> None:
        self._repo = repo

    def run(self, quiz_set_id: int, project: str, body: CreateQuizSetRequest) -> None:
        files = body.files  # 비어 있으면 요청 검증에서 이미 422로 걸러진다
        self._repo.patch(quiz_set_id, status="GENERATING")
        try:
            final = run_engine(build_pipeline_state(quiz_set_id, project, body, files))
            approved = [q for q in final.get("quizzes", []) if q.get("status") == "APPROVED"]
            status = "READY" if approved else "FAILED"
            self._repo.save(
                quiz_set_id,
                QuizSetRecord(
                    project=project,
                    status=status,
                    quizzes=approved,
                    error_message=None if approved else "NO_APPROVED_ITEMS",
                    meter=final["meter"].rows,
                ),
            )
        except Exception as e:
            traceback.print_exc()
            self._repo.save(
                quiz_set_id,
                QuizSetRecord(
                    project=project,
                    status="FAILED",
                    quizzes=[],
                    error_message=str(e)[:500],
                ),
            )
