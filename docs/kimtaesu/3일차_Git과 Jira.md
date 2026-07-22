# Git과 Jira 정리

# 1. Git

## 1.1 Git이란?

**Git**은 파일의 변경 이력을 기록하고 관리하는 **분산 버전 관리 시스템(Distributed Version Control System)**이다.

소프트웨어 개발 과정에서 코드가 언제, 어떻게 변경되었는지 추적할 수 있으며, 여러 개발자가 각자의 작업을 독립적으로 진행한 뒤 하나의 프로젝트로 합칠 수 있도록 도와준다.

Git은 단순히 코드를 저장하는 도구가 아니라 다음과 같은 작업을 가능하게 한다.

* 파일 변경 이력 관리
* 이전 버전으로 복구
* 여러 개발자 간 협업
* 브랜치를 활용한 독립적인 작업
* 코드 리뷰 및 Merge Request 연동
* CI/CD 파이프라인 연동

---

## 1.2 Git과 GitHub, GitLab의 차이

Git과 GitHub, GitLab은 같은 개념이 아니다.

### Git

로컬 컴퓨터에서 파일의 변경 이력을 관리하는 버전 관리 도구이다.

```text
Git
→ 버전 관리 프로그램
```

### GitHub / GitLab

Git 저장소를 인터넷에 보관하고 협업 기능을 제공하는 서비스이다.

```text
GitHub / GitLab
→ 원격 Git 저장소와 협업 기능을 제공하는 플랫폼
```

GitHub와 GitLab에서는 다음 기능을 사용할 수 있다.

* 원격 저장소
* Pull Request 또는 Merge Request
* 코드 리뷰
* 이슈 관리
* 프로젝트 관리
* CI/CD
* 사용자 및 권한 관리

---

## 1.3 Git의 효과

### 1. 버전 관리

파일이 변경된 시점과 내용을 기록할 수 있다.

```text
초기 코드
→ 로그인 기능 추가
→ 로그인 오류 수정
→ 현재 버전
```

필요한 경우 이전 상태로 돌아갈 수도 있다.

---

### 2. 협업 용이성

여러 개발자가 같은 프로젝트를 각자의 컴퓨터에서 작업할 수 있다.

각자의 변경 사항을 원격 저장소에 올리고 검토한 뒤 하나로 합칠 수 있다.

---

### 3. 브랜치를 통한 작업 분리

새로운 기능이나 버그 수정을 별도의 브랜치에서 진행할 수 있다.

```text
master
├── feature/login
├── feature/signup
└── fix/login-error
```

작업 중인 코드가 완성되지 않았더라도 기존 안정적인 코드에 영향을 주지 않는다.

---

### 4. 백업 및 복구

로컬 저장소와 원격 저장소에 코드와 변경 이력을 보관할 수 있다.

잘못된 작업을 수행했을 때 이전 커밋이나 브랜치를 기준으로 복구할 수 있다.

다만 Git이 모든 형태의 백업을 대신하는 것은 아니다.

커밋하거나 원격 저장소에 push하지 않은 파일은 손실될 수 있으므로 중요한 변경 사항은 반드시 커밋하거나 별도로 백업해야 한다.

---

### 5. 개발 도구와의 연동

GitHub나 GitLab과 연동하면 다음 기능을 사용할 수 있다.

* 코드 리뷰
* Merge Request
* Issue 관리
* 자동 테스트
* 자동 빌드
* 자동 배포
* 보안 검사

---

# 2. Git의 구조

Git은 일반적으로 다음 네 영역으로 구분할 수 있다.

```text
Working Directory
→ Staging Area
→ Local Repository
→ Remote Repository
```

---

## 2.1 Working Directory

**Working Directory**는 개발자가 실제로 파일을 생성하고 수정하는 작업 공간이다.

예를 들어 다음 파일을 수정하고 있다면 해당 파일은 Working Directory에 존재한다.

```text
src/
└── UserService.java
```

파일을 수정했지만 아직 `git add`를 수행하지 않았다면 변경 내용은 Working Directory에만 존재한다.

---

## 2.2 Staging Area

