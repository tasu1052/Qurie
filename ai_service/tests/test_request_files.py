import os
os.environ["AI_MOCK"] = "1"

import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError

from app.main import app
from app.quiz.dto.request import CreateQuizSetRequest

client = TestClient(app)

BODY = {
    "mode": "PRACTICE",
    "requested_count": 3,
    "version_hash": "test",
    "files": {"solution.py": "x = 1\n"},
}


def _body(**over):
    b = dict(BODY)
    b.update(over)
    return b


def test_rejects_missing_files():
    """코드 없이 요청하면 더미로 만들지 말고 접수 자체를 거절한다."""
    body = _body()
    body.pop("files")
    r = client.post("/api/quiz?project=demo", json=body)
    assert r.status_code == 422


def test_rejects_empty_files():
    r = client.post("/api/quiz?project=demo", json=_body(files={}))
    assert r.status_code == 422


def test_rejects_blank_content():
    r = client.post("/api/quiz?project=demo", json=_body(files={"a.py": "   \n"}))
    assert r.status_code == 422


def test_accepts_real_files():
    r = client.post("/api/quiz?project=demo", json=_body())
    assert r.status_code == 200


def test_error_message_explains_what_to_send():
    with pytest.raises(ValidationError) as e:
        CreateQuizSetRequest(mode="PRACTICE", requested_count=3,
                             version_hash="t", files={})
    assert "files는 비울 수 없습니다" in str(e.value)


def test_file_paths_normalized_like_target_files():
    """target_files만 정규화하면 대표 파일 선택이 빗나간다."""
    req = CreateQuizSetRequest(
        mode="PRACTICE", requested_count=3, version_hash="t",
        target_files=["src\\solution.py"],
        files={"src\\solution.py": "x = 1\n"},
    )
    assert req.target_files == ["src/solution.py"]
    assert list(req.files) == ["src/solution.py"]

    from app.engine.factory import pick_primary
    assert pick_primary(req, req.files) == "src/solution.py"
