import { useEffect, useMemo, useRef, useState } from 'react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';

export type CollabStatus = 'connecting' | 'connected' | 'disconnected';

export interface CollabUser {
  name: string;
  color: string;
  /** 세션 참가자 userId — 퇴장 시 원격 커서 정리에 사용 */
  id?: number | null;
}

/* eslint-disable qurie/no-raw-color -- remote cursors need distinct hex per client; DS tokens are not a multi-user palette */
/** 원격 커서 색: 유저마다 구분되도록 CMYK 계열 팔레트. */
const CURSOR_PALETTE = [
  '#00A3E0', // Cyan
  '#E4007C', // Magenta
  '#FFD100', // Yellow
  '#111111', // Key (black)
  '#008B8B', // Dark cyan
  '#C71585', // Medium violet red (magenta family)
  '#DAA520', // Goldenrod (yellow family)
  '#2F4F4F', // Dark slate (key family)
  '#40E0D0', // Turquoise
  '#FF69B4', // Hot pink
  '#F0E68C', // Khaki
  '#696969', // Dim gray
];
/* eslint-enable qurie/no-raw-color */

function resolveCursorColor(clientId: number): string {
  return CURSOR_PALETTE[Math.abs(clientId) % CURSOR_PALETTE.length];
}

/**
 * Yjs WS URL.
 * - `VITE_YJS_WS_URL` 이 있으면 그대로 사용
 * - 없으면 현재 origin 의 `/yjs` (Vite·nginx → collab-server)
 *   배포에서는 ACCESS_TOKEN 쿠키가 핸드셰이크에 실리도록 백엔드와 same-site 여야 한다.
 */
export function resolveYjsWsUrl(): string {
  const fromEnv = import.meta.env.VITE_YJS_WS_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/+$/, '');
  if (typeof window === 'undefined') return 'ws://127.0.0.1:1234';
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}/yjs`;
}

/**
 * 세션 방(roomId) 하나에 대한 Yjs 공유 문서 + WebSocket provider.
 * 전송 계층은 resolveYjsWsUrl() 로 추상화한다.
 *  - 개발: npm run collab:server (AUTH_DISABLED) + Vite `/yjs` 프록시
 *  - 배포: collab-server 컨테이너. nginx `/yjs` → 1234, JWT 쿠키 인증
 *
 * 퇴장/탭 종료 시 awareness local state 를 null 로 브로드캐스트해
 * 다른 참가자 화면에 남은 원격 커서를 즉시 지운다.
 */
export function useCollabSession(
  roomId: string,
  user: { name: string; id?: number | null },
) {
  const [status, setStatus] = useState<CollabStatus>('connecting');

  // roomId가 바뀌기 전까지 동일 인스턴스 유지
  const ydoc = useMemo(() => new Y.Doc(), [roomId]); // eslint-disable-line react-hooks/exhaustive-deps
  const ytext = useMemo(() => ydoc.getText('monaco'), [ydoc]);

  const providerRef = useRef<WebsocketProvider | null>(null);
  const [provider, setProvider] = useState<WebsocketProvider | null>(null);
  /** 'sync' 콜백에서 provider.synced 를 다시 읽도록 리렌더만 유발한다. */
  const [syncTick, setSyncTick] = useState(0);

  useEffect(() => {
    const wsUrl = resolveYjsWsUrl();
    const p = new WebsocketProvider(wsUrl, `qurie-session-${roomId}`, ydoc);
    providerRef.current = p;

    const onStatus = ({ status: s }: { status: string }) => {
      setStatus(s === 'connected' ? 'connected' : s === 'connecting' ? 'connecting' : 'disconnected');
    };
    const onSync = () => {
      setSyncTick((n) => n + 1);
    };
    p.on('status', onStatus);
    p.on('sync', onSync);

    /** 연결이 살아있는 동안 null 상태를 보내 원격 커서를 제거한다. */
    const clearLocalAwareness = () => {
      try {
        p.awareness.setLocalState(null);
      } catch {
        // provider 이미 destroy된 경우
      }
    };

    const onPageLeave = () => {
      clearLocalAwareness();
    };
    window.addEventListener('pagehide', onPageLeave);
    window.addEventListener('beforeunload', onPageLeave);

    // provider는 effect에서만 생성 가능 — 렌더 트리 노출을 위한 1회성 동기화.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- external WebsocketProvider bridge
    setProvider(p);

    return () => {
      window.removeEventListener('pagehide', onPageLeave);
      window.removeEventListener('beforeunload', onPageLeave);
      p.off('status', onStatus);
      p.off('sync', onSync);
      clearLocalAwareness();
      p.destroy();
      ydoc.destroy();
      providerRef.current = null;
      setProvider(null);
    };
    // user.name/id 변경 시 provider·ydoc 를 재생성하지 않는다 (새로고침 후 편집본 유실 방지).
    // eslint-disable-next-line react-hooks/exhaustive-deps -- room 단위 1 provider
  }, [roomId, ydoc]);

  /** 로그인 정보가 늦게 오면 awareness 만 갱신한다. */
  useEffect(() => {
    if (!provider) return;
    provider.awareness.setLocalStateField('user', {
      name: user.name,
      color: resolveCursorColor(ydoc.clientID),
      id: user.id ?? null,
    } satisfies CollabUser);
  }, [provider, user.name, user.id, ydoc]);

  // syncTick 변경 시 provider.synced 를 재평가한다. provider 가 없으면 false.
  const synced = syncTick >= 0 && Boolean(provider?.synced);

  return { ydoc, ytext, provider, status, synced };
}
