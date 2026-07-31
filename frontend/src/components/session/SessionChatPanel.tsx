import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Send } from 'lucide-react';
import { AlertBanner } from '../../ds';
import { useMeOptional, useSessionSocket, type SessionParticipantResponse } from '../../data';

type SessionSocket = ReturnType<typeof useSessionSocket>;

function formatChatTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function ChatBubble({
  initial,
  name,
  role,
  time,
  text,
  mine,
}: {
  initial: string;
  name: string;
  role?: string;
  time: string;
  text: ReactNode;
  mine?: boolean;
}) {
  return (
    <div style={{ display: 'flex', gap: 8, flexDirection: mine ? 'row-reverse' : 'row' }}>
      <span
        style={{
          width: 28,
          height: 28,
          borderRadius: '50%',
          background: mine ? 'var(--tertiary-100)' : 'var(--accent-soft)',
          color: mine ? 'var(--quaternary-400)' : 'var(--accent)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 10,
          fontWeight: 700,
          flexShrink: 0,
        }}
      >
        {initial}
      </span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3, alignItems: mine ? 'flex-end' : 'flex-start' }}>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          {mine ? (
            <>
              {name} · {time}
            </>
          ) : (
            <>
              <span style={{ fontWeight: 600, color: 'var(--ink)' }}>{name}</span>{' '}
              {role ? <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{role}</span> : null} · {time}
            </>
          )}
        </span>
        <div
          style={{
            background: mine ? 'var(--accent-softer)' : 'var(--surface-sunken)',
            border: mine ? '1px solid var(--accent-soft)' : undefined,
            borderRadius: mine ? '10px 0 10px 10px' : '0 10px 10px 10px',
            padding: '9px 12px',
            fontSize: 12.5,
            lineHeight: 1.55,
            color: 'var(--text-body)',
            maxWidth: 240,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        >
          {text}
        </div>
      </div>
    </div>
  );
}

type SessionChatPanelProps = {
  chat: SessionSocket;
  hasSessionId: boolean;
};

export function SessionChatPanel({ chat, hasSessionId }: SessionChatPanelProps) {
  const [draft, setDraft] = useState('');
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const meQuery = useMeOptional();
  const myUserId = meQuery.data?.id ?? null;

  const roleByUserId = useMemo(() => {
    const map = new Map<number, SessionParticipantResponse['role']>();
    for (const p of chat.participants) map.set(p.userId, p.role);
    return map;
  }, [chat.participants]);

  const presenceLabel = useMemo(() => {
    if (!hasSessionId) return '세션 주소가 올바르지 않습니다';
    if (chat.status === 'connected') return `현재 ${chat.participants.length}명 접속 중`;
    if (chat.status === 'connecting') return '실시간 연결을 준비하는 중';
    if (chat.status === 'idle') return '세션에 연결되지 않았습니다';
    return '연결이 끊어졌습니다 · 자동으로 재연결합니다';
  }, [chat.participants.length, chat.status, hasSessionId]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [chat.messages.length]);

  const onSend = () => {
    if (!chat.sendMessage(draft)) return;
    setDraft('');
  };

  const canSend = chat.status === 'connected' && draft.trim().length > 0;

  return (
    <>
      <div
        ref={scrollRef}
        style={{ flex: 1, padding: 16, display: 'flex', flexDirection: 'column', gap: 14, overflow: 'auto', minHeight: 0 }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
            paddingBottom: 6,
            borderBottom: '1px solid var(--divider)',
          }}
        >
          <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink)' }}>실시간 클래스 채팅</span>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{presenceLabel}</span>
        </div>
        {chat.error ? (
          <AlertBanner
            tone="error"
            title="채팅 오류"
            description={chat.error}
            actionLabel="닫기"
            onAction={chat.dismissError}
          />
        ) : null}
        {chat.isHistoryLoading && chat.messages.length === 0 ? (
          <span style={{ fontSize: 12, color: 'var(--text-muted)', alignSelf: 'center' }}>메시지를 불러오는 중…</span>
        ) : chat.messages.length === 0 ? (
          <span style={{ fontSize: 12, color: 'var(--text-muted)', alignSelf: 'center', lineHeight: 1.6 }}>
            아직 메시지가 없습니다.
          </span>
        ) : (
          chat.messages.map((message) => {
            const senderRole = roleByUserId.get(message.senderId);
            return (
              <ChatBubble
                key={message.id}
                initial={message.senderName.trim().charAt(0) || '?'}
                name={message.senderName}
                role={senderRole && senderRole !== 'STUDENT' ? senderRole : undefined}
                time={formatChatTime(message.createdAt)}
                mine={myUserId != null && message.senderId === myUserId}
                text={message.content}
              />
            );
          })
        )}
      </div>
      <div style={{ borderTop: '1px solid var(--border)', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            border: '1px solid var(--border-strong)',
            borderRadius: 999,
            padding: '9px 14px',
          }}
        >
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key !== 'Enter' || e.shiftKey || e.nativeEvent.isComposing) return;
              e.preventDefault();
              onSend();
            }}
            maxLength={1000}
            disabled={chat.status !== 'connected'}
            placeholder={chat.status === 'connected' ? '메시지를 입력하세요…' : '연결을 기다리는 중…'}
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              background: 'transparent',
              fontSize: 13,
              color: 'var(--ink)',
              fontFamily: 'var(--font-sans)',
            }}
          />
          <button
            type="button"
            onClick={onSend}
            disabled={!canSend}
            aria-label="메시지 보내기"
            style={{
              width: 28,
              height: 28,
              borderRadius: 6,
              border: 'none',
              background: 'var(--accent)',
              color: 'var(--text-inverse)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: canSend ? 'pointer' : 'not-allowed',
              opacity: canSend ? 1 : 0.5,
              whiteSpace: 'nowrap',
              lineHeight: 1,
            }}
          >
            <Send size={13} />
          </button>
        </div>
      </div>
    </>
  );
}
