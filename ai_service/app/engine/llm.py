"""GMS LLM 호출 래퍼."""

from __future__ import annotations

import json
import re
import time
from dataclasses import dataclass, field

from openai import OpenAI

from app.core import config

# ---------------------------------------------------------------------------
# Usage (나중에 quiz_llm_log 행으로 매핑)
# ---------------------------------------------------------------------------

@dataclass
class UsageMeter:
    rows: list[dict] = field(default_factory=list)

    def add(self, purpose: str, model: str, in_tok: int, out_tok: int, ms: int, ok: bool = True) -> None:
        self.rows.append({
            "stage": purpose,
            "model": model,
            "input_tokens": in_tok,
            "output_tokens": out_tok,
            "latency_ms": ms,
            "succeeded": ok,
        })


def provider_of(model: str) -> str:
    if model.startswith("claude"):
        return "anthropic"
    if model.startswith("gemini"):
        return "gemini"
    return "openai"


_openai = None
_anthropic = None
_gemini = None


def get_openai() -> OpenAI:
    global _openai
    if _openai is None:
        _openai = OpenAI(base_url=config.OPENAI_BASE, api_key=config.GMS_API_KEY or "x")
    return _openai


def get_anthropic():
    global _anthropic
    if _anthropic is None:
        from anthropic import Anthropic
        _anthropic = Anthropic(base_url=config.ANTHROPIC_BASE, api_key=config.GMS_API_KEY or "x")
    return _anthropic


def get_gemini():
    global _gemini
    if _gemini is None:
        from google import genai
        _gemini = genai.Client(
            api_key=config.GMS_API_KEY or "x",
            http_options={"base_url": config.GEMINI_BASE},
        )
    return _gemini


class LLMTruncatedError(RuntimeError):
    """응답이 출력 상한에 걸려 잘림 → JSON 파싱 불가."""


class LLMParseError(RuntimeError):
    """LLM 응답을 JSON으로 읽지 못함."""


# 각 provider 호출은 (본문, 입력토큰, 출력토큰, 잘림여부)를 돌려준다.

def call_anthropic(model: str, prompt: str, limit: int) -> tuple[str, int, int, bool]:
    r = get_anthropic().messages.create(
        model=model,
        max_tokens=limit,
        messages=[{"role": "user", "content": prompt}],
    )
    return (
        r.content[0].text,
        r.usage.input_tokens,
        r.usage.output_tokens,
        r.stop_reason == "max_tokens",
    )


def call_anthropic_tool(model: str, prompt: str, limit: int,
                        tool: dict) -> tuple[dict, int, int, bool]:
    """tool use로 스키마를 강제하고 이미 파싱된 dict를 받는다."""
    r = get_anthropic().messages.create(
        model=model,
        max_tokens=limit,
        messages=[{"role": "user", "content": prompt}],
        tools=[tool],
        tool_choice={"type": "tool", "name": tool["name"]},
    )
    truncated = r.stop_reason == "max_tokens"
    block = next((b for b in r.content if getattr(b, "type", "") == "tool_use"), None)
    data = dict(block.input) if block is not None and not truncated else {}
    return data, r.usage.input_tokens, r.usage.output_tokens, truncated


def call_gemini_schema(model: str, prompt: str, limit: int,
                       schema: dict) -> tuple[dict, int, int, bool]:
    """response_json_schema로 형식을 강제하고 dict로 받는다."""
    from google.genai import types

    resp = get_gemini().models.generate_content(
        model=model,
        contents=prompt,
        config=types.GenerateContentConfig(
            max_output_tokens=limit,
            response_mime_type="application/json",
            response_json_schema=schema,
        ),
    )
    u = resp.usage_metadata
    tin = int(getattr(u, "prompt_token_count", 0) or 0) if u else 0
    tout = int(getattr(u, "candidates_token_count", 0) or 0) if u else 0
    cands = getattr(resp, "candidates", None) or []
    finish = str(getattr(cands[0], "finish_reason", "")) if cands else ""
    truncated = finish.upper().endswith("MAX_TOKENS")
    data = {} if truncated else json.loads(resp.text or "{}")
    return data, tin, tout, truncated


