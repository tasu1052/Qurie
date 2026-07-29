from __future__ import annotations

from app.quiz.dto.request import CreateQuizSetRequest
from app.quiz.dto.response import QuizResponse, QuizSetAccepted
from app.quiz.mappers import to_quiz_response
from app.quiz.models import QuizSetRecord
from app.quiz.repository import QuizRepository


class QuizService:
    def __init__(self, repo: QuizRepository) -> None:
        self._repo = repo

    def create(self, project: str, body: CreateQuizSetRequest) -> QuizSetAccepted:
        qid = self._repo.new_id()
        self._repo.save(qid, QuizSetRecord(project=project, status="PENDING"))
        return QuizSetAccepted(quiz_set_id=qid, project=project, status="PENDING")

    def get_status(self, quiz_set_id: int) -> QuizResponse:
        return to_quiz_response(quiz_set_id, self._repo.get(quiz_set_id))
