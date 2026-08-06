"""run_eval.py 가 만든 CSV 를 읽어 모델 간 차이를 검정한다.

주 검정은 Wilcoxon 부호순위 검정이다. 짝지어 비교(같은 코드 샘플을 두 모델에
동일하게 먹임)이고, 통과 문항 수가 0~N 정수라 정규분포를 가정할 수 없기 때문이다.

McNemar 는 여기 쓰지 않는다 — 모델마다 서로 다른 문항을 만들어서 짝지을 대상이
없다. McNemar 가 맞는 상황은 "같은 문항을 judge A/B 가 각각 채점"처럼 동일 대상을
두 번 잴 때다.

사용:
    python -m eval.analyze
    python -m eval.analyze --metric fill_rate
"""

from __future__ import annotations

import argparse
import csv
import statistics
from collections import Counter, defaultdict
from pathlib import Path

RESULTS_DIR = Path(__file__).resolve().parent / "results"
RUNS_CSV = RESULTS_DIR / "runs.csv"
ITEMS_CSV = RESULTS_DIR / "items.csv"
CALLS_CSV = RESULTS_DIR / "calls.csv"


def read_csv(path: Path) -> list[dict]:
    if not path.exists():
        return []
    with path.open(encoding="utf-8-sig", newline="") as f:
        return list(csv.DictReader(f))


def describe(runs: list[dict], metric: str) -> None:
    print(f"\n{'=' * 68}\n모델별 요약\n{'=' * 68}")
    print(f"{'모델':<32}{'실행':>5}{'평균':>9}{'중앙':>7}{'라운드':>8}{'출력토큰':>10}")
    by_model = defaultdict(list)
    for r in runs:
        by_model[r["gen_model"]].append(r)

    for model, rs in by_model.items():
        vals = [float(r[metric]) for r in rs]
        rounds = [float(r["rounds"]) for r in rs]
        out_tok = [float(r["output_tokens"]) for r in rs]
        print(f"{model:<32}{len(rs):>5}{statistics.mean(vals):>9.2f}"
              f"{statistics.median(vals):>7.2f}{statistics.mean(rounds):>8.2f}"
              f"{statistics.mean(out_tok):>10.0f}")


def pair_runs(runs: list[dict], a: str, b: str, metric: str) -> list[tuple[str, float, float]]:
    """(샘플, 반복)을 키로 두 모델의 결과를 짝짓는다."""
    index: dict[str, dict[tuple[str, str], float]] = {a: {}, b: {}}
    for r in runs:
        if r["gen_model"] in index:
            index[r["gen_model"]][(r["sample"], r["repeat"])] = float(r[metric])

    shared = sorted(set(index[a]) & set(index[b]))
    return [(f"{s}#{rep}", index[a][(s, rep)], index[b][(s, rep)]) for s, rep in shared]


def wilcoxon(pairs: list[tuple[str, float, float]], a: str, b: str) -> None:
    print(f"\n{'=' * 68}\nWilcoxon 부호순위 검정\n{'=' * 68}")
    print(f"A = {a}\nB = {b}\n")

    if len(pairs) < 6:
        print(f"짝 {len(pairs)}개 — 검정하기엔 너무 적다. 최소 8~10짝을 권장한다.")

    print(f"{'샘플':<24}{'A':>8}{'B':>8}{'차이(B-A)':>12}")
    diffs = []
    for name, va, vb in pairs:
        print(f"{name:<24}{va:>8.2f}{vb:>8.2f}{vb - va:>12.2f}")
        diffs.append(vb - va)

    nonzero = [d for d in diffs if d != 0]
    print(f"\n짝 {len(pairs)}개 (차이 0 제외 시 {len(nonzero)}개)")
    if diffs:
        print(f"평균 차이: {statistics.mean(diffs):+.3f}")

    if not nonzero:
        print("\n모든 짝의 차이가 0 — 두 모델의 결과가 완전히 같다. 검정 불필요.")
        return

    try:
        from scipy.stats import wilcoxon as scipy_wilcoxon
    except ImportError:
        print("\nscipy 가 없어 p-value 를 계산하지 못했다. pip install scipy")
        return

    stat, p = scipy_wilcoxon([va for _, va, _ in pairs], [vb for _, _, vb in pairs])
    print(f"\n검정통계량 W = {stat:.1f}")
    print(f"p-value      = {p:.4f}")
    if p < 0.05:
        winner = b if statistics.mean(diffs) > 0 else a
        print(f"→ 유의수준 5%에서 차이가 있다. 우세: {winner}")
    else:
        print("→ 유의한 차이를 찾지 못했다.")
        print("  (차이가 없다는 증명이 아니라, 이 표본으로는 판단할 수 없다는 뜻)")


def reject_reasons(items: list[dict]) -> None:
    """탈락 사유 분포. 병목이 생성인지 solver 인지 judge 인지 가른다."""
    print(f"\n{'=' * 68}\n탈락 사유 분포 (모델별)\n{'=' * 68}")
    by_model = defaultdict(Counter)
    totals = Counter()
    for it in items:
        by_model[it["gen_model"]][it["reject_reason"] or "(통과)"] += 1
        totals[it["gen_model"]] += 1

    for model, counter in by_model.items():
        print(f"\n{model}  (문항 {totals[model]}개)")
        for reason, n in counter.most_common():
            label = "JUDGE" if reason.startswith("JUDGE") else reason
            print(f"  {label:<28}{n:>5}  {n / totals[model]:>6.1%}")


def cost_table(calls: list[dict]) -> None:
    print(f"\n{'=' * 68}\n단계별 토큰 (비용 추정용)\n{'=' * 68}")
    print(f"{'단계':<10}{'모델':<32}{'호출':>6}{'입력':>10}{'출력':>10}")
    agg = defaultdict(lambda: [0, 0, 0])
    for c in calls:
        key = (c["stage"], c["model"])
        agg[key][0] += 1
        agg[key][1] += int(c["input_tokens"] or 0)
        agg[key][2] += int(c["output_tokens"] or 0)

    for (stage, model), (n, tin, tout) in sorted(agg.items()):
        print(f"{stage:<10}{model:<32}{n:>6}{tin:>10}{tout:>10}")
    print("\n※ 실제 크레딧은 GMS 대시보드에서 확인할 것. 토큰 수는 상대 비교용이다.")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--metric", default="approved",
                    choices=["approved", "fill_rate", "rounds", "output_tokens"])
    ap.add_argument("--a", default=None, help="비교할 모델 A (기본: 첫 번째)")
    ap.add_argument("--b", default=None, help="비교할 모델 B (기본: 두 번째)")
    args = ap.parse_args()

    runs = read_csv(RUNS_CSV)
    if not runs:
        raise SystemExit(f"결과가 없습니다: {RUNS_CSV}\n먼저 python -m eval.run_eval 을 실행하세요.")

    describe(runs, args.metric)
    reject_reasons(read_csv(ITEMS_CSV))
    cost_table(read_csv(CALLS_CSV))

    models = list(dict.fromkeys(r["gen_model"] for r in runs))
    a = args.a or models[0]
    b = args.b or (models[1] if len(models) > 1 else None)
    if b is None:
        print(f"\n모델이 하나({a})뿐이라 비교 검정을 건너뜁니다.")
        print("비교하려면: python -m eval.run_eval --gen-models 모델A,모델B")
        return

    pairs = pair_runs(runs, a, b, args.metric)
    if not pairs:
        print(f"\n{a} 와 {b} 의 공통 (샘플,반복) 조합이 없어 짝을 지을 수 없습니다.")
        return
    wilcoxon(pairs, a, b)


if __name__ == "__main__":
    main()
