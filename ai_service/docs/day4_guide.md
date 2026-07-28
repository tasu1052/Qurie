# Day 4 손코딩 가이드 — Judge / Graph / 비동기 API

> 목표: Swagger에서 `POST /api/quiz` (mock) → 잠시 후 status `READY` + 문항.  
> 계약: §2.5 상태전이, §3.7 Judge 입력, §4.3 Judge 출력, §5 검증 일부

---

## 오늘 범위

| 함 | 안 함 |
|---|---|
| `nodes/judge.py`, `nodes/refine.py`, `graph.py` | 진짜 DB |
| POST → PENDING + BackgroundTasks | AST |
| GET `/api/quiz/{quiz_set_id}/status` | 시맨틱 캐시 |
| 메모리 dict 상태 저장 | |

---

## 1. 파일

```
app/pipeline/
├── graph.py
└── nodes/
    ├── judge.py
    └── refine.py
app/api/quizzes.py          ← 수정
app/schemas/request.py      ← body 연결
app/schemas/quiz.py         ← QuizSetAccepted 사용
```

---

## 2. `nodes/judge.py` (계약 §3.7, §4.3)

핵심만:

1. Solver 답 == `answer_index` → 코드로 비교 (LLM 0콜). 불일치면 `REJECTED` / `SOLVER_MISMATCH`, Judge 스킵  
2. 일치 문항만 Judge 호출 — **코드(줄번호) 포함**, `quality_score`는 **0~10 정수**  
3. `>= JUDGE_PASS_SCORE(7)` → APPROVED, 아니면 REJECTED + critique  

```python
from __future__ import annotations

from app import config
from app.llm.client import call_llm, parse_json
from app.pipeline.prompts import number_code
from app.pipeline.state import PipelineState


def node_judge(state: PipelineState) -> PipelineState:
    quizzes = state["quizzes"]
    solver = state.get("solver_answers", [])
    matched = [
        i for i, q in enumerate(quizzes)
        if i < len(solver) and solver[i] == int(q["answer_index"])
    ]

    scores: dict[int, dict] = {}
    if matched:
        code = number_code(state["primary_file"], state["files"][state["primary_file"]])
        sub = [{
            "index": i,
            "q": quizzes[i]["question"],
            "c": quizzes[i]["choices"],
            "a": quizzes[i]["answer_index"],
            "lines": [quizzes[i].get("line_start"), quizzes[i].get("line_end")],
        } for i in matched]
        prompt = f"""코드:\n{code}\n\n0~10 정수로 품질 채점(정답유일성/오답매력/코드이해필요).
JSON만: {{"scores":[{{"index":0,"quality_score":8,"critique":""}}]}}\n문항:{sub}"""
        raw = call_llm(config.JUDGE_MODEL, prompt, state["meter"], "JUDGE")
        scores = {int(s["index"]): s for s in parse_json(raw)["scores"]}

    out = []
    for i, q in enumerate(quizzes):
        if i not in matched:
            out.append({**q, "status": "REJECTED", "judge_score": None,
                        "reject_reason": "SOLVER_MISMATCH"})
            continue
        sc = scores.get(i, {}).get("quality_score")
        if isinstance(sc, float) and 0 <= sc <= 1:
            sc = int(round(sc * 10))
        try:
            sc = int(sc)
        except (TypeError, ValueError):
            sc = -1
        if not (0 <= sc <= 10):
            out.append({**q, "status": "REJECTED", "judge_score": None,
                        "reject_reason": "JUDGE_INVALID_SCORE"})
        elif sc >= config.JUDGE_PASS_SCORE:
            out.append({**q, "status": "APPROVED", "judge_score": sc, "reject_reason": None})
        else:
            critique = scores.get(i, {}).get("critique", "")
            out.append({**q, "status": "REJECTED", "judge_score": sc,
                        "reject_reason": f"JUDGE: {critique}"[:200]})
    state["quizzes"] = out
    return state
```

---

## 3. `nodes/refine.py` (간단 MVP)

```python
from __future__ import annotations

from app.pipeline.state import PipelineState


def should_refine(state: PipelineState) -> str:
    """조건부 엣지용: refine | end"""
    approved = sum(1 for q in state.get("quizzes", []) if q.get("status") == "APPROVED")
    if approved > 0:
        return "end"
    if state.get("retry_count", 0) >= 1:  # config.MAX_RETRY
        return "end"
    return "refine"


def node_refine(state: PipelineState) -> PipelineState:
    # critique를 user_prompt에 붙여 다음 generate가 보게 함 (MVP)
    critiques = [
        q.get("reject_reason") or ""
        for q in state.get("quizzes", [])
        if q.get("status") == "REJECTED"
    ]
    extra = "이전 실패 사유(반복 금지): " + " | ".join(c for c in critiques if c)[:500]
    prev = state.get("user_prompt") or ""
    state["user_prompt"] = (prev + "\n" + extra).strip()
    state["retry_count"] = state.get("retry_count", 0) + 1
    return state
```

계약: 문항 단위 재생성 1회. MVP는 **세트 전체 1회 재시도**로 단순화해도 됨.

---

## 4. `graph.py`

```python
from __future__ import annotations

from langgraph.graph import END, StateGraph

from app.pipeline.nodes.generate import node_generate
from app.pipeline.nodes.judge import node_judge
from app.pipeline.nodes.refine import node_refine, should_refine
from app.pipeline.nodes.solve import node_solve
from app.pipeline.state import PipelineState


def build_graph():
    g = StateGraph(dict)  # TypedDict를 dict로 써도 동작
    g.add_node("generate", node_generate)
    g.add_node("solve", node_solve)
    g.add_node("judge", node_judge)
    g.add_node("refine", node_refine)
    g.set_entry_point("generate")
    g.add_edge("generate", "solve")
    g.add_edge("solve", "judge")
    g.add_conditional_edges("judge", should_refine, {"refine": "refine", "end": END})
    g.add_edge("refine", "generate")
    return g.compile()


PIPELINE = build_graph()


def run_pipeline(initial: dict) -> dict:
    return PIPELINE.invoke(initial)
```

