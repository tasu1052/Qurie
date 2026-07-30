/**
 * Qurie 동시편집(Yjs) 동기화 서버.
 *
 * y-websocket 프로토콜(sync + awareness)은 y-websocket 의 서버 유틸이 처리하고,
 * 이 파일은 그 앞단의 인증만 담당한다 — 백엔드(Spring)와 같은 JWT_SECRET 으로
 * ACCESS_TOKEN 을 검증해서, 로그인하지 않은 클라이언트가 문서에 붙지 못하게 한다.
 *
 * 서버 유틸은 최신 @y/websocket-server 가 아니라 y-websocket@1.x 의 bin/utils 를 쓴다.
 * @y/websocket-server 0.1.5 는 yjs 14 프리릴리즈(@y/y)에 의존해 내부에서 yjs 인스턴스가
 * 섞이고, yjs 13 클라이언트의 업데이트 적용이 "store.getClock is not a function" 으로
 * 깨진다. 프론트가 yjs 13 이므로 서버도 같은 메이저로 맞춘다.
 *
 * 토큰은 쿠키(ACCESS_TOKEN)에서 읽는다. 백엔드가 httpOnly 쿠키로 발급하므로
 * 프론트 JS 는 토큰을 꺼낼 수 없고, 브라우저가 WS 핸드셰이크에 쿠키를 실어 보내는
 * 것에 의존한다 — 즉 이 서버는 백엔드와 same-site 로 서빙되어야 한다(nginx 프록시).
 * ?token= 쿼리 파라미터는 로컬 테스트·비브라우저 클라이언트용 보조 경로다.
 *
 * todo: 세션 참여 자격(반 소속·세션 활성 여부) 검증은 백엔드 API 호출이 필요해서
 *       아직 없다. 지금은 "로그인한 같은 서비스 사용자"까지만 거른다.
 */
const http = require('http')
const { WebSocketServer } = require('ws')
const jwt = require('jsonwebtoken')
const { setupWSConnection } = require('y-websocket/bin/utils')

const host = process.env.HOST || '0.0.0.0'
const port = Number.parseInt(process.env.PORT || '1234', 10)
const jwtSecret = process.env.JWT_SECRET
// 로컬에서 백엔드 없이 에디터만 볼 때 인증을 끄는 명시적 스위치. 배포에서는 켜면 안 된다.
const authDisabled = process.env.AUTH_DISABLED === 'true'

if (!authDisabled && !jwtSecret) {
  console.error('JWT_SECRET 이 없습니다. 인증 없이 띄우려면 AUTH_DISABLED=true 를 명시하세요.')
  process.exit(1)
}

/** 프론트 useCollabSession 이 만드는 방 이름 형식 외에는 문서를 만들어주지 않는다. */
const ROOM_PATTERN = /^qurie-session-\d+$/

const parseCookies = (header) => {
  const cookies = {}
  if (!header) {
    return cookies
  }
  for (const part of header.split(';')) {
    const index = part.indexOf('=')
    if (index > 0) {
      cookies[part.slice(0, index).trim()] = decodeURIComponent(part.slice(index + 1).trim())
    }
  }
  return cookies
}

const roomNameOf = (request) => {
  const path = (request.url || '').slice(1).split('?')[0]
  return decodeURIComponent(path)
}

/**
 * 핸드셰이크 요청에서 토큰을 찾아 검증한다. 실패하면 null.
 * 백엔드 jjwt 는 JWT_SECRET 길이에 따라 HS256/384/512 를 고르므로 셋 다 허용한다.
 */
const authenticate = (request) => {
  const cookies = parseCookies(request.headers.cookie)
  const url = new URL(request.url || '/', `http://${request.headers.host || 'localhost'}`)
  const token = cookies.ACCESS_TOKEN || url.searchParams.get('token')
  if (!token) {
    return null
  }
  try {
    return jwt.verify(token, jwtSecret, { algorithms: ['HS256', 'HS384', 'HS512'] })
  } catch {
    return null
  }
}

const rejectUpgrade = (socket, status, reason) => {
  socket.write(`HTTP/1.1 ${status}\r\nConnection: close\r\n\r\n`)
  socket.destroy()
  console.warn(`upgrade 거부: ${reason}`)
}

const wss = new WebSocketServer({ noServer: true })
wss.on('connection', setupWSConnection)

const server = http.createServer((_request, response) => {
  // docker compose healthcheck 용
  response.writeHead(200, { 'Content-Type': 'text/plain' })
  response.end('ok')
})

server.on('upgrade', (request, socket, head) => {
  const roomName = roomNameOf(request)
  if (!ROOM_PATTERN.test(roomName)) {
    rejectUpgrade(socket, '404 Not Found', `허용되지 않은 방 이름 (${roomName})`)
    return
  }
  if (!authDisabled && authenticate(request) === null) {
    rejectUpgrade(socket, '401 Unauthorized', `토큰 없음/무효 (room=${roomName})`)
    return
  }
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request)
  })
})

server.listen(port, host, () => {
  console.log(`collab-server: ${host}:${port} (auth ${authDisabled ? 'OFF — 개발 전용' : 'on'})`)
})
