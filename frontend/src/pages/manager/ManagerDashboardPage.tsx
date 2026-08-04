import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload } from 'lucide-react';
import { ManagerShell, PageMain } from '../../components/layout/ManagerShell';
import {
  AlertBanner,
  Badge,
  Button,
  EmptyState,
  LiveBadge,
  RowErrorFallback,
  Skeleton,
} from '../../ds';
import {
  QueryAsyncBoundary,
  useGetClass,
  useGetGroups,
  useGetSessions,
  useMe,
} from '../../data';
import { DashboardNoticesSection } from '../../components/notices/DashboardNoticesSection';
import { saveSessionTitle } from '../../components/session/sessionProjectStorage';

const DASH_PANEL_STYLE = {
  background: 'var(--surface-card)',
  border: '1px solid var(--border)',
  borderRadius: 16,
  boxShadow: 'var(--shadow-card)',
  padding: 20,
  display: 'flex',
  flexDirection: 'column' as const,
  gap: 12,
  minWidth: 0,
  minHeight: 280,
  maxHeight: 320,
  boxSizing: 'border-box' as const,
};

function DashSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Skeleton width="100%" height={100} radius={16} />
      <Skeleton width="100%" height={52} radius={12} />
      <div
        className="qurie-app-split"
        style={{ gridTemplateColumns: 'minmax(0, 0.72fr) minmax(0, 0.88fr) minmax(0, 1fr)' }}
      >
        <Skeleton width="100%" height={280} radius={16} />
        <Skeleton width="100%" height={280} radius={16} delay={0.06} />
        <Skeleton width="100%" height={280} radius={16} delay={0.12} />
      </div>
    </div>
  );
}

function DashboardMetrics({
  activeCount,
  sessionCount,
  groupCount,
  capacity,
}: {
  activeCount: number;
  sessionCount: number;
  groupCount: number;
  capacity: string;
}) {
  const items = [
    { label: '열린 세션', value: String(activeCount), accent: activeCount > 0 },
    { label: '전체 세션', value: String(sessionCount), accent: false },
    { label: '그룹', value: String(groupCount), accent: false },
    { label: '정원', value: capacity, accent: false },
  ];

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'stretch',
        gap: 12,
        padding: '14px 18px',
        background: 'var(--surface-card)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        boxShadow: 'var(--shadow-card)',
      }}
    >
      {items.map((item, index) => (
        <div
          key={item.label}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            paddingRight: index < items.length - 1 ? 12 : 0,
            borderRight: index < items.length - 1 ? '1px solid var(--divider)' : undefined,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 72 }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                color: 'var(--text-muted)',
              }}
            >
              {item.label}
            </span>
            <span
              style={{
                fontSize: 20,
                fontWeight: 700,
                lineHeight: 1.2,
                color: item.accent ? 'var(--accent)' : 'var(--ink)',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {item.value}
            </span>
          </div>
          {item.label === '열린 세션' && activeCount > 0 ? (
            <span
              style={{
                width: 4,
                alignSelf: 'stretch',
                borderRadius: 999,
                background: 'var(--accent)',
                minHeight: 36,
              }}
              aria-hidden
            />
          ) : null}
        </div>
      ))}
    </div>
  );
}

