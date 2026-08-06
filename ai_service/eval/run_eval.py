"""모델 배치 A/B 실험 러너.

실제 파이프라인(app.engine.run)을 그대로 호출한다. 실험용 파이프라인을 따로 두면
운영과 어긋나서 결과를 신뢰할 수 없다.

짝지어 비교(paired) 설계다 — 같은 코드 샘플을 모든 후보 모델에 동일하게 먹인다.
코드마다 난이도 편차가 커서, 짝을 안 지으면 모델 차이가 그 편차에 묻힌다.

사용:
    python -m eval.run_eval --plan                  # 호출 횟수만 계산 (크레딧 0)
    python -m eval.run_eval --mock                  # 로직 점검 (크레딧 0)
    python -m eval.run_eval --gen-models claude-haiku-4-5-20251001,claude-sonnet-4-6 --repeats 3
    python -m eval.run_eval --resume                # 중단된 실험 이어서

산출물 (eval/results/):
    runs.csv   실행 1건당 1행  — 통과 개수·토큰·지연. 통계 분석의 입력
    items.csv  문항 1개당 1행  — 탈락 사유 분포 확인용
    calls.csv  LLM 호출 1건당 1행 — 비용 계산용 (quiz_llm_log 와 같은 모양)
    raw/*.json 실행별 원본 — 문항 본문까지 사람이 눈으로 검토할 때
"""

from __future__ import annotations

import argparse
import csv
import json
import sys
import time
import traceback
from datetime import datetime
from pathlib import Path

EVAL_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(EVAL_DIR.parent))

from app.core import config  # noqa: E402
from app.engine.factory import build_pipeline_state  # noqa: E402
from app.engine.run import run as run_engine  # noqa: E402
from app.quiz.dto.request import CreateQuizSetRequest  # noqa: E402

SAMPLES_DIR = EVAL_DIR / "samples"
RESULTS_DIR = EVAL_DIR / "results"
RAW_DIR = RESULTS_DIR / "raw"

RUNS_CSV = RESULTS_DIR / "runs.csv"
ITEMS_CSV = RESULTS_DIR / "items.csv"
CALLS_CSV = RESULTS_DIR / "calls.csv"

RUN_FIELDS = [
    "run_id", "timestamp", "gen_model", "solver_model", "judge_model",
    "temperature", "sample", "repeat", "mode", "requested_count",
    "approved", "rejected", "fill_rate", "rounds",
    "input_tokens", "output_tokens", "latency_ms", "status", "error",
]
ITEM_FIELDS = [
    "run_id", "gen_model", "sample", "repeat", "index",
    "status", "purpose", "difficulty", "judge_score", "reject_reason",
    "has_evidence", "tested_concept", "question",
]
CALL_FIELDS = [
    "run_id", "gen_model", "sample", "repeat", "seq",
    "stage", "model", "input_tokens", "output_tokens", "latency_ms", "succeeded",
]


def load_samples(only: list[str] | None) -> dict[str, str]:
    files = sorted(SAMPLES_DIR.glob("*.py"))
    if not files:
        raise SystemExit(f"샘플이 없습니다: {SAMPLES_DIR}")
    samples = {f.stem: f.read_text(encoding="utf-8") for f in files}
    if only:
        missing = [n for n in only if n not in samples]
        if missing:
            raise SystemExit(f"없는 샘플: {missing} (가능: {list(samples)})")
        samples = {n: samples[n] for n in only}
    return samples


def done_keys() -> set[tuple[str, str, str]]:
    """이미 끝난 (모델, 샘플, 반복) 조합. --resume 으로 재실행을 건너뛴다."""
    if not RUNS_CSV.exists():
        return set()
    with RUNS_CSV.open(encoding="utf-8-sig", newline="") as f:
        return {(r["gen_model"], r["sample"], r["repeat"]) for r in csv.DictReader(f)}


class CsvSink:
    """행이 생길 때마다 즉시 flush 한다.

    실행 도중 중단되면 그때까지 쓴 크레딧이 날아가므로, 버퍼에 들고 있지 않는다.
    """

    def __init__(self, path: Path, fields: list[str]) -> None:
        self.path = path
        is_new = not path.exists()
        # utf-8-sig: Excel 이 한글을 깨뜨리지 않게 BOM 을 붙인다.
        self.handle = path.open("a", encoding="utf-8-sig", newline="")
        self.writer = csv.DictWriter(self.handle, fieldnames=fields, extrasaction="ignore")
        if is_new:
            self.writer.writeheader()
            self.handle.flush()

    def write(self, row: dict) -> None:
        self.writer.writerow(row)
        self.handle.flush()

    def close(self) -> None:
        self.handle.close()


def run_once(run_id: str, sample: str, code: str, repeat: int, args) -> dict:
    """파이프라인 1회 실행. 예외가 나도 기록은 남기고 계속 진행한다."""
    body = CreateQuizSetRequest(
        mode=args.mode,
        requested_count=args.count,
        ratio={"easy": args.easy, "normal": args.normal, "hard": args.hard},
        version_hash=f"eval-{run_id}",
        target_files=[f"{sample}.py"],
        files={f"{sample}.py": code},
    )
    state = build_pipeline_state(0, "eval", body, body.files)

    started = time.time()
    error = ""
    quizzes: list[dict] = []
    try:
        final = run_engine(state)
        quizzes = final.get("quizzes", [])
        meter_rows = final["meter"].rows
    except Exception as e:
        error = f"{type(e).__name__}: {e}"
        traceback.print_exc()
        meter_rows = state["meter"].rows

    approved = [q for q in quizzes if q.get("status") == "APPROVED"]
    rejected = [q for q in quizzes if q.get("status") != "APPROVED"]
    rounds = sum(1 for r in meter_rows if r.get("stage") == "GENERATE")

    return {
        "run": {
            "run_id": run_id,
            "timestamp": datetime.now().isoformat(timespec="seconds"),
            "gen_model": config.GEN_MODEL,
            "solver_model": config.SOLVER_MODEL,
            "judge_model": config.JUDGE_MODEL,
            "temperature": config.TEMPERATURE,
            "sample": sample,
            "repeat": repeat,
            "mode": args.mode,
            "requested_count": args.count,
            "approved": len(approved),
            "rejected": len(rejected),
            # 요청 개수를 얼마나 채웠나. 모델 비교의 1차 지표.
            "fill_rate": round(len(approved) / args.count, 3),
            "rounds": rounds,
            "input_tokens": sum(r.get("input_tokens", 0) for r in meter_rows),
            "output_tokens": sum(r.get("output_tokens", 0) for r in meter_rows),
            "latency_ms": int((time.time() - started) * 1000),
            "status": "ERROR" if error else ("READY" if approved else "NO_APPROVED"),
            "error": error,
        },
        "items": quizzes,
        "calls": meter_rows,
    }


