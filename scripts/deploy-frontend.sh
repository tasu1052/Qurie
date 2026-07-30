#!/usr/bin/env bash
#
# 프론트 배포 스크립트. Jenkins 파이프라인과 수동 배포가 완전히 같은 절차를 쓰도록 한 곳에 모아 둔다.
# 백엔드의 scripts/deploy.sh 와 같은 역할이다.
#
# 수동 실행:
#   export AWS_ACCESS_KEY_ID=... AWS_SECRET_ACCESS_KEY=...
#   export S3_BUCKET=... CF_DISTRIBUTION_ID=...
#   bash scripts/deploy-frontend.sh
#
# 백엔드 스크립트와 달리 git fetch/reset 을 하지 않는다. Jenkins 가 워크스페이스에 SCM 체크아웃을
# 해 주고, 이 빌드는 docker 를 쓰지 않아 호스트 경로와 맞출 필요가 없기 때문이다.
set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FRONT_DIR="$REPO_DIR/frontend"

# 값이 없으면 aws 호출까지 가서 애매하게 실패하므로 여기서 먼저 끊는다.
S3_BUCKET="${S3_BUCKET:?S3_BUCKET 이 필요하다 (예: qurie-frontend)}"
CF_DISTRIBUTION_ID="${CF_DISTRIBUTION_ID:?CF_DISTRIBUTION_ID 이 필요하다 (예: E1234ABCDEFGH)}"
export AWS_DEFAULT_REGION="${AWS_DEFAULT_REGION:-ap-northeast-2}"

# CloudFront 단일 배포라 프론트와 API 가 같은 origin 이다. 상대 경로로 빌드해야
# 백엔드가 SameSite=Lax 로 발급한 쿠키가 XHR 에 실린다. 절대 URL 로 빌드하면 로그인이 깨진다.
export VITE_API_BASE_URL="${VITE_API_BASE_URL:-/api}"

if [[ "$S3_BUCKET" == CHANGE-ME* || "$CF_DISTRIBUTION_ID" == CHANGE-ME* ]]; then
	echo "[front] Jenkinsfile.frontend 의 S3_BUCKET / CF_DISTRIBUTION_ID 를 실제 값으로 바꿔야 한다" >&2
	exit 1
fi

cd "$FRONT_DIR"

# CI 에는 frontend/.env 가 없다(gitignore). 빌드 입력이 환경변수로만 결정되게 두어
# "로컬에선 되는데 배포하면 다르다" 를 만들지 않는다.
#
# SKIP_NPM_CI 는 파이프라인이 앞선 스테이지에서 이미 설치했을 때 쓴다. 수동 실행에서는
# 값이 없으므로 항상 설치한다 — 스크립트 하나만 돌려도 배포가 되게 유지하려는 것이다.
if [ "${SKIP_NPM_CI:-0}" = "1" ] && [ -d node_modules ]; then
	echo "[front] 의존성 설치 생략 (SKIP_NPM_CI=1)"
else
	echo "[front] 의존성 설치 (npm ci)"
	npm ci --no-audit --no-fund
fi

echo "[front] 빌드 (VITE_API_BASE_URL=$VITE_API_BASE_URL)"
npm run build

# dist 가 비었는데 그대로 sync 하면 아래 --delete 가 운영 버킷을 비운다. 먼저 확인한다.
if [ ! -s dist/index.html ]; then
	echo "[front] dist/index.html 이 없다. 빌드 산출물을 확인할 것" >&2
	exit 1
fi

# sync 를 두 번 나누는 이유는 Cache-Control 을 파일 성격에 따라 다르게 주기 위해서다.
# assets/* 는 파일명에 콘텐츠 해시가 붙으므로 영구 캐시해도 안전하고, index.html 을 캐시하면
# 배포해도 사용자가 계속 옛 번들을 잡는다.
#
# --exclude/--include 필터는 원본과 대상 양쪽에 적용된다. 즉 1번 sync 의 --delete 는
# assets/* 키만 삭제 대상으로 보고 index.html 을 건드리지 않는다.
echo "[front] S3 업로드 — assets (영구 캐시)"
aws s3 sync dist/ "s3://$S3_BUCKET/" --delete \
	--exclude "*" --include "assets/*" \
	--cache-control "public,max-age=31536000,immutable"

# assets 를 먼저 올린다. index.html 이 먼저 올라가면 그 사이 접속한 사용자가
# 아직 없는 번들을 받으러 가서 흰 화면을 본다.
echo "[front] S3 업로드 — index.html 및 정적 파일 (캐시 없음)"
aws s3 sync dist/ "s3://$S3_BUCKET/" --delete \
	--exclude "assets/*" \
	--cache-control "no-cache"

# index.html 이 no-cache 라도 CloudFront 엣지에 남은 사본은 무효화해야 즉시 반영된다.
# 무효화 요청은 월 1000 경로까지 무료라 /* 한 건으로 끝낸다.
echo "[front] CloudFront 무효화"
invalidation_id="$(aws cloudfront create-invalidation \
	--distribution-id "$CF_DISTRIBUTION_ID" \
	--paths '/*' \
	--query 'Invalidation.Id' --output text)"
echo "[front] 무효화 $invalidation_id 완료 대기"
aws cloudfront wait invalidation-completed \
	--distribution-id "$CF_DISTRIBUTION_ID" --id "$invalidation_id"

# FRONT_URL 이 있으면 실제 사용자 경로로 한 번 확인한다. S3 업로드 성공은
# CloudFront 가 정상 응답한다는 뜻이 아니다(오리진 권한/behavior 설정이 따로 있다).
if [ -n "${FRONT_URL:-}" ]; then
	echo "[front] 확인 요청: $FRONT_URL"
	code="$(curl -s -o /dev/null -w '%{http_code}' "$FRONT_URL" || true)"
	if [ "$code" != "200" ]; then
		echo "[front] $FRONT_URL 이 HTTP $code 를 반환했다" >&2
		exit 1
	fi
	echo "[front] 정상 (HTTP $code)"
fi

echo "[front] 배포 완료"