**Staging Area**는 다음 커밋에 포함할 변경 사항을 임시로 선택하는 영역이다.

다음 명령어를 실행하면 파일이 Staging Area에 추가된다.

```bash
git add UserService.java
```

모든 변경 사항을 추가하려면 다음 명령어를 사용할 수 있다.

```bash
git add .
```

또는 삭제된 파일까지 포함해 모든 변경 사항을 추가하려면 다음 명령어를 사용할 수 있다.

```bash
git add -A
```

Staging Area를 사용하는 이유는 여러 변경 사항 중 일부만 선택하여 커밋할 수 있기 때문이다.

예를 들어 로그인 기능과 README 수정이 함께 존재해도 로그인 기능만 먼저 커밋할 수 있다.

---

## 2.3 Local Repository

**Local Repository**는 자신의 컴퓨터에 존재하는 Git 저장소이다.

커밋을 수행하면 Staging Area에 있던 변경 사항이 Local Repository에 기록된다.

```bash
git commit -m "feat(login): 로그인 기능 구현"
```

Local Repository에는 다음 정보가 포함된다.

* 파일 변경 내용
* 커밋 이력
* 브랜치 정보
* 태그 정보
* 작성자 정보

---

## 2.4 Remote Repository

**Remote Repository**는 GitHub, GitLab과 같은 네트워크상의 원격 저장소이다.

로컬 저장소의 커밋을 다른 팀원들과 공유하기 위해 원격 저장소로 전송한다.

```bash
git push origin feature/login
```

원격 저장소의 변경 사항을 가져오려면 다음 명령어를 사용한다.

```bash
git pull origin master
```

---

# 3. Git의 기본 동작 흐름

Git의 기본적인 작업 흐름은 다음과 같다.

```text
1. Working Directory에서 파일 수정
2. git add로 Staging Area에 추가
3. git commit으로 Local Repository에 기록
4. git push로 Remote Repository에 전송
```

명령어로 표현하면 다음과 같다.

```bash
git add .
git commit -m "feat(login): 로그인 기능 구현"
git push origin feature/login
```

기존 설명에서 다음 표현은 정확하지 않다.

```text
작업 디렉토리의 변경 사항을 원격 저장소에 반영한다.
```

`git push`는 Working Directory의 파일을 직접 전송하는 것이 아니다.

정확하게는 **Local Repository에 기록된 커밋을 Remote Repository로 전송하는 것**이다.

```text
Working Directory
→ git add
→ Staging Area
→ git commit
→ Local Repository
→ git push
→ Remote Repository
```

---

# 4. 파일의 상태

Git에서 파일은 여러 상태를 가질 수 있다.

## Untracked

Git이 아직 추적하지 않는 새 파일이다.

```text
Untracked file
→ 새로 생성했지만 git add하지 않은 파일
```

---

## Modified

Git이 추적 중인 파일이 수정된 상태이다.

```text
Modified
→ 기존 파일의 내용이 변경됨
```

---

## Staged

변경 내용이 Staging Area에 추가된 상태이다.

```text
Staged
→ 다음 커밋에 포함될 예정
```

---

## Committed

변경 내용이 Local Repository에 기록된 상태이다.

```text
Committed
→ 커밋으로 저장 완료
```

파일 상태는 다음 명령어로 확인할 수 있다.

```bash
git status
```

---

# 5. 자주 사용하는 Git 명령어

## 저장소 생성

```bash
git init
```

현재 디렉토리를 Git 저장소로 만든다.

---

## 원격 저장소 복제

```bash
git clone <원격 저장소 주소>
```

원격 저장소의 파일과 커밋 이력을 로컬로 가져온다.

---

## 변경 상태 확인

```bash
git status
```

현재 브랜치와 변경된 파일 상태를 확인한다.

---

## 변경 내용 확인

```bash
git diff
```

Working Directory와 Staging Area 사이의 변경 내용을 확인한다.

스테이징된 변경 내용을 확인하려면 다음 명령어를 사용한다.

```bash
git diff --staged
```

---

## 변경 사항 추가

```bash
git add <파일명>
```

```bash
git add .
```

---

## 커밋 생성

```bash
git commit -m "커밋 메시지"
```

