from __future__ import annotations


def validate_quiz_item(q: dict, files: dict[str, str]) -> str | None:
    choices = q.get("choices") or []
    if len(choices) != 4:
        return "SCHEMA_CHOICES_COUNT"
    if len(set(c.strip().lower() for c in choices)) < 4:
        return "DUP_CHOICE"
    try:
        ai = int(q["answer_index"])
    except (KeyError, TypeError, ValueError):
        return "BAD_ANSWER_INDEX"
    if not (0 <= ai <= 3):
        return "BAD_ANSWER_INDEX"

    purpose = q.get("purpose", "MICRO")
    if purpose not in ("CONCEPTUAL", "MICRO"):
        return "BAD_PURPOSE"
    concept = q.get("tested_concept") or ""
    if not concept or len(concept) > 60:
        return "SCHEMA"

    if purpose == "MICRO":
        path = q.get("file_path")
        if not path or path not in files:
            return "UNKNOWN_FILE"
        ls, le = q.get("line_start"), q.get("line_end")
        if ls is None or le is None:
            return "BAD_SPAN"
        try:
            ls, le = int(ls), int(le)
        except (TypeError, ValueError):
            return "BAD_SPAN"
        nlines = len(files[path].replace("\r\n", "\n").split("\n"))
        if not (1 <= ls <= le <= nlines):
            return "LINE_OOB"
    elif purpose == "CONCEPTUAL":
        if q.get("file_path") or q.get("line_start") or q.get("line_end"):
            return "CONCEPTUAL_WITH_SPAN"

    return None


def apply_validation(quizzes: list[dict], files: dict[str, str]) -> list[dict]:
    out = []
    for q in quizzes:
        code = validate_quiz_item(q, files)
        if code:
            out.append({**q, "status": "REJECTED", "reject_reason": code,
                        "judge_score": q.get("judge_score")})
        else:
            out.append(q)
    return out
