import os
os.environ["AI_MOCK"] = "1"

import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError

from app.core import config
from app.main import app
from app.quiz import callback as cb
from app.quiz.dto.request import CreateQuizSetRequest
from app.quiz.job_runner import QuizJobRunner
from app.quiz.repository import QuizRepository

client = TestClient(app)

BODY = {
    "mode": "PRACTICE",
    "requested_count": 3,
    "version_hash": "test",
    "files": {"solution.py": "x = 1\ny = 2\n"},
}


class _Resp:
    def __init__(self, status_code):
        self.status_code = status_code


@pytest.fixture(autouse=True)
def _no_sleep(monkeypatch):
    monkeypatch.setattr(config, "CALLBACK_BACKOFF_SEC", 0)


@pytest.fixture
def sent(monkeypatch):
    """httpx.post를 가로채 호출 내역을 모은다 (네트워크 없음)."""
    calls = []

    def fake_post(url, json=None, headers=None, timeout=None):
        calls.append({"url": url, "json": json, "headers": headers or {}})
        return _Resp(204)

    monkeypatch.setattr(cb.httpx, "post", fake_post)
    return calls


# --- notify() 단위 ---------------------------------------------------------

def test_sends_secret_header_when_configured(sent, monkeypatch):
    """헤더 이름은 백엔드 QuizController가 읽는 값과 정확히 같아야 한다."""
    monkeypatch.setattr(config, "CALLBACK_SECRET", "s3cret")
    assert cb.notify("https://back/hook", {"a": 1}) is True
    assert sent[0]["headers"]["X-Ai-Callback-Secret"] == "s3cret"


def test_omits_secret_header_when_not_configured(sent, monkeypatch):
    monkeypatch.setattr(config, "CALLBACK_SECRET", "")
    cb.notify("https://back/hook", {"a": 1})
    assert "X-Ai-Callback-Secret" not in sent[0]["headers"]


def test_accepts_204_no_content(monkeypatch):
    """백엔드 콜백 엔드포인트는 204를 반환한다."""
    monkeypatch.setattr(cb.httpx, "post", lambda *a, **k: _Resp(204))
    assert cb.notify("https://back/hook", {"a": 1}) is True


def test_no_retry_on_success(sent):
    cb.notify("https://back/hook", {"a": 1})
    assert len(sent) == 1


def test_retries_then_gives_up_on_server_error(monkeypatch):
    calls = []
    monkeypatch.setattr(cb.httpx, "post",
                        lambda *a, **k: (calls.append(1), _Resp(500))[1])
    assert cb.notify("https://back/hook", {"a": 1}) is False
    assert len(calls) == config.CALLBACK_RETRIES


def test_unauthorized_is_not_retried_forever(monkeypatch):
    """비밀 값이 어긋나면 백엔드가 401을 준다. 재시도해도 통과할 수 없으니 상한에서 끝난다."""
    calls = []
    monkeypatch.setattr(cb.httpx, "post",
                        lambda *a, **k: (calls.append(1), _Resp(401))[1])
    assert cb.notify("https://back/hook", {"a": 1}) is False
    assert len(calls) == config.CALLBACK_RETRIES


def test_network_error_does_not_raise(monkeypatch):
    def boom(*a, **k):
        raise ConnectionError("연결 거부")

    monkeypatch.setattr(cb.httpx, "post", boom)
    assert cb.notify("https://back/hook", {"a": 1}) is False  # 예외가 새지 않는다


# --- 요청 검증 -------------------------------------------------------------

def test_callback_url_is_optional():
    assert CreateQuizSetRequest(**BODY).callback_url is None


def test_rejects_non_http_scheme():
    with pytest.raises(ValidationError) as e:
        CreateQuizSetRequest(**BODY, callback_url="ftp://back/hook")
    assert "http:// 또는 https://" in str(e.value)


def test_blank_url_becomes_none():
    assert CreateQuizSetRequest(**BODY, callback_url="   ").callback_url is None


def test_api_rejects_bad_callback_url():
    body = dict(BODY, callback_url="not-a-url")
    assert client.post("/api/quiz?project=demo", json=body).status_code == 422


def test_accepts_backend_callback_url_shape():
    """백엔드가 실제로 보내는 형태: {base}/api/quiz/{quizSetId}/callback"""
    url = "http://localhost:8080/api/quiz/42/callback"
    assert CreateQuizSetRequest(**BODY, callback_url=url).callback_url == url


# --- job_runner 연동 -------------------------------------------------------

def _run(body_dict):
    repo = QuizRepository()
    qid = repo.new_id()
    QuizJobRunner(repo).run(qid, "demo", CreateQuizSetRequest(**body_dict))
    return qid, repo


def test_no_callback_when_url_absent(sent):
    _run(BODY)
    assert sent == []


def test_posts_result_to_callback_url(sent):
    """MOCK 모드는 보기 셔플이 랜덤이라 승인 개수가 매번 다르다.
    따라서 결과값 자체가 아니라 '저장된 것과 보낸 것이 같은지'를 검증한다."""
    qid, repo = _run(dict(BODY, callback_url="https://back/hook"))
    record = repo.get(qid)

    assert len(sent) == 1
    assert sent[0]["url"] == "https://back/hook"
    payload = sent[0]["json"]
    assert payload["quiz_set_id"] == qid
    assert payload["project"] == "demo"
    assert payload["status"] == record.status
    assert payload["status"] in ("READY", "FAILED")  # 종료 상태만 통보한다
    assert len(payload["quizzes"]) == len(record.quizzes)
    # GET /status와 같은 스키마여야 백엔드가 파싱 코드를 재사용할 수 있다
    assert set(payload) == {"project", "quiz_set_id", "status", "quizzes",
                            "rejected", "meter", "error_message"}


def test_payload_is_json_serializable(sent):
    import json

    _run(dict(BODY, callback_url="https://back/hook"))
    json.dumps(sent[0]["json"])  # 예외 없이 직렬화되어야 한다


def test_callback_failure_does_not_lose_the_result(monkeypatch):
    """수신 측이 죽어 있어도 결과는 저장돼 조회 가능해야 한다."""
    monkeypatch.setattr(cb.httpx, "post",
                        lambda *a, **k: (_ for _ in ()).throw(ConnectionError()))
    qid, repo = _run(dict(BODY, callback_url="https://back/hook"))

    record = repo.get(qid)
    assert record is not None
    assert record.status in ("READY", "FAILED")
    assert record.meter  # 파이프라인이 실제로 돌았고 기록이 남아 있다
