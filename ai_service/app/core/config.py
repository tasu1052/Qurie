import os

from dotenv import load_dotenv

load_dotenv()

# --- GMS (LLM 게이트웨이) ---
GMS_API_KEY = os.environ.get("GMS_API_KEY", "")
OPENAI_BASE = "https://gms.ssafy.io/gmsapi/api.openai.com/v1"
ANTHROPIC_BASE = "https://gms.ssafy.io/gmsapi/api.anthropic.com"
GEMINI_BASE = "https://gms.ssafy.io/gmsapi/generativelanguage.googleapis.com"

# --- 모델 배치 ---
GEN_MODEL = "claude-haiku-4-5-20251001"
SOLVER_MODEL = "gpt-5.4-nano"
JUDGE_MODEL = "gemini-2.5-flash-lite"
# 리포트는 학생 1명당 1회 호출이라 한 세션에서 인원수만큼 나간다. 짧은 서술 작업이라
# 가장 싼 모델로 시작한다 — 문장 품질이 부족하면 claude-haiku-4-5-20251001 로 올린다.
REPORT_MODEL = "gemini-2.5-flash-lite"

# 응시 문항이 이보다 적으면 LLM을 부르지 않는다.
# 2~3문항으로 "이 개념에 약하다"고 단정할 근거가 없고, 학생에게 보이는 글이라 위험하다.
REPORT_MIN_ATTEMPTS = 3

# --- 파이프라인 상수 ---
JUDGE_PASS_SCORE = 7
GEN_INPUT_CODE_TOKEN_BUDGET = 6000

# 요청 개수를 채울 때까지 부족분을 다시 생성한다. 이 값은 그 상한(안전핀)이다.
# 한 라운드 = GENERATE + SOLVE + JUDGE 3콜이므로 무한 루프는 크레딧을 태운다.
# 진전이 없는 라운드(승인 0건)가 나오면 상한 전이라도 중단한다.
MAX_RETRY = 5

# --- 출력 토큰 예산 ---
# 응답이 상한에 걸려 잘리면 JSON 파싱이 통째로 깨지므로 문항 수에 비례해 잡는다.
# 한글 explanation 2~4문장 기준 문항당 약 510 출력 토큰(실측) + 여유분.
MAX_TOKENS = 2000  # 문항 수를 모르는 호출의 기본값
TOKEN_BUDGET = {  # stage: (기본, 문항당)
    "GENERATE": (800, 600),
    "SOLVE": (400, 60),
    "JUDGE": (400, 200),
    # 총평 600자 + 항목 4개×200자 + 오답 노트(문항당 500자). 한글이라 토큰이 넉넉히 든다.
    "REPORT": (1200, 250),
}


def max_tokens_for(stage: str, item_count: int) -> int:
    base, per_item = TOKEN_BUDGET.get(stage, (MAX_TOKENS, 0))
    return base + per_item * item_count

# --- 개발 모드 ---
MOCK = os.environ.get("AI_MOCK", "0") == "1"

# --- 샘플링 ---
# 지정하지 않으면 provider 기본값(약 1.0)이 적용되는데, 그러면 모델이 확률 2·3순위
# 토큰을 자주 골라 같은 입력에도 결과가 크게 흔들린다(같은 조건에서 통과 7/7 ↔ 0/7 관측).
# 평가 도구는 재현성이 중요하므로 낮춰 고정한다. 0으로 두지 않는 이유는 실수까지
# 매번 똑같이 반복하고, 한 응답 안 문항들이 서로 비슷해지기 때문이다.
TEMPERATURE = 0.3

# --- 완료 통보(콜백) ---
# 요청에 callback_url이 있으면 파이프라인 종료 후 그 주소로 결과를 POST한다.
# 비밀 값은 수신 측이 "정말 AI 서비스가 보낸 것"인지 검증하는 용도.
# 백엔드의 app.ai.callback-secret(= AI_CALLBACK_SECRET)과 같은 값이어야 한다.
CALLBACK_SECRET = os.environ.get("AI_CALLBACK_SECRET", "")
CALLBACK_TIMEOUT_SEC = 10
CALLBACK_RETRIES = 3
CALLBACK_BACKOFF_SEC = 2
