import os
os.environ["AI_MOCK"] = "1"

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health():
    r = client.get("/health")
    assert r.status_code == 200


def test_create_requires_project():
    r = client.post("/api/quiz")
    assert r.status_code == 422


def test_create_rejects_requested_count_out_of_range():
    body = {
        "mode": "PRACTICE",
        "requested_count": 21,
        "version_hash": "test",
        "files": {"solution.py": "x = 1\n"},
    }
    r = client.post("/api/quiz?project=demo", json=body)
    assert r.status_code == 422


def test_create_accepts_arbitrary_count_up_to_20():
    body = {
        "mode": "PRACTICE",
        "requested_count": 7,
        "ratio": {"easy": 1, "normal": 1, "hard": 1},
        "version_hash": "test",
        "target_files": ["solution.py"],
        "files": {
            "solution.py": "def fib(n, memo={}):\n    if n <= 1:\n        return n\n    return fib(n-1)+fib(n-2)\n"
        },
    }
    r = client.post("/api/quiz?project=demo", json=body)
    assert r.status_code == 200


def test_create_and_status_mock():
    body = {
        "mode": "PRACTICE",
        "requested_count": 5,
        "ratio": {"easy": 1, "normal": 1, "hard": 1},
        "version_hash": "test",
        "target_files": ["solution.py"],
        "files": {
            "solution.py": "def fib(n, memo={}):\n    if n <= 1:\n        return n\n    return fib(n-1)+fib(n-2)\n"
        },
    }
    r = client.post("/api/quiz?project=demo", json=body)
    assert r.status_code == 200
    data = r.json()
    assert data["status"] in ("PENDING", "READY")  # TestClient는 동기적으로 background 돌릴 수 있음
    qid = data.get("quiz_set_id")
    if qid:
        s = client.get(f"/api/quiz/{qid}/status")
        assert s.status_code == 200
        assert s.json()["status"] in ("PENDING", "GENERATING", "READY", "FAILED")