from __future__ import annotations

from app.engine.graph import build_graph

_PIPELINE = build_graph()


def run(initial: dict) -> dict:
    """퀴즈 생성 엔진 진입점."""
    return _PIPELINE.invoke(initial)
