import { Client } from '@stomp/stompjs';

/**
 * STOMP WebSocket URL.
 * - `VITE_STOMP_WS_URL` 이 있으면 그대로 사용
 * - 없으면 현재 origin 의 `/ws` (Vite 프록시·nginx → 백엔드 `/ws`)
 *
 * 백엔드는 SockJS 없이 순수 STOMP 엔드포인트를 열어두고, 인증은 핸드셰이크에 실리는
 * ACCESS_TOKEN 쿠키로만 한다. 따라서 WS 는 API 와 반드시 same-site 여야 한다 —
 * 절대 URL 로 다른 origin 에 붙으면 SameSite=Lax 쿠키가 실리지 않아 CONNECT 가 거부된다.
 */
export function resolveStompUrl(): string {
  const fromEnv = import.meta.env.VITE_STOMP_WS_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/+$/, '');
  if (typeof window === 'undefined') return 'ws://127.0.0.1:8080/ws';
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}/ws`;
}

/** 세션 실시간 연결용 STOMP 클라이언트. activate/deactivate 는 호출자가 관리한다. */
export function createStompClient(): Client {
  return new Client({
    brokerURL: resolveStompUrl(),
    reconnectDelay: 3000,
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,
  });
}

export const sessionDestinations = {
  messages: (sessionId: number) => `/topic/sessions/${sessionId}/messages`,
  participants: (sessionId: number) => `/topic/sessions/${sessionId}/participants`,
  quiz: (sessionId: number) => `/topic/sessions/${sessionId}/quiz`,
  project: (sessionId: number) => `/topic/sessions/${sessionId}/project`,
  errors: '/user/queue/errors',
  enter: (sessionId: number) => `/app/sessions/${sessionId}/enter`,
  leave: (sessionId: number) => `/app/sessions/${sessionId}/leave`,
  send: (sessionId: number) => `/app/sessions/${sessionId}/messages`,
} as const;
