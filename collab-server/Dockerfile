# Yjs 동시편집 동기화 서버. backend 와 같은 EC2 에서 compose 로 함께 뜬다.
# alpine 이 아닌 이유: y-websocket 1.x 가 끌고 오는 leveldown(네이티브)이 musl 프리빌드가 없다.
FROM node:22-slim

WORKDIR /app

# leveldown 네이티브 빌드용 (y-leveldb → leveldown)
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY server.js ./

# named volume 최초 마운트 시 이 디렉터리 소유권이 복사되도록 node 소유로 만든다.
RUN mkdir -p /data/yjs && chown -R node:node /data/yjs /app

ENV HOST=0.0.0.0
ENV PORT=1234
ENV YPERSISTENCE=/data/yjs
EXPOSE 1234

USER node
CMD ["node", "server.js"]
