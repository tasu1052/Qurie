/**
 * WebRTC ICE 서버 목록.
 * - 기본: 공개 STUN (같은 LAN·단순 NAT)
 * - TURN: `VITE_ICE_SERVERS` 에 JSON 배열을 넣으면 그대로 사용
 *   예) [{"urls":"stun:stun.l.google.com:19302"},{"urls":"turn:turn.example:3478","username":"u","credential":"p"}]
 */
export function resolveIceServers(): RTCIceServer[] {
  const raw = import.meta.env.VITE_ICE_SERVERS?.trim();
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as RTCIceServer[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    } catch {
      console.warn('[voice] VITE_ICE_SERVERS JSON 파싱 실패 — 기본 STUN 사용');
    }
  }
  return [{ urls: 'stun:stun.l.google.com:19302' }];
}
