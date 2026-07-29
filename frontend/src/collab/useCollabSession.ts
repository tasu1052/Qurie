import { useEffect, useMemo, useRef, useState } from 'react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';

export type CollabStatus = 'connecting' | 'connected' | 'disconnected';

export interface CollabUser {
  name: string;
  color: string;
}

/** 원격 커서 색: DS 토큰에서 런타임 해석(raw hex 금지 규칙 준수). */
const CURSOR_TOKEN_NAMES = ['--accent', '--status-green', '--status-amber', '--status-red'];

function resolveCursorColor(clientId: number): string {
  const token = CURSOR_TOKEN_NAMES[clientId % CURSOR_TOKEN_NAMES.length];
  const value = getComputedStyle(document.documentElement).getPropertyValue(token).trim();
  return value || 'var(--accent)';
}

/**
 * 세션 방(roomId) 하나에 대한 Yjs 공유 문서 + WebSocket provider.
 * 전송 계층은 VITE_YJS_WS_URL(개발용 y-websocket 서버)로 추상화 —
 * 백엔드 WS가 준비되면 env만 교체하면 된다.
 */
export function useCollabSession(roomId: string, user: { name: string }) {
  const [status, setStatus] = useState<CollabStatus>('connecting');

  // roomId가 바뀌기 전까지 동일 인스턴스 유지
  const ydoc = useMemo(() => new Y.Doc(), [roomId]); // eslint-disable-line react-hooks/exhaustive-deps
  const ytext = useMemo(() => ydoc.getText('monaco'), [ydoc]);

  const providerRef = useRef<WebsocketProvider | null>(null);
  const [provider, setProvider] = useState<WebsocketProvider | null>(null);

  useEffect(() => {
    const wsUrl = import.meta.env.VITE_YJS_WS_URL ?? 'ws://localhost:1234';
    const p = new WebsocketProvider(wsUrl, `qurie-session-${roomId}`, ydoc);
    providerRef.current = p;

    p.awareness.setLocalStateField('user', {
      name: user.name,
      color: resolveCursorColor(ydoc.clientID),
    } satisfies CollabUser);

    const onStatus = ({ status: s }: { status: string }) => {
      setStatus(s === 'connected' ? 'connected' : s === 'connecting' ? 'connecting' : 'disconnected');
    };
    p.on('status', onStatus);
    // 외부 시스템(WebSocket provider) 인스턴스를 렌더 트리에 노출하는 유일한 시점 —
    // 생성은 effect에서만 가능하므로 여기서의 setState는 의도된 1회성 동기화다.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProvider(p);

    return () => {
      p.off('status', onStatus);
      p.destroy();
      ydoc.destroy();
      providerRef.current = null;
      setProvider(null);
    };
  }, [roomId, ydoc, user.name]);

  return { ydoc, ytext, provider, status };
}
