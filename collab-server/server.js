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
 * 세션 참여 자격(반 명단 소속·세션 활성)은 규칙을 여기 복제하지 않고 백엔드의
 * GET /api/sessions/{id}/access 로 위임한다. 백엔드가 죽어 있으면 입장을 거부한다
 * (fail-closed) — 자격을 모르는 채 문서를 열어주는 것보다 안전하다.
 *
 * YPERSISTENCE 가 설정되면 y-websocket/bin/utils 가 LevelDB 로 문서를 영속화한다.
 * 이 값은 utils require 이전에 잡혀 있어야 한다(모듈 로드 시 env 를 읽음).
 */
if (!process.env.YPERSISTENCE) {
  // 로컬 개발 기본 경로. compose 배포에서는 /data/yjs 를 명시한다.
  process.env.YPERSISTENCE = './yjs-data'
}

const http = require('http')
const { WebSocketServer } = require('ws')
const jwt = require('jsonwebtoken')
const { setupWSConnection, getYDoc, getPersistence, setPersistence } = require('y-websocket/bin/utils')

const host = process.env.HOST || '0.0.0.0'
const port = Number.parseInt(process.env.PORT || '1234', 10)
const jwtSecret = process.env.JWT_SECRET
// 세션 자격 확인을 위임할 백엔드. compose 에서는 서비스명(http://backend:8080)이다.
const backendBaseUrl = (process.env.BACKEND_BASE_URL || 'http://localhost:8080').replace(/\/+$/, '')
// 로컬에서 백엔드 없이 에디터만 볼 때 인증을 끄는 명시적 스위치. 배포에서는 켜면 안 된다.
const authDisabled = process.env.AUTH_DISABLED === 'true'
const persistenceDir = process.env.YPERSISTENCE

if (!authDisabled && !jwtSecret) {
  console.error('JWT_SECRET 이 없습니다. 인증 없이 띄우려면 AUTH_DISABLED=true 를 명시하세요.')
  process.exit(1)
}

/** 프론트 useCollabSession 이 만드는 방 이름 형식 외에는 문서를 만들어주지 않는다. */
const ROOM_PATTERN = /^qurie-session-\d+$/

/**
 * LevelDB 로드(bindState)는 utils 안에서 await 없이 시작되는데, 로드가 끝나기 전에 클라이언트와
 * sync 가 진행되면 빈 문서가 "동기화 완료"로 보인다 — 프론트는 빈 문서로 판단해 DB 스냅샷을
 * 시딩하고, 뒤늦게 LevelDB 내용이 병합되어 문서가 중복(편집 줄 밀림)된다.
 * bindState 완료 Promise 를 방 이름별로 기록해 두고, 연결 수락 전에 기다린다.
 */
const docLoadPromises = new Map()
const basePersistence = getPersistence()
if (basePersistence) {
  setPersistence({
    ...basePersistence,
    bindState: (docName, ydoc) => {
      const loaded = Promise.resolve(basePersistence.bindState(docName, ydoc)).catch((error) => {
        // 로드 실패 시 빈 문서로라도 열어준다 — 프론트 시딩이 DB 스냅샷으로 채운다.
        console.error(`LevelDB 문서 로드 실패 (doc=${docName}):`, error)
      })
      docLoadPromises.set(docName, loaded)
      return loaded
    },
  })
}

/** 방 문서를 미리 만들어 영속화 로드를 시작시키고, 로드가 끝날 때까지 기다린다. */
const waitForDocLoad = async (roomName) => {
  getYDoc(roomName)
  const loaded = docLoadPromises.get(roomName)
  if (loaded) {
    await loaded
  }
}

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

const tokenOf = (request) => {
  const cookies = parseCookies(request.headers.cookie)
  const url = new URL(request.url || '/', `http://${request.headers.host || 'localhost'}`)
  return cookies.ACCESS_TOKEN || url.searchParams.get('token')
}

/**
 * 토큰 서명을 로컬에서 검증한다. 실패하면 false.
 * 백엔드 jjwt 는 JWT_SECRET 길이에 따라 HS256/384/512 를 고르므로 셋 다 허용한다.
 * 백엔드 호출도 토큰을 다시 검증하지만, 쓰레기 토큰을 백엔드까지 보내지 않는 선별용이다.
 */
const verifyToken = (token) => {
  try {
    jwt.verify(token, jwtSecret, { algorithms: ['HS256', 'HS384', 'HS512'] })
    return true
  } catch {
    return false
  }
}

/**
 * 방 입장 자격을 백엔드에 위임 확인한다. 통과하면 null, 아니면 거부 사유 문자열.
 * 규칙(반 명단 소속·세션 활성·세션 존재)은 백엔드 SessionParticipantService 가 판정한다.
 */
const verifySessionAccess = async (roomName, token) => {
  const sessionId = roomName.slice('qurie-session-'.length)
  try {
    const response = await fetch(`${backendBaseUrl}/api/sessions/${sessionId}/access`, {
      headers: { cookie: `ACCESS_TOKEN=${encodeURIComponent(token)}` },
      signal: AbortSignal.timeout(3000),
    })
    if (response.status === 204) {
      return null
    }
    return `백엔드 자격 확인 거부 (status=${response.status})`
  } catch {
    return '백엔드 자격 확인 불가 (연결 실패/타임아웃)'
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
  // 자격 확인(비동기) 중에 소켓이 끊겨도 프로세스가 죽지 않게 한다.
  socket.on('error', () => {})

  const roomName = roomNameOf(request)
  if (!ROOM_PATTERN.test(roomName)) {
    rejectUpgrade(socket, '404 Not Found', `허용되지 않은 방 이름 (${roomName})`)
    return
  }

  const accept = () => {
    waitForDocLoad(roomName).then(() => {
      if (socket.destroyed) {
        return
      }
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request)
      })
    })
  }

  if (authDisabled) {
    accept()
    return
  }

  const token = tokenOf(request)
  if (!token || !verifyToken(token)) {
    rejectUpgrade(socket, '401 Unauthorized', `토큰 없음/무효 (room=${roomName})`)
    return
  }

  verifySessionAccess(roomName, token).then((failure) => {
    if (socket.destroyed) {
      return
    }
    if (failure !== null) {
      rejectUpgrade(socket, '403 Forbidden', `${failure} (room=${roomName})`)
      return
    }
    accept()
  })
})

server.listen(port, host, () => {
  console.log(
    `collab-server: ${host}:${port} (auth ${authDisabled ? 'OFF — 개발 전용' : 'on'}, persistence=${persistenceDir})`,
  )
})
