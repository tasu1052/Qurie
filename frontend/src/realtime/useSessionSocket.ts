import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { Client, IMessage } from '@stomp/stompjs';
import { queryKeys } from '../network/core/queryKeys';
import { useGetSessionChatHistory, useGetSessionPresence } from '../network/session';
import type { ChatMessageResponse, SessionParticipantResponse } from '../network/session';
import type { QuizSetStatus } from '../network/quiz';
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

interface ChatErrorPayload {
  message: string;
  occurredAt: string;
}

/**
 * 서버가 입장 전 전송을 막을 때 쓰는 문구. 백엔드가 에러 코드를 주지 않아 메시지로 판별한다 —
 * 매칭에 실패하면 재시도 없이 그대로 사용자에게 노출되므로 동작상 안전한 최선 노력 복구다.
 */
const ENTER_REQUIRED_HINT = '입장';

interface UseSessionSocketOptions {
  /** 퀴즈 생성 완료/실패 푸시. 캐시 무효화는 훅이 이미 처리하므로 UI 알림용으로만 쓴다. */
  onQuizNotification?: (notification: QuizGenerationNotification) => void;
}

/**
 * 세션 하나에 대한 STOMP 연결. 채팅 메시지 · 참여자 명단 · 퀴즈 생성 알림을 한 연결에서 받는다.
 *
 * 백엔드 계약상 순서가 중요하다: CONNECT → SUBSCRIBE → `/app/.../enter` → 그 뒤에야 메시지 전송이 허용된다
 * (SessionParticipantService#verifyPresent). 재연결 때도 같은 순서를 다시 밟아야 하므로
 * 구독과 입장은 전부 onConnect 안에서 처리한다.
 *
 * @param sessionId 숫자 세션 id. null 이면 연결하지 않는다(목업·비로그인 화면).
 */
export function useSessionSocket(sessionId: number | null, options: UseSessionSocketOptions = {}) {
  const { onQuizNotification } = options;
  const queryClient = useQueryClient();

  const [status, setStatus] = useState<SessionSocketStatus>(sessionId == null ? 'idle' : 'connecting');
  const [liveMessages, setLiveMessages] = useState<ChatMessageResponse[]>([]);
  /** null = 아직 participants 이벤트를 받지 못함 → REST 로 받은 명단을 보여준다. */
  const [socketParticipants, setSocketParticipants] = useState<SessionParticipantResponse[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastQuizNotification, setLastQuizNotification] = useState<QuizGenerationNotification | null>(null);

  const clientRef = useRef<Client | null>(null);
  /** 마지막으로 보낸 내용 — 입장 누락으로 거부됐을 때 한 번만 재전송한다. */
  const lastOutgoingRef = useRef<string | null>(null);
  const retriedRef = useRef(false);
  const onQuizRef = useRef(onQuizNotification);

  useEffect(() => {
    onQuizRef.current = onQuizNotification;
  }, [onQuizNotification]);

  const history = useGetSessionChatHistory(sessionId);
  const presence = useGetSessionPresence(sessionId);

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
        const notification = JSON.parse(frame.body) as QuizGenerationNotification;
        // 알림에는 문항이 없다. 캐시를 비워 화면이 실제 퀴즈셋을 다시 받게 한다.
        queryClient.invalidateQueries({ queryKey: queryKeys.quiz.detail(notification.quizSetId) });
        setLastQuizNotification(notification);
        onQuizRef.current?.(notification);
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

    return () => {
      if (client.connected) {
        client.publish({ destination: sessionDestinations.leave(sessionId) });
      }
      void client.deactivate();
      clientRef.current = null;
      retriedRef.current = false;
      lastOutgoingRef.current = null;
      setLiveMessages([]);
      setSocketParticipants(null);
      setStatus('connecting');
    };
  }, [sessionId, queryClient]);

  /** 이력(최신순 DESC)과 소켓 수신분을 id 오름차순으로 합친다. 내가 보낸 것도 토픽으로 되돌아오므로 id 로 중복을 제거한다. */
  const messages = useMemo(() => {
    const byId = new Map<number, ChatMessageResponse>();
    for (const message of history.data ?? []) {
      byId.set(message.id, message);
    }
    for (const message of liveMessages) {
      byId.set(message.id, message);
    }
    return [...byId.values()].sort((a, b) => a.id - b.id);
  }, [history.data, liveMessages]);

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

  const dismissError = useCallback(() => setError(null), []);

  return {
    // 연결 대상이 없는 화면(목업·잘못된 주소)은 소켓 상태를 노출하지 않는다.
    status: sessionId == null ? 'idle' : status,
    messages,
    participants: socketParticipants ?? presence.data ?? [],
    error,
    dismissError,
    sendMessage,
    lastQuizNotification,
    isHistoryLoading: history.isLoading,
  };
}
