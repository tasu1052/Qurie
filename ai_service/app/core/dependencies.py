from functools import lru_cache

from app.quiz.job_runner import QuizJobRunner
from app.quiz.repository import QuizRepository
from app.quiz.service import QuizService
from app.report.service import ReportService


@lru_cache
def get_repository() -> QuizRepository:
    return QuizRepository()


@lru_cache
def get_job_runner() -> QuizJobRunner:
    return QuizJobRunner(get_repository())


@lru_cache
def get_quiz_service() -> QuizService:
    return QuizService(get_repository())


@lru_cache
def get_report_service() -> ReportService:
    return ReportService()
