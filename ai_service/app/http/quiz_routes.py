from fastapi import APIRouter, BackgroundTasks, Depends, Query

from app.core.dependencies import get_job_runner, get_quiz_service
from app.quiz.dto.request import CreateQuizSetRequest
from app.quiz.dto.response import QuizResponse, QuizSetAccepted
from app.quiz.job_runner import QuizJobRunner
from app.quiz.service import QuizService

router = APIRouter(prefix="/api", tags=["quiz"])


@router.post("/quiz", response_model=QuizSetAccepted)
def create_quiz(
    background_tasks: BackgroundTasks,
    project: str = Query(...),
    body: CreateQuizSetRequest = ...,
    svc: QuizService = Depends(get_quiz_service),
    runner: QuizJobRunner = Depends(get_job_runner),
) -> QuizSetAccepted:
    accepted = svc.create(project, body)
    background_tasks.add_task(runner.run, accepted.quiz_set_id, project, body)
    return accepted


@router.get("/quiz/{quiz_set_id}/status", response_model=QuizResponse)
def get_status(
    quiz_set_id: int,
    svc: QuizService = Depends(get_quiz_service),
) -> QuizResponse:
    return svc.get_status(quiz_set_id)
