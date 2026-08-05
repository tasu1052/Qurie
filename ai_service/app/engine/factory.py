from __future__ import annotations

from app.core import config
from app.engine.llm import UsageMeter
from app.engine.quota import scale_counts
from app.engine.purpose import purpose_counts
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
    ratio_target = body.ratio.to_counts(body.requested_count)
    purpose_target = purpose_counts(body.mode.value, body.requested_count)
    # 1라운드부터 여유분을 더해 뽑는다. 검증에서 몇 개 떨어져도 재생성 라운드가
    # 안 붙을 확률이 올라가고, 라운드를 더 도는 것보다 싸다.
    gen_count = body.requested_count + config.QUIZ_OVERSHOOT

    return {
        "project": project,
        "quiz_set_id": quiz_set_id,
        "mode": body.mode.value,
        "requested_count": body.requested_count,
        "gen_count": gen_count,
        # 프롬프트의 난이도·purpose 합이 생성 개수와 어긋나면 모델이 혼란스러워한다.
        "ratio_counts": scale_counts(ratio_target, {}, gen_count),
        "purpose_counts": scale_counts(purpose_target, {}, gen_count),
        # 부족분 재생성 시 기준으로 삼을 원래 목표. 라운드마다 바뀌지 않는다.
        "ratio_target": ratio_target,
        "purpose_target": purpose_target,
        "user_prompt": body.user_prompt,
        "version_hash": body.version_hash,
        "files": files,
        "primary_file": pick_primary(body, files),
        "meter": UsageMeter(),
        "retry_count": 0,
    }