---

## 원격 저장소에 전송

```bash
git push origin <브랜치명>
```

---

## 원격 변경 사항 가져오기

```bash
git pull origin master
```

`git pull`은 내부적으로 다음 두 작업을 수행한다.

```text
git fetch
+
git merge
```

설정에 따라 merge 대신 rebase를 수행하도록 지정할 수도 있다.

---

## 원격 정보만 가져오기

```bash
git fetch origin
```

원격 저장소의 변경 이력을 가져오지만 현재 브랜치에 자동으로 합치지는 않는다.

---

## 브랜치 목록 확인

```bash
git branch
```

원격 브랜치까지 함께 확인하려면 다음과 같이 실행한다.

```bash
git branch -a
```

---

## 브랜치 생성 및 이동

```bash
git switch -c feature/login
```

기존 브랜치로 이동하려면 다음과 같이 실행한다.

```bash
git switch master
```

---

## 브랜치 병합

```bash
git merge feature/login
```

현재 브랜치에 다른 브랜치의 변경 사항을 합친다.

---

# 6. Git Hooks

## 6.1 Git Hooks란?

**Git Hooks**는 Git에서 특정 이벤트가 발생할 때 자동으로 실행되는 스크립트이다.

예를 들어 커밋 직전에 코드 스타일을 검사하거나, push 전에 테스트를 실행하도록 설정할 수 있다.

```text
Git 이벤트 발생
→ Hook 실행
→ 검사 또는 자동화 작업 수행
```

Git Hooks는 다음과 같은 목적으로 사용된다.

* 코드 스타일 검사
* 테스트 자동 실행
* 커밋 메시지 형식 검사
* 보안 정보 포함 여부 검사
* 잘못된 코드 push 방지

---

## 6.2 주요 Git Hooks

### pre-commit Hook

커밋이 생성되기 전에 실행된다.

주로 다음 작업에 사용된다.

* 코드 포맷 검사
* 린트 검사
* 테스트 실행
* 민감 정보 검사

검사에 실패하면 커밋을 중단시킬 수 있다.

---

### commit-msg Hook

커밋 메시지가 생성된 직후 실행된다.

팀에서 정한 커밋 메시지 형식을 검사할 때 사용한다.

예:

```text
feat(login): 로그인 기능 구현
```

규칙에 맞지 않는 메시지를 차단할 수 있다.

---

### pre-push Hook

원격 저장소에 push하기 직전에 실행된다.

다음과 같은 작업을 수행할 수 있다.

* 전체 테스트 실행
* 빌드 성공 여부 확인
* 정적 분석 수행
* 특정 브랜치로 직접 push하는 행위 차단

---

## 6.3 Git Hooks의 주의점

기본 Git Hooks는 `.git/hooks` 디렉토리에 저장된다.

```text
.git/
└── hooks/
```

`.git` 디렉토리 내부 파일은 일반적으로 Git 저장소에 커밋되지 않는다.

따라서 팀원에게 자동으로 공유되지 않는다.

팀 단위로 Hooks를 공유하려면 다음과 같은 도구를 사용할 수 있다.

* Husky
* Lefthook
* pre-commit
* 별도의 스크립트 및 설정 파일

---

# 7. Git 고급 명령어

## 7.1 Rebase

### Rebase란?

**Rebase**는 현재 브랜치의 커밋 시작점을 다른 브랜치의 최신 커밋으로 옮기는 작업이다.

예를 들어 다음과 같은 이력이 있다고 가정한다.

```text
A---B---C master
     \
      D---E feature
```

feature 브랜치에서 master를 기준으로 rebase하면 다음과 같은 형태가 된다.

```text
A---B---C master
         \
          D'---E' feature
```

기존의 `D`, `E` 커밋을 그대로 이동하는 것이 아니라 새로운 커밋 `D'`, `E'`가 생성된다.

즉, Rebase는 커밋 이력을 다시 작성한다.

---

### Rebase의 사용 목적

* 커밋 히스토리를 일직선으로 정리
* 최신 master를 자신의 브랜치에 반영
* 불필요한 merge commit 감소
* 커밋 순서 및 내용 정리