def main() -> None:
    ap = argparse.ArgumentParser(description="퀴즈 생성 모델 A/B 실험")
    ap.add_argument("--gen-models", default=config.GEN_MODEL,
                    help="쉼표로 구분한 생성 모델 목록 (기본: config.GEN_MODEL)")
    ap.add_argument("--solver-model", default=config.SOLVER_MODEL)
    ap.add_argument("--judge-model", default=config.JUDGE_MODEL)
    ap.add_argument("--samples", default=None, help="쉼표로 구분한 샘플 이름 (기본: 전부)")
    ap.add_argument("--repeats", type=int, default=1,
                    help="같은 조건 반복 횟수. temperature 가 높아 분산이 크므로 2 이상 권장")
    ap.add_argument("--count", type=int, default=5, help="문항 수")
    ap.add_argument("--mode", default="ASSESSMENT", choices=["ASSESSMENT", "PRACTICE"])
    ap.add_argument("--easy", type=int, default=30)
    ap.add_argument("--normal", type=int, default=50)
    ap.add_argument("--hard", type=int, default=20)
    ap.add_argument("--max-retry", type=int, default=None,
                    help="부족분 재생성 상한 override. 실험 비용을 묶고 싶을 때 0~1 권장")
    ap.add_argument("--temperature", type=float, default=None,
                    help="샘플링 온도 override. 미지정 시 config.TEMPERATURE 를 그대로 쓴다 "
                         "— 운영과 다른 값으로 실험하면 결론이 운영에 그대로 적용되지 않는다")
    ap.add_argument("--plan", action="store_true", help="계획만 출력하고 종료 (크레딧 0)")
    ap.add_argument("--mock", action="store_true", help="AI_MOCK=1 로 실행 (크레딧 0)")
    ap.add_argument("--resume", action="store_true", help="runs.csv 에 있는 조합은 건너뜀")
    args = ap.parse_args()

    if args.mock:
        config.MOCK = True
    if args.max_retry is not None:
        config.MAX_RETRY = args.max_retry
    if args.temperature is not None:
        config.TEMPERATURE = args.temperature

    gen_models = [m.strip() for m in args.gen_models.split(",") if m.strip()]
    samples = load_samples([s.strip() for s in args.samples.split(",")] if args.samples else None)

    total_runs = len(gen_models) * len(samples) * args.repeats
    min_calls = total_runs * 3                       # GENERATE + SOLVE + JUDGE
    max_calls = total_runs * 3 * (config.MAX_RETRY + 1)

    print(f"모델   : {gen_models}")
    print(f"샘플   : {list(samples)}")
    print(f"반복   : {args.repeats}  |  문항 수: {args.count}  |  모드: {args.mode}")
    print(f"온도   : {config.TEMPERATURE}")
    print(f"실행 수: {total_runs}회")
    print(f"LLM 호출: 최소 {min_calls}회 ~ 최대 {max_calls}회 (재시도 상한 {config.MAX_RETRY})")
    print(f"※ GENERATE 가 비용의 약 96%. 실행당 GENERATE {1}~{config.MAX_RETRY + 1}회")
    if args.plan:
        print("\n--plan 이므로 실행하지 않고 종료합니다.")
        return
    if not config.MOCK:
        print("\n실제 LLM 을 호출합니다. 계속하려면 Enter, 취소하려면 Ctrl+C")
        input()

    RESULTS_DIR.mkdir(parents=True, exist_ok=True)
    RAW_DIR.mkdir(parents=True, exist_ok=True)
    skip = done_keys() if args.resume else set()

    runs = CsvSink(RUNS_CSV, RUN_FIELDS)
    items = CsvSink(ITEMS_CSV, ITEM_FIELDS)
    calls = CsvSink(CALLS_CSV, CALL_FIELDS)

    original_gen = config.GEN_MODEL
    config.SOLVER_MODEL = args.solver_model
    config.JUDGE_MODEL = args.judge_model

    try:
        done = 0
        for gen_model in gen_models:
            config.GEN_MODEL = gen_model
            for sample, code in samples.items():
                for repeat in range(1, args.repeats + 1):
                    done += 1
                    if (gen_model, sample, str(repeat)) in skip:
                        print(f"[{done}/{total_runs}] skip  {gen_model} / {sample} #{repeat}")
                        continue

                    run_id = f"{gen_model.split('-')[0]}_{sample}_{repeat}_{int(time.time())}"
                    print(f"[{done}/{total_runs}] run   {gen_model} / {sample} #{repeat} ...",
                          end="", flush=True)

                    result = run_once(run_id, sample, code, repeat, args)
                    row = result["run"]
                    print(f" {row['approved']}/{args.count} 통과, "
                          f"{row['rounds']}라운드, {row['latency_ms']}ms")

                    runs.write(row)
                    for i, q in enumerate(result["items"]):
                        items.write({
                            "run_id": run_id, "gen_model": gen_model,
                            "sample": sample, "repeat": repeat, "index": i,
                            "status": q.get("status", "APPROVED"),
                            "purpose": q.get("purpose"),
                            "difficulty": q.get("difficulty"),
                            "judge_score": q.get("judge_score"),
                            "reject_reason": q.get("reject_reason"),
                            "has_evidence": bool(q.get("file_path")),
                            "tested_concept": q.get("tested_concept"),
                            "question": q.get("question"),
                        })
                    for seq, c in enumerate(result["calls"]):
                        calls.write({
                            "run_id": run_id, "gen_model": gen_model,
                            "sample": sample, "repeat": repeat, "seq": seq, **c,
                        })
                    (RAW_DIR / f"{run_id}.json").write_text(
                        json.dumps(result, ensure_ascii=False, indent=2, default=str),
                        encoding="utf-8")
    finally:
        config.GEN_MODEL = original_gen
        runs.close()
        items.close()
        calls.close()

    print(f"\n저장 완료: {RESULTS_DIR}")
    print("분석: python -m eval.analyze")


if __name__ == "__main__":
    main()
