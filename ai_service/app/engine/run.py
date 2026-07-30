from __future__ import annotations

from app.core import config
from app.engine.graph import build_graph

_PIPELINE = build_graph()

# 한 라운드는 generate → solve → judge → refine 4스텝. 마지막 라운드는 refine 대신
# collect로 빠진다. LangGraph 기본 recursion_limit(25)은 MAX_RETRY를 올리면
# 부족분을 다 채우기 전에 GraphRecursionError로 끊기므로 여기서 함께 계산한다.
_RECURSION_LIMIT = 4 * (config.MAX_RETRY + 1) + 5


def run(initial: dict) -> dict:
    """퀴즈 생성 엔진 진입점."""
    return _PIPELINE.invoke(initial, config={"recursion_limit": _RECURSION_LIMIT})
