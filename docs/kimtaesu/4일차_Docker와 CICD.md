# Docker 정리

## 1. Docker란?

Docker는 애플리케이션과 애플리케이션 실행에 필요한 환경을 하나로 묶어, 어디서든 비슷한 환경에서 실행할 수 있도록 도와주는 컨테이너 플랫폼이다.

애플리케이션 코드뿐 아니라 다음과 같은 요소를 함께 패키징할 수 있다.

* 실행에 필요한 런타임
* 라이브러리 및 의존성
* 환경 설정
* 실행 명령어

Docker는 이러한 실행 환경을 **컨테이너(Container)**라는 독립된 공간에서 실행한다.

예를 들어 Spring Boot 애플리케이션을 실행하려면 Java 버전, 라이브러리, 환경변수 등의 설정이 필요하다. Docker를 사용하면 이러한 환경을 이미지로 만들고, 다른 개발자의 컴퓨터나 서버에서도 동일한 방식으로 실행할 수 있다.

---

# 2. Docker를 사용하는 이유

## 2.1 개발 환경 통일

개발자마다 운영체제, Java 버전, 데이터베이스 버전 등이 달라 발생하는 문제를 줄일 수 있다.

대표적으로 다음과 같은 문제를 방지할 수 있다.

> 내 컴퓨터에서는 실행되는데 다른 사람의 컴퓨터에서는 실행되지 않는 문제

Docker 이미지에 실행 환경을 정의하면 팀원들이 동일한 환경을 사용할 수 있다.

## 2.2 설치와 실행이 편리함

Java, MySQL, Redis 등의 프로그램을 직접 설치하고 복잡하게 설정하지 않아도 Docker 이미지를 이용하여 실행할 수 있다.

예를 들어 MySQL은 다음 명령으로 실행할 수 있다.

```bash
docker run -d \
  --name mysql \
  -e MYSQL_ROOT_PASSWORD=root \
  -p 3306:3306 \
  mysql:8.0
```

## 2.3 배포가 편리함

개발 환경에서 만든 Docker 이미지를 서버에서 동일하게 실행할 수 있다.

```text
개발 환경
→ Docker 이미지 생성
→ 이미지 저장소에 업로드
→ 서버에서 이미지 다운로드
→ 컨테이너 실행
```

이를 통해 개발 환경과 운영 환경의 차이를 줄일 수 있다.

---

# 3. Docker와 가상 머신의 차이

가상 머신은 각각 별도의 게스트 운영체제를 실행한다.

반면 Docker 컨테이너는 호스트 운영체제의 커널을 공유한다.

```text
가상 머신
호스트 운영체제
 ├─ 게스트 운영체제 1
 │   └─ 애플리케이션
 └─ 게스트 운영체제 2
     └─ 애플리케이션
```

```text
Docker
호스트 운영체제
 └─ Docker Engine
     ├─ 컨테이너 1
     └─ 컨테이너 2
```

Docker 컨테이너는 별도의 운영체제 전체를 포함하지 않기 때문에 일반적으로 가상 머신보다 가볍고 빠르게 실행된다.

다만 컨테이너도 완전히 독립된 컴퓨터는 아니다. 호스트 운영체제의 커널과 CPU, 메모리 등의 자원을 공유한다.

---

# 4. Docker의 구조

Docker는 클라이언트-서버 구조를 사용한다.

```text
Docker Client
    ↓ 명령 전달
Docker Daemon
    ↓
이미지, 컨테이너, 네트워크, 볼륨 관리
```

## 4.1 Docker Client

사용자가 Docker 명령어를 입력하는 도구이다.

```bash
docker build
docker run
docker ps
docker stop
```

Docker Client는 사용자의 명령을 Docker API를 통해 Docker daemon에 전달한다.

## 4.2 Docker Daemon

Docker daemon은 백그라운드에서 실행되는 프로세스이다.

Docker API 요청을 받아 다음과 같은 작업을 수행한다.

