from __future__ import annotations

PRACTICE_WEIGHTS = {"conceptual": 7, "micro": 3}
ASSESSMENT_WEIGHTS = {"conceptual": 3, "micro": 7}


def purpose_counts(mode: str, requested_count: int) -> dict[str, int]:
    """mode별 CONCEPTUAL/MICRO 목표 개수 (합 = requested_count)."""
    weights = PRACTICE_WEIGHTS if mode == "PRACTICE" else ASSESSMENT_WEIGHTS
    total_w = weights["conceptual"] + weights["micro"]
    conceptual = int(requested_count * weights["conceptual"] / total_w)
    return {"conceptual": conceptual, "micro": requested_count - conceptual}


def mode_display(mode: str) -> str:
    if mode == "PRACTICE":
        return "연습(PRACTICE) — 개념 이해(CONCEPTUAL) 중심"
    return "평가(ASSESSMENT) — 코드 근거(MICRO) 중심"
