"""난이도·purpose 할당량 계산."""

from __future__ import annotations


def scale_counts(target: dict[str, int], have: dict[str, int], total: int) -> dict[str, int]:
    """목표 대비 부족분을 total 개수에 맞춰 배분한다.

    이미 채운 카테고리는 빼고, 남은 부족분의 비율을 유지하며 정확히 total개가
    되도록 맞춘다(합이 어긋나면 소수부가 큰 쪽부터 +1).

    have 를 비워 두면 target 비율을 그대로 total 개수로 환산한다 —
    여유분을 더해 생성할 때 프롬프트의 난이도 합을 요청 개수와 맞추는 데 쓴다.
    """
    need = {k: max(0, v - have.get(k, 0)) for k, v in target.items()}
    remaining = sum(need.values())
    if remaining == total:
        return need
    if remaining == 0:  # 모든 카테고리를 이미 채웠으면 원래 비율대로 뽑는다
        need = dict(target)
        remaining = sum(need.values())
    if remaining == 0:
        return {k: 0 for k in target}

    scaled = {k: v * total / remaining for k, v in need.items()}
    counts = {k: int(v) for k, v in scaled.items()}
    order = sorted(scaled, key=lambda k: scaled[k] - counts[k], reverse=True)
    for i in range(total - sum(counts.values())):
        counts[order[i % len(order)]] += 1
    return counts
