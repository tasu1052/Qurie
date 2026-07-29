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
	&& apt-get install -y --no-install-recommends docker-ce-cli docker-compose-plugin \
	&& rm -rf /var/lib/apt/lists/*