---

### 기본 사용법

feature 브랜치에서 최신 master를 반영하려면 다음과 같이 실행할 수 있다.

```bash
git switch feature/login
git fetch origin
git rebase origin/master
```

---

### Rebase 충돌 해결

Rebase 도중 충돌이 발생하면 다음 명령어로 확인한다.

```bash
git status
```

충돌 파일을 수정한 뒤 다음과 같이 진행한다.

```bash
git add <충돌 해결한 파일>
git rebase --continue
```

Rebase를 취소하려면 다음 명령어를 사용한다.

```bash
git rebase --abort
```

---

### Rebase 주의사항

이미 원격 저장소에 공유되어 여러 사람이 사용하는 커밋을 함부로 Rebase하면 안 된다.

Rebase는 커밋 ID를 변경하기 때문에 다른 팀원의 작업 이력과 충돌할 수 있다.

```text
개인 작업 브랜치
→ Rebase 사용 가능

여러 사람이 공유하는 master 또는 공용 브랜치
→ 함부로 Rebase하면 안 됨
```

Rebase 후 이미 push한 브랜치를 다시 올리려면 강제 push가 필요할 수 있다.

```bash
git push --force-with-lease
```

일반적인 `--force`보다 `--force-with-lease`가 상대적으로 안전하다.

---

## 7.2 Interactive Rebase

**Interactive Rebase**는 여러 커밋을 직접 선택하여 수정하거나 정리하는 기능이다.

```bash
git rebase -i HEAD~3
```

최근 3개의 커밋을 대상으로 작업한다.

주요 명령은 다음과 같다.

| 명령       | 의미                    |
| -------- | --------------------- |
| `pick`   | 커밋 유지                 |
| `reword` | 커밋 메시지 수정             |
| `edit`   | 커밋 내용 수정              |
| `squash` | 이전 커밋과 합치고 메시지도 수정    |
| `fixup`  | 이전 커밋과 합치고 현재 메시지는 버림 |
| `drop`   | 커밋 삭제                 |

예를 들어 다음처럼 여러 개로 나뉜 커밋을 하나로 합칠 수 있다.

```text
로그인 화면 생성
로그인 버튼 수정
로그인 스타일 수정
```

```text
feat(login): 로그인 화면 구현
```

---

### `--preserve-merges`에 대한 수정

과거에는 merge commit을 유지하면서 Rebase하기 위해 다음 옵션을 사용했다.

```bash
git rebase --preserve-merges
```

하지만 현재는 해당 옵션이 더 이상 권장되지 않으며, 일반적으로 다음 옵션을 사용한다.

```bash
git rebase --rebase-merges
```

---

## 7.3 Cherry-pick

### Cherry-pick이란?

**Cherry-pick**은 다른 브랜치의 특정 커밋 하나 또는 여러 개만 현재 브랜치에 적용하는 기능이다.

브랜치 전체를 merge하지 않고 필요한 변경 사항만 가져올 때 사용한다.

```bash
git cherry-pick <커밋 해시>
```

예:

```bash
git cherry-pick a1b2c3d
```

---

### 사용 예시

```text
develop 브랜치
├── 기능 A
├── 기능 B
└── 긴급 버그 수정
```

release 브랜치에 기능 A와 기능 B는 필요 없고 긴급 버그 수정만 필요하다면 해당 커밋만 Cherry-pick할 수 있다.

---

### 여러 커밋 적용

```bash
git cherry-pick <커밋1> <커밋2>
```

연속된 범위의 커밋을 적용할 수도 있다.

```bash
git cherry-pick A^..B
```

---

### Cherry-pick 충돌 해결

충돌이 발생하면 파일을 수정한 뒤 다음과 같이 진행한다.

```bash
git add <충돌 해결한 파일>
git cherry-pick --continue
```

작업을 취소하려면 다음 명령어를 사용한다.

```bash
git cherry-pick --abort
```

---

### Cherry-pick 주의사항

Cherry-pick은 기존 커밋과 동일한 내용을 가진 새로운 커밋을 생성한다.

따라서 같은 변경 사항을 여러 브랜치에 반복적으로 Cherry-pick하면 이력이 복잡해질 수 있다.

