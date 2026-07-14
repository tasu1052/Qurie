# 🌿 Git 협업 규칙 (S15P11A604)

## 1. 브랜치 전략

- `master` 브랜치는 **보호 브랜치**입니다. 누구도 직접 push하지 않습니다. (방장 포함)
- 모든 작업은 **브랜치를 생성한 뒤** 진행하고, **Merge Request(MR)** 를 통해서만 master에 합칩니다.

### 브랜치 이름 규칙

```
<타입>/<작업내용>
```

| 타입 | 용도 | 예시 |
|---|---|---|
| `feature/` | 새 기능 개발 | `feature/login`, `feature/main-page` |
| `fix/` | 버그 수정 | `fix/login-error` |
| `refactor/` | 기능 변화 없는 코드 정리 | `refactor/api-service` |
| `docs/` | 문서 작업 (README 등) | `docs/readme` |
| `chore/` | 설정, 빌드 등 잡무 | `chore/eslint-setup` |

- 작업 내용은 **영어 소문자 + 하이픈(-)** 으로 작성합니다.

## 2. 작업 흐름 (전원 공통)

```bash
# 1. 최신 master 받아오기
git switch master
git pull

# 2. 작업 브랜치 생성
git switch -c feature/login

# 3. 작업 후 커밋
git add .
git commit -m "feat: 로그인 페이지 구현"

# 4. 브랜치 push
git push -u origin feature/login
```

5. GitLab에서 `feature/login` → `master` 방향으로 **MR 생성**
6. 팀원 1명 이상 리뷰 후, **방장이 Merge**
7. merge 완료된 브랜치는 삭제, 다음 작업은 1번부터 다시

## 3. 커밋 메시지 규칙

```
<타입>: <제목>
```

| 타입 | 용도 |
|---|---|
| `feat` | 새 기능 추가 |
| `fix` | 버그 수정 |
| `refactor` | 리팩토링 |
| `style` | 코드 포맷팅, 세미콜론 등 (동작 변화 없음) |
| `docs` | 문서 수정 |
| `test` | 테스트 코드 |
| `chore` | 빌드, 설정 등 기타 |

- 제목은 **한글 OK**, 무엇을 했는지 명확하게 씁니다.
- 예: `feat: 회원가입 유효성 검사 추가`, `fix: 메인페이지 이미지 깨짐 수정`

## 4. Merge Request 규칙

- MR 제목: 커밋 규칙과 동일하게 `feat: 로그인 기능 구현` 형식
- MR 설명에 **무엇을, 왜** 변경했는지 간단히 작성
- **본인 MR은 본인이 merge하지 않습니다** → merge는 방장 담당
- 충돌(conflict)이 나면 **본인 브랜치에서** 해결 후 다시 push

## 5. 금지 사항 🚫

- `master`에 직접 push ❌
- 리뷰 없이 merge ❌
- 하나의 브랜치/MR에 여러 기능 몰아넣기 ❌ (기능 단위로 쪼개기)