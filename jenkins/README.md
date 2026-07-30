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
| `/yjs/*` | `i15a604.p.ssafy.io` (HTTPS 443) | `CachingDisabled` | `AllViewerExceptHostHeader` |
| `Default (*)` | S3 버킷 (OAC) | `CachingOptimized` | — |

- 오리진 요청 정책이 `AllViewer*` 가 아니면 쿠키가 오리진까지 전달되지 않는다.
- Default behavior 에 403/404 → `/index.html` (200) **custom error response** 가 필요하다.
  없으면 초대 링크(`/signup?token=...`) 직접 접속이 404 가 된다 (SPA 라우팅).
- certbot 이 인증서를 받은 도메인 앞에 CloudFront 를 끼우면 HTTP-01 갱신이 깨진다.
  viewer 도메인은 `*.cloudfront.net` 이나 별도 서브도메인을 쓴다.
- CloudFront 도메인이 바뀌면 EC2 `.env` 의 `CORS_ALLOWED_ORIGIN_PATTERNS`,
  `WEBSOCKET_ALLOWED_ORIGIN_PATTERNS`, `FRONTEND_BASE_URL` 세 개를 맞추고 `docker compose up -d` 로 재기동한다(재빌드 불필요).

---

## Yjs 동시편집 경로 (`/yjs`)

동작 확인 완료(2026-07-30). 브라우저는 항상 현재 origin 의 `/yjs/<방이름>` 으로 붙는다
(`frontend/src/collab/useCollabSession.ts` 의 `resolveYjsWsUrl`). `ACCESS_TOKEN` 쿠키가 WS
핸드셰이크에 실려야 하므로 반드시 CloudFront same-origin 을 거쳐야 한다.

```
브라우저 → CloudFront /yjs/* → nginx /yjs/ → 127.0.0.1:1234 (collab 컨테이너)
```

**nginx 설정은 EC2 에만 있고 git 에 없다.** 서버를 다시 만들 때 필요하므로 여기에 사본을 남긴다.
`listen 443 ssl` server 블록(`server_name i15a604.p.ssafy.io`) 안, `location /ws` 옆에 둔다.

```nginx
    location /yjs/ {
        proxy_pass http://127.0.0.1:1234/;

        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_read_timeout 3600s;
        proxy_send_timeout 3600s;
    }
```

- **`proxy_pass` 끝의 슬래시가 필수다.** `collab-server` 는 경로 전체를 방 이름으로 읽고
  `^qurie-session-\d+$` 만 허용한다. 접두어를 떼지 않으면 방 이름이 `yjs/qurie-session-1` 이
  되어 404 로 거부된다.
- CloudFront behavior 의 오리진 요청 정책이 `AllViewerExceptHostHeader` 가 아니면
  `Upgrade`/`Connection` 헤더와 쿠키가 오리진까지 가지 않는다. 그러면 nginx 가 평범한 GET 으로
  넘겨서 collab-server 의 healthcheck 핸들러가 `200 ok` 를 응답한다 — 401 이 아니라 200 이 나오면
  이걸 먼저 본다.

경로 점검(브라우저 없이). **`--http1.1` 이 필수다** — HTTP/2 는 `Connection`/`Upgrade` 헤더를
금지하므로(RFC 9113 §8.2.2) h2 로 붙으면 업그레이드가 인식되지 않고 항상 `200 ok` 가 나온다.

```bash
curl -sS -i --http1.1 -H 'Connection: Upgrade' -H 'Upgrade: websocket' \
  -H 'Sec-WebSocket-Version: 13' -H 'Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==' \
  "https://d3alq9m5x08xk2.cloudfront.net/yjs/qurie-session-1?cb=1" | head -1
```

**401 이 정상이다** — 쿠키 없이 불렀으니 collab-server 가 거절한 것이고, 경로가 끝까지 닿았다는 뜻이다.
404 는 접두어 미제거, 502 는 컨테이너 미기동, `200 ok` 는 업그레이드 헤더 미전달이다.

### 남은 구멍 두 개

- **세션 참여 자격 검증이 없다** (`collab-server/server.js` 의 `todo`). 지금은 "로그인한 서비스
  사용자" 까지만 거르므로 **다른 반 학생도 세션 id 만 알면 편집에 참여할 수 있다.** 백엔드의
  `SessionWebSocketAuthorizationInterceptor` 가 하는 판단(반 소속·세션 활성)을 API 로 위임해야 막힌다.
- **문서가 메모리에만 있다.** compose 의 collab 서비스에 `YPERSISTENCE` 가 없어서 컨테이너가
  재시작되면 진행 중이던 편집 내용이 사라진다.

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

- **Lint 는 배포를 막지 않는다.** 현재 `qurie/*` 디자인시스템 룰과 `react-hooks` 룰에서 에러가
  다수 남아 있어 게이트로 걸면 모든 배포가 멈춘다. 지금은 실패해도 빌드를 UNSTABLE 로만 표시하고 배포는 진행한다.
  룰 위반을 정리한 뒤 `Jenkinsfile.frontend` 의 `catchError` 를 지우면 게이트가 된다.
  에러가 남아 있는 동안은 **빌드가 매번 노란색(UNSTABLE)** 이 되는 것이 정상이다.
- **`Install` 스테이지를 지우지 말 것.** Lint 가 `node_modules` 를 필요로 한다.
  없으면 Lint 가 `eslint: not found`(exit 127)로 죽어서, 룰 위반 여부와 무관하게 항상 실패한다.
  설치를 여기서 한 번만 하려고 `Build & Deploy` 는 `SKIP_NPM_CI=1` 로 스크립트의 `npm ci` 를 건너뛴다.
  수동 실행(`bash scripts/deploy-frontend.sh`)에서는 그 변수가 없으므로 스크립트가 알아서 설치한다.
- **프론트에는 테스트 스테이지가 없다.** 테스트가 아직 없기 때문이고, 생기면 `Lint` 다음에 넣는다.
- **`VITE_YJS_WS_URL` 은 배포 빌드에서 설정하지 않는다. 설정하면 안 된다.**
  `resolveYjsWsUrl()` 이 값이 없을 때 현재 origin 의 `/yjs` 로 붙기 때문에, 비워 두는 것이
  CloudFront same-origin 접속(= `ACCESS_TOKEN` 쿠키가 핸드셰이크에 실림)을 보장한다.
  절대 URL 을 넣으면 cross-site 가 되어 쿠키가 빠지고 collab-server 가 401 로 거절한다.
  대신 인프라 쪽에 CloudFront `/yjs/*` behavior 와 nginx `/yjs/` location 이 있어야 한다.
- **두 잡은 무엇이 바뀌었는지와 무관하게 master 푸시마다 둘 다 돈다.** 웹훅은 푸시 이벤트만 보고
  경로를 보지 않는다. 그래서 프론트만 고친 머지에도 백엔드 잡이 돌고 매터모스트 알림이 두 건 온다.
  경로로 걸러 건너뛸 수도 있지만(`gitlabBefore..gitlabAfter` 범위의 변경 경로 확인), 앞선 빌드가
  실패했을 때 그 변경이 다음 머지에서 "바뀐 게 없다" 로 판정돼 배포되지 않고 남는 구멍이 있어
  넣지 않았다. 알림 한 건은 두세 줄로 짧게 유지해서 채널 부담을 줄이는 쪽을 택했다.
- **알림에 마크다운 헤딩(`##`)을 쓰지 않는다.** 매터모스트에서 글자가 과하게 커진다.
  굵은 글씨 + 인라인 코드로만 강조한다.
