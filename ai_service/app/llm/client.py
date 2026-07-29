"""GMS LLM 호출 래퍼. 계약: usage 실측, mock, 프로바이더 분기."""

from __future__ import annotations

import json
import time
from dataclasses import dataclass, field

from openai import OpenAI

from app import config

# ---------------------------------------------------------------------------
# Usage (나중에 quiz_llm_log 행으로 매핑)
# ---------------------------------------------------------------------------

@dataclass
class UsageMeter:
    rows: list[dict] = field(default_factory=list)

    def add(self, purpose: str, model: str, in_tok: int, out_tok: int, ms: int, ok: bool = True) -> None:
        self.rows.append({
            "stage": purpose,  # GENERATE / SOLVE / JUDGE
            "model": model,
            "input_tokens": in_tok,
            "output_tokens": out_tok,
            "latency_ms": ms,
            "succeeded": ok,
        })


# ---------------------------------------------------------------------------
# Provider
# ---------------------------------------------------------------------------

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
    """SSAFY GMS + google.genai 공식 클라이언트."""
    global _gemini
    if _gemini is None:
        from google import genai
        _gemini = genai.Client(
            api_key=config.GMS_API_KEY or "x",
            http_options={"base_url": config.GEMINI_BASE},
        )
    return _gemini


def call_gemini(model: str, prompt: str) -> tuple[str, int, int]:
    """google.genai SDK로 generateContent. (text, in_tok, out_tok)"""
    from google.genai import types

    resp = get_gemini().models.generate_content(
        model=model,
        contents=prompt,
        config=types.GenerateContentConfig(
            max_output_tokens=config.MAX_TOKENS,
            response_mime_type="application/json",
        ),
    )
    text = resp.text or ""
    u = resp.usage_metadata
    tin = int(getattr(u, "prompt_token_count", 0) or 0) if u else 0
    tout = int(getattr(u, "candidates_token_count", 0) or 0) if u else 0
    return text, tin, tout


# ---------------------------------------------------------------------------
# Mock
# ---------------------------------------------------------------------------

def _mock_response(purpose: str) -> str:
    if purpose.upper() in ("GENERATE", "generate"):
        return json.dumps({
            "quizzes": [{
                "purpose": "MICRO",
                "difficulty": "EASY",
                "tested_concept": "mock",
                "question": f"[mock] Q{i}",
                "choices": ["a", "b", "c", "d"],
                "answer_index": i % 4,
                "explanation": "mock",
                "file_path": "solution.py",
                "line_start": 1,
                "line_end": 3,
            } for i in range(3)]
        }, ensure_ascii=False)
    if purpose.upper() in ("SOLVE", "solve"):
        return json.dumps({"answers": [{"i": i, "choice": i % 4} for i in range(3)]})
    return json.dumps({"scores": [{"index": i, "quality_score": 8, "critique": ""} for i in range(3)]})


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def call_llm(model: str, prompt: str, meter: UsageMeter, purpose: str) -> str:
    """JSON 문자열 반환. purpose는 GENERATE|SOLVE|JUDGE (로그용)."""
    if config.MOCK:
        meter.add(purpose, "MOCK", 0, 0, 0, True)
        return _mock_response(purpose)

    if not config.GMS_API_KEY:
        raise RuntimeError("GMS_API_KEY 없음 (또는 AI_MOCK=1)")

    t0 = time.time()
    try:
        if provider_of(model) == "anthropic":
            r = get_anthropic().messages.create(
                model=model,
                max_tokens=config.MAX_TOKENS,
                messages=[{"role": "user", "content": prompt}],
            )
            text = r.content[0].text
            meter.add(purpose, model, r.usage.input_tokens, r.usage.output_tokens,
                      int((time.time() - t0) * 1000), True)
            return text

        if provider_of(model) == "gemini":
            text, tin, tout = call_gemini(model, prompt)
            meter.add(purpose, model, tin, tout, int((time.time() - t0) * 1000), True)
            return text

        # OpenAI 호환
        kw = {
            "model": model,
            "messages": [{"role": "user", "content": prompt}],
            "max_tokens": config.MAX_TOKENS,
        }
        try:
            r = get_openai().chat.completions.create(
                **kw, response_format={"type": "json_object"})
        except Exception:
            kw.pop("max_tokens", None)
            r = get_openai().chat.completions.create(**kw)
        u = getattr(r, "usage", None)
        meter.add(
            purpose, model,
            getattr(u, "prompt_tokens", 0),
            getattr(u, "completion_tokens", 0),
            int((time.time() - t0) * 1000), True,
        )
        return r.choices[0].message.content or ""
    except Exception:
        meter.add(purpose, model, 0, 0, int((time.time() - t0) * 1000), False)
        raise


def parse_json(raw: str) -> dict:
    """코드펜스/잡텍스트 제거 후 JSON 객체 파싱."""
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
    return json.loads(s[a : b + 1] if a >= 0 else s)