---

## 5. 메모리 상태 저장소 + API 연결

`app/api/store.py` (새 파일):

```python
"""MVP: 프로세스 메모리. 재시작 시 소실."""

from __future__ import annotations

from typing import Any

_SETS: dict[int, dict[str, Any]] = {}
_NEXT_ID = 1


def new_id() -> int:
    global _NEXT_ID
    i = _NEXT_ID
    _NEXT_ID += 1
    return i


def put(quiz_set_id: int, data: dict) -> None:
    _SETS[quiz_set_id] = data


def get(quiz_set_id: int) -> dict | None:
    return _SETS.get(quiz_set_id)
```

`quizzes.py` 교체 요지:

```python
from fastapi import APIRouter, BackgroundTasks, Query
from app.schemas.request import CreateQuizSetRequest, DifficultyRatio
from app.schemas.quiz import Quiz, QuizResponse, QuizSetAccepted
from app.api import store
from app.llm.client import UsageMeter
from app.pipeline.graph import run_pipeline
from app import config

router = APIRouter(prefix="/api", tags=["quiz"])


def _run_job(quiz_set_id: int, project: str, body: CreateQuizSetRequest, files: dict[str, str]):
    store.put(quiz_set_id, {**store.get(quiz_set_id), "status": "GENERATING"})
    try:
        primary = body.target_files[0] if body.target_files else next(iter(files))
        state = {
            "project": project,
            "quiz_set_id": quiz_set_id,
            "mode": body.mode.value,
            "requested_count": body.requested_count,
            "ratio_counts": body.ratio.to_counts(body.requested_count),
            "user_prompt": body.user_prompt,
            "version_hash": body.version_hash,
            "files": files,
            "primary_file": primary,
            "meter": UsageMeter(),
            "retry_count": 0,
        }
        final = run_pipeline(state)
        approved = [q for q in final.get("quizzes", []) if q.get("status") == "APPROVED"]
        status = "READY" if approved else "FAILED"
        store.put(quiz_set_id, {
            "project": project,
            "status": status,
            "quizzes": approved,  # 또는 전체+status 필드
            "error_message": None if approved else "NO_APPROVED_ITEMS",
            "meter": final["meter"].rows,
        })
    except Exception as e:
        store.put(quiz_set_id, {
            "project": project, "status": "FAILED",
            "quizzes": [], "error_message": str(e)[:500],
        })


@router.post("/quiz", response_model=QuizSetAccepted)
def create_quiz(
    background_tasks: BackgroundTasks,
    project: str = Query(...),
    body: CreateQuizSetRequest | None = None,
):
    # Day1 호환: body 없으면 가짜 즉시 READY 경로를 남겨도 됨
    if body is None:
        ...
    qid = store.new_id()
    store.put(qid, {"project": project, "status": "PENDING", "quizzes": []})
    # MVP: files는 body에 아직 없으면 테스트용 하드코드 / 또는 body 확장
    files = {"solution.py": "def fib(n):\n    return n\n"}  # TODO: body.files
    background_tasks.add_task(_run_job, qid, project, body, files)
    return QuizSetAccepted(quiz_set_id=qid, project=project, status="PENDING")


@router.get("/quiz/{quiz_set_id}/status", response_model=QuizResponse)
def get_status(quiz_set_id: int):
    data = store.get(quiz_set_id)
    if not data:
        return QuizResponse(project="", quiz_set_id=quiz_set_id, status="FAILED",
                            error_message="NOT_FOUND", quizzes=[])
    # Quiz 모델로 변환 (필드 매핑)
    quizzes = []
    for q in data.get("quizzes", []):
        quizzes.append(Quiz(
            purpose=q.get("purpose", "MICRO"),
            difficulty=q.get("difficulty", "EASY"),
            tested_concept=q.get("tested_concept", "")[:60],
            question=q["question"],
            choices=q["choices"],
            answer_index=q["answer_index"],
            explanation=q.get("explanation"),
            file_path=q.get("file_path"),
            line_start=q.get("line_start"),
            line_end=q.get("line_end"),
        ))
    return QuizResponse(
        project=data["project"],
        quiz_set_id=quiz_set_id,
        status=data["status"],
        quizzes=quizzes,
        error_message=data.get("error_message"),
    )
```

**중요**: 계약 §6.10 — MVP는 body에 `files`를 실어 보내는 편이 안전.  
`CreateQuizSetRequest`에 `files: dict[str, str] = {}`를 추가해도 된다.

상태 전이:

```
PENDING → GENERATING → READY | FAILED
```

---

## 6. 확인

```bash
export AI_MOCK=1
uvicorn app.main:app --reload
```

1. `POST /api/quiz?project=demo` + body (Swagger)  
2. 응답 `status=PENDING`, `quiz_set_id` 기억  
3. `GET /api/quiz/{id}/status` 폴링 → READY 또는 FAILED  
4. meter 로그가 응답/스토어에 쌓이는지  

---

## 7. 커밋

```bash
git commit -m "feat(ai): LangGraph 파이프라인 연결 및 비동기 퀴즈 생성 API"
```

---

## 8. 내일(Day5)

구조 검증(V4~V7), 테스트, README, (남으면) AST 힌트.