def call_gemini(model: str, prompt: str, limit: int) -> tuple[str, int, int, bool]:
    from google.genai import types

    resp = get_gemini().models.generate_content(
        model=model,
        contents=prompt,
        config=types.GenerateContentConfig(
            max_output_tokens=limit,
            response_mime_type="application/json",
        ),
    )
    text = resp.text or ""
    u = resp.usage_metadata
    tin = int(getattr(u, "prompt_token_count", 0) or 0) if u else 0
    tout = int(getattr(u, "candidates_token_count", 0) or 0) if u else 0
    cands = getattr(resp, "candidates", None) or []
    finish = str(getattr(cands[0], "finish_reason", "")) if cands else ""
    return text, tin, tout, finish.upper().endswith("MAX_TOKENS")


_REASONING_PREFIXES = ("gpt-5", "o1", "o3", "o4")


def token_param_of(model: str) -> str:
    """reasoning 모델은 max_tokens를 거부하고 max_completion_tokens를 요구한다.

    max_tokens는 '보이는 출력'의 상한이라 추론 토큰이 끼면 의미가 깨지므로,
    OpenAI가 '추론+출력 합계'를 뜻하는 새 이름으로 갈아끼우고 옛 이름은 400으로 막았다.
    """
    return "max_completion_tokens" if model.startswith(_REASONING_PREFIXES) else "max_tokens"


def call_openai(model: str, prompt: str, limit: int) -> tuple[str, int, int, bool]:
    kw = {
        "model": model,
        "messages": [{"role": "user", "content": prompt}],
        token_param_of(model): limit,
    }
    try:
        r = get_openai().chat.completions.create(
            **kw, response_format={"type": "json_object"})
    except Exception as e:
        # response_format 미지원 모델만 구제한다. 출력 상한은 안전핀이므로 유지.
        if "response_format" not in str(e):
            raise
        r = get_openai().chat.completions.create(**kw)
    u = getattr(r, "usage", None)
    return (
        r.choices[0].message.content or "",
        getattr(u, "prompt_tokens", 0),
        getattr(u, "completion_tokens", 0),
        r.choices[0].finish_reason == "length",
    )


def _parse_generate_meta(prompt: str) -> tuple[int, int, int]:
    count_m = re.search(r"문항 수:\s*(\d+)", prompt)
    n = int(count_m.group(1)) if count_m else 3
    mix_m = re.search(r"CONCEPTUAL=(\d+),\s*MICRO=(\d+)", prompt)
    if mix_m:
        return n, int(mix_m.group(1)), int(mix_m.group(2))
    return n, 0, n


def _mock_quiz_item(i: int, purpose: str, primary_file: str = "solution.py") -> dict:
    item = {
        "purpose": purpose,
        "difficulty": "EASY",
        "tested_concept": "mock",
        "question": f"[mock] Q{i}",
        "choices": ["a", "b", "c", "d"],
        "answer_index": i % 4,
        "explanation": "mock explanation",
    }
    if purpose == "MICRO":
        item.update({
            "file_path": primary_file,
            "line_start": 1,
            "line_end": 3,
        })
    return item


def _mock_response(purpose: str, prompt: str = "") -> str:
    if purpose.upper() in ("GENERATE", "generate"):
        n, conceptual_n, micro_n = _parse_generate_meta(prompt)
        path_m = re.search(r'file_path="([^"]+)"', prompt)
        primary = path_m.group(1) if path_m else "solution.py"
        quizzes = []
        for i in range(conceptual_n):
            quizzes.append(_mock_quiz_item(i, "CONCEPTUAL", primary))
        for i in range(micro_n):
            quizzes.append(_mock_quiz_item(conceptual_n + i, "MICRO", primary))
        while len(quizzes) < n:
            quizzes.append(_mock_quiz_item(len(quizzes), "MICRO", primary))
        return json.dumps({"quizzes": quizzes[:n]}, ensure_ascii=False)
    if purpose.upper() in ("SOLVE", "solve"):
        n = _parse_generate_meta(prompt)[0] if prompt else 3
        item_m = re.findall(r"\[\d+\]", prompt)
        n = max(n, len(item_m)) if item_m else n
        return json.dumps({"answers": [{"i": i, "choice": i % 4} for i in range(n)]})
    n = _parse_generate_meta(prompt)[0] if prompt else 3
    return json.dumps({"scores": [{"index": i, "quality_score": 8, "critique": ""} for i in range(n)]})


