# Qurie CI/CD 설정

EC2(`i15a604.p.ssafy.io`)의 Jenkins 컨트롤러 설정 메모. 잡은 두 개다.

| 잡 | 스크립트 | 트리거 | 하는 일 |
|---|---|---|---|
| `qurie-backend` | `Jenkinsfile` | GitLab master 푸시 | 테스트 → 이미지 빌드 → compose 재기동 → 헬스체크 |
| `qurie-frontend` | `Jenkinsfile.frontend` | GitLab master 푸시 | 설치 → lint → 빌드 → S3 업로드 → CloudFront 무효화 → 확인 |

잡을 나눈 이유는 백엔드 테스트가 깨졌을 때 프론트 배포까지 같이 막히지 않게 하려는 것이다.

---

## 프론트 잡 처음 붙일 때 (순서대로)

### 1. 배포 대상 확인 (이미 채워져 있음)

`Jenkinsfile.frontend` 의 environment 에 들어 있다. 파이프라인이 GitLab 의 master 를 체크아웃해서
돌기 때문에, 이 값을 바꾸면 **master 에 머지돼야** 반영된다.

| 변수 | 값 |
|---|---|
| `S3_BUCKET` | `qurie-app-476140239188-ap-northeast-2-an` |
| `CF_DISTRIBUTION_ID` | `E28OF28IVIMFW3` |
| `FRONT_URL` | `https://d3alq9m5x08xk2.cloudfront.net/` |

버킷이나 배포를 새로 만들면 다시 확인한다:

```bash
aws s3 ls
aws cloudfront list-distributions --query 'DistributionList.Items[].{id:Id,domain:DomainName}' --output table
```

### 2. Jenkins 이미지 재빌드 (Node 24 + AWS CLI v2 추가)

프론트 빌드에 필요한 `node`/`npm`/`aws` 가 Jenkins 컨테이너 안에 있어야 한다.
잡 설정과 빌드 이력은 `jenkins-home` 네임드 볼륨에 있어서 컨테이너를 다시 만들어도 남는다.

```bash
cd /home/ubuntu/S15P11A604 && git pull && cd jenkins && docker compose up -d --build
```

**빌드가 돌고 있는 중에는 실행하지 않는다.** 컨테이너가 재생성되면서 진행 중인 빌드가 끊긴다.

확인:

```bash
docker exec jenkins bash -c 'node -v && npm -v && aws --version'
```

### 3. IAM 사용자와 정책

배포 전용 IAM 사용자를 하나 만들고(예: `qurie-ci-deployer`) 액세스 키를 발급한다.
아래보다 넓은 권한(`AmazonS3FullAccess` 등)은 주지 않는다 — 키가 새면 계정의 버킷 전체가 노출된다.
아래 정책은 이 프로젝트 값이 이미 채워져 있어 그대로 붙여 쓸 수 있다.

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "ListBucketForSync",
      "Effect": "Allow",
      "Action": ["s3:ListBucket"],
      "Resource": "arn:aws:s3:::qurie-app-476140239188-ap-northeast-2-an"
    },
    {
      "Sid": "SyncObjects",
      "Effect": "Allow",
      "Action": ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"],
      "Resource": "arn:aws:s3:::qurie-app-476140239188-ap-northeast-2-an/*"
    },
    {
      "Sid": "Invalidate",
      "Effect": "Allow",
      "Action": ["cloudfront:CreateInvalidation", "cloudfront:GetInvalidation"],
      "Resource": "arn:aws:cloudfront::476140239188:distribution/E28OF28IVIMFW3"
    }
  ]
}
```

`s3:DeleteObject` 가 필요한 이유는 `aws s3 sync --delete` 로 옛 번들을 지우기 때문이다.
`cloudfront:GetInvalidation` 은 무효화 완료를 기다리는 데 쓴다.

### 4. Jenkins 자격증명 등록

Manage Jenkins → Credentials → System → Global credentials → Add Credentials.
둘 다 **Secret text** 로 넣는다(Kind 를 잘못 고르면 파이프라인이 자격증명을 못 찾는다).

| ID | 값 |
|---|---|
| `aws-access-key-id` | IAM 액세스 키 ID |
| `aws-secret-access-key` | IAM 시크릿 액세스 키 |

`mattermost-webhook` 은 백엔드 잡에서 쓰던 것을 그대로 재사용한다.

### 5. 잡 생성

New Item → 이름 `qurie-frontend` → **Pipeline**.

- **Build Triggers**: `Build when a change is pushed to GitLab` 체크
  - Advanced → `Allowed branches` → `master` 만 (MR 브랜치 푸시마다 배포되면 안 된다)
  - Advanced → `Secret token` → Generate (아래 6번에서 쓴다)
- **Pipeline**:
  - Definition: `Pipeline script from SCM`
  - SCM: Git, Repository URL 과 자격증명은 `qurie-backend` 잡과 동일
  - Branch: `*/master`
  - **Script Path: `Jenkinsfile.frontend`** ← 기본값 `Jenkinsfile` 그대로 두면 백엔드 파이프라인이 돈다

### 6. GitLab 웹훅 추가

웹훅 URL 은 잡마다 다르다. 백엔드 것과 별개로 하나 더 추가한다.

- Settings → Webhooks → Add new webhook
- URL: `https://i15a604.p.ssafy.io/jenkins/project/qurie-frontend`
- Secret token: 5번에서 생성한 값
- Trigger: **Push events** 만 체크, 브랜치 필터에 `master`

MR 을 master 로 머지하면 master 에 푸시 이벤트가 발생하므로 이 트리거로 잡힌다.

### 7. 확인

`Build Now` 로 한 번 수동 실행한다. 성공하면 매터모스트에 알림이 오고, 이후 master 머지마다 자동으로 돈다.

---

## CloudFront 구성 (프론트 배포 전제)

프론트와 API 는 **CloudFront 배포 하나**로 합쳐 same-origin 으로 서비스한다.
`AuthController` 가 쿠키를 `SameSite=Lax` 로 발급하기 때문에, 프론트가 CloudFront 도메인이고
API 가 EC2 도메인이면 cross-site 가 되어 브라우저가 XHR 에 쿠키를 싣지 않고 로그인 직후부터 401 이 된다.

| behavior | 오리진 | 캐시 정책 | 오리진 요청 정책 |
|---|---|---|---|
| `/api/*` | `i15a604.p.ssafy.io` (HTTPS 443) | `CachingDisabled` | `AllViewerExceptHostHeader` |
| `/ws` | `i15a604.p.ssafy.io` (HTTPS 443) | `CachingDisabled` | `AllViewerExceptHostHeader` |
| `Default (*)` | S3 버킷 (OAC) | `CachingOptimized` | — |

- 오리진 요청 정책이 `AllViewer*` 가 아니면 쿠키가 오리진까지 전달되지 않는다.
- Default behavior 에 403/404 → `/index.html` (200) **custom error response** 가 필요하다.
  없으면 초대 링크(`/signup?token=...`) 직접 접속이 404 가 된다 (SPA 라우팅).
- certbot 이 인증서를 받은 도메인 앞에 CloudFront 를 끼우면 HTTP-01 갱신이 깨진다.
  viewer 도메인은 `*.cloudfront.net` 이나 별도 서브도메인을 쓴다.
- CloudFront 도메인이 바뀌면 EC2 `.env` 의 `CORS_ALLOWED_ORIGIN_PATTERNS`,
  `WEBSOCKET_ALLOWED_ORIGIN_PATTERNS`, `FRONTEND_BASE_URL` 세 개를 맞추고 `docker compose up -d` 로 재기동한다(재빌드 불필요).

---

## 수동 배포

CI 와 완전히 같은 절차를 쓴다. 파이프라인은 이 스크립트를 호출할 뿐이다.

```bash
export AWS_ACCESS_KEY_ID=... AWS_SECRET_ACCESS_KEY=...
export S3_BUCKET=... CF_DISTRIBUTION_ID=...
bash scripts/deploy-frontend.sh   # 프론트
bash scripts/deploy.sh            # 백엔드
```

---

## 알아둘 것

- **Lint 는 배포를 막지 않는다.** 현재 `qurie/*` 디자인시스템 룰에서 에러 25개가 남아 있어
  게이트로 걸면 모든 배포가 멈춘다. 지금은 실패해도 빌드를 UNSTABLE 로만 표시하고 배포는 진행한다.
  룰 위반을 정리한 뒤 `Jenkinsfile.frontend` 의 `catchError` 를 지우면 게이트가 된다.
  에러가 남아 있는 동안은 **빌드가 매번 노란색(UNSTABLE)** 이 되는 것이 정상이다.
- **`Install` 스테이지를 지우지 말 것.** Lint 가 `node_modules` 를 필요로 한다.
  없으면 Lint 가 `eslint: not found`(exit 127)로 죽어서, 룰 위반 여부와 무관하게 항상 실패한다.
  설치를 여기서 한 번만 하려고 `Build & Deploy` 는 `SKIP_NPM_CI=1` 로 스크립트의 `npm ci` 를 건너뛴다.
  수동 실행(`bash scripts/deploy-frontend.sh`)에서는 그 변수가 없으므로 스크립트가 알아서 설치한다.
- **프론트에는 테스트 스테이지가 없다.** 테스트가 아직 없기 때문이고, 생기면 `Lint` 다음에 넣는다.
- **`VITE_YJS_WS_URL` 은 배포 빌드에서 설정되지 않는다.** 코드가 `ws://localhost:1234` 로 폴백하므로
  배포 환경에서 Yjs 실시간 협업은 동작하지 않는다. y-websocket 서버를 배포한 뒤
  `Jenkinsfile.frontend` 의 environment 에 한 줄 추가하면 된다.
- **프론트 변경이 없어도 master 푸시마다 프론트 잡이 돈다.** 빌드가 1분 안쪽이라 그대로 두었다.
  건너뛰고 싶으면 `git diff --name-only HEAD~1 HEAD -- frontend/` 로 걸러야 하는데,
  머지 커밋이 아닌 푸시에서 오판할 수 있어 넣지 않았다.