이후 해당 브랜치들을 merge할 때 중복된 변경 사항으로 인해 충돌이 발생할 가능성도 있다.

---

## 7.4 Reflog

### Reflog란?

**Reflog**는 로컬 저장소에서 HEAD와 브랜치가 이동한 기록을 확인하는 기능이다.

다음과 같은 작업을 추적할 수 있다.

* 커밋 이동
* 브랜치 전환
* Rebase
* Reset
* Merge
* 삭제된 브랜치의 과거 커밋

```bash
git reflog
```

출력 예시:

```text
a1b2c3d HEAD@{0}: commit: 로그인 기능 구현
e4f5g6h HEAD@{1}: checkout: moving from master to feature/login
h7i8j9k HEAD@{2}: commit: 회원가입 기능 구현
```

---

### Reflog 활용 예시

실수로 다음 명령어를 실행했다고 가정한다.

```bash
git reset --hard HEAD~2
```

최근 커밋 두 개가 사라진 것처럼 보일 수 있다.

이때 Reflog로 이전 커밋을 확인한다.

```bash
git reflog
```

복구할 커밋 해시를 찾은 뒤 새 브랜치를 생성할 수 있다.

```bash
git switch -c recovery-branch <커밋 해시>
```

또는 해당 커밋으로 돌아갈 수도 있다.

```bash
git reset --hard <커밋 해시>
```

---

### Reflog 주의사항

Reflog는 기본적으로 로컬 저장소에서만 관리된다.

원격 저장소에 push되지 않으며, 다른 팀원의 Reflog를 확인할 수 없다.

또한 Reflog 기록은 영구적으로 유지되는 것이 아니며 일정 기간이 지나면 삭제될 수 있다.

---

## 7.5 Reset과 Revert

### Reset

브랜치의 현재 위치를 과거 커밋으로 이동한다.

```bash
git reset --soft HEAD~1
git reset --mixed HEAD~1
git reset --hard HEAD~1
```

| 옵션        | 커밋 취소 | Staging Area | Working Directory |
| --------- | ----- | ------------ | ----------------- |
| `--soft`  | 취소    | 유지           | 유지                |
| `--mixed` | 취소    | 초기화          | 유지                |
| `--hard`  | 취소    | 초기화          | 초기화               |

`--hard`는 수정 중인 파일까지 삭제할 수 있으므로 주의해야 한다.

---

### Revert

기존 커밋을 삭제하지 않고, 해당 변경을 되돌리는 새로운 커밋을 생성한다.

```bash
git revert <커밋 해시>
```

이미 원격 저장소에 공유된 커밋을 취소할 때는 일반적으로 `reset`보다 `revert`가 안전하다.

```text
reset
→ 기존 커밋 이력을 변경

revert
→ 기존 커밋은 유지하고 되돌리는 커밋 추가
```

---

# 8. Git 충돌

## 8.1 충돌이란?

두 브랜치가 같은 파일의 같은 부분을 서로 다르게 수정하면 Git이 어떤 내용을 선택해야 할지 판단하지 못할 수 있다.

이를 **Merge Conflict**라고 한다.

충돌 파일에는 다음과 같은 표시가 생긴다.

```text
<<<<<<< HEAD
현재 브랜치의 내용
=======
합치려는 브랜치의 내용
>>>>>>> feature/login
```

개발자가 필요한 내용을 선택하거나 두 내용을 합친 뒤 충돌 표시를 삭제해야 한다.

---

## 8.2 충돌 해결 과정

```bash
git status
```

충돌 파일을 수정한 뒤 다음과 같이 실행한다.

```bash
git add <충돌 해결한 파일>
git commit
```

Rebase 중이라면 다음 명령어를 사용한다.

```bash
git rebase --continue
```

---

# 9. Jira

## 9.1 이슈 관리란?

소프트웨어 개발 프로젝트에서는 기능 개발, 오류 수정, 문서 작성 등의 작업 단위를 **이슈(Issue)**라고 한다.

**이슈 관리**는 이러한 작업을 생성하고, 담당자를 지정하고, 진행 상태와 우선순위를 추적하는 활동이다.

예를 들어 다음 작업들이 각각 하나의 이슈가 될 수 있다.

```text
회원가입 기능 구현
로그인 오류 수정
배포 서버 구축
README 작성
```

이슈 관리를 통해 팀원들은 다음 내용을 파악할 수 있다.

* 누가 작업을 담당하는지
* 현재 어떤 작업이 진행 중인지
* 어떤 작업이 완료되었는지
* 어떤 작업이 지연되고 있는지
* 다음에 어떤 작업을 해야 하는지

---

## 9.2 Jira Software란?

**Jira Software**는 Atlassian에서 제공하는 이슈 추적 및 프로젝트 관리 도구이다.

애자일 개발 방식인 Scrum과 Kanban을 지원하며 다음과 같은 기능을 제공한다.

* 이슈 생성 및 관리
* 담당자 지정
* 우선순위 설정
* 진행 상태 추적
* Sprint 관리
* Backlog 관리
* Roadmap
* 통계 및 보고서
* GitLab, GitHub, Confluence 연동

---

# 10. Jira 주요 용어

## 10.1 Project

**Project**는 관련된 이슈들을 관리하는 최상위 단위이다.

예를 들어 화상회의 프로젝트를 관리한다면 다음과 같은 Project를 만들 수 있다.

```text
Project: WebRTC 화상회의 플랫폼
```

프로젝트 안에 기능 개발, 버그 수정, 배포 작업 등의 여러 이슈가 포함된다.

---

## 10.2 Issue

**Issue**는 프로젝트에서 관리하는 하나의 작업 단위이다.

예:

```text
로그인 API 구현
채팅 UI 개발
TURN 서버 구축
화상회의 연결 오류 수정
```

---

## 10.3 Backlog

**Backlog**는 아직 Sprint에 포함되지 않았거나 앞으로 수행해야 할 이슈들을 모아놓은 공간이다.

Backlog에서는 다음 정보를 정리할 수 있다.

* 작업 우선순위
* 담당자
* Story Point
* Epic
* Sprint 배정 여부

---

## 10.4 Project Lead

**Project Lead**는 프로젝트의 대표 관리자 역할을 담당하는 사용자이다.

프로젝트 설정, 기본 담당자, 권한 관리 등에 관여할 수 있다.

실제 역할과 권한은 Jira 설정에 따라 다를 수 있다.

---

## 10.5 Reporter

**Reporter**는 이슈를 생성하거나 보고한 사용자이다.

예를 들어 테스트 중 오류를 발견한 사람이 Bug 이슈를 생성하면 해당 사용자가 Reporter가 된다.

---

## 10.6 Assignee

**Assignee**는 해당 이슈를 실제로 처리하는 담당자이다.

```text
Reporter: 오류를 발견하고 등록한 사람
Assignee: 오류를 수정하는 사람
```

---

## 10.7 Watcher

**Watcher**는 특정 이슈의 변경 사항을 지켜보는 사용자이다.

이슈의 상태, 댓글, 담당자 등이 변경되면 알림을 받을 수 있다.

Watcher라고 해서 해당 작업의 담당자는 아니다.

---

## 10.8 Status

**Status**는 이슈가 현재 어느 단계에 있는지를 나타낸다.

예:

```text
To Do
→ In Progress
→ Code Review
→ Done
```

팀에 따라 다음과 같이 구성할 수도 있다.

```text
할 일
→ 진행 중
→ 검토 중
→ 완료
```

---

## 10.9 Transition

**Transition**은 이슈의 Status를 다른 상태로 변경하는 동작이다.

예를 들어 다음 상태 변경이 Transition이다.

```text
To Do → In Progress
In Progress → Code Review
Code Review → Done
```

모든 상태에서 아무 상태로 이동할 수 있는 것은 아니며, Workflow 설정에 따라 가능한 Transition이 결정된다.

---

## 10.10 Resolution

**Resolution**은 이슈가 어떤 방식으로 종료되었는지를 나타내는 값이다.

예:

* Fixed
* Done
* Duplicate
* Won't Do
* Cannot Reproduce

