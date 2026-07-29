# syntax=docker/dockerfile:1

# ============================================
# build stage
# ============================================
FROM eclipse-temurin:17-jdk AS builder

WORKDIR /workspace

# 래퍼와 빌드 스크립트를 소스보다 먼저 복사한다 — 소스만 바뀔 때 의존성 해석 레이어를 재사용한다.
COPY gradlew settings.gradle build.gradle ./
COPY gradle gradle
COPY src src

# 테스트는 CI 에서 따로 돌린다. 이미지 빌드에서 재실행하면 DB 없는 환경에서 불필요하게 느려진다.
RUN --mount=type=cache,target=/root/.gradle \
    ./gradlew --no-daemon clean bootJar -x test

# 버전이 올라도 런타임 스테이지의 경로가 깨지지 않도록 부트 jar 를 고정된 이름으로 옮긴다.
RUN cp "$(find build/libs -name '*.jar' ! -name '*-plain.jar' | head -n 1)" /workspace/app.jar

# ============================================
# runtime stage
# ============================================
FROM eclipse-temurin:17-jre

# 컨테이너 메모리 한도를 기준으로 힙을 잡는다 — 고정 -Xmx 는 인스턴스를 바꿀 때마다 손봐야 한다.
ENV TZ=Asia/Seoul \
    JAVA_OPTS="-XX:MaxRAMPercentage=75 -Dfile.encoding=UTF-8"

RUN useradd --system --create-home --shell /usr/sbin/nologin qurie

WORKDIR /app
COPY --from=builder --chown=qurie:qurie /workspace/app.jar app.jar
USER qurie

EXPOSE 8080

# JAVA_OPTS 를 런타임에 덮어쓸 수 있도록 sh 로 감싸고, PID 1 은 java 가 되도록 exec 한다.
ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar /app/app.jar"]
