# ai_service 5일 개발 계획 (계약 반영본)

> 실행 계획. 상세 손코딩은 `day1_guide.md` ~ `day5_guide.md`.  
> 데이터 계약: `quiz_generation_contract.md`

---

## 0. 전제 (회의·계약)

| 항목 | 결정 |
|---|---|
| AST | 보류 (Day5 여유분) |
| 출제 단위 | 파일 단위 (import 정의 추적 안 함) |
| API | `POST /api/quiz?project=` + body `CreateQuizSetRequest` |
| 파이프라인 | generate → solve → judge → (refine) |
| 상태 | PENDING → GENERATING → READY \| FAILED |
| Judge 점수 | 0~10 정수, 통과선 7 |
| 난이도 ratio | 상대 가중치 (합 100 불필요) |

```
generate → solve_blind → judge ─┬─ APPROVED → 응답
                                └─ reject → refine(1회) → generate
```

---

## 1. 5일 후 완성 상태

1. `POST /api/quiz?project=...` + body → 즉시 `PENDING`  
2. 백그라운드에서 G/S/J 파이프라인  
3. `GET /api/quiz/{quiz_set_id}/status` → READY + APPROVED 문항  
4. `AI_MOCK=1`로 크레딧 0 개발 가능  

---

## 2. 폴더 구조 + 일차

```
ai_service/
├── docs/
│   ├── quiz_generation_contract.md
│   ├── day1_guide.md … day5_guide.md
│   └── dev_plan_5days.md          # 이 파일
├── app/
│   ├── main.py                    # Day1
│   ├── config.py                  # Day1
│   ├── api/
│   │   ├── quizzes.py             # Day1 껍데기 → Day4 비동기
│   │   └── store.py               # Day4 메모리 상태
│   ├── schemas/
│   │   ├── request.py             # Day1 (계약 §2.2)
│   │   └── quiz.py                # Day1 응답
│   ├── llm/
│   │   └── client.py              # Day2
│   └── pipeline/
│       ├── state.py, prompts.py   # Day3
│       ├── validate.py            # Day5
│       ├── graph.py               # Day4
│       └── nodes/
│           ├── generate.py, solve.py   # Day3
│           └── judge.py, refine.py     # Day4
├── tests/test_pipeline.py         # Day5
└── README.md                      # Day5
```

---

## 3. 날짜별 한 줄

| Day | 산출 | 확인 |
|---|---|---|
| 1 | 껍데기 `POST /api/quiz` + 스키마 | Swagger 가짜 READY |
| 2 | `llm/client.py` | mock call_llm |
| 3 | generate/solve + prompts | smoke 스크립트 |
| 4 | judge/graph + BackgroundTasks | PENDING→READY |
| 5 | validate + pytest + README | pytest 통과 |

---

## 4. 규칙

- 개발 기본 `AI_MOCK=1`  
- 연습 스크립트(`files/`, `Quiz_lab.py`)는 참고만, 정식은 `app/`  
- 커밋: `feat(ai): ...`  
- 계약과 코드가 어긋나면 **계약을 고치거나 코드를 맞춤** (문서가 진실)

## 5. 5일 안에 안 함

AST(본구현), 시맨틱 캐시, DB, Docker, 단답형, ASSESSMENT 전용 분기 심화
