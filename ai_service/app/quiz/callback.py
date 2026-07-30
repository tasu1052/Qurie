"""생성 완료를 요청자에게 되쏘는 콜백.

폴링을 대체하는 게 아니라 보완한다. 콜백이 유실돼도 결과는 이미 저장된 뒤이므로
GET /api/quiz/{id}/status로 그대로 받아갈 수 있다.
"""

from __future__ import annotations

import time
from typing import Any

import httpx

from app.core import config


def notify(url: str, payload: dict[str, Any]) -> bool:
    """결과를 콜백 URL로 POST한다. 성공 여부를 반환하고 예외는 밖으로 내보내지 않는다.

    통보 실패가 퀴즈 생성 자체를 실패로 만들면 안 된다. 크레딧을 써서 만든 결과가
    수신 측 장애 하나로 버려지는 상황을 막는다.
    """
    headers = {}
    if config.CALLBACK_TOKEN:
        headers["X-Callback-Token"] = config.CALLBACK_TOKEN

    for attempt in range(1, config.CALLBACK_RETRIES + 1):
        try:
            r = httpx.post(url, json=payload, headers=headers,
                           timeout=config.CALLBACK_TIMEOUT_SEC)
            if r.status_code < 400:
                return True
            reason = f"HTTP {r.status_code}"
        except Exception as e:  # 네트워크/타임아웃/DNS 등
            reason = f"{type(e).__name__}: {e}"

        print(f"[callback] {url} 실패 ({attempt}/{config.CALLBACK_RETRIES}) - {reason}")
        if attempt < config.CALLBACK_RETRIES:
            time.sleep(config.CALLBACK_BACKOFF_SEC * attempt)

    print(f"[callback] {url} 최종 실패. 결과는 GET /status로 조회 가능하다.")
    return False
