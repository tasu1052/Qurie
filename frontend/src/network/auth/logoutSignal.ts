/**
 * 로그아웃 신호. 쿠키를 지우는 것만으로는 이미 열려 있는 리소스가 정리되지 않는다 —
 * STOMP 연결은 핸드셰이크 시점 인증을 유지하고, 다른 탭의 React Query 캐시에는 `me` 가 남는다.
 * 그래서 로그아웃을 "이벤트"로 알려 각자 정리하게 한다.
 *
 * BroadcastChannel 은 보낸 쪽에는 전달되지 않으므로 로컬 리스너를 따로 호출한다.
 * 지원하지 않는 환경(구형 브라우저)에서는 같은 탭 정리만 동작한다.
 */
const CHANNEL_NAME = 'qurie-auth';
const LOGOUT_MESSAGE = 'logout';

type LogoutListener = () => void;

const listeners = new Set<LogoutListener>();

function createChannel(): BroadcastChannel | null {
  if (typeof BroadcastChannel === 'undefined') return null;
  return new BroadcastChannel(CHANNEL_NAME);
}

/** 로그아웃을 이 탭과 다른 모든 탭에 알린다. */
export function notifyLogout(): void {
  const channel = createChannel();
  if (channel) {
    channel.postMessage(LOGOUT_MESSAGE);
    channel.close();
  }
  for (const listener of [...listeners]) {
    listener();
  }
}

/** 로그아웃 구독. 반환된 함수를 호출해 해지한다(effect cleanup 에서 그대로 쓸 수 있다). */
export function onLogout(listener: LogoutListener): () => void {
  listeners.add(listener);

  const channel = createChannel();
  const onMessage = (event: MessageEvent) => {
    if (event.data === LOGOUT_MESSAGE) listener();
  };
  channel?.addEventListener('message', onMessage);

  return () => {
    listeners.delete(listener);
    channel?.removeEventListener('message', onMessage);
    channel?.close();
  };
}
