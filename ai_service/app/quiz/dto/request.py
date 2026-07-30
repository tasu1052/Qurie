from enum import Enum

from pydantic import BaseModel, Field, field_validator, model_validator


class QuizMode(str, Enum):
    ASSESSMENT = "ASSESSMENT"
    PRACTICE = "PRACTICE"


class DifficultyRatio(BaseModel):
    """난이도 상대 비율(가중치). 합이 100일 필요 없음."""
    easy: int = Field(default=30, ge=0)
    normal: int = Field(default=50, ge=0)
    hard: int = Field(default=20, ge=0)

    @model_validator(mode="after")
    def not_all_zero(self):
        if self.easy + self.normal + self.hard <= 0:
            raise ValueError("easy/normal/hard 중 하나 이상은 0보다 커야 합니다")
        return self

    def to_counts(self, requested_count: int) -> dict[str, int]:
        t = self.easy + self.normal + self.hard
        raw = {
            "easy": requested_count * self.easy / t,
            "normal": requested_count * self.normal / t,
            "hard": requested_count * self.hard / t,
        }
        floors = {k: int(v) for k, v in raw.items()}
        remain = requested_count - sum(floors.values())
        order = sorted(raw.keys(), key=lambda k: raw[k] - floors[k], reverse=True)
        for i in range(remain):
            floors[order[i]] += 1
        return floors


class CreateQuizSetRequest(BaseModel):
    """POST /api/quiz?project=... body"""

    mode: QuizMode
    requested_count: int = Field(ge=1, le=20)
    ratio: DifficultyRatio = DifficultyRatio()
    user_prompt: str | None = Field(default=None, max_length=500)
    version_hash: str = Field(min_length=1, max_length=64)
    target_files: list[str] = Field(default_factory=list, max_length=20)
    # 필수. 기본값을 두면 필드를 생략했을 때 validator가 돌지 않아 그대로 통과한다.
    files: dict[str, str]

    @field_validator("user_prompt")
    @classmethod
    def strip_prompt(cls, v: str | None) -> str | None:
        if v is None:
            return None
        v = v.strip()
        return v or None

    @field_validator("target_files")
    @classmethod
    def normalize_paths(cls, v: list[str]) -> list[str]:
        return [p.strip().replace("\\", "/") for p in v if p.strip()]

    @field_validator("files")
    @classmethod
    def require_files(cls, v: dict[str, str]) -> dict[str, str]:
        """코드 없이는 출제하지 않는다.

        AI 서비스는 스냅샷 DB를 조회하지 않으므로 코드는 요청으로만 들어온다.
        비었을 때 임의의 기본 코드로 만들어 주면 의미 없는 문항이 정상 응답으로
        나가 호출자가 잘못을 눈치채지 못한다. 접수 단계에서 422로 막는다.

        경로는 target_files와 같은 규칙으로 정규화한다. 한쪽만 정규화하면
        "src\\a.py"와 "src/a.py"가 어긋나 대표 파일 선택이 빗나간다.
        """
        cleaned = {
            p.strip().replace("\\", "/"): c
            for p, c in v.items()
            if p.strip() and c.strip()
        }
        if not cleaned:
            raise ValueError(
                "files는 비울 수 없습니다. {파일경로: 파일내용} 형태로 코드를 보내세요")
        return cleaned
