from __future__ import annotations

from typing import Any

_SETS: dict[int, dict[str, Any]] = {}
_NEXT_ID = 1


def new_id() -> int:
    global _NEXT_ID
    i = _NEXT_ID
    _NEXT_ID += 1
    return i


def put(quiz_set_id: int, data: dict) -> None:
    _SETS[quiz_set_id] = data


def get(quiz_set_id: int) -> dict | None:
    return _SETS.get(quiz_set_id)