from fastapi import FastAPI
from app.api.quizzes import router as quizzes_router

app = FastAPI(title="Qurie AI Service", version="0.1.0")
app.include_router(quizzes_router)

@app.get("/health")
def health():
    return {"status": "ok"}