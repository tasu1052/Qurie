# Day 5 손코딩 가이드 — 검증 · 테스트 · 문서

> 목표: mock으로 `POST → READY`가 테스트로 고정되고, README로 다른 사람이 띄울 수 있으면 성공.  
> 계약: §5 검증 계층, §6 ERD 이슈는 백엔드에 공유만

---

## 오늘 범위

| 함 | 안 함 (명시) |
|---|---|
| `pipeline/validate.py` (V1~V7) | DB 연동 |
| `tests/test_pipeline.py` | Dockerfile |
| README, 에러→FAILED 정리 | 시맨틱 캐시 |
| (여유) AST import 힌트 | 프로덕션 배포 |

---

## 1. `app/pipeline/validate.py` (계약 §5)

```python
"""LLM 출력 → DB/응답 직전 구조·스냅샷 정합 검증."""

from __future__ import annotations


def validate_quiz_item(q: dict, files: dict[str, str]) -> str | None:
    """실패 시 reject_code 문자열, 성공 시 None."""
    choices = q.get("choices") or []
    if len(choices) != 4:
        return "SCHEMA_CHOICES_COUNT"
    if len(set(c.strip().lower() for c in choices)) < 4:
        return "DUP_CHOICE"
    try:
        ai = int(q["answer_index"])
    except (KeyError, TypeError, ValueError):
        return "BAD_ANSWER_INDEX"
    if not (0 <= ai <= 3):
        return "BAD_ANSWER_INDEX"

    purpose = q.get("purpose", "MICRO")
    concept = q.get("tested_concept") or ""
    if not concept or len(concept) > 60:
        return "SCHEMA"  # 절삭하지 말고 거절 (계약)

    if purpose == "MICRO":
        path = q.get("file_path")
        if not path or path not in files:
            return "UNKNOWN_FILE"
        ls, le = q.get("line_start"), q.get("line_end")
        if ls is None or le is None:
            return "BAD_SPAN"
        try:
            ls, le = int(ls), int(le)
        except (TypeError, ValueError):
            return "BAD_SPAN"
        nlines = len(files[path].replace("\r\n", "\n").split("\n"))
        if not (1 <= ls <= le <= nlines):
            return "LINE_OOB"
    elif purpose == "CONCEPTUAL":
        if q.get("file_path") or q.get("line_start") or q.get("line_end"):
            return "CONCEPTUAL_WITH_SPAN"

    return None


def apply_validation(quizzes: list[dict], files: dict[str, str]) -> list[dict]:
    out = []
    for q in quizzes:
        code = validate_quiz_item(q, files)
        if code:
            out.append({**q, "status": "REJECTED", "reject_reason": code,
                        "judge_score": q.get("judge_score")})
        else:
            out.append(q)
    return out
```

**어디에 끼우나**: `node_judge` 직후 또는 `generate` 직후·Solver 전.  
권장: **generate 직후** 구조 검증 → 나쁜 문항은 Solver/Judge 스킵(비용).

```python
# generate 끝에서
from app.pipeline.validate import apply_validation
state["quizzes"] = apply_validation(state["quizzes"], state["files"])
# status가 REJECTED인 건 solve에서 제외해도 됨
```

정책 요약 (계약):

| 코드 | 문항 폐기 | 재생성 | 세트 FAILED |
|---|---|---|---|
| SCHEMA/DUP/LINE/... | O | 1회(여유시) | APPROVED==0 이면 O |
| SOLVER_MISMATCH | O | critique 1회 | 동일 |
| NO_APPROVED_ITEMS | — | — | O |

---

## 2. `CreateQuizSetRequest`에 files 추가 (MVP, 계약 §6.10)

`app/schemas/request.py`에:

```python
files: dict[str, str] = Field(default_factory=dict)  # path -> content
```

Day4 `_run_job`에서 `files = body.files or {...}`.  
AI 서버가 DB를 안 보는 동안 이게 정석이다.

---

## 3. `tests/test_pipeline.py`

