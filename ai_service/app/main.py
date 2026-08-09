import logging

from fastapi import FastAPI

from app.core import config
from app.http.health import router as health_router
from app.http.quiz_routes import router as quiz_router
from app.http.report_routes import router as report_router

if config.DEMO_MODE:
    # 켠 채로 잊고 배포하면 검증 없는 문항이 학생에게 그대로 나간다. 기동 때마다 알린다.
    logging.getLogger("uvicorn.error").warning(
        "AI_DEMO_MODE=1 — 교차검증(SOLVE·JUDGE)을 건너뜁니다. 발표용이며 운영에 쓰지 마세요.")

app = FastAPI(title="Qurie AI Service", version="0.1.0")
app.include_router(health_router)
app.include_router(quiz_router)
app.include_router(report_router)