function ManagerDashBody({ classId }: { classId: number }) {
  const navigate = useNavigate();
  const { data: cls } = useGetClass(classId);
  const { data: sessions } = useGetSessions(classId);
  const { data: groups } = useGetGroups(classId);
  const active = sessions.filter((s) => s.active);
  const live = active[0];
  const [popupBlockedSessionId, setPopupBlockedSessionId] = useState<number | null>(null);

  const openSessionInNewTab = (sessionId: number, title?: string) => {
    if (title) saveSessionTitle(sessionId, title);
    const qs = title ? `?title=${encodeURIComponent(title)}` : '';
    const url = `/session/${sessionId}${qs}`;
    const win = window.open(url, '_blank');
    if (!win) {
      setPopupBlockedSessionId(sessionId);
      return;
    }
    win.opener = null;
    setPopupBlockedSessionId(null);
  };

  const capacityLabel = cls.capacity != null ? String(cls.capacity) : '—';

  return (
    <>
      {popupBlockedSessionId != null ? (
        <AlertBanner
          tone="warning"
          title="브라우저가 새 창 열기를 차단했습니다."
          description="브라우저의 팝업 차단을 해제한 뒤 다시 시도해 주세요."
          actionLabel="확인"
          onAction={() => setPopupBlockedSessionId(null)}
        />
      ) : null}
      <div
        style={{
          background: 'var(--surface-card)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          boxShadow: 'var(--shadow-card)',
          padding: 24,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>{cls.name}</h1>
            {live ? <LiveBadge /> : <Badge status="neutral">대기</Badge>}
          </div>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            {cls.description || '담당 클래스 대시보드'}
          </span>
        </div>
      </div>

      <DashboardMetrics
        activeCount={active.length}
        sessionCount={sessions.length}
        groupCount={groups.length}
        capacity={capacityLabel}
      />

      <div
        className="qurie-app-split"
        style={{ gridTemplateColumns: 'minmax(0, 0.72fr) minmax(0, 0.88fr) minmax(0, 1fr)' }}
      >
        <div style={{ ...DASH_PANEL_STYLE, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: 'var(--text-secondary)',
              }}
            >
              최근 세션
            </span>
            <button
              type="button"
              onClick={() => navigate('/manager/sessions')}
              style={{
                border: 'none',
                background: 'transparent',
                color: 'var(--accent)',
                fontSize: 12.5,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'var(--font-sans)',
                padding: 0,
              }}
            >
              더보기
            </button>
          </div>
          <div style={{ overflowY: 'auto', minHeight: 0, flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {sessions.length === 0 ? (
              <EmptyState
                message="세션이 없습니다"
                actionLabel="세션으로"
                onAction={() => navigate('/manager/sessions')}
              />
            ) : (
              sessions.slice(0, 6).map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => openSessionInNewTab(s.id, s.title)}
                  style={{
                    textAlign: 'left',
                    border: '1px solid var(--border)',
                    borderRadius: 12,
                    padding: '10px 12px',
                    background: 'transparent',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-sans)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    flexShrink: 0,
                  }}
                >
                  {s.active ? <LiveBadge /> : <Badge status="neutral">종료</Badge>}
                  <span
                    style={{
                      fontWeight: 600,
                      fontSize: 13,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {s.title}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>

        <DashboardNoticesSection role="MANAGER" classId={classId} size={4} compact />

        <div style={{ ...DASH_PANEL_STYLE }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: 'var(--text-secondary)',
              }}
            >
              학습 자료
            </span>
            <Badge status="neutral">준비 중</Badge>
          </div>
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              textAlign: 'center',
              padding: '8px 12px',
              borderRadius: 12,
              border: '1px dashed var(--border-strong)',
              background: 'var(--surface-sunken)',
              minHeight: 0,
            }}
          >
            <span style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.55 }}>
              PDF·링크 등 학습 자료를 업로드할 수 있어요.
              <br />
              기능 준비 중입니다.
            </span>
            <span title="준비 중">
              <Button
                variant="secondary"
                size="sm"
                icon={<Upload size={14} strokeWidth={1.75} />}
                disabled
              >
                업로드
              </Button>
            </span>
          </div>
        </div>
      </div>
    </>
  );
}

function ManagerDashGate() {
  const navigate = useNavigate();
  const { data: me } = useMe();
  if (me.classId == null) {
    return (
      <EmptyState
        message="담당 클래스가 없습니다"
        description="계정에 classId가 없어 대시보드를 표시할 수 없습니다."
        actionLabel="세션으로"
        onAction={() => navigate('/manager/sessions')}
      />
    );
  }
  return <ManagerDashBody classId={me.classId} />;
}

export default function ManagerDashboardPage() {
  const [rowKey, setRowKey] = useState(0);

  return (
    <ManagerShell activeKey="dashboard" breadcrumbs={['대시보드']}>
      <PageMain>
        <QueryAsyncBoundary
          key={rowKey}
          suspenseFallback={<DashSkeleton />}
          errorFallback={
            <RowErrorFallback
              onRetry={() => setRowKey((k) => k + 1)}
              title="대시보드를 불러오지 못했습니다"
            />
          }
        >
          <ManagerDashGate />
        </QueryAsyncBoundary>
      </PageMain>
    </ManagerShell>
  );
}
