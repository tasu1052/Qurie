import { useEffect, useId, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { QueryAsyncBoundary, useGetNotices, type NoticeResponse, type UserRole } from '../../data';
import { Skeleton } from '../../ds';

const READ_KEY = 'qurie-notice-read-ids';

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

function allNoticesPath(role: UserRole): string | null {
  if (role === 'MASTER') return '/master/announcements';
  if (role === 'STUDENT') return '/app/classes';
  return null;
}

function BellPanel({
  role,
  onClose,
}: {
  role: UserRole;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const { data } = useGetNotices({ size: 8 });
  const notices = data.data;
  const morePath = allNoticesPath(role);

  useEffect(() => {
    if (notices.length === 0) return;
    const ids = readIds();
    for (const n of notices) ids.add(n.id);
    writeIds(ids);
  }, [notices]);

  return (
    <div
      role="dialog"
      aria-label="알림"
      style={{
        position: 'absolute',
        right: 0,
        top: 'calc(100% + 8px)',
        width: 340,
        maxHeight: 420,
        overflow: 'auto',
        background: 'var(--surface-card)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        boxShadow: 'var(--shadow-modal)',
        zIndex: 40,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 14px',
          borderBottom: '1px solid var(--divider)',
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>알림 · 공지</span>
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
            전체 보기
          </button>
        ) : null}
      </div>
      {notices.length === 0 ? (
        <div style={{ padding: 20, fontSize: 13, color: 'var(--text-muted)' }}>새 공지가 없습니다.</div>
      ) : (
        notices.map((n) => (
          <div
            key={n.id}
            style={{
              padding: '12px 14px',
              borderBottom: '1px solid var(--divider)',
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
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
          </div>
        ))
      )}
    </div>
  );
}

function UnreadBadge({ version }: { version: number }) {
  const { data } = useGetNotices({ size: 8 });
  void version;
  const unread = data.data.filter((n) => !readIds().has(n.id)).length;
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

/** Topbar bell: recent notices as in-app notifications (no dedicated notification API yet). */
export function NotificationBell({ role }: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const [readVersion, setReadVersion] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

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
    <div ref={rootRef} style={{ position: 'relative', display: 'inline-flex' }}>
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
          <UnreadBadge version={readVersion} />
        </QueryAsyncBoundary>
      </button>
      {open ? (
        <div id={panelId}>
          <QueryAsyncBoundary
            suspenseFallback={
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  top: 'calc(100% + 8px)',
                  width: 340,
                  padding: 16,
                  background: 'var(--surface-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  boxShadow: 'var(--shadow-modal)',
                  zIndex: 40,
                }}
              >
                <Skeleton width="100%" height={80} radius={8} />
              </div>
            }
            errorFallback={
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  top: 'calc(100% + 8px)',
                  width: 340,
                  padding: 16,
                  background: 'var(--surface-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  boxShadow: 'var(--shadow-modal)',
                  zIndex: 40,
                  fontSize: 13,
                  color: 'var(--text-muted)',
                }}
              >
                알림을 불러오지 못했습니다.
              </div>
            }
          >
            <BellPanel role={role} onClose={close} />
          </QueryAsyncBoundary>
        </div>
      ) : null}
    </div>
  );
}