* Docker 이미지 빌드
* 컨테이너 생성 및 실행
* 컨테이너 중지 및 삭제
* Docker 네트워크 관리
* Docker 볼륨 관리
* 이미지 다운로드 및 업로드

일반적으로 daemon 프로세스의 이름은 `dockerd`이다.

## 4.3 Docker Engine

Docker Engine은 Docker 컨테이너를 생성하고 실행하기 위한 전체 실행 환경을 의미한다.

일반적으로 다음 구성 요소를 포함한다.

* Docker Client
* Docker Daemon
* Docker API
* 컨테이너 실행을 위한 런타임

즉, Docker daemon은 Docker Engine을 구성하는 핵심 요소 중 하나이다.

---

# 5. Docker 핵심 개념

## 5.1 Image

Docker 이미지는 컨테이너를 생성하기 위한 읽기 전용 템플릿이다.

이미지에는 애플리케이션 실행에 필요한 다음 요소들이 포함될 수 있다.

* 운영체제의 일부 파일
* Java, Node.js 등의 런타임
* 라이브러리 및 패키지
* 애플리케이션 파일
* 실행 명령어
* 환경 설정

예를 들어 Spring Boot 애플리케이션 이미지는 다음 내용을 포함할 수 있다.

```text
Java 17
+ Spring Boot JAR 파일
+ 애플리케이션 실행 명령어
```

이미지는 직접 실행되는 프로그램이라기보다 컨테이너를 만들기 위한 틀이다.

## 5.2 Container

컨테이너는 Docker 이미지를 기반으로 생성된 실행 인스턴스이다.

```text
Docker Image
    ↓ 실행
Docker Container
```

같은 이미지로 여러 개의 컨테이너를 생성할 수도 있다.

```text
Backend Image
 ├─ Backend Container 1
 ├─ Backend Container 2
 └─ Backend Container 3
```

컨테이너는 격리된 환경에서 실행되지만 호스트 시스템의 CPU, 메모리, 네트워크 등의 자원을 사용한다.

## 5.3 Dockerfile

Dockerfile은 Docker 이미지를 만드는 방법을 정의한 텍스트 파일이다.

Dockerfile에는 다음 내용이 작성된다.

* 사용할 베이스 이미지
* 설치할 라이브러리
* 복사할 파일
* 작업 디렉토리
* 환경변수
* 컨테이너 실행 명령어

예시:

```dockerfile
FROM eclipse-temurin:17-jdk

WORKDIR /app

COPY build/libs/app.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
```

## 5.4 Docker Compose

Docker Compose는 여러 개의 컨테이너를 하나의 설정 파일로 관리하는 도구이다.

예를 들어 프론트엔드, 백엔드, 데이터베이스를 함께 실행할 수 있다.

```yaml
services:
  frontend:
    build: ./frontend
    ports:
      - "3000:80"

  backend:
    build: ./backend
    ports:
      - "8080:8080"
    depends_on:
      - mysql

  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: root
      MYSQL_DATABASE: mydb
```

다음 명령으로 여러 컨테이너를 한 번에 실행할 수 있다.

```bash
docker compose up -d
```

---

# 6. Docker 동작 방식

Docker의 기본적인 동작 흐름은 다음과 같다.

```text
Dockerfile
    ↓ docker build
Docker Image
    ↓ docker run
Docker Container
```

## 6.1 Dockerfile 작성

Dockerfile에 애플리케이션 실행 환경을 정의한다.

```dockerfile
FROM eclipse-temurin:17-jdk

WORKDIR /app

COPY build/libs/app.jar app.jar

ENTRYPOINT ["java", "-jar", "app.jar"]
```

## 6.2 Docker 이미지 빌드

다음 명령으로 이미지를 생성한다.

```bash
docker build -t my-backend:1.0 .
```

Docker Engine은 Dockerfile에 작성된 명령어를 위에서부터 순서대로 실행하여 이미지를 생성한다.

