"""SOLVE LLM 응답 정규화 (stdlib only — 단위 테스트·파이프라인 공용)."""

from __future__ import annotations

import json
import re


def coerce_json(payload: object) -> object:
    if not isinstance(payload, str):
        return payload
    s = payload.strip()
    if "```" in s:
        for part in s.split("```"):
            p = part.strip()
            if p.startswith("json"):
                p = p[4:].strip()
            if p.startswith("{"):
                s = p
                break
    a, b = s.find("{"), s.rfind("}")
    frag = s[a : b + 1] if a >= 0 else s
    try:
        return json.loads(frag)
    except json.JSONDecodeError:
        m = re.search(r"\[[\s\S]*\]", s)
        if not m:
            return None
        try:
            return {"answers": json.loads(m.group(0))}
        except json.JSONDecodeError:
            return None


def parse_solver_answers(payload: object) -> dict[int, int]:
    """솔버 LLM 응답을 {문항인덱스: 선택지인덱스}로 정규화한다.

    gpt 계열 SOLVE는 스키마 강제 없이 자유 JSON을 받기 때문에
    ``{"answers":[0,1,2]}`` 처럼 int 배열로 오는 경우가 있다.
    그때 ``a["i"]``를 치면 ``'int' object is not subscriptable``로
    파이프라인 전체가 FAILED(생성 0)가 된다.
    """
    payload = coerce_json(payload)
    if payload is None:
        return {}

    if isinstance(payload, dict):
        answers = payload.get("answers", payload)
    else:
        answers = payload

    if not isinstance(answers, list):
        return {}

    by_local: dict[int, int] = {}
    for local_i, a in enumerate(answers):
        if isinstance(a, bool):
            continue
        if isinstance(a, (int, float)):
            by_local[local_i] = int(a)
            continue
        if not isinstance(a, dict):
            continue
        idx_raw = a.get("i", a.get("index", local_i))
        choice_raw = a.get("choice", a.get("answer", a.get("answer_index")))
        if choice_raw is None:
            continue
        try:
            by_local[int(idx_raw)] = int(choice_raw)
        except (TypeError, ValueError):
            continue
    return by_local
