"""A/B 실험 결과를 그림으로 만든다.

수치는 전부 results/*.csv 에서 읽는다 — 손으로 적은 숫자를 그리면
그림과 데이터가 어긋난다.

사용:
    python -m eval.plot
    → results/model_compare.png
"""

from __future__ import annotations

import csv
import statistics
from collections import defaultdict
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt  # noqa: E402
from matplotlib import font_manager  # noqa: E402

RESULTS = Path(__file__).resolve().parent / "results"

# dataviz 레퍼런스 팔레트 슬롯 1·2 (light). 값을 바꾸면 검증기를 다시 돌릴 것.
SERIES = ["#2a78d6", "#eb6834"]
SURFACE = "#fcfcfb"
INK = "#0b0b0b"
INK_MUTED = "#52514e"
HAIRLINE = "#e3e2df"

SHORT = {"claude-haiku-4-5-20251001": "haiku-4.5", "claude-sonnet-4-6": "sonnet-4.6"}


def _use_korean_font() -> None:
    for name in ("Malgun Gothic", "AppleGothic", "NanumGothic"):
        if any(f.name == name for f in font_manager.fontManager.ttflist):
            plt.rcParams["font.family"] = name
            break
    plt.rcParams["axes.unicode_minus"] = False


def _read(path: Path) -> list[dict]:
    with path.open(encoding="utf-8-sig", newline="") as f:
        return list(csv.DictReader(f))


def collect() -> tuple[list[str], dict[str, dict[str, float]]]:
    runs = _read(RESULTS / "runs.csv")
    items = _read(RESULTS / "items.csv")
    calls = _read(RESULTS / "calls.csv")

    models = list(dict.fromkeys(r["gen_model"] for r in runs))
    by: dict[str, dict[str, float]] = {}

    for m in models:
        mine = [r for r in runs if r["gen_model"] == m]
        scores = [int(i["judge_score"]) for i in items
                  if i["gen_model"] == m and i["status"] == "APPROVED" and i["judge_score"]]
        gen_out = sum(int(c["output_tokens"]) for c in calls
                      if c["gen_model"] == m and c["stage"] == "GENERATE")
        by[m] = {
            "approved": statistics.mean(float(r["approved"]) for r in mine),
            "quality": statistics.mean(scores) if scores else 0.0,
            "gen_tokens": gen_out / len(mine),
            "latency_s": statistics.mean(float(r["latency_ms"]) for r in mine) / 1000,
        }
    return models, by


PANELS = [
    ("요청 충족 문항", "approved", "5문항 요청 · 실행당 평균", "{:.1f}"),
    ("품질 점수", "quality", "Judge 0~10점 · 승인 문항 평균", "{:.2f}"),
    ("생성 단계 출력 토큰", "gen_tokens", "실행당 평균", "{:,.0f}"),
    ("응답 시간", "latency_s", "실행당 평균 · 초", "{:.1f}초"),
]


def draw(models: list[str], data: dict[str, dict[str, float]], out: Path) -> None:
    fig, axes = plt.subplots(2, 2, figsize=(9.5, 4.4))
    fig.patch.set_facecolor(SURFACE)

    for ax, (title, key, note, fmt) in zip(axes.ravel(), PANELS):
        values = [data[m][key] for m in models]
        ypos = list(range(len(models)))[::-1]

        # 두꺼운 채움 블록은 피한다 — 얇은 막대 + 넉넉한 여백.
        ax.barh(ypos, values, height=0.30, color=SERIES[: len(models)], zorder=3)

        for y, v in zip(ypos, values):
            ax.text(v + max(values) * 0.035, y, fmt.format(v),
                    va="center", ha="left", fontsize=10.5, color=INK)

        ax.set_yticks(ypos)
        ax.set_yticklabels([SHORT.get(m, m) for m in models], fontsize=9.5, color=INK_MUTED)
        ax.set_ylim(-0.62, len(models) - 0.38)
        ax.set_xlim(0, max(values) * 1.34)
        ax.set_xticks([])
        ax.set_title(title, fontsize=12, color=INK, loc="left", pad=16, weight="bold")
        ax.text(0, 1.03, note, transform=ax.transAxes, fontsize=8.5,
                color=INK_MUTED, va="bottom")

        ax.set_facecolor(SURFACE)
        for side in ("top", "right", "bottom"):
            ax.spines[side].set_visible(False)
        ax.spines["left"].set_color(HAIRLINE)
        ax.spines["left"].set_linewidth(0.8)
        ax.tick_params(length=0)

    fig.suptitle("생성 모델 비교 — 같은 결과, 더 큰 비용",
                 fontsize=14, color=INK, x=0.055, ha="left", y=0.975, weight="bold")
    fig.text(0.055, 0.905,
             "코드 샘플 3종(fib_memo · binary_search · nqueen) × 5문항 요청 · "
             "ASSESSMENT 모드 · temperature 0.3 · 짝지어 비교",
             fontsize=9.5, color=INK_MUTED, ha="left")

    handles = [plt.Rectangle((0, 0), 1, 1, color=SERIES[i]) for i in range(len(models))]
    fig.legend(handles, [SHORT.get(m, m) for m in models],
               loc="upper right", bbox_to_anchor=(0.975, 0.99),
               frameon=False, fontsize=9, ncol=len(models), labelcolor=INK_MUTED,
               handlelength=1.1, handleheight=0.7, columnspacing=1.4)

    fig.tight_layout(rect=(0.03, 0.02, 0.97, 0.855))
    fig.subplots_adjust(hspace=0.75, wspace=0.26)
    fig.savefig(out, dpi=200, facecolor=SURFACE)
    print(f"저장: {out}")


def main() -> None:
    _use_korean_font()
    models, data = collect()
    for m in models:
        d = data[m]
        print(f"{SHORT.get(m, m):<12} 충족 {d['approved']:.1f}  품질 {d['quality']:.2f}  "
              f"토큰 {d['gen_tokens']:,.0f}  시간 {d['latency_s']:.1f}s")
    draw(models, data, RESULTS / "model_compare.png")


if __name__ == "__main__":
    main()