Status가 `Done`이라고 해서 Resolution이 항상 자동으로 설정되는 것은 아니다.

Jira Workflow 설정에서 완료 상태로 전환할 때 Resolution을 지정하도록 구성해야 한다.

진행 중인 이슈의 Resolution은 일반적으로 비어 있어야 한다.

---

## 10.11 Priority

**Priority**는 이슈의 중요도나 긴급도를 나타낸다.

예:

```text
Highest
High
Medium
Low
Lowest
```

긴급한 오류와 단순한 디자인 수정은 서로 다른 우선순위를 가질 수 있다.

---

## 10.12 Label

**Label**은 이슈를 분류하기 위해 붙이는 태그이다.

예:

```text
backend
frontend
infra
webrtc
urgent
```

Label을 사용하면 관련 이슈를 검색하거나 필터링하기 쉽다.

---

## 10.13 Component

**Component**는 프로젝트 내부의 기능 영역이나 모듈을 구분하기 위한 단위이다.

예:

```text
Frontend
Backend
AI
Infrastructure
WebRTC
```

Label보다 프로젝트 구조에 가까운 분류 방식으로 사용할 수 있다.

---

## 10.14 Story Point

**Story Point**는 작업에 필요한 시간 자체가 아니라, 작업의 상대적인 규모와 복잡도, 불확실성을 나타내는 값이다.

Story Point를 정할 때는 다음 요소를 함께 고려한다.

* 작업량
* 기술적 복잡도
* 위험 요소
* 불확실성

Story Point는 반드시 1부터 5까지만 사용하는 것은 아니다.

Scrum 팀에서는 다음과 같은 Fibonacci 형태를 많이 사용한다.

```text
1, 2, 3, 5, 8, 13
```

예:

```text
로그인 버튼 색상 수정: 1 Point
회원가입 API 구현: 3 Point
WebRTC 다자간 연결 구축: 8 Point
```

Story Point를 시간으로 정확하게 환산하면 안 된다.

```text
1 Point = 1시간
```

처럼 고정해서 사용하는 개념은 아니다.

팀원들이 작업의 상대적인 크기를 비교하기 위한 단위이다.

---

# 11. Jira Issue 유형

## 11.1 Epic

**Epic**은 여러 개의 Story나 Task로 나눌 수 있는 큰 규모의 작업 단위이다.

예:

```text
Epic: 화상회의 기능
```

하위 작업은 다음처럼 구성할 수 있다.

```text
Story: 회의방 생성
Story: 카메라 및 마이크 연결
Story: 화면 공유
Story: 참가자 초대
```

Epic은 일반적으로 하나의 Sprint 안에 끝나지 않을 수 있다.

---

## 11.2 Story

**Story**는 사용자에게 가치를 제공하는 기능 단위이다.

일반적으로 다음과 같은 형식으로 작성할 수 있다.

```text
사용자로서,
회의방에 입장하기 위해,
초대 링크를 통해 접속할 수 있다.
```

예:

```text
사용자는 이메일과 비밀번호로 로그인할 수 있다.
사용자는 회의방을 생성할 수 있다.
사용자는 다른 참가자의 영상을 볼 수 있다.
```

Story는 사용자 관점의 기능을 나타내는 경우가 많다.

---

## 11.3 Task

**Task**는 Story와 직접 연결되지 않더라도 수행해야 하는 일반적인 작업 단위이다.

예:

```text
Docker Compose 구성
GitLab CI/CD 설정
README 작성
개발 서버 구축
```

Task와 Story의 구분 방식은 팀 규칙에 따라 달라질 수 있다.

---

## 11.4 Bug

**Bug**는 시스템이 의도한 대로 동작하지 않는 오류나 결함을 나타낸다.

예:

```text
로그인 성공 후 메인 화면으로 이동하지 않음
회의방 입장 시 카메라가 표시되지 않음
특정 브라우저에서 음성이 들리지 않음
```

---

## 11.5 Sub-task

**Sub-task**는 Story, Task 또는 Bug와 같은 상위 이슈를 더 작은 작업으로 나눈 하위 작업이다.

예:

