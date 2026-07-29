from __future__ import annotations

from app.engine.llm import UsageMeter
from app.engine.state import PipelineState
from app.quiz.dto.request import CreateQuizSetRequest


def pick_primary(body: CreateQuizSetRequest, files: dict[str, str]) -> str:
    if not files:
        raise ValueError("files가 비어 있습니다. body.files에 path→코드를 넣으세요")
    for path in body.target_files or []:
        if path in files:
            return path
    return next(iter(files))


def build_pipeline_state(
    quiz_set_id: int,
    project: str,
    body: CreateQuizSetRequest,
    files: dict[str, str],
) -> PipelineState:
    return {
        "project": project,
        "quiz_set_id": quiz_set_id,
        "mode": body.mode.value,
        "requested_count": body.requested_count,
        "ratio_counts": body.ratio.to_counts(body.requested_count),
        "user_prompt": body.user_prompt,
        "version_hash": body.version_hash,
        "files": files,
        "primary_file": pick_primary(body, files),
        "meter": UsageMeter(),
        "retry_count": 0,
    }
