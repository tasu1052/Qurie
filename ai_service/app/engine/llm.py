"""GMS LLM 호출 래퍼."""

from __future__ import annotations

import itertools
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
        temperature=config.TEMPERATURE,
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
        temperature=config.TEMPERATURE,
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
            temperature=config.TEMPERATURE,
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
            temperature=config.TEMPERATURE,
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


# OpenAI strict json_schema 가 받지 않는 키워드. 남겨두면 400 이 난다.
_STRICT_UNSUPPORTED = {
    "minLength", "maxLength", "minItems", "maxItems",
    "minimum", "maximum", "pattern", "format", "default",
}


def to_openai_strict(schema: dict) -> dict:
    """JSON Schema 를 OpenAI strict 모드가 받는 부분집합으로 바꾼다.

    strict 는 (1) 객체마다 additionalProperties=false, (2) 모든 속성이 required,
    (3) 길이·범위 키워드 불가 를 요구한다. 우리 스키마는 이미 전부 required 라
    ⑵는 그대로고, 나머지만 맞춰 준다.
    """
    if not isinstance(schema, dict):
        return schema

    out = {k: v for k, v in schema.items() if k not in _STRICT_UNSUPPORTED}
    if "properties" in out:
        out["properties"] = {k: to_openai_strict(v) for k, v in out["properties"].items()}
        out["required"] = list(out["properties"])
        out["additionalProperties"] = False
    if "items" in out:
        out["items"] = to_openai_strict(out["items"])
    # enum 만 있고 type 이 없으면 strict 가 거부한다. 값에서 타입을 유추해 채운다.
    if "enum" in out and "type" not in out:
        kinds = sorted({
            "null" if v is None else "integer" if isinstance(v, int) else "string"
            for v in out["enum"]
        })
        out["type"] = kinds if len(kinds) > 1 else kinds[0]
    return out


def call_openai_schema(model: str, prompt: str, limit: int,
                       tool: dict) -> tuple[dict, int, int, bool]:
    """response_format=json_schema 로 형식을 강제하고 dict 로 받는다."""
    kw = {
        "model": model,
        "messages": [{"role": "user", "content": prompt}],
        token_param_of(model): limit,
        "response_format": {
            "type": "json_schema",
            "json_schema": {
                "name": tool["name"],
                "strict": True,
                "schema": to_openai_strict(tool["input_schema"]),
            },
        },
    }
    if not model.startswith(_REASONING_PREFIXES):
        kw["temperature"] = config.TEMPERATURE

    try:
        r = get_openai().chat.completions.create(**kw)
    except Exception as e:
        # json_schema 미지원 모델이면 텍스트로 받아 parse_json 이 방어한다.
        # 모델명만 바꿔도 돌아가야 하므로 여기서 죽지 않는다.
        if "json_schema" not in str(e) and "response_format" not in str(e):
            raise
        text, tin, tout, truncated = call_openai(model, prompt, limit)
        return ({} if truncated else parse_json(text)), tin, tout, truncated

    u = getattr(r, "usage", None)
    truncated = r.choices[0].finish_reason == "length"
    text = r.choices[0].message.content or ""
    return (
        {} if truncated else json.loads(text or "{}"),
        getattr(u, "prompt_tokens", 0),
        getattr(u, "completion_tokens", 0),
        truncated,
    )


def call_openai(model: str, prompt: str, limit: int) -> tuple[str, int, int, bool]:
    kw = {
        "model": model,
        "messages": [{"role": "user", "content": prompt}],
        token_param_of(model): limit,
    }
    # reasoning 모델은 temperature 조정을 거부하고 기본값만 허용한다(max_tokens와 같은 사정).
    if not model.startswith(_REASONING_PREFIXES):
        kw["temperature"] = config.TEMPERATURE
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


_mock_seq = itertools.count()

# 서로 충분히 다른 문장이어야 한다. "[mock] Q0"/"[mock] Q1" 같은 이름은 정규화 후
# 유사도가 0.83 이라 dedupe가 전부 중복으로 잘라냈고, MOCK에서는 승인 문항이
# 사실상 1개를 넘지 못했다 — 개수를 세는 검증이 조용히 무력해진다.
_MOCK_STEMS = [
    "반복문 종료 조건", "재귀 호출 깊이", "리스트 인덱싱", "정수 나눗셈",
    "예외 처리 흐름", "변수 스코프", "함수 반환값", "조건식 단축 평가",
    "슬라이싱 경계", "딕셔너리 기본값", "문자열 불변성", "제너레이터 지연 평가",
    "얕은 복사", "튜플 언패킹", "집합 연산", "정렬 안정성",
    "가변 기본 인자", "클로저 캡처", "컨텍스트 매니저", "이터레이터 소진",
]


def _mock_quiz_item(i: int, purpose: str, primary_file: str = "solution.py") -> dict:
    # 번호를 호출 간에 이어 붙인다. 라운드마다 0부터 다시 세면 재생성분이 1라운드와
    # 같은 문장이 되어 dedupe에 걸린다.
    n = next(_mock_seq)
    item = {
        "purpose": purpose,
        "difficulty": "EASY",
        "tested_concept": f"mock-{_MOCK_STEMS[n % len(_MOCK_STEMS)]}",
        "question": f"[mock] {_MOCK_STEMS[n % len(_MOCK_STEMS)]} {n}",
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
        # 프롬프트가 file_path="x" / "file_path": "x" 두 형태를 모두 쓴다.
        path_m = re.search(r'"?file_path"?\s*[:=]\s*"([^"]+)"', prompt)
        primary = path_m.group(1) if path_m else "solution.py"
        quizzes = []
        for i in range(conceptual_n):
            quizzes.append(_mock_quiz_item(i, "CONCEPTUAL", primary))
        for i in range(micro_n):
            quizzes.append(_mock_quiz_item(conceptual_n + i, "MICRO", primary))
        while len(quizzes) < n:
            quizzes.append(_mock_quiz_item(len(quizzes), "MICRO", primary))
        return json.dumps({"quizzes": quizzes[:n]}, ensure_ascii=False)
    if purpose.upper() == "REPORT":
        return json.dumps({
            "comment": "[mock] 전반적으로 안정적인 결과입니다. 보완할 부분도 함께 정리했습니다.",
            "strengths": [
                {"quiz_index": None,
                 "text": "[mock] 반복문 흐름 추적 문항을 모두 맞혔습니다."},
            ],
            "improvements": [
                {"quiz_index": 0,
                 "text": "[mock] 재귀 종료 조건을 묻는 문항을 다시 확인해 보세요."},
            ],
            "focus_concepts": ["mock"],
        }, ensure_ascii=False)
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

    if not config.GMS_API_KEY:
        raise RuntimeError("GMS_API_KEY 없음 (또는 AI_MOCK=1)")

    # provider 별로 형식 강제 수단이 다르다. 모델명만 바꿔도 스키마가 걸리도록
    # 세 경로를 모두 둔다 — anthropic tool use / gemini response_json_schema /
    # openai response_format=json_schema.
    provider = provider_of(model)
    limit = max_tokens or config.MAX_TOKENS
    t0 = time.time()
    try:
        if provider == "anthropic":
            data, tin, tout, truncated = call_anthropic_tool(model, prompt, limit, tool)
        elif provider == "gemini":
            data, tin, tout, truncated = call_gemini_schema(
                model, prompt, limit, tool["input_schema"])
        else:
            data, tin, tout, truncated = call_openai_schema(model, prompt, limit, tool)
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
