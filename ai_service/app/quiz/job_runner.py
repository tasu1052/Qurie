from __future__ import annotations

import traceback

from app.engine.factory import build_pipeline_state
from app.engine.run import run as run_engine
from app.quiz.callback import notify
from app.quiz.dto.request import CreateQuizSetRequest
from app.quiz.mappers import to_quiz_response
from app.quiz.models import QuizSetRecord
from app.quiz.repository import QuizRepository


class QuizJobRunner:
    def __init__(self, repo: QuizRepository) -> None:
        self._repo = repo

    def run(self, quiz_set_id: int, project: str, body: CreateQuizSetRequest) -> None:
        files = body.files  # 비어 있으면 요청 검증에서 이미 422로 걸러진다
        self._repo.patch(quiz_set_id, status="GENERATING")
        state = build_pipeline_state(quiz_set_id, project, body, files)
        try:
            final = run_engine(state)
            all_quizzes = final.get("quizzes", [])
            approved = [q for q in all_quizzes if q.get("status") == "APPROVED"]
            rejected = [q for q in all_quizzes if q.get("status") != "APPROVED"]
            record = QuizSetRecord(
                project=project,
                status="READY" if approved else "FAILED",
                quizzes=approved,
                rejected=rejected,
                error_message=None if approved else "NO_APPROVED_ITEMS",
                meter=final["meter"].rows,
            )
        except Exception as e:
            traceback.print_exc()
            # 실패해도 그때까지의 호출 기록은 남긴다. 어느 단계에서 터졌는지 봐야 한다.
            record = QuizSetRecord(
                project=project,
                status="FAILED",
                quizzes=[],
                error_message=str(e)[:500],
                meter=state["meter"].rows,
            )

        # 저장을 먼저 한다. 콜백이 실패해도 GET /status로는 받아갈 수 있어야 한다.
        self._repo.save(quiz_set_id, record)
        if body.callback_url:
            payload = to_quiz_response(quiz_set_id, record).model_dump(mode="json")
            notify(body.callback_url, payload)
