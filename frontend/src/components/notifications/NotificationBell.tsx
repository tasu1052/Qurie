import { useEffect, useId, useRef, useState, type CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import {
  QueryAsyncBoundary,
  useDismissHelpRequest,
  useGetClassHelpRequests,
  useGetNotices,
  useMeOptional,
  type HelpRequestResponse,
  type NoticeResponse,
  type UserRole,
} from '../../data';
import { noticeListPath, useOpenNoticeDetail } from '../../hooks/useOpenNoticeDetail';
import { Skeleton } from '../../ds';

const READ_KEY = 'qurie-notice-read-ids';

/** 뒤 화면은 강하게 뭉개고, 패널 본문은 읽히게 높은 불투명도 유지 */
const panelShellStyle: CSSProperties = {
  position: 'absolute',
  right: 0,
  top: 'calc(100% + 8px)',
  width: 340,
  maxHeight: 420,
  overflow: 'auto',
  background: 'var(--surface-modal)',
  border: '1px solid var(--border-strong)',
  borderRadius: 12,
  boxShadow: 'var(--shadow-modal)',
  zIndex: 800,
  display: 'flex',
  flexDirection: 'column',
  backdropFilter: 'blur(48px) saturate(1.45)',
  WebkitBackdropFilter: 'blur(48px) saturate(1.45)',
  color: 'var(--ink)',
};

function readIds(): Set<number> {
  try {
    const raw = localStorage.getItem(READ_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((n): n is number => typeof n === 'number'));
  } catch {
    return new Set();
  }
}

function writeIds(ids: Set<number>) {
  localStorage.setItem(READ_KEY, JSON.stringify([...ids]));
}

function scopeLabel(scope: NoticeResponse['scope']): string {
  if (scope === 'ENTERPRISE') return '전체';
  if (scope === 'TRACK') return '트랙';
  return '클래스';
}

function HelpRequestRows({
  requests,
  onClose,
}: {
  requests: HelpRequestResponse[];
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const dismiss = useDismissHelpRequest();

  if (requests.length === 0) return null;

  return (
    <>
      <div
        style={{
          padding: '10px 14px 6px',
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          color: 'var(--accent)',
        }}
      >
        질문 요청
      </div>
      {requests.map((req) => (
        <div
          key={`help-${req.id}`}
          style={{
            padding: '12px 14px',
            borderBottom: '1px solid var(--divider)',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            background: 'var(--surface-modal)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--status-warning)' }}>호출</span>
            <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-muted)' }}>
              {new Date(req.createdAt).toLocaleTimeString('ko-KR', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>
            {req.fromName}님이 도움이 필요해요
          </span>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.45 }}>
            세션 · {req.sessionTitle || `#${req.sessionId}`}
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={() => {
                dismiss.mutate(req.id);
                onClose();
                navigate(`/session/${req.sessionId}`);
              }}
              style={{
                border: 'none',
                background: 'var(--accent)',
                color: 'var(--text-inverse)',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'var(--font-sans)',
                borderRadius: 8,
                padding: '6px 10px',
              }}
            >
              세션으로 이동
            </button>
            <button
              type="button"
              onClick={() => dismiss.mutate(req.id)}
              style={{
                border: '1px solid var(--border)',
                background: 'transparent',
                color: 'var(--text-secondary)',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'var(--font-sans)',
                borderRadius: 8,
                padding: '6px 10px',
              }}
            >
              닫기
            </button>
          </div>
        </div>
      ))}
    </>
  );
}

function BellPanel({
  role,
  classId,
  onClose,
}: {
  role: UserRole;
  classId: number | null;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const openNotice = useOpenNoticeDetail();
  const { data } = useGetNotices({ size: 8 });
  const helpQuery = useGetClassHelpRequests(
    role === 'MANAGER' || role === 'MASTER' ? classId : null,
  );
  const notices = data.data;
  const helpRequests = helpQuery.data ?? [];
  const morePath = noticeListPath(role);

  useEffect(() => {
    if (notices.length === 0) return;
    const ids = readIds();
    for (const n of notices) ids.add(n.id);
    writeIds(ids);
  }, [notices]);

  return (
    <div role="dialog" aria-label="알림" style={panelShellStyle}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 14px',
          borderBottom: '1px solid var(--divider)',
          background: 'var(--surface-modal)',
          position: 'sticky',
          top: 0,
          zIndex: 1,
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>알림</span>
        {morePath ? (
          <button
            type="button"
            onClick={() => {
              onClose();
              navigate(morePath);
            }}
            style={{
              border: 'none',
              background: 'transparent',
              color: 'var(--accent)',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
              padding: 0,
            }}
          >
            공지 전체
          </button>
        ) : null}
      </div>

      <HelpRequestRows requests={helpRequests} onClose={onClose} />

      <div
        style={{
          padding: '10px 14px 6px',
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          color: 'var(--text-muted)',
        }}
      >
        공지
      </div>
      {notices.length === 0 ? (
        <div style={{ padding: '8px 20px 20px', fontSize: 13, color: 'var(--text-muted)' }}>
          {helpRequests.length === 0 ? '새 알림이 없습니다.' : '새 공지가 없습니다.'}
        </div>
      ) : (
        notices.map((n) => (
          <button
            key={n.id}
            type="button"
            onClick={() => {
              onClose();
              openNotice(n.id);
            }}
            style={{
              padding: '12px 14px',
              border: 'none',
              borderBottom: '1px solid var(--divider)',
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
              background: 'var(--surface-modal)',
              textAlign: 'left',
              cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
              color: 'inherit',
              width: '100%',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  color: 'var(--text-muted)',
                }}
              >
                {scopeLabel(n.scope)}
              </span>
              {n.pinned ? (
                <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--accent)' }}>고정</span>
              ) : null}
              <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-muted)' }}>
                {new Date(n.createdAt).toLocaleDateString('ko-KR')}
              </span>
            </div>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{n.title}</span>
            <span
              style={{
                fontSize: 12,
                color: 'var(--text-secondary)',
                lineHeight: 1.45,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {n.body}
            </span>
          </button>
        ))
      )}
    </div>
  );
}

function UnreadBadge({
  version,
  classId,
  role,
}: {
  version: number;
  classId: number | null;
  role: UserRole;
}) {
  const { data } = useGetNotices({ size: 8 });
  const helpQuery = useGetClassHelpRequests(
    role === 'MANAGER' || role === 'MASTER' ? classId : null,
  );
  void version;
  const unreadNotices = data.data.filter((n) => !readIds().has(n.id)).length;
  const helpCount = helpQuery.data?.length ?? 0;
  const unread = unreadNotices + helpCount;
  if (unread <= 0) return null;
  return (
    <span
      aria-label={`읽지 않은 알림 ${unread}개`}
      style={{
        position: 'absolute',
        top: 2,
        right: 2,
        minWidth: 16,
        height: 16,
        padding: '0 4px',
        borderRadius: 999,
        background: 'var(--status-error)',
        color: 'var(--text-inverse)',
        fontSize: 10,
        fontWeight: 700,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        lineHeight: 1,
      }}
    >
      {unread > 9 ? '9+' : unread}
    </span>
  );
}

type NotificationBellProps = {
  role: UserRole;
};

/** Topbar bell: notices + manager help-request alerts. */
export function NotificationBell({ role }: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const [readVersion, setReadVersion] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const meQuery = useMeOptional();
  const classId = meQuery.data?.classId ?? null;

  const close = () => {
    setOpen(false);
    setReadVersion((v) => v + 1);
  };

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} style={{ position: 'relative', display: 'inline-flex', zIndex: 810 }}>
      <button
        type="button"
        aria-label="알림"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => {
          if (open) close();
          else setOpen(true);
        }}
        style={{
          border: 'none',
          background: 'transparent',
          color: 'var(--text-secondary)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 4,
          cursor: 'pointer',
          position: 'relative',
          borderRadius: 8,
        }}
      >
        <Bell size={17} strokeWidth={1.75} />
        <QueryAsyncBoundary suspenseFallback={null} errorFallback={null}>
          <UnreadBadge version={readVersion} classId={classId} role={role} />
        </QueryAsyncBoundary>
      </button>
      {open ? (
        <div id={panelId}>
          <QueryAsyncBoundary
            suspenseFallback={
              <div style={{ ...panelShellStyle, padding: 16, overflow: 'hidden' }}>
                <Skeleton width="100%" height={80} radius={8} />
              </div>
            }
            errorFallback={
              <div style={{ ...panelShellStyle, padding: 16, fontSize: 13, color: 'var(--text-muted)' }}>
                알림을 불러오지 못했습니다.
              </div>
            }
          >
            <BellPanel role={role} classId={classId} onClose={close} />
          </QueryAsyncBoundary>
        </div>
      ) : null}
    </div>
  );
}
