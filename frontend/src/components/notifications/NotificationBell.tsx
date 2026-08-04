import { useEffect, useId, useRef, useState, type CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import {
  QueryAsyncBoundary,
  useGetClassHelpRequests,
  useGetNotices,
  useMeOptional,
  type UserRole,
} from '../../data';
import { noticeListPath } from '../../hooks/useOpenNoticeDetail';

const READ_KEY_PREFIX = 'qurie-notice-read-ids';

function readKeyForUser(userId: number | undefined): string | null {
  if (userId == null) return null;
  return `${READ_KEY_PREFIX}-${userId}`;
}

function readIds(userId: number | undefined): Set<number> {
  const key = readKeyForUser(userId);
  if (!key) return new Set();
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((n): n is number => typeof n === 'number'));
  } catch {
    return new Set();
  }
}

function markNoticesRead(userId: number | undefined, noticeIds: number[]) {
  if (noticeIds.length === 0) return;
  const key = readKeyForUser(userId);
  if (!key) return;
  const ids = readIds(userId);
  for (const id of noticeIds) ids.add(id);
  localStorage.setItem(key, JSON.stringify([...ids]));
}

const emptyPanelStyle: CSSProperties = {
  position: 'absolute',
  right: 0,
  top: 'calc(100% + 8px)',
  width: 220,
  padding: '12px 14px',
  background: 'var(--surface-modal)',
  border: '1px solid var(--border-strong)',
  borderRadius: 12,
  boxShadow: 'var(--shadow-modal)',
  zIndex: 800,
  fontSize: 13,
  color: 'var(--text-muted)',
};

const backdropStyle: CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 799,
  border: 'none',
  padding: 0,
  margin: 0,
  background: 'var(--scrim-modal)',
  cursor: 'default',
};

function dashboardPathForRole(role: UserRole): string {
  if (role === 'MASTER') return '/master';
  if (role === 'MANAGER') return '/manager';
  return '/app';
}

function UnreadBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span
      aria-label={`읽지 않은 알림 ${count}개`}
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
      {count > 9 ? '9+' : count}
    </span>
  );
}

function NotificationBellInner({
  role,
  classId,
  userId,
}: {
  role: UserRole;
  classId: number | null;
  userId: number | undefined;
}) {
  const navigate = useNavigate();
  const [emptyOpen, setEmptyOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

  const { data } = useGetNotices({
    size: 8,
    forAudience: role === 'MASTER' ? undefined : true,
  });
  const helpQuery = useGetClassHelpRequests(
    role === 'MANAGER' || role === 'MASTER' ? classId : null,
  );

  const unreadNotices = data.data.filter((n) => !readIds(userId).has(n.id));
  const helpCount = helpQuery.data?.length ?? 0;
  const unreadTotal = unreadNotices.length + helpCount;

  const closeEmpty = () => setEmptyOpen(false);

  useEffect(() => {
    if (!emptyOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) closeEmpty();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeEmpty();
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [emptyOpen]);

  const onBellClick = () => {
    if (unreadTotal > 0) {
      markNoticesRead(
        userId,
        unreadNotices.map((n) => n.id),
      );
      const listPath = noticeListPath(role);
      if (unreadNotices.length > 0 && listPath) {
        navigate(listPath);
      } else {
        navigate(dashboardPathForRole(role));
      }
      closeEmpty();
      return;
    }
    setEmptyOpen((open) => !open);
  };

  return (
    <div ref={rootRef} style={{ position: 'relative', display: 'inline-flex', zIndex: 810 }}>
      {emptyOpen ? (
        <button type="button" aria-label="알림 닫기" onClick={closeEmpty} style={backdropStyle} />
      ) : null}
      <button
        type="button"
        aria-label="알림"
        aria-expanded={emptyOpen}
        aria-controls={panelId}
        onClick={onBellClick}
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
        <UnreadBadge count={unreadTotal} />
      </button>
      {emptyOpen ? (
        <div id={panelId} role="dialog" aria-label="알림" style={emptyPanelStyle}>
          알림 없음
        </div>
      ) : null}
    </div>
  );
}

type NotificationBellProps = {
  role: UserRole;
};

/** Topbar bell: unread count badge only; click navigates to notices or dashboard. */
export function NotificationBell({ role }: NotificationBellProps) {
  const meQuery = useMeOptional();
  const classId = meQuery.data?.classId ?? null;
  const userId = meQuery.data?.id;

  return (
    <QueryAsyncBoundary suspenseFallback={<BellPlaceholder />} errorFallback={null}>
      <NotificationBellInner role={role} classId={classId} userId={userId} />
    </QueryAsyncBoundary>
  );
}

function BellPlaceholder() {
  return (
    <button
      type="button"
      aria-label="알림"
      disabled
      style={{
        border: 'none',
        background: 'transparent',
        color: 'var(--text-secondary)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 4,
        position: 'relative',
        borderRadius: 8,
        opacity: 0.6,
      }}
    >
      <Bell size={17} strokeWidth={1.75} />
    </button>
  );
}
