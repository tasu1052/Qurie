# Jenkins 컨트롤러 이미지.
#
# 호스트의 docker 데몬(/var/run/docker.sock)을 공유해서 쓰므로 컨테이너 안에는 docker CLI 만 넣는다.
# 데몬을 컨테이너 안에 또 띄우지 않는다(DinD) — 이미지 캐시가 갈라지고 볼륨 관리가 복잡해진다.
FROM jenkins/jenkins:lts-jdk17

# docker.sock 은 호스트에서 root:docker 소유다. 컨테이너의 jenkins 유저 GID 와 호스트 docker GID 를
# 맞추는 것보다 root 로 도는 쪽이 단순하고, 어차피 docker.sock 접근 권한은 root 와 동등하다.
USER root

RUN apt-get update \
	&& apt-get install -y --no-install-recommends ca-certificates curl gnupg \
	&& install -m 0755 -d /etc/apt/keyrings \
	&& curl -fsSL https://download.docker.com/linux/debian/gpg -o /etc/apt/keyrings/docker.asc \
	&& chmod a+r /etc/apt/keyrings/docker.asc \
	&& echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/debian $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
		> /etc/apt/sources.list.d/docker.list \
	&& apt-get update \
	&& apt-get install -y --no-install-recommends docker-ce-cli docker-compose-plugin docker-buildx-plugin \
	&& rm -rf /var/lib/apt/lists/*

# buildx 가 없으면 compose 가 구형 빌더로 폴백하고, backend/Dockerfile 의
# RUN --mount=type=cache(BuildKit 문법)를 인식하지 못해 빌드가 실패한다.

# 프론트 파이프라인용 Node. Jenkins NodeJS 플러그인 대신 이미지에 박는 이유는
# 버전이 코드로 남아 재현 가능하고, 빌드마다 툴 설치 단계를 타지 않기 때문이다.
# vite 8 은 Node 20.19+/22.12+/24+ 를 요구한다.
ARG NODE_MAJOR=24
RUN curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key \
		-o /etc/apt/keyrings/nodesource.asc \
	&& chmod a+r /etc/apt/keyrings/nodesource.asc \
	&& echo "deb [signed-by=/etc/apt/keyrings/nodesource.asc] https://deb.nodesource.com/node_${NODE_MAJOR}.x nodistro main" \
		> /etc/apt/sources.list.d/nodesource.list \
	&& apt-get update \
	&& apt-get install -y --no-install-recommends nodejs \
	&& rm -rf /var/lib/apt/lists/*

# AWS CLI. Debian 의 apt 패키지는 v1 이고 cloudfront wait 같은 하위 명령이 빠져 있어 v2 를 직접 넣는다.
RUN apt-get update \
	&& apt-get install -y --no-install-recommends unzip \
	&& curl -fsSL "https://awscli.amazonaws.com/awscli-exe-linux-$(uname -m).zip" -o /tmp/awscliv2.zip \
	&& unzip -q /tmp/awscliv2.zip -d /tmp \
	&& /tmp/aws/install \
	&& rm -rf /tmp/aws /tmp/awscliv2.zip \
	&& rm -rf /var/lib/apt/lists/*

# Jenkins 는 root 로 돌고 배포 디렉터리는 ubuntu 소유라 git 이 소유자 불일치를 거부한다.
# 파이프라인에서도 등록하지만, 컨테이너를 재생성해도 유지되도록 이미지에 박아 둔다.
RUN git config --system --add safe.directory /home/ubuntu/S15P11A604
