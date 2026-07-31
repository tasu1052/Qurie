import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { StudentShell, PageMain } from '../../components/layout/StudentShell';
import {
  AlertBanner,
  Badge,
  Button,
  CardScrollRow,
  EmptyState,
  LiveBadge,
  RowErrorFallback,
  Skeleton,
  StatCard,
  StatCardRow,
} from '../../ds';
import {
  QueryAsyncBoundary,
  useGetMyClasses,
  useGetSessions,
  useMe,
} from '../../data';
import { DashboardNoticesSection } from '../../components/notices/DashboardNoticesSection';
import { saveSessionTitle } from '../../components/session/sessionProjectStorage';

function DashSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Skeleton width="100%" height={140} radius={16} />
      <StatCardRow>
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              background: 'var(--surface-card-solid)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--card-radius)',
              padding: 'var(--stat-card-padding)',
            }}
          >
            <Skeleton width="50%" height={14} delay={i * 0.08} />
          </div>
        ))}
      </StatCardRow>
    </div>
  );
}

function StudentDashBody() {
  const navigate = useNavigate();
  const { data: me } = useMe();
  const { data: myClasses } = useGetMyClasses();
  const classId = me.classId ?? myClasses[0]?.id ?? null;

  if (classId == null) {
    return (
      <EmptyState
        message="소속 클래스가 없습니다"
        description="클래스에 배정되면 세션과 대시보드가 표시됩니다."
        actionLabel="클래스"
        onAction={() => navigate('/app/classes')}
      />
    );
  }

  return <StudentDashWithClass classId={classId} />;
}

function StudentDashWithClass({ classId }: { classId: number }) {
  const navigate = useNavigate();
  const { data: me } = useMe();
  const { data: myClasses } = useGetMyClasses();
  const { data: sessions } = useGetSessions(classId);
  const [popupBlockedSessionId, setPopupBlockedSessionId] = useState<number | null>(null);

  const activeSessions = useMemo(() => sessions.filter((s) => s.active), [sessions]);
  const livePublicSession = useMemo(
    () => activeSessions.find((session) => session.classPublic === true) ?? null,
    [activeSessions],
  );
  const className = myClasses.find((c) => c.id === classId)?.name ?? '내 클래스';

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

  return (
    <>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.6fr) minmax(0, 1fr)',
          gap: 24,
        }}
      >
        <div
          style={{
            background: 'var(--ink)',
            color: 'var(--text-inverse)',
            borderRadius: 16,
            padding: 28,
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
            minWidth: 0,
          }}
        >
          <span style={{ fontSize: 13, opacity: 0.72 }}>안녕하세요, {me.name}님</span>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: 'var(--text-inverse)' }}>
            {livePublicSession ? 'LIVE 세션이 진행 중입니다' : '진행 중인 클래스 공개 LIVE 세션이 없습니다'}
          </h1>
          <span style={{ fontSize: 13, opacity: 0.72 }}>
            {livePublicSession ? livePublicSession.title : `${className} · 강사가 공개 LIVE를 열면 여기 표시됩니다`}
          </span>
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            {livePublicSession ? (
              <Button variant="accent" onClick={() => openSessionInNewTab(livePublicSession.id, livePublicSession.title)}>
                LIVE 입장
              </Button>
            ) : null}
          </div>
        </div>
        <div
          style={{
            background: 'var(--surface-card)',
            border: '1px solid var(--border)',
            borderRadius: 16,
            boxShadow: 'var(--shadow-card)',
            padding: 24,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            minWidth: 0,
          }}
        >
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: 'var(--text-secondary)',
            }}
          >
            클래스
          </span>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>{className}</h2>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            열린 세션 {activeSessions.length} · 전체 {sessions.length}
          </span>
          <Button variant="secondary" size="sm" onClick={() => navigate(`/app/classes/${classId}`)}>
            클래스 로비
          </Button>
        </div>
      </div>

      <StatCardRow>
        <StatCard label="열린 세션" value={String(activeSessions.length)} caption="active" accent />
        <StatCard label="전체 세션" value={String(sessions.length)} caption="이 클래스" />
        <StatCard label="내 클래스" value={String(myClasses.length)} caption="classes/me" />
        <StatCard label="역할" value={me.role} caption="system" />
      </StatCardRow>

      {popupBlockedSessionId != null ? (
        <AlertBanner
          tone="warning"
          title="브라우저가 새 창 열기를 차단했습니다."
          description="브라우저의 팝업 차단을 해제한 뒤 다시 시도해 주세요."
          actionLabel="확인"
          onAction={() => setPopupBlockedSessionId(null)}
        />
      ) : null}

      <DashboardNoticesSection role="STUDENT" classId={classId} size={5} />

      <div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 14,
          }}
        >
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: 'var(--text-secondary)',
            }}
          >
            나의 세션
          </span>
        </div>
        {sessions.length === 0 ? (
          <EmptyState
            message="세션이 없습니다"
            description="클래스 탭에서 세션을 만들거나, 공개 LIVE가 열리면 참여할 수 있습니다."
            actionLabel="클래스"
            onAction={() => navigate(`/app/classes/${classId}`)}
          />
        ) : (
          <CardScrollRow>
            {sessions.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => openSessionInNewTab(s.id, s.title)}
                style={{
                  minWidth: 220,
                  textAlign: 'left',
                  background: 'var(--surface-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 16,
                  padding: 18,
                  cursor: 'pointer',
                  fontFamily: 'var(--font-sans)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {s.active ? <LiveBadge /> : <Badge status="neutral">종료</Badge>}
                </div>
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>{s.title}</span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {new Date(s.createdAt).toLocaleString('ko-KR')}
                </span>
              </button>
            ))}
          </CardScrollRow>
        )}
      </div>

    </>
  );
}

export default function StudentDashboardPage() {
  const [rowKey, setRowKey] = useState(0);

  return (
    <StudentShell activeKey="dashboard" breadcrumbs={['대시보드']}>
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
          <StudentDashBody />
        </QueryAsyncBoundary>
      </PageMain>
    </StudentShell>
  );
}
