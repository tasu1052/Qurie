# 퀴즈 생성 AI 서버(FastAPI). docker-compose 의 ai 서비스가 이 이미지를 빌드한다.
FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
