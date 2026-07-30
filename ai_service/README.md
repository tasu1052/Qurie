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


## 8. 5일 체크리스트

- [ ] Day1: Swagger POST project만으로 가짜 READY  
- [ ] Day2: mock/실측 call_llm  
- [ ] Day3: generate→solve smoke  
- [ ] Day4: 비동기 PENDING→READY  
- [ ] Day5: pytest 통과 + README  

개발 중 기본은 `AI_MOCK=1`. 실호출은 프롬프트 확정·환산비 측정 때만.