## 6.3 컨테이너 생성 및 실행

다음 명령으로 이미지를 기반으로 컨테이너를 생성하고 실행한다.

```bash
docker run -d \
  --name my-backend \
  -p 8080:8080 \
  my-backend:1.0
```

여기서 옵션의 의미는 다음과 같다.

```text
-d
→ 백그라운드 실행

--name my-backend
→ 컨테이너 이름 지정

-p 8080:8080
→ 호스트의 8080 포트와 컨테이너의 8080 포트를 연결
```

---

# 7. Docker 이미지의 계층 구조

Docker 이미지는 여러 개의 레이어로 구성된다.

Dockerfile의 각 명령어는 이미지 레이어를 만들 수 있다.

```dockerfile
FROM eclipse-temurin:17-jdk
COPY app.jar app.jar
RUN chmod +x app.jar
```

개념적으로 다음과 같은 레이어가 만들어진다.

```text
Java 17 베이스 이미지
    ↓
app.jar 파일 추가
    ↓
파일 권한 변경
    ↓
최종 Docker 이미지
```

Docker는 변경되지 않은 레이어를 캐시로 재사용한다.

따라서 Dockerfile의 일부 내용만 변경되면 모든 과정을 처음부터 다시 실행하지 않고, 변경된 레이어부터 다시 빌드할 수 있다.

이 때문에 자주 변경되지 않는 의존성 설치 명령은 앞쪽에 작성하고, 자주 변경되는 애플리케이션 코드는 뒤쪽에 작성하는 것이 일반적이다.

---

# 8. Dockerfile 주요 명령어

| 명령어          | 역할                              |
| ------------ | ------------------------------- |
| `FROM`       | 이미지 생성의 기반이 되는 베이스 이미지를 지정      |
| `RUN`        | 이미지를 빌드하는 동안 실행할 명령어            |
| `ARG`        | 이미지 빌드 과정에서만 사용하는 변수            |
| `CMD`        | 컨테이너가 시작될 때 실행할 기본 명령어 또는 기본 인자 |
| `ENTRYPOINT` | 컨테이너가 시작될 때 반드시 실행할 기본 프로그램     |
| `LABEL`      | 이미지에 작성자, 버전 등의 메타데이터를 추가       |
| `ENV`        | 이미지 및 컨테이너에서 사용할 환경변수를 설정       |
| `EXPOSE`     | 컨테이너 애플리케이션이 사용할 예정인 포트를 문서화    |
| `COPY`       | 호스트의 파일이나 디렉토리를 이미지 내부로 복사      |
| `ADD`        | 파일 복사 기능에 압축 해제 등의 추가 기능을 제공    |
| `USER`       | 이후 명령 및 컨테이너 실행에 사용할 사용자를 지정    |
| `WORKDIR`    | 명령이 실행될 작업 디렉토리를 지정             |
| `VOLUME`     | 컨테이너 데이터를 외부 저장소로 관리할 경로를 지정    |

---

## 8.1 FROM

Docker 이미지의 기반이 되는 베이스 이미지를 지정한다.

```dockerfile
FROM eclipse-temurin:17-jdk
```

일반적으로 Dockerfile의 첫 번째 명령어로 사용한다.

---

## 8.2 RUN

Docker 이미지를 빌드하는 동안 실행할 명령어이다.

```dockerfile
RUN apt-get update
RUN apt-get install -y curl
```

`RUN` 명령은 이미지 빌드 시 실행된다.

컨테이너가 실행될 때마다 반복 실행되는 명령이 아니다.

---

## 8.3 ARG

이미지를 빌드하는 동안에만 사용할 변수를 설정한다.

```dockerfile
ARG APP_VERSION=1.0
```

빌드 명령에서 값을 전달할 수 있다.

```bash
docker build \
  --build-arg APP_VERSION=2.0 \
  -t my-app .
```

`ARG` 값은 기본적으로 컨테이너 실행 시 사용하는 환경변수가 아니다.

민감한 비밀번호나 API 키를 `ARG`에 넣으면 이미지 기록에 남을 수 있으므로 주의해야 한다.

---

## 8.4 ENV

이미지와 컨테이너에서 사용할 환경변수를 지정한다.

```dockerfile
ENV SPRING_PROFILES_ACTIVE=prod
```

컨테이너 실행 시 값을 변경할 수도 있다.

```bash
docker run \
  -e SPRING_PROFILES_ACTIVE=dev \
  my-app
```

API 키나 비밀번호 같은 민감한 값은 Dockerfile에 직접 작성하지 않고, 실행 시 환경변수나 별도의 Secret 관리 방식을 사용하는 것이 좋다.

---

## 8.5 CMD

컨테이너가 시작될 때 실행할 기본 명령어나 기본 인자를 지정한다.

```dockerfile
CMD ["java", "-jar", "app.jar"]
```

Dockerfile에는 일반적으로 하나의 `CMD`만 유효하다.

`docker run` 뒤에 다른 명령어를 작성하면 기존 `CMD`를 대체할 수 있다.

```bash
docker run my-image java -version
```

---

## 8.6 ENTRYPOINT

컨테이너가 실행될 때 기본적으로 실행할 프로그램을 지정한다.

```dockerfile
ENTRYPOINT ["java", "-jar", "app.jar"]
```

`ENTRYPOINT`는 컨테이너의 주 실행 프로그램을 고정할 때 주로 사용한다.

다만 `ENTRYPOINT`가 절대 변경 불가능한 것은 아니다.

다음 옵션으로 변경할 수 있다.

```bash
docker run \
  --entrypoint sh \
  my-image
```

`CMD`와 함께 사용하면 `CMD`는 `ENTRYPOINT`에 전달되는 기본 인자 역할을 할 수 있다.

```dockerfile
ENTRYPOINT ["java", "-jar"]
CMD ["app.jar"]
```

실제 실행 명령:

```text
java -jar app.jar
```

---

## 8.7 COPY

호스트의 파일이나 디렉토리를 이미지 내부로 복사한다.

```dockerfile
COPY build/libs/app.jar /app/app.jar
```

일반적인 파일 복사에는 `COPY` 사용을 권장한다.

---

## 8.8 ADD

`ADD`도 파일을 이미지 내부로 복사할 수 있다.

```dockerfile
ADD app.tar.gz /app
```

`ADD`는 로컬 압축 파일을 자동으로 해제하는 기능 등을 제공한다.

일부 환경에서는 URL을 사용할 수도 있지만 동작과 캐시 관리가 복잡할 수 있으므로, 원격 파일은 보통 `curl`이나 `wget`을 이용해 직접 내려받는 방식이 더 명확하다.

단순한 파일 복사에는 `COPY`를 사용하는 것이 권장된다.

---

## 8.9 WORKDIR

Dockerfile 명령과 컨테이너 명령이 실행될 작업 디렉토리를 지정한다.

```dockerfile
WORKDIR /app
```

이후 실행되는 명령은 `/app`을 기준으로 동작한다.

```dockerfile
WORKDIR /app
COPY app.jar .
```

위 코드에서 `app.jar`는 `/app/app.jar`로 복사된다.

---

## 8.10 USER

컨테이너에서 명령을 실행할 사용자를 지정한다.

```dockerfile
USER appuser
```

기본적으로 컨테이너가 root 사용자로 실행될 수 있기 때문에 보안을 위해 별도의 일반 사용자를 만들어 실행하는 것이 권장된다.

---

## 8.11 EXPOSE

컨테이너 내부의 애플리케이션이 어떤 포트를 사용할 예정인지 문서화한다.

```dockerfile
EXPOSE 8080
```

중요한 점은 `EXPOSE`만 작성한다고 외부에서 해당 포트에 접속할 수 있는 것은 아니라는 것이다.

실제로 호스트 포트와 연결하려면 컨테이너 실행 시 `-p` 옵션이 필요하다.

```bash
docker run -p 8080:8080 my-app
```

```text
호스트 8080 포트
→ 컨테이너 8080 포트
```

---

## 8.12 LABEL

Docker 이미지에 메타데이터를 추가한다.

```dockerfile
LABEL maintainer="team@example.com"
LABEL version="1.0"
```

이미지의 작성자, 버전, 설명 등을 기록할 때 사용할 수 있다.

---

## 8.13 VOLUME

컨테이너의 데이터를 컨테이너 외부에 저장할 수 있도록 볼륨 사용 지점을 지정한다.

```dockerfile
VOLUME ["/data"]
```

컨테이너 내부 파일은 컨테이너를 삭제하면 함께 사라질 수 있다.

볼륨을 사용하면 데이터베이스 파일이나 업로드 파일 등을 컨테이너 외부에 보존할 수 있다.

실제 운영에서는 Dockerfile의 `VOLUME`보다 Docker Compose나 `docker run` 명령에서 명시적으로 연결하는 경우가 많다.

```yaml
services:
  mysql:
    image: mysql:8.0
    volumes:
      - mysql-data:/var/lib/mysql

volumes:
  mysql-data:
```

---

# 9. 이미지와 컨테이너의 차이

| 구분     | 이미지               | 컨테이너               |
| ------ | ----------------- | ------------------ |
| 의미     | 컨테이너를 만들기 위한 템플릿  | 이미지를 기반으로 실행된 인스턴스 |
| 실행 여부  | 실행되지 않음           | 실제로 실행 가능          |
| 변경 가능성 | 기본적으로 읽기 전용       | 실행 중 파일 변경 가능      |
| 비유     | 프로그램 설치 파일 또는 설계도 | 실제 실행 중인 프로그램      |

```text
이미지
→ 실행 환경을 저장한 틀

컨테이너
→ 이미지를 기반으로 실제 실행되는 프로세스
```

---

# 10. 기본적인 Docker 실행 과정

## 10.1 소스코드 준비

애플리케이션 코드를 작성하고 정상적으로 실행되는지 확인한다.

## 10.2 Dockerfile 작성

프로젝트 구조에 맞게 Dockerfile을 작성한다.

Dockerfile은 반드시 프로젝트 최상위 폴더에 있어야 하는 것은 아니다.

다만 빌드 컨텍스트와 파일 경로를 관리하기 편하도록 각 프로젝트 디렉토리에 배치하는 경우가 많다.

예시:

```text
project/
├── frontend/
│   ├── Dockerfile
│   └── src/
├── backend/
│   ├── Dockerfile
│   └── src/
└── docker-compose.yml
```

## 10.3 이미지 빌드

```bash
docker build -t my-app:1.0 .
```

## 10.4 컨테이너 실행

```bash
docker run -d -p 8080:8080 my-app:1.0
```

## 10.5 실행 상태 확인

```bash
docker ps
```

로그 확인:

```bash
docker logs my-container
```

실시간 로그 확인:

```bash
docker logs -f my-container
```

---

# 11. 기본적인 배포 과정

단순히 로컬에서 컨테이너를 실행하는 것과 서버에 배포하는 것은 다르다.

전체 배포 흐름은 다음과 같다.

```text
1. 소스코드 준비
2. Dockerfile 작성
3. Docker 이미지 빌드
4. 이미지 저장소에 이미지 업로드
5. 서버 준비
6. 서버에 Docker 설치
7. 서버에서 이미지 다운로드
8. 컨테이너 실행
9. 포트 및 네트워크 설정
10. 도메인 및 HTTPS 연결
11. 외부 접속과 기능 확인
```

## 11.1 이미지 저장소 업로드

대표적인 이미지 저장소는 다음과 같다.

* Docker Hub
* AWS ECR
* GitHub Container Registry

```bash
docker push username/my-app:1.0
```

## 11.2 서버에서 이미지 다운로드

```bash
docker pull username/my-app:1.0
```

## 11.3 서버에서 컨테이너 실행

```bash
docker run -d \
  --name my-app \
  -p 8080:8080 \
  username/my-app:1.0
```

여러 컨테이너를 실행한다면 Docker Compose를 사용할 수 있다.

```bash
docker compose up -d
```

## 11.4 외부 접속 설정

AWS EC2를 사용한다면 보안 그룹에서 필요한 포트를 허용해야 한다.

|   포트 | 용도                      |
| ---: | ----------------------- |
|   22 | SSH 접속                  |
|   80 | HTTP                    |
|  443 | HTTPS                   |
| 8080 | 백엔드 직접 접근 시 사용 가능       |
| 3306 | MySQL, 일반적으로 외부 공개하지 않음 |

운영 환경에서는 보통 Nginx와 같은 리버스 프록시를 사용한다.

```text
사용자
  ↓ 80 또는 443
Nginx
  ├─ / → 프론트엔드
  └─ /api → 백엔드
```

서버에서 컨테이너가 실행되는 것뿐 아니라 외부 사용자가 도메인이나 IP로 정상 접속할 수 있어야 배포가 완료되었다고 볼 수 있다.

---

# 12. CI/CD

## 12.1 CI: Continuous Integration

CI는 지속적인 통합을 의미한다.

여러 개발자가 작성한 코드 변경사항을 자주 합치고, 코드가 정상적으로 동작하는지 자동으로 검증하는 과정이다.

CI 파이프라인은 일반적으로 다음 작업을 수행한다.

```text
코드 Push
→ 코드 체크아웃
→ 의존성 설치
→ 컴파일
→ 테스트
→ 빌드
→ Docker 이미지 빌드
```

CI의 목적은 코드가 통합될 때 발생하는 문제를 빠르게 발견하는 것이다.

대표적인 CI 도구는 다음과 같다.

* GitHub Actions
* Jenkins
* GitLab CI/CD
* CircleCI

---

## 12.2 CD: Continuous Delivery

Continuous Delivery는 지속적인 제공을 의미한다.

코드 변경사항이 빌드와 테스트를 통과하면 언제든 운영 환경에 배포할 수 있는 상태까지 자동으로 준비한다.

최종 운영 배포는 사람이 승인하여 실행할 수 있다.

```text
코드 Push
→ 빌드
→ 테스트
→ 이미지 생성
→ 배포 준비 완료
→ 관리자 승인
→ 운영 배포
```

---

## 12.3 CD: Continuous Deployment

Continuous Deployment는 지속적인 배포를 의미한다.

코드 변경사항이 모든 테스트와 검증 단계를 통과하면 사람의 승인 없이 자동으로 운영 환경에 배포된다.

```text
코드 Push
→ 빌드
→ 테스트
→ 이미지 생성
→ 서버 배포
→ 컨테이너 교체
```

따라서 Continuous Delivery와 Continuous Deployment는 구분할 필요가 있다.

```text
Continuous Delivery
→ 운영 배포 직전까지 자동화
→ 최종 배포는 사람의 승인 가능

Continuous Deployment
→ 운영 배포까지 전부 자동화
```

---

# 13. Docker와 CI/CD를 활용한 배포 흐름

```text
개발자가 GitHub에 코드 Push
        ↓
GitHub Actions 실행
        ↓
코드 빌드 및 테스트
        ↓
Docker 이미지 생성
        ↓
Docker Hub 또는 ECR에 이미지 업로드
        ↓
EC2 서버에서 최신 이미지 다운로드
        ↓
기존 컨테이너 종료
        ↓
새 컨테이너 실행
        ↓
배포 완료
```

수동 배포에서는 개발자가 직접 다음 작업을 수행한다.

```text
docker build
docker push
EC2 접속
docker pull
docker compose up
```

CI/CD를 구축하면 이러한 과정을 자동화할 수 있다.

---