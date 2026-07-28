import os
from dotenv import load_dotenv

load_dotenv()  # .env 파일을 읽어 환경변수로 등록

# --- GMS (LLM 게이트웨이) ---
GMS_API_KEY = os.environ.get("GMS_API_KEY", "")
OPENAI_BASE = "https://gms.ssafy.io/gmsapi/api.openai.com/v1"
ANTHROPIC_BASE = "https://gms.ssafy.io/gmsapi/api.anthropic.com"
GEMINI_BASE = "https://gms.ssafy.io/gmsapi/generativelanguage.googleapis.com"

# --- 모델 배치 (A/B 실측 결과 기준, 바뀌면 여기만 수정) ---
GEN_MODEL = "claude-sonnet-4-6"
SOLVER_MODEL = "gemini-2.5-flash-lite"   # 생성과 계열 분리 (계약 권고)
JUDGE_MODEL = "gemini-2.5-flash-lite"

# --- 파이프라인 상수 ---\
JUDGE_PASS_SCORE = 7      # 10점 만점 통과선
MAX_RETRY = 1             # refine 최대 재시도
MAX_TOKENS = 800         # 출력 폭주 방지 안전핀
GEN_INPUT_CODE_TOKEN_BUDGET = 6000
# --- 개발 모드 ---
MOCK = os.environ.get("AI_MOCK", "0") == "1"  # AI_MOCK=1이면 LLM 호출 안 함