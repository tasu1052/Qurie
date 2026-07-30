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
}


def max_tokens_for(stage: str, item_count: int) -> int:
    base, per_item = TOKEN_BUDGET.get(stage, (MAX_TOKENS, 0))
    return base + per_item * item_count

# --- 개발 모드 ---
MOCK = os.environ.get("AI_MOCK", "0") == "1"