```bash
pip install pytest
```

```python
# tests/test_pipeline.py
import os
os.environ["AI_MOCK"] = "1"

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health():
    r = client.get("/health")
    assert r.status_code == 200


def test_create_requires_project():
    r = client.post("/api/quiz")
    assert r.status_code == 422


def test_create_and_status_mock():
    body = {
        "mode": "PRACTICE",
        "requested_count": 5,
        "ratio": {"easy": 1, "normal": 1, "hard": 1},
        "version_hash": "test",
        "target_files": ["solution.py"],
        "files": {
            "solution.py": "def fib(n, memo={}):\n    if n <= 1:\n        return n\n    return fib(n-1)+fib(n-2)\n"
        },
    }
    r = client.post("/api/quiz?project=demo", json=body)
    assert r.status_code == 200
    data = r.json()
    assert data["status"] in ("PENDING", "READY")  # TestClient는 동기적으로 background 돌릴 수 있음
    qid = data.get("quiz_set_id")
    if qid:
        s = client.get(f"/api/quiz/{qid}/status")
        assert s.status_code == 200
        assert s.json()["status"] in ("PENDING", "GENERATING", "READY", "FAILED")
```

```bash
pytest -q
```

`BackgroundTasks`가 TestClient에서 어떻게 도는지에 따라 폴링 루프를 테스트에 넣어도 된다.

---

## 4. 에러 → FAILED

이미 Day4 `_run_job`의 `except`가 있으면, 추가로:

- JSON 파싱 실패 → 해당 단계 `meter.succeeded=False`, 세트 FAILED `PARSE_ERROR`
- `GMS_API_KEY` 없고 MOCK 아님 → 즉시 FAILED
- APPROVED 0개 → FAILED `NO_APPROVED_ITEMS` (계약 §2.5)

---

## 5. `ai_service/README.md`

```markdown
# Qurie AI Service

코드 스냅샷 기반 객관식 퀴즈 생성 (Generator → Solver → Judge).

## Setup
python -m venv venv
source venv/Scripts/activate
pip install -r requirements.txt
cp .env.example .env   # GMS_API_KEY=

## Run
export AI_MOCK=1          # 개발 기본
uvicorn app.main:app --reload

## API
- POST /api/quiz?project=...  body: CreateQuizSetRequest
- GET  /api/quiz/{quiz_set_id}/status

계약: docs/quiz_generation_contract.md
일별 가이드: docs/day1_guide.md ~ day5_guide.md
```

`.env.example`:

```
GMS_API_KEY=
AI_MOCK=1
```

---

## 6. (여유) AST 힌트 — 보류 해제 시

```
app/analysis/ast_tools.py
```

- Python `ast`로 `import` 목록만 추출
- generate 프롬프트에  
  `외부 모듈: X, Y — 내부 동작 출제 금지` 한 줄 추가  
- 그래프 노드로 넣지 말고 **프롬프트 빌더 전처리**만으로도 MVP 충분

---

## 7. 백엔드에 공유할 것

1. `POST /api/quiz?project=` + `CreateQuizSetRequest` (files 포함 여부)  
2. 상태 머신 PENDING→GENERATING→READY|FAILED  
3. ERD 이슈: `quiz_set.snapshot_id` vs 파일단위 `code_snapshot` (계약 §6.1)  
4. `time_limit_sec` / `quiz_rating` UNRESOLVED

---

## 8. 커밋

```bash
git commit -m "feat(ai): 퀴즈 검증 계층·pytest·README"
```

---

## 9. 5일 체크리스트

- [ ] Day1: Swagger POST project만으로 가짜 READY  
- [ ] Day2: mock/실측 call_llm  
- [ ] Day3: generate→solve smoke  
- [ ] Day4: 비동기 PENDING→READY  
- [ ] Day5: pytest 통과 + README  

개발 중 기본은 `AI_MOCK=1`. 실호출은 프롬프트 확정·환산비 측정 때만.