```text
Story: 로그인 기능 구현

Sub-task:
- 로그인 화면 구현
- 로그인 API 구현
- 로그인 유효성 검사
- 로그인 테스트 작성
```

Sub-task는 단독으로 Epic에 직접 연결하기보다 상위 이슈에 포함되는 형태로 사용하는 경우가 많다.

---

# 12. Epic, Story, Task, Sub-task 관계

```text
Epic
└── Story
    ├── Sub-task
    ├── Sub-task
    └── Sub-task
```

또는 다음처럼 구성할 수 있다.

```text
Epic
├── Story
├── Story
├── Task
└── Bug
```

예시:

```text
Epic: WebRTC 화상회의

Story: 회의방 생성
├── Sub-task: 회의방 생성 API
├── Sub-task: 회의방 생성 화면
└── Sub-task: 회의방 생성 테스트

Story: 영상 연결
├── Sub-task: getUserMedia 구현
├── Sub-task: SDP 교환 구현
└── Sub-task: ICE Candidate 교환 구현

Task: TURN 서버 구축

Bug: 두 번째 참가자의 음성이 들리지 않음
```

---

# 13. Scrum 관련 용어

## 13.1 Sprint

**Sprint**는 팀이 일정 기간 동안 선택한 이슈를 집중적으로 처리하는 개발 주기이다.

일반적으로 1주에서 4주 단위로 운영한다.

예:

```text
Sprint 1: 회원가입 및 로그인
Sprint 2: 회의방 생성 및 입장
Sprint 3: WebRTC 영상 연결
```

Sprint 기간은 프로젝트 도중 자주 변경하기보다 팀이 정한 주기를 유지하는 것이 좋다.

---

## 13.2 Sprint Backlog

**Sprint Backlog**는 현재 Sprint에서 처리하기로 선택한 이슈들의 목록이다.

전체 Backlog 중 이번 Sprint에 완료할 작업만 포함한다.

---

## 13.3 Sprint Planning

Sprint를 시작하기 전에 팀이 다음 내용을 결정하는 회의이다.

* 이번 Sprint의 목표
* 처리할 이슈
* Story Point
* 담당자
* 작업 우선순위

---

## 13.4 Daily Scrum

팀원들이 짧게 진행 상황을 공유하는 회의이다.

주로 다음 내용을 공유한다.

```text
어제 한 일
오늘 할 일
현재 막힌 점
```

문제 해결 회의라기보다 현재 상태를 빠르게 공유하는 것이 목적이다.

---

## 13.5 Sprint Review

Sprint가 끝난 뒤 실제로 완성한 기능을 확인하고 시연하는 과정이다.

완료한 결과물이 요구사항을 충족하는지 검토한다.

---

## 13.6 Sprint Retrospective

Sprint 진행 방식을 돌아보고 다음 Sprint에서 개선할 점을 정리하는 회의이다.

예:

```text
잘한 점
아쉬운 점
다음 Sprint에서 개선할 점
```

---

# 14. Kanban Board

Jira에서는 이슈 상태를 보드 형태로 관리할 수 있다.

```text
To Do
→ In Progress
→ Code Review
→ Done
```

예:

| To Do      | In Progress | Code Review | Done       |
| ---------- | ----------- | ----------- | ---------- |
| 회원가입 API   | 로그인 UI      | 회의방 생성 API  | 프로젝트 초기 설정 |
| TURN 서버 구축 | WebRTC 연결   |             |            |

이슈 상태가 변경되면 보드에서 카드를 다음 열로 이동시킨다.

---

# 15. Jira Workflow

**Workflow**는 이슈가 생성된 뒤 완료될 때까지 거치는 상태와 전환 규칙이다.

예:

```text
To Do
→ In Progress
→ Code Review
→ Done
```

코드 리뷰에서 문제가 발견되면 다시 진행 중 상태로 이동할 수 있다.

```text
Code Review
→ In Progress
```

팀 상황에 따라 다음과 같은 상태도 추가할 수 있다.

* Blocked
* Testing
* Ready for Review
* Reopened

상태를 너무 많이 만들면 관리가 복잡해질 수 있으므로 실제 팀이 사용하는 단계만 구성하는 것이 좋다.

---