# Yjs 동시편집 동기화 서버. backend 와 같은 EC2 에서 compose 로 함께 뜬다.
# alpine 이 아닌 이유: y-websocket 1.x 가 끌고 오는 leveldown(네이티브)이 musl 프리빌드가 없다.
FROM node:22-slim

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY server.js ./

ENV HOST=0.0.0.0
ENV PORT=1234
EXPOSE 1234

USER node
CMD ["node", "server.js"]
