#!/usr/bin/env bash
#
# 배포 스크립트. Jenkins 파이프라인과 수동 배포가 완전히 같은 절차를 쓰도록 한 곳에 모아 둔다.
# 수동 실행:  bash scripts/deploy.sh
set -euo pipefail

DEPLOY_DIR="${DEPLOY_DIR:-/home/ubuntu/S15P11A604}"
BRANCH="${BRANCH:-master}"
HEALTH_URL="${HEALTH_URL:-http://127.0.0.1:8080/api/auth/me}"
HEALTH_RETRY="${HEALTH_RETRY:-45}"

cd "$DEPLOY_DIR"

# .env 는 서버에만 존재하고 git 에 없다. 없으면 컨테이너가 뜨지 않으니 먼저 걸러낸다.
if [ ! -f .env ]; then
	echo "[deploy] .env 가 없다: $DEPLOY_DIR/.env" >&2
	exit 1
fi

echo "[deploy] origin/$BRANCH 최신 코드로 맞춘다"
git fetch --prune origin "$BRANCH"
git checkout "$BRANCH"
# 서버 작업 디렉터리는 배포 전용이라 로컬 변경을 남기지 않는다. .env 같은 untracked 파일은 유지된다.
git reset --hard "origin/$BRANCH"
git log -1 --oneline

echo "[deploy] 이미지 빌드 및 재기동"
docker compose up -d --build

echo "[deploy] 헬스체크 (최대 $((HEALTH_RETRY * 2))초)"
for _ in $(seq 1 "$HEALTH_RETRY"); do
	code="$(curl -s -o /dev/null -w '%{http_code}' "$HEALTH_URL" || true)"
	# 인증 없이 호출하므로 401 이 정상 응답이다. 200/401 둘 다 앱이 살아 있다는 뜻.
	if [ "$code" = "401" ] || [ "$code" = "200" ]; then
		echo "[deploy] 정상 (HTTP $code)"
		# 이전 빌드의 dangling 이미지가 쌓이면 디스크가 찬다.
		docker image prune -f >/dev/null
		exit 0
	fi
	sleep 2
done

echo "[deploy] 헬스체크 실패. 최근 로그:" >&2
docker compose logs --tail 50 backend >&2
exit 1