def call_llm(model: str, prompt: str, meter: UsageMeter, purpose: str,
             max_tokens: int | None = None) -> str:
    if config.MOCK:
        meter.add(purpose, "MOCK", 0, 0, 0, True)
        return _mock_response(purpose, prompt)

    if not config.GMS_API_KEY:
        raise RuntimeError("GMS_API_KEY 없음 (또는 AI_MOCK=1)")

    limit = max_tokens or config.MAX_TOKENS
    call = {
        "anthropic": call_anthropic,
        "gemini": call_gemini,
    }.get(provider_of(model), call_openai)

    t0 = time.time()
    try:
        text, tin, tout, truncated = call(model, prompt, limit)
    except Exception:
        meter.add(purpose, model, 0, 0, int((time.time() - t0) * 1000), False)
        raise

    meter.add(purpose, model, tin, tout, int((time.time() - t0) * 1000), not truncated)
    if truncated:
        raise LLMTruncatedError(
            f"{purpose}: {model} 응답이 출력 상한({limit} 토큰)에 걸려 잘렸습니다. "
            f"출력 {tout} 토큰. 문항 수를 줄이거나 config.TOKEN_BUDGET을 올리세요."
        )
    return text


def call_llm_json(model: str, prompt: str, meter: UsageMeter, purpose: str,
                  tool: dict, max_tokens: int | None = None) -> dict:
    """스키마를 강제해 dict로 받는다.

    tool use를 지원하는 anthropic 경로만 스키마를 쓰고, 나머지 provider는
    기존 텍스트 + parse_json 경로로 떨어진다.
    """
    if config.MOCK:
        meter.add(purpose, "MOCK", 0, 0, 0, True)
        return json.loads(_mock_response(purpose, prompt))

    provider = provider_of(model)
    if provider not in ("anthropic", "gemini"):
        return parse_json(call_llm(model, prompt, meter, purpose, max_tokens))

    if not config.GMS_API_KEY:
        raise RuntimeError("GMS_API_KEY 없음 (또는 AI_MOCK=1)")

    limit = max_tokens or config.MAX_TOKENS
    t0 = time.time()
    try:
        if provider == "anthropic":
            data, tin, tout, truncated = call_anthropic_tool(model, prompt, limit, tool)
        else:
            data, tin, tout, truncated = call_gemini_schema(
                model, prompt, limit, tool["input_schema"])
    except Exception:
        meter.add(purpose, model, 0, 0, int((time.time() - t0) * 1000), False)
        raise

    meter.add(purpose, model, tin, tout, int((time.time() - t0) * 1000), not truncated)
    if truncated:
        raise LLMTruncatedError(
            f"{purpose}: {model} 응답이 출력 상한({limit} 토큰)에 걸려 잘렸습니다. "
            f"출력 {tout} 토큰. 문항 수를 줄이거나 config.TOKEN_BUDGET을 올리세요."
        )
    if not data:
        raise LLMParseError(f"{purpose}: {model}이 스키마에 맞는 응답을 반환하지 않았습니다.")
    return data


def parse_json(raw: str) -> dict:
    s = (raw or "").strip()
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
    except json.JSONDecodeError as e:
        # rfind("}")가 잘린 응답의 마지막 완성 객체까지만 잘라내서
        # 원인이 문법 오류처럼 보이는 경우가 많다. 원문 정보를 남긴다.
        raise LLMParseError(
            f"LLM JSON 파싱 실패: {e} "
            f"(원문 {len(raw or '')}자 / 추출 {len(frag)}자 / 꼬리={frag[-120:]!r})"
        ) from e
