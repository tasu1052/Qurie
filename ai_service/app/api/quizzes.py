from fastapi import APIRouter, BackgroundTasks, Query
from app.schemas.request import CreateQuizSetRequest, DifficultyRatio
from app.schemas.quiz import Quiz, QuizResponse, QuizSetAccepted
from app.api import store
from app.llm.client import UsageMeter
from app.pipeline.graph import run_pipeline
from app import config

router = APIRouter(prefix="/api", tags=["quiz"])


def _run_job(quiz_set_id: int, project: str, body: CreateQuizSetRequest, files: dict[str, str]):
    store.put(quiz_set_id, {**store.get(quiz_set_id), "status": "GENERATING"})
    try:
        primary = body.target_files[0] if body.target_files else next(iter(files))
        state = {
            "project": project,
            "quiz_set_id": quiz_set_id,
            "mode": body.mode.value,
            "requested_count": body.requested_count,
            "ratio_counts": body.ratio.to_counts(body.requested_count),
            "user_prompt": body.user_prompt,
            "version_hash": body.version_hash,
            "files": files,
            "primary_file": primary,
            "meter": UsageMeter(),
            "retry_count": 0,
        }
        final = run_pipeline(state)
        approved = [q for q in final.get("quizzes", []) if q.get("status") == "APPROVED"]
        status = "READY" if approved else "FAILED"
        store.put(quiz_set_id, {
            "project": project,
            "status": status,
            "quizzes": approved,  # 또는 전체+status 필드
            "error_message": None if approved else "NO_APPROVED_ITEMS",
            "meter": final["meter"].rows,
        })
    except Exception as e:
        store.put(quiz_set_id, {
            "project": project, "status": "FAILED",
            "quizzes": [], "error_message": str(e)[:500],
        })


@router.post("/quiz", response_model=QuizSetAccepted)
def create_quiz(
    background_tasks: BackgroundTasks,
    project: str = Query(...),
    body: CreateQuizSetRequest | None = None,
):
    # Day1 호환: body 없으면 가짜 즉시 READY 경로를 남겨도 됨
    if body is None:
        ...
    qid = store.new_id()
    store.put(qid, {"project": project, "status": "PENDING", "quizzes": []})
    # MVP: files는 body에 아직 없으면 테스트용 하드코드 / 또는 body 확장
    files = {"solution.py": "def fib(n):\n    return n\n"}  # TODO: body.files
    background_tasks.add_task(_run_job, qid, project, body, files)
    return QuizSetAccepted(quiz_set_id=qid, project=project, status="PENDING")


@router.get("/quiz/{quiz_set_id}/status", response_model=QuizResponse)
def get_status(quiz_set_id: int):
    data = store.get(quiz_set_id)
    if not data:
        return QuizResponse(project="", quiz_set_id=quiz_set_id, status="FAILED",
                            error_message="NOT_FOUND", quizzes=[])
    # Quiz 모델로 변환 (필드 매핑)
    quizzes = []
    for q in data.get("quizzes", []):
        quizzes.append(Quiz(
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
        ))
    return QuizResponse(
        project=data["project"],
        quiz_set_id=quiz_set_id,
        status=data["status"],
        quizzes=quizzes,
        error_message=data.get("error_message"),
    )