import { useEffect, useRef, useState } from 'react';
import type { MutableRefObject } from 'react';
import type {
  VoiceParticipantResponse,
  VoiceSignalRequest,
  VoiceSignalResponse,
} from '../network/voice';
import { resolveIceServers } from './iceServers';

interface PeerSlot {
  pc: RTCPeerConnection;
  audio: HTMLAudioElement;
  makingOffer: boolean;
  ignoreOffer: boolean;
  /** setRemoteDescription 전에 도착한 ICE */
  pendingCandidates: RTCIceCandidateInit[];
}

export interface UseSessionVoiceOptions {
  /** 음성 채널에 들어와 있을 때만 true */
  enabled: boolean;
  myUserId: number | null;
  peers: VoiceParticipantResponse[];
  micMuted: boolean;
  deafened: boolean;
  sendSignal: (request: VoiceSignalRequest) => boolean;
  /**
   * 소켓이 시그널을 넣을 큐. useSessionSocket 의 voiceSignalQueueRef 를 그대로 넘긴다.
   * React state 로 시그널을 받으면 배치로 유실될 수 있어 큐+tick 방식을 쓴다.
   */
  signalQueueRef: MutableRefObject<VoiceSignalResponse[]>;
  signalTick: number;
}

export type SessionVoiceStatus = 'idle' | 'starting' | 'live' | 'error';

/**
 * 세션 음성 채널 WebRTC 풀메시.
 * - 참여자마다 RTCPeerConnection 하나
 * - offer 충돌은 polite peer(myUserId > remoteId) 패턴으로 해소
 * - 서버는 SDP/ICE 중계만 (VoiceChannelService#relaySignal)
 */
export function useSessionVoice(options: UseSessionVoiceOptions) {
  const {
    enabled,
    myUserId,
    peers,
    micMuted,
    deafened,
    sendSignal,
    signalQueueRef,
    signalTick,
  } = options;

  const [mediaStatus, setMediaStatus] = useState<'starting' | 'live' | 'error' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const channelActive = enabled && myUserId != null;
  const status: SessionVoiceStatus = !channelActive ? 'idle' : (mediaStatus ?? 'starting');

  const localStreamRef = useRef<MediaStream | null>(null);
  const peersRef = useRef<Map<number, PeerSlot>>(new Map());
  const sendSignalRef = useRef(sendSignal);
  const myUserIdRef = useRef(myUserId);
  const deafenedRef = useRef(deafened);
  const micMutedRef = useRef(micMuted);
  const enabledRef = useRef(enabled);

  useEffect(() => {
    sendSignalRef.current = sendSignal;
  }, [sendSignal]);
  useEffect(() => {
    myUserIdRef.current = myUserId;
  }, [myUserId]);
  useEffect(() => {
    deafenedRef.current = deafened;
  }, [deafened]);
  useEffect(() => {
    micMutedRef.current = micMuted;
  }, [micMuted]);
  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  const closePeer = (remoteUserId: number) => {
    const slot = peersRef.current.get(remoteUserId);
    if (!slot) return;
    try {
      slot.pc.close();
    } catch {
      // ignore
    }
    slot.audio.pause();
    slot.audio.srcObject = null;
    slot.audio.remove();
    peersRef.current.delete(remoteUserId);
  };

  const closeAllPeers = () => {
    for (const id of [...peersRef.current.keys()]) {
      closePeer(id);
    }
  };

  const stopLocalStream = () => {
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
  };

  const ensurePeer = (remoteUserId: number): PeerSlot | null => {
    const selfId = myUserIdRef.current;
    const stream = localStreamRef.current;
    if (selfId == null || stream == null || remoteUserId === selfId) {
      return null;
    }

    const existing = peersRef.current.get(remoteUserId);
    if (existing) return existing;

    const pc = new RTCPeerConnection({ iceServers: resolveIceServers() });
    const audio = document.createElement('audio');
    audio.autoplay = true;
    audio.playsInline = true;
    audio.dataset.voicePeer = String(remoteUserId);
    audio.muted = deafenedRef.current;
    document.body.appendChild(audio);

    const slot: PeerSlot = {
      pc,
      audio,
      makingOffer: false,
      ignoreOffer: false,
      pendingCandidates: [],
    };
    peersRef.current.set(remoteUserId, slot);

    for (const track of stream.getTracks()) {
      pc.addTrack(track, stream);
    }

    pc.onicecandidate = (event) => {
      if (!event.candidate || !enabledRef.current) return;
      sendSignalRef.current({
        targetUserId: remoteUserId,
        type: 'candidate',
        payload: JSON.stringify(event.candidate.toJSON()),
      });
    };

    pc.ontrack = (event) => {
      const [remoteStream] = event.streams;
      if (remoteStream) {
        slot.audio.srcObject = remoteStream;
      } else {
        const fallback = new MediaStream([event.track]);
        slot.audio.srcObject = fallback;
      }
      slot.audio.muted = deafenedRef.current;
      void slot.audio.play().catch(() => {
        // 자동재생 차단 시 — 사용자가 이미 조인 제스처를 한 경우가 대부분이므로 무시
      });
    };

    pc.onnegotiationneeded = async () => {
      try {
        slot.makingOffer = true;
        await pc.setLocalDescription();
        const desc = pc.localDescription;
        if (!desc || !enabledRef.current) return;
        sendSignalRef.current({
          targetUserId: remoteUserId,
          type: desc.type === 'offer' ? 'offer' : 'answer',
          payload: JSON.stringify(desc),
        });
      } catch (err) {
        console.warn('[voice] negotiationneeded failed', err);
      } finally {
        slot.makingOffer = false;
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'failed') {
        pc.restartIce();
      }
    };

    return slot;
  };

  const flushPendingCandidates = async (slot: PeerSlot) => {
    if (!slot.pc.remoteDescription) return;
    const queued = slot.pendingCandidates.splice(0);
    for (const candidate of queued) {
      try {
        await slot.pc.addIceCandidate(candidate);
      } catch (err) {
        if (!slot.ignoreOffer) {
          console.warn('[voice] addIceCandidate failed', err);
        }
      }
    }
  };

  const handleSignal = async (signal: VoiceSignalResponse) => {
    if (!enabledRef.current || myUserIdRef.current == null) return;

    const slot = ensurePeer(signal.fromUserId);
    if (!slot) return;

    const polite = myUserIdRef.current > signal.fromUserId;

    try {
      if (signal.type === 'candidate') {
        const candidate = JSON.parse(signal.payload) as RTCIceCandidateInit;
        if (!slot.pc.remoteDescription) {
          slot.pendingCandidates.push(candidate);
          return;
        }
        await slot.pc.addIceCandidate(candidate);
        return;
      }

      const description = JSON.parse(signal.payload) as RTCSessionDescriptionInit;
      const offerCollision =
        description.type === 'offer' &&
        (slot.makingOffer || slot.pc.signalingState !== 'stable');

      slot.ignoreOffer = !polite && offerCollision;
      if (slot.ignoreOffer) {
        return;
      }

      if (offerCollision) {
        await Promise.all([
          slot.pc.setLocalDescription({ type: 'rollback' }),
          slot.pc.setRemoteDescription(description),
        ]);
      } else {
        await slot.pc.setRemoteDescription(description);
      }

      await flushPendingCandidates(slot);

      if (description.type === 'offer') {
        await slot.pc.setLocalDescription();
        const answer = slot.pc.localDescription;
        if (answer) {
          sendSignalRef.current({
            targetUserId: signal.fromUserId,
            type: 'answer',
            payload: JSON.stringify(answer),
          });
        }
      }
    } catch (err) {
      console.warn('[voice] handleSignal failed', err);
    }
  };

  /** 채널 입장/퇴장 — 로컬 마이크 + peer 수명 */
  useEffect(() => {
    if (!enabled || myUserId == null) {
      closeAllPeers();
      stopLocalStream();
      return;
    }

    let cancelled = false;

    (async () => {
      setMediaStatus('starting');
      setError(null);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
          video: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        for (const track of stream.getAudioTracks()) {
          track.enabled = !micMutedRef.current;
        }
        localStreamRef.current = stream;
        setMediaStatus('live');
      } catch (err) {
        if (cancelled) return;
        console.warn('[voice] getUserMedia failed', err);
        setMediaStatus('error');
        setError('마이크 권한을 허용해야 음성 통화에 참여할 수 있습니다.');
        stopLocalStream();
      }
    })();

    return () => {
      cancelled = true;
      closeAllPeers();
      stopLocalStream();
    };
    // peers 동기화는 아래 effect — 여기선 입장/퇴장만
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, myUserId]);

  /** 참여자 목록 ↔ peer 맵 동기화 (로컬 스트림 준비 후) */
  useEffect(() => {
    if (!enabled || myUserId == null || status !== 'live' || !localStreamRef.current) {
      return;
    }

    const remoteIds = new Set(
      peers.map((p) => p.userId).filter((id) => id !== myUserId),
    );

    for (const id of [...peersRef.current.keys()]) {
      if (!remoteIds.has(id)) {
        closePeer(id);
      }
    }
    for (const id of remoteIds) {
      ensurePeer(id);
    }
  }, [enabled, myUserId, peers, status]);

  /** 시그널 큐 드레인 */
  useEffect(() => {
    if (!enabled || status !== 'live') return;
    const queued = signalQueueRef.current.splice(0);
    for (const signal of queued) {
      void handleSignal(signal);
    }
    // handleSignal/ensurePeer 는 refs 기반
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signalTick, enabled, status]);

  /** 마이크 트랙 ↔ UI 음소거 */
  useEffect(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    for (const track of stream.getAudioTracks()) {
      track.enabled = !micMuted;
    }
  }, [micMuted]);

  /** 헤드셋(청취 차단) ↔ 원격 audio */
  useEffect(() => {
    for (const slot of peersRef.current.values()) {
      slot.audio.muted = deafened;
    }
  }, [deafened]);

  return {
    status,
    error,
    dismissError: () => setError(null),
  };
}
