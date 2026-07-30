import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Settings } from 'lucide-react';
import { ManagerShell, PageMain } from '../../components/layout/ManagerShell';
import {
  Badge,
  Button,
  EmptyState,
  LiveBadge,
  RowErrorFallback,
  Skeleton,
  StatCard,
  StatCardRow,
} from '../../ds';
import {
  QueryAsyncBoundary,
  useGetClass,
  useGetGroups,
  useGetSessions,
  useMe,
} from '../../data';
import { DashboardNoticesSection } from '../../components/notices/DashboardNoticesSection';

function DashSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Skeleton width="100%" height={100} radius={16} />
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
            <Skeleton width="40%" height={28} delay={i * 0.08 + 0.04} style={{ marginTop: 12 }} />
          </div>
        ))}
      </StatCardRow>
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

  return (
    <>
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
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="secondary" icon={<Settings size={14} />} onClick={() => navigate('/manager/settings')}>
            설정
          </Button>
          <Button variant="primary" icon={<Plus size={14} />} onClick={() => navigate('/manager/sessions')}>
            세션
          </Button>
        </div>
      </div>

      <StatCardRow>
        <StatCard label="열린 세션" value={String(active.length)} caption="active" accent />
        <StatCard label="전체 세션" value={String(sessions.length)} caption="sessions" />
        <StatCard label="그룹" value={String(groups.length)} caption="groups" />
        <StatCard label="정원" value={cls.capacity != null ? String(cls.capacity) : '—'} caption="capacity" />
      </StatCardRow>

      <div className="qurie-master-split">
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
            최근 세션
          </span>
          {sessions.length === 0 ? (
            <EmptyState message="세션이 없습니다" actionLabel="세션으로" onAction={() => navigate('/manager/sessions')} />
          ) : (
            sessions.slice(0, 6).map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => navigate(`/session/${s.id}`)}
                style={{
                  textAlign: 'left',
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  padding: '12px 14px',
                  background: 'transparent',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-sans)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                {s.active ? <LiveBadge /> : <Badge status="neutral">종료</Badge>}
                <span style={{ fontWeight: 600, fontSize: 13 }}>{s.title}</span>
              </button>
            ))
          )}
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
            그룹 미리보기
          </span>
          {groups.length === 0 ? (
            <EmptyState message="그룹이 없습니다" actionLabel="그룹으로" onAction={() => navigate('/manager/groups')} />
          ) : (
            groups.slice(0, 6).map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => navigate(`/manager/groups/${g.id}`)}
                style={{
                  textAlign: 'left',
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-sans)',
                  fontSize: 13,
                  fontWeight: 600,
                  color: 'var(--ink)',
                  padding: '6px 0',
                }}
              >
                {g.name}
              </button>
            ))
          )}
        </div>
      </div>

      <DashboardNoticesSection role="MANAGER" classId={classId} size={5} />
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
