# ai_service — 개발 셋업 & 컨텍스트

> 이 문서는 이 디렉터리에서 개발을 도울 Claude Code(및 새로 합류하는 사람)를 위한 온보딩 문서다.
> 프로젝트 배경, 담당 범위, 설계 결정, 파일 구조, 개발 규칙을 담는다.
> 상세 설계 근거는 `docs/quiz_design_final.md`, 회의 합의는 `docs/meeting.md` 참고.

---

## 0. 30초 요약

- **프로젝트**: Qurie — 코드를 함께 리뷰하고, AI가 그 코드로 낸 퀴즈를 풀어 이해도를 검증하는 협업 학습 플랫폼.
- **이 디렉터리(`ai_service`)**: 퀴즈를 생성·검증하는 AI 서버. FastAPI + LangGraph 기반. GMS(SSAFY 게이트웨이)로 LLM 호출.
- **내 담당**: `ai_service`만. `backend/`, `frontend/`는 절대 건드리지 않는다.
- **핵심 설계**: 단일 LLM 호출이 아니라 Generator → Solver → Judge 3역할 Self-Refine 루프로 품질 보증. 시맨틱 캐시로 비용 절감.

---

## 1. 레포 구조 & 담당 경계

```
S15P11A604/
├── backend/       # Spring Boot (다른 담당) — 건드리지 않음
├── frontend/      # React (다른 담당) — 건드리지 않음
└── ai_service/    # ← 내 담당. 이 안에서만 작업
    └── docs/
        ├── setup.md              # 이 문서
        ├── meeting.md            # 팀 회의 합의 사항
        └── quiz_design_final.md  # 퀴즈 생성 설계 상세 (12개 결정 + 근거)
```

**절대 규칙**: `ai_service/` 밖의 파일은 읽기만 하고 수정/생성하지 않는다.
`backend`나 `frontend` 변경이 필요해 보이면, 직접 하지 말고 "백엔드/프론트에 이런 요청이 필요하다"고 알려만 준다.

---

## 2. 이 서버가 하는 일 (한 문장씩)

- 백엔드로부터 `POST /quizzes/generate` 요청을 받는다 (코드 + 사용자 설정).
- 코드를 AST로 분석해 출제 포인트·외부 의존성을 파악한다 (LLM 없이).
- LLM으로 퀴즈를 생성하고, 독립 Solver가 풀고, Judge가 채점해 통과분만 반환한다.
- 생성이 수십 초 걸리므로 비동기로 처리하고 상태를 갱신한다.
- LLM 호출 토큰을 실측 로깅한다 (비용 관리).

**핵심: 코드를 저장하지 않는다.** 코드 원본은 백엔드가 요청에 실어 보내고, 이 서버는 그걸 읽어서 문제를 만들 뿐. 결과(문항)는 코드를 복제하지 않고 `file_path + line_start/end`로 참조만 한다.

---

## 3. 파이프라인 구조 (앞으로 구현할 것)

```
analyze_code → generate → solve_blind → judge ─┬─ pass → dedup/저장 → END
  (AST,LLM×)     (LLM)      (LLM)       (LLM)   ├─ fail → refine ──┐
                    ↑                            └─ retry 초과 → discard
                    └────────────────────────────────────────────┘
```

- **analyze_code**: AST로 import/함수/재귀 등 감지. **LLM 안 씀 (크레딧 0).** 외부 의존성(다른 파일 참조)도 여기서 파악.
- **generate**: 퀴즈 배치 생성 (문항 여러 개를 1콜로). 품질 우선 모델.
- **solve_blind**: 정답 가리고 독립적으로 풀기. **생성과 다른 계열의 저렴한 모델** (교차 검증).
- **judge**: 정답 유일성·오답 매력도 채점. 정답 일치 여부는 코드로 비교(LLM 0콜), 품질만 LLM.
- **refine**: 불합격 사유(critique)를 누적해 재생성. 최대 N회.

모델 배치(잠정, A/B로 확정 중): 생성=claude-sonnet 계열, 풀이·판정=claude-haiku 계열.

---

## 4. 앞으로 만들 파일 구조 (제안)

MVP 기준. 실제 구현하며 조정.

```
ai_service/
├── docs/                    # 문서 (이미 있음)
├── app/
│   ├── main.py              # FastAPI 진입점, 라우터 등록
│   ├── config.py            # GMS 엔드포인트/키, 모델명, 상수 (환경변수 로드)
│   ├── api/
│   │   └── quizzes.py       # POST /quizzes/generate 등 엔드포인트
│   ├── schemas/
│   │   ├── request.py       # 요청 Pydantic 모델 (GenerateRequest 등)
│   │   └── quiz.py          # Quiz, JudgeVerdict 등 출력 스키마
│   ├── pipeline/
│   │   ├── graph.py         # LangGraph 그래프 조립 (노드/엣지)
│   │   ├── state.py         # PipelineState (TypedDict)
│   │   ├── nodes/
│   │   │   ├── analyze.py   # analyze_code (AST 분석, LLM 없음)
│   │   │   ├── generate.py  # generate 노드
│   │   │   ├── solve.py     # solve_blind 노드
│   │   │   ├── judge.py     # judge 노드
│   │   │   └── refine.py    # refine 노드
│   │   └── prompts.py       # 프롬프트 빌더 함수들
│   ├── llm/
│   │   └── client.py        # GMS 호출 래퍼 (프로바이더 분기, usage 실측, mock 모드)
│   └── analysis/
│       └── ast_tools.py     # 언어별 AST 분석 (import/함수/재귀 감지)
├── tests/
├── .env                     # GMS_API_KEY 등 (git에 올리지 않음!)
├── .gitignore
├── requirements.txt
└── Dockerfile               # 배포용 (인프라 담당과 협의)
```

