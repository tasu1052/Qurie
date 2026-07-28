from __future__ import annotations

from typing import Any, TypedDict

from app.llm.client import UsageMeter


class PipelineState(TypedDict, total=False):
    # --- 요청/코드 (SYSTEM·USER) ---
    project: str
    quiz_set_id: int
    mode: str                          # ASSESSMENT | PRACTICE
    requested_count: int
    ratio_counts: dict[str, int]       # {"easy":3,"normal":5,"hard":2} ← to_counts() 결과
    user_prompt: str | None
    version_hash: str
    # path -> 파일 전체 텍스트 (MVP: 요청에 실어 오거나 스냅샷에서 로드)
    files: dict[str, str]
    primary_file: str                  # 줄번호 붙일 주 파일

    # --- 생성물 ---
    quizzes: list[dict[str, Any]]      # Generator JSON items
    # 셔플: item_idx -> perm (셔플된 위치 i의 원래 인덱스)
    choice_perms: list[list[int]]
    solver_answers: list[int]          # 복원된 원인덱스
    critiques: list[str]
    retry_count: int

    meter: UsageMeter
    error: str | None