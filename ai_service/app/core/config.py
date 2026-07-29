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
MAX_RETRY = 1
MAX_TOKENS = 2000
GEN_INPUT_CODE_TOKEN_BUDGET = 6000

# --- 개발 모드 ---
MOCK = os.environ.get("AI_MOCK", "0") == "1"

# --- 기본 코드 스냅샷 (body.files 미제공 시) ---
DEFAULT_FILES = {"solution.py": "def fib(n):\n    return n\n"}