**개발 순서 (로드맵)**:
1. `main.py` + `api/quizzes.py`로 껍데기 API (가짜 퀴즈 반환)부터
2. `llm/client.py`로 GMS 실제 호출 (mock 모드 포함)
3. `pipeline/`로 LangGraph 그래프 (toy → 실제)
4. `analysis/ast_tools.py`로 코드 분석 붙이기
5. 시맨틱 캐시·비용 로깅은 이후

---

## 5. 핵심 설계 결정 (요약 — 상세는 quiz_design_final.md)

- **파인튜닝 안 함**: 추론 문제라 API+파이프라인이 정답. 품질은 모델 10% + 설계 90%.
- **3역할 루프**: 생성자가 자기 문제 검수하면 같은 실수 반복 → 정답 가리고 독립 풀이 + 별도 판정.
- **계열 다른 모델**: 같은 회사 모델은 실패 패턴이 같아 교차 검증 안 됨.
- **코드 참조**: 문항에 코드 복제 안 하고 줄 번호만 → 토큰 절약 + 변형 방지. 원본은 프론트가 표시.
- **AST 전처리**: import/참조 분석은 LLM 아니라 코드가 함 (정확·무료). 드래그 범위가 외부 파일을 참조하면 감지.
- **시맨틱 캐시**: 유사 문항 재사용. 코드 유사도까지 봐야 함(개념만 같고 코드 다르면 재사용 금지).
- **비용 실측**: 크레딧이 토큰 비례. usage를 로깅해 관리(초기 추정과 실측이 10배 차이 난 경험).
- **두 모드**: ASSESSMENT(평가, 전원 동일·리포트 반영) / PRACTICE(학습, 개인화·반복). 개인화는 LLM 아니라 개념 태그 DB 쿼리.

---

## 6. GMS (LLM 게이트웨이) 사용 규칙

- OpenAI 호환 엔드포인트: `https://gms.ssafy.io/gmsapi/api.openai.com/v1`
- Anthropic(Claude)은 별도 주소·규격 → 모델명으로 프로바이더 분기 필요. Claude는 `max_tokens` 필수, 응답이 `content[0].text`.
- 키는 `.env`의 `GMS_API_KEY`로 (코드에 하드코딩 금지, git에 올리지 않음).
- **크레딧은 토큰 비례**로 과금. 호출당 정액 아님. 소수점 크레딧이 그 증거.
- 응답의 `usage`(input/output_tokens)를 항상 로깅.

### 크레딧 절약 규칙 (중요)
- **개발/디버깅은 mock 모드로** — 그래프 로직 점검은 LLM 호출 없이. 실제 호출은 프롬프트 검증할 때만.
- 배치 생성(문항 여러 개를 1콜), 정답 일치는 코드로 비교(0콜), 실패분만 재생성.
- 남은 크레딧 주기적으로 GMS "사용 현황"에서 확인.

---

## 7. 개발 규칙 & 컨벤션

- Python 3.x + FastAPI + LangGraph. 가상환경(`.venv`) 안에서 작업.
- 비밀값(`GMS_API_KEY` 등)은 `.env`로, 반드시 `.gitignore`에 추가.
- LLM 호출은 전부 `llm/client.py` 한 곳을 통하게 (프로바이더 분기·로깅·mock을 한 곳에서).
- 프롬프트는 `pipeline/prompts.py`에 모아 튜닝하기 쉽게.
- **AI 사용 규칙(개인)**: "코드 짜줘"보다 "내가 짠 것 리뷰해줘 / 왜 이런지 설명해줘"를 우선. 이해하고 넘어가는 게 목표.

---

## 8. 백엔드와의 인터페이스 (합의 진행 중 — meeting.md 참고)

**요청 형태** (`POST /quizzes/generate`, 잠정):
```json
{
  "quiz_set_id": 42,
  "language": "javascript",
  "target": { "file_path": "solution.js", "line_start": 3, "line_end": 10 },
  "files": { "solution.js": "코드 전문...", "utils.js": "..." },
  "config": {
    "count": 5,
    "types": ["MULTIPLE_CHOICE"],
    "ratio": { "easy": 30, "normal": 50, "hard": 20 },
    "user_prompt": "cleanup 위주로"
  }
}
```

**미확정(회의에서 정할 것)**:
- 코드를 백엔드가 실어 보낼지 vs AI 서버가 DB 직접 읽을지 → 실어 보내기(방식 C) 제안.
- `files` 범위: MVP는 드래그된 파일 하나, 크로스파일 참조는 확장.
- 비동기 완료 통보: 콜백 vs 폴링.
- 코드 원본 저장 위치(DB longtext vs Git): 인프라 담당과.

---

## 9. Claude Code에게 (작업 시작 시 참고)

- 이 서버는 **퀴즈 생성 파이프라인**이 본체다. 새 코드는 `ai_service/` 안에만.
- 설계 배경이 궁금하면 `docs/quiz_design_final.md`(왜 이렇게 설계했는지 12개 결정), `docs/meeting.md`(팀 합의) 순으로 읽으면 된다.
- LLM 호출을 넣을 때는 반드시 mock 모드를 함께 지원하게 한다 (크레딧 절약).
- "정답이 정해진 기계적 작업"(import 찾기, 함수 세기 등)은 LLM이 아니라 코드(AST)로 처리한다.
- 새 결정이 생기면 이 문서나 quiz_design_final.md에 반영해 맥락을 유지한다.