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
  type NoticeListFilters,
  type NoticeResponse,
  type UserRole,
} from '../../data';
import {
  useAppNotifications,
  useAppNotificationUnreadCount,
  useMarkAllAppNotificationsRead,
  type AppNotificationItem,
} from '../../network/notification';
import { noticeListPath, useOpenNoticeDetail } from '../../hooks/useOpenNoticeDetail';
import { Skeleton } from '../../ds';

const READ_KEY_PREFIX = 'qurie-notice-read-ids';

/**
 * 패널 배경은 불투명한 --surface-modal 이라 backdrop-filter 가 시각 효과 없이
 * Topbar(자체 backdrop-filter 보유)와 중첩돼 상단바가 어둡게 재합성되는 아티팩트만 냈다.
 * 그래서 패널에는 blur 를 걸지 않는다.
 */
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
  color: 'var(--ink)',
};

// 같은 브라우저에서 계정을 바꿔 로그인해도 읽음 상태가 섞이지 않도록 사용자별 키를 쓴다.
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

/**
 * MASTER 외 역할이 forAudience 없이 조회하면 대상이 아닌 반의 공지까지 내려와
 * 상세 진입 시 404가 난다. BellPanel·UnreadBadge 두 호출부가 같은 캐시 엔트리를
 * 쓰도록 필터 객체를 모듈 상수로 공유한다.
 */
const MASTER_NOTICE_FILTERS: NoticeListFilters = { size: 8 };
const AUDIENCE_NOTICE_FILTERS: NoticeListFilters = { size: 8, forAudience: true };

function bellNoticeFilters(role: UserRole): NoticeListFilters {
  return role === 'MASTER' ? MASTER_NOTICE_FILTERS : AUDIENCE_NOTICE_FILTERS;
}

function scopeLabel(scope: NoticeResponse['scope']): string {
  if (scope === 'ENTERPRISE') return '전체';
  if (scope === 'TRACK') return '트랙';
  return '클래스';
}

function AppNotificationRows({
  items,
  onClose,
}: {
  items: AppNotificationItem[];
  onClose: () => void;
}) {
  const navigate = useNavigate();
  if (items.length === 0) return null;
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
        활동
      </div>
      {items.map((item) => (
        <button
          key={`app-${item.id}`}
          type="button"
          onClick={() => {
            onClose();
            if (item.link) navigate(item.link);
          }}
          style={{
            display: 'block',
            width: '100%',
            textAlign: 'left',
            padding: '12px 14px',
            border: 'none',
            borderBottom: '1px solid var(--divider)',
            background: item.unread ? 'var(--accent-softer)' : 'transparent',
            cursor: item.link ? 'pointer' : 'default',
            fontFamily: 'var(--font-sans)',
          }}
        >
          <span style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>
            {item.title}
          </span>
          {item.body ? (
            <span style={{ display: 'block', marginTop: 4, fontSize: 12, color: 'var(--text-secondary)' }}>
              {item.body}
            </span>
          ) : null}
        </button>
      ))}
    </>
  );
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

function PanelHeader({
  role,
  onClose,
  onMarkAllRead,
}: {
  role: UserRole;
  onClose: () => void;
  onMarkAllRead?: () => void;
}) {
  const navigate = useNavigate();
  const morePath = noticeListPath(role);

  return (
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
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {onMarkAllRead ? (
          <button
            type="button"
            onClick={onMarkAllRead}
            style={{
              border: 'none',
              background: 'transparent',
              color: 'var(--text-secondary)',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
              padding: 0,
            }}
          >
            모두 읽음
          </button>
        ) : null}
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
    </div>
  );
}

/** forAudience=true 조회는 classId 없는 계정에서 400 이라 공지 요청 자체를 생략한다. */
function BellPanelNoClass({ role, onClose }: { role: UserRole; onClose: () => void }) {
  return (
    <div role="dialog" aria-label="알림" style={panelShellStyle}>
      <PanelHeader role={role} onClose={onClose} />
      <div style={{ padding: '16px 14px 20px', fontSize: 13, color: 'var(--text-muted)' }}>
        소속 클래스가 지정되면 공지를 볼 수 있어요.
      </div>
    </div>
  );
}

function BellPanel({
  role,
  classId,
  userId,
  onClose,
  onRead,
}: {
  role: UserRole;
  classId: number | null;
  userId: number | undefined;
  onClose: () => void;
  onRead: () => void;
}) {
  const openNotice = useOpenNoticeDetail();
  const { data } = useGetNotices(bellNoticeFilters(role));
  const helpQuery = useGetClassHelpRequests(
    role === 'MANAGER' || role === 'MASTER' ? classId : null,
  );
  const appNotifications = useAppNotifications(true);
  const markAppRead = useMarkAllAppNotificationsRead();
  const notices = data.data;
  const helpRequests = helpQuery.data ?? [];
  const activityItems = appNotifications.data ?? [];

  const markAllRead = () => {
    if (notices.length > 0) {
      markNoticesRead(
        userId,
        notices.map((n) => n.id),
      );
    }
    if (activityItems.some((n) => n.unread)) {
      markAppRead.mutate();
    }
    onRead();
  };

  return (
    <div role="dialog" aria-label="알림" style={panelShellStyle}>
      <PanelHeader role={role} onClose={onClose} onMarkAllRead={markAllRead} />

      <AppNotificationRows items={activityItems} onClose={onClose} />
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
              markNoticesRead(userId, [n.id]);
              onRead();
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
  userId,
}: {
  version: number;
  classId: number | null;
  role: UserRole;
  userId: number | undefined;
}) {
  const { data } = useGetNotices(bellNoticeFilters(role));
  const helpQuery = useGetClassHelpRequests(
    role === 'MANAGER' || role === 'MASTER' ? classId : null,
  );
  const appUnread = useAppNotificationUnreadCount(true);
  void version;
  const unreadNotices = data.data.filter((n) => !readIds(userId).has(n.id)).length;
  const helpCount = helpQuery.data?.length ?? 0;
  return <BadgeDot unread={unreadNotices + helpCount + (appUnread.data ?? 0)} />;
}

/** classId 없는 계정은 forAudience 공지 조회가 400 이라 도움 요청·활동 알림만 배지에 반영한다. */
function HelpOnlyBadge({ classId, role }: { classId: number | null; role: UserRole }) {
  const helpQuery = useGetClassHelpRequests(role === 'MANAGER' ? classId : null);
  const appUnread = useAppNotificationUnreadCount(true);
  return <BadgeDot unread={(helpQuery.data?.length ?? 0) + (appUnread.data ?? 0)} />;
}

function BadgeDot({ unread }: { unread: number }) {
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

function NotificationBellInner({
  role,
  classId,
  userId,
}: {
  role: UserRole;
  classId: number | null;
  userId: number | undefined;
}) {
  const [open, setOpen] = useState(false);
  const [readVersion, setReadVersion] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelId = useId();
  // forAudience=true 는 classId 없는 계정에서 400 이라 MASTER 외에는 classId 확보 후에만 공지를 조회한다.
  const canFetchNotices = role === 'MASTER' || classId != null;

  const bumpReadVersion = () => setReadVersion((v) => v + 1);

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
          {canFetchNotices ? (
            <UnreadBadge version={readVersion} classId={classId} role={role} userId={userId} />
          ) : (
            <HelpOnlyBadge classId={classId} role={role} />
          )}
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
            {canFetchNotices ? (
              <BellPanel
                role={role}
                classId={classId}
                userId={userId}
                onClose={close}
                onRead={bumpReadVersion}
              />
            ) : (
              <BellPanelNoClass role={role} onClose={close} />
            )}
          </QueryAsyncBoundary>
        </div>
      ) : null}
    </div>
  );
}

type NotificationBellProps = {
  role: UserRole;
};

/** Topbar bell: notices + manager help-request alerts. */
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
