import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { Client, IMessage } from '@stomp/stompjs';
import { queryKeys } from '../network/core/queryKeys';
import { onLogout } from '../network/auth/logoutSignal';
import { useGetSessionPresence } from '../network/session';
import type { ChatMessageResponse, SessionParticipantResponse } from '../network/session';
import type { QuizSetStatus } from '../network/quiz';
import { normalizeQuizSetStatus } from '../network/quiz';
import { useGetVoicePresence } from '../network/voice';
import type {
  VoiceChannelEventResponse,
  VoiceParticipantResponse,
  VoiceSignalRequest,
  VoiceSignalResponse,
} from '../network/voice';
import { createStompClient, sessionDestinations } from './stompClient';

export type SessionSocketStatus = 'idle' | 'connecting' | 'connected' | 'disconnected';

/** `/topic/sessions/{id}/participants` 이벤트. participants 는 항상 현재 전체 명단이다. */
export interface SessionParticipantEvent {
  type: 'ENTER' | 'LEAVE';
  sessionId: number;
  participant: SessionParticipantResponse;
  participants: SessionParticipantResponse[];
  occurredAt: string;
}

/** `/topic/sessions/{id}/quiz` 이벤트. 문항은 담기지 않으므로 받으면 퀴즈셋을 다시 조회해야 한다. */
export interface QuizGenerationNotification {
  quizSetId: number;
  status: QuizSetStatus;
  generatedCount: number;
  errorMessage: string | null;
}

/** `/topic/sessions/{id}/project` 이벤트. 임포트 직후 참가자 전원 트리를 맞출 때 쓴다. */
export interface ProjectImportNotification {
  projectId: number;
  sessionId: number;
  fileCount: number;
  versionHash: string;
}

/** `/topic/sessions/{id}/status` 이벤트. 세션이 종료되면(active=false) 전 참가자에게 브로드캐스트된다. */
export interface SessionStatusEvent {
  sessionId: number;
  active: boolean;
  endedAt: string;
}

/** `/topic/sessions/{id}/quiz-progress` 이벤트. 학생 문항 제출마다 집계가 온다. */
export interface QuizProgressEvent {
  quizSetId: number;
  totalQuizCount?: number;
  startedStudentCount?: number;
  inProgressStudentCount?: number;
  completedStudentCount: number;
  totalStudentCount: number;
  allCompleted: boolean;
}

interface ChatErrorPayload {
  message: string;
  occurredAt: string;
}

const EMPTY_PARTICIPANTS: SessionParticipantResponse[] = [];
const EMPTY_VOICE: VoiceParticipantResponse[] = [];

/**
 * 서버가 입장 전 전송을 막을 때 쓰는 문구. 백엔드가 에러 코드를 주지 않아 메시지로 판별한다 —
 * 매칭에 실패하면 재시도 없이 그대로 사용자에게 노출되므로 동작상 안전한 최선 노력 복구다.
 */
const ENTER_REQUIRED_HINT = '입장';

interface UseSessionSocketOptions {
  /** 퀴즈 생성 완료/실패 푸시. 캐시 무효화는 훅이 이미 처리하므로 UI 알림용으로만 쓴다. */
  onQuizNotification?: (notification: QuizGenerationNotification) => void;
  /** 음성 시그널(offer/answer/ICE) 개인 토픽 구독·본인 join 판별용 */
  myUserId?: number | null;
  /**
   * 연결 직후 음성 채널에 자동 입장할지.
   * WebRTC 마이크 권한은 사용자 제스처가 필요하므로 기본 false — UI 버튼으로 join.
   */
  autoJoinVoice?: boolean;
}

/**
 * 세션 하나에 대한 STOMP 연결.
 * 채팅 · 참여자 · 퀴즈/프로젝트 알림 · 음성 채널을 한 연결에서 처리한다.
 *
 * 백엔드 계약상 순서가 중요하다: CONNECT → SUBSCRIBE → `/app/.../enter` → 그 뒤에야 메시지 전송이 허용된다
 * (SessionParticipantService#verifyPresent). 재연결 때도 같은 순서를 다시 밟아야 하므로
 * 구독과 입장은 언제나 onConnect 안에서 처리한다.
 *
 * @param sessionId 숫자 세션 id. null 이면 연결하지 않는다(목업·비로그인 화면).
 */
export function useSessionSocket(sessionId: number | null, options: UseSessionSocketOptions = {}) {
  const { onQuizNotification, myUserId = null, autoJoinVoice = false } = options;
  const queryClient = useQueryClient();

  const [status, setStatus] = useState<SessionSocketStatus>(sessionId == null ? 'idle' : 'connecting');
  const [liveMessages, setLiveMessages] = useState<ChatMessageResponse[]>([]);
  /** null = 아직 participants 이벤트를 받지 못함 → REST 로 받은 명단을 보여준다. */
  const [socketParticipants, setSocketParticipants] = useState<SessionParticipantResponse[] | null>(null);
  const [voiceParticipants, setVoiceParticipants] = useState<VoiceParticipantResponse[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastQuizNotification, setLastQuizNotification] = useState<QuizGenerationNotification | null>(null);
  /** null = 아직 status 이벤트를 받지 못함 — 세션 종료 브로드캐스트가 오면 채워진다. */
  const [sessionStatus, setSessionStatus] = useState<{ active: boolean; endedAt: string | null } | null>(null);
  const [lastQuizProgress, setLastQuizProgress] = useState<QuizProgressEvent | null>(null);
  /** useSessionVoice 가 큐를 드레인할 때마다 올려 리렌더를 유도한다. */
  const [voiceSignalTick, setVoiceSignalTick] = useState(0);

  const clientRef = useRef<Client | null>(null);
  /** 마지막으로 보낸 내용 — 입장 누락으로 거부됐을 때 한 번만 재전송한다. */
  const lastOutgoingRef = useRef<string | null>(null);
  const retriedRef = useRef(false);
  const onQuizRef = useRef(onQuizNotification);
  const myUserIdRef = useRef(myUserId);
  const autoJoinVoiceRef = useRef(autoJoinVoice);
  /** WebRTC 시그널 유실 방지용 큐 — React state 배치에 의존하지 않는다. */
  const voiceSignalQueueRef = useRef<VoiceSignalResponse[]>([]);

  useEffect(() => {
    onQuizRef.current = onQuizNotification;
  }, [onQuizNotification]);

  useEffect(() => {
    myUserIdRef.current = myUserId;
  }, [myUserId]);

  useEffect(() => {
    autoJoinVoiceRef.current = autoJoinVoice;
  }, [autoJoinVoice]);

  const presence = useGetSessionPresence(sessionId);
  const voicePresence = useGetVoicePresence(sessionId);

  useEffect(() => {
    if (sessionId == null) {
      return;
    }

    const client = createStompClient();
    clientRef.current = client;

    client.beforeConnect = () => {
      setStatus('connecting');
    };

    client.onConnect = () => {
      client.subscribe(sessionDestinations.messages(sessionId), (frame: IMessage) => {
        const message = JSON.parse(frame.body) as ChatMessageResponse;
        setLiveMessages((prev) => (prev.some((m) => m.id === message.id) ? prev : [...prev, message]));
      });

      client.subscribe(sessionDestinations.participants(sessionId), (frame: IMessage) => {
        const event = JSON.parse(frame.body) as SessionParticipantEvent;
        setSocketParticipants(event.participants);
      });

      client.subscribe(sessionDestinations.quiz(sessionId), (frame: IMessage) => {
        const notification = JSON.parse(frame.body) as QuizGenerationNotification & {
          status: string;
        };
        const normalized: QuizGenerationNotification = {
          ...notification,
          status: normalizeQuizSetStatus(notification.status),
        };
        // 알림에는 문항이 없다. 캐시를 비워 화면이 실제 퀴즈셋을 다시 받게 한다.
        queryClient.invalidateQueries({ queryKey: queryKeys.quiz.detail(normalized.quizSetId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.quiz.questions(normalized.quizSetId) });
        setLastQuizNotification(normalized);
        onQuizRef.current?.(normalized);
      });

      client.subscribe(sessionDestinations.project(sessionId), (frame: IMessage) => {
        const notification = JSON.parse(frame.body) as ProjectImportNotification;
        queryClient.invalidateQueries({ queryKey: queryKeys.projects.bySession(sessionId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.projects.files(notification.projectId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.projects.detail(notification.projectId) });
      });

      // 아래 두 토픽은 sessionDestinations 헬퍼가 아직 없어 기존 /topic/sessions/{id}/* 규칙대로 직접 조립한다.
      client.subscribe(`/topic/sessions/${sessionId}/status`, (frame: IMessage) => {
        const event = JSON.parse(frame.body) as SessionStatusEvent;
        setSessionStatus({ active: event.active, endedAt: event.endedAt ?? null });
        // LIVE 배지 등 세션 메타가 즉시 갱신되도록 detail 캐시를 비운다.
        queryClient.invalidateQueries({ queryKey: queryKeys.sessions.detail(sessionId) });
      });

      client.subscribe(`/topic/sessions/${sessionId}/quiz-progress`, (frame: IMessage) => {
        setLastQuizProgress(JSON.parse(frame.body) as QuizProgressEvent);
      });

      client.subscribe(sessionDestinations.voice(sessionId), (frame: IMessage) => {
        const event = JSON.parse(frame.body) as VoiceChannelEventResponse;
        setVoiceParticipants(event.participants);
        queryClient.setQueryData(queryKeys.voice.participants(sessionId), event.participants);
      });

      client.subscribe(sessionDestinations.errors, (frame: IMessage) => {
        const payload = JSON.parse(frame.body) as ChatErrorPayload;
        const pending = lastOutgoingRef.current;
        if (payload.message.includes(ENTER_REQUIRED_HINT) && pending && !retriedRef.current) {
          retriedRef.current = true;
          client.publish({ destination: sessionDestinations.enter(sessionId) });
          client.publish({
            destination: sessionDestinations.send(sessionId),
            body: JSON.stringify({ content: pending }),
          });
          return;
        }
        setError(payload.message);
      });

      client.publish({ destination: sessionDestinations.enter(sessionId) });
      if (autoJoinVoiceRef.current) {
        client.publish({ destination: sessionDestinations.voiceJoin(sessionId) });
      }
      setStatus('connected');
    };

    client.onStompError = (frame) => {
      setError(frame.headers.message || '실시간 연결에 실패했습니다.');
      setStatus('disconnected');
    };

    client.onWebSocketClose = () => {
      setStatus('disconnected');
    };

    client.activate();

    /**
     * 로그아웃해도 이미 열린 소켓은 핸드셰이크 시점 인증을 유지하므로 서버가 끊어주지 않는다.
     * (다른 탭에서 로그아웃한 경우까지 포함해) 신호를 받으면 이쪽에서 연결을 내린다.
     */
    const unsubscribeLogout = onLogout(() => {
      if (client.connected) {
        client.publish({ destination: sessionDestinations.voiceLeave(sessionId) });
        client.publish({ destination: sessionDestinations.leave(sessionId) });
      }
      void client.deactivate();
      setStatus('disconnected');
      setError('로그아웃되어 실시간 연결이 종료되었습니다.');
    });

    return () => {
      unsubscribeLogout();
      if (client.connected) {
        client.publish({ destination: sessionDestinations.voiceLeave(sessionId) });
        client.publish({ destination: sessionDestinations.leave(sessionId) });
      }
      void client.deactivate();
      clientRef.current = null;
      retriedRef.current = false;
      lastOutgoingRef.current = null;
      voiceSignalQueueRef.current = [];
      setLiveMessages([]);
      setSocketParticipants(null);
      setVoiceParticipants(null);
      setVoiceSignalTick(0);
      setSessionStatus(null);
      setLastQuizProgress(null);
      setStatus('connecting');
    };
  }, [sessionId, queryClient]);

  /** me 가 CONNECT 이후에 로드돼도 개인 시그널 토픽을 놓치지 않도록 별도 구독한다. */
  useEffect(() => {
    const client = clientRef.current;
    if (sessionId == null || myUserId == null || status !== 'connected' || !client?.connected) {
      return;
    }
    const sub = client.subscribe(sessionDestinations.voiceSignal(sessionId, myUserId), (frame: IMessage) => {
      const signal = JSON.parse(frame.body) as VoiceSignalResponse;
      voiceSignalQueueRef.current.push(signal);
      setVoiceSignalTick((n) => n + 1);
    });
    return () => {
      sub.unsubscribe();
    };
  }, [sessionId, myUserId, status]);

  /**
   * 이 연결에서 받은 메시지만 보여준다 — 방을 나가면 화면에서 지워지는 것이 정책이라
   * 과거 이력(`GET /sessions/{id}/messages`)은 의도적으로 조회하지 않는다. 다시 붙이지 말 것.
   * 내가 보낸 것도 토픽으로 되돌아오므로 id 로 중복을 제거하고 오름차순으로 정렬한다.
   */
  const messages = useMemo(() => {
    const byId = new Map<number, ChatMessageResponse>();
    for (const message of liveMessages) {
      byId.set(message.id, message);
    }
    return [...byId.values()].sort((a, b) => a.id - b.id);
  }, [liveMessages]);

  const resolvedVoice = voiceParticipants ?? voicePresence.data ?? EMPTY_VOICE;
  const myVoice = useMemo(
    () => (myUserId == null ? null : (resolvedVoice.find((p) => p.userId === myUserId) ?? null)),
    [resolvedVoice, myUserId],
  );
  const voiceJoined = myVoice != null;

  const sendMessage = useCallback(
    (content: string) => {
      const client = clientRef.current;
      const trimmed = content.trim();
      if (sessionId == null || !client?.connected || !trimmed) {
        return false;
      }
      if (trimmed.length > 1000) {
        setError('메시지는 1000자를 넘을 수 없습니다.');
        return false;
      }

      lastOutgoingRef.current = trimmed;
      retriedRef.current = false;
      client.publish({
        destination: sessionDestinations.send(sessionId),
        body: JSON.stringify({ content: trimmed }),
      });
      return true;
    },
    [sessionId],
  );

  const joinVoice = useCallback(() => {
    const client = clientRef.current;
    if (sessionId == null || !client?.connected) return false;
    client.publish({ destination: sessionDestinations.voiceJoin(sessionId) });
    return true;
  }, [sessionId]);

  const leaveVoice = useCallback(() => {
    const client = clientRef.current;
    if (sessionId == null || !client?.connected) return false;
    client.publish({ destination: sessionDestinations.voiceLeave(sessionId) });
    return true;
  }, [sessionId]);

  const updateVoiceState = useCallback(
    (next: { micMuted: boolean; deafened: boolean }) => {
      const client = clientRef.current;
      if (sessionId == null || !client?.connected) return false;
      client.publish({
        destination: sessionDestinations.voiceState(sessionId),
        body: JSON.stringify(next),
      });
      return true;
    },
    [sessionId],
  );

  const sendVoiceSignal = useCallback(
    (request: VoiceSignalRequest) => {
      const client = clientRef.current;
      if (sessionId == null || !client?.connected) return false;
      client.publish({
        destination: sessionDestinations.voiceSignalSend(sessionId),
        body: JSON.stringify(request),
      });
      return true;
    },
    [sessionId],
  );

  const toggleMic = useCallback(() => {
    if (!myVoice) return false;
    return updateVoiceState({ micMuted: !myVoice.micMuted, deafened: myVoice.deafened });
  }, [myVoice, updateVoiceState]);

  const toggleDeafened = useCallback(() => {
    if (!myVoice) return false;
    // 청취차단 ON → 마이크도 함께 뮤트. OFF 시 마이크·청취를 둘 다 복구한다.
    const nextDeafened = !myVoice.deafened;
    return updateVoiceState({
      micMuted: nextDeafened,
      deafened: nextDeafened,
    });
  }, [myVoice, updateVoiceState]);

  const dismissError = useCallback(() => setError(null), []);

  return {
    // 연결 대상이 없는 화면(목업·잘못된 주소)은 소켓 상태를 노출하지 않는다.
    status: sessionId == null ? 'idle' : status,
    messages,
    participants: socketParticipants ?? presence.data ?? EMPTY_PARTICIPANTS,
    voiceParticipants: resolvedVoice,
    voiceJoined,
    myVoice,
    joinVoice,
    leaveVoice,
    toggleMic,
    toggleDeafened,
    updateVoiceState,
    sendVoiceSignal,
    voiceSignalQueueRef,
    voiceSignalTick,
    error,
    dismissError,
    sendMessage,
    lastQuizNotification,
    sessionStatus,
    lastQuizProgress,
  };
}
