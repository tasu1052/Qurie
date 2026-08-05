import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ManagerShell, PageMain } from '../../components/layout/ManagerShell';
import {
  Badge,
  Button,
  DonutChart,
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
import { ClassMaterialsCard } from '../../components/materials/ClassMaterialsCard';

function DashSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Skeleton width="100%" height={100} radius={16} />
      <Skeleton width="100%" height={140} radius={16} delay={0.06} />
      <div
        className="qurie-app-split"
        style={{ gridTemplateColumns: 'minmax(0, 0.88fr) minmax(0, 1fr)' }}
      >
        <Skeleton width="100%" height={280} radius={16} />
        <Skeleton width="100%" height={280} radius={16} delay={0.06} />
      </div>
    </div>
  );
}

function DashboardMetricsInfographic({
  activeCount,
  endedCount,
  groupCount,
  capacity,
}: {
  activeCount: number;
  endedCount: number;
  groupCount: number;
  capacity: string;
}) {
  const sessionTotal = activeCount + endedCount;
  const segments =
    sessionTotal > 0
      ? [
          { label: '진행 중', value: activeCount, accent: activeCount > 0 },
          { label: '종료', value: endedCount },
        ]
      : [
          { label: '진행 중', value: 0 },
          { label: '종료', value: 0 },
        ];

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 16,
        alignItems: 'stretch',
      }}
    >
      <div
        style={{
          background: 'var(--surface-card)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          boxShadow: 'var(--shadow-card)',
          padding: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 140,
        }}
      >
        <DonutChart
          segments={segments}
          size={120}
          thickness={14}
          centerValue={String(sessionTotal)}
          centerLabel="세션"
        />
      </div>
      <div
        style={{
          background: 'var(--surface-card)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          boxShadow: 'var(--shadow-card)',
          padding: 20,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: 16,
          minHeight: 140,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>그룹</span>
          <span style={{ fontSize: 28, fontWeight: 700, color: 'var(--ink)', fontVariantNumeric: 'tabular-nums' }}>
            {groupCount}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>정원</span>
          <span style={{ fontSize: 28, fontWeight: 700, color: 'var(--ink)', fontVariantNumeric: 'tabular-nums' }}>
            {capacity}
          </span>
        </div>
        {activeCount > 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <LiveBadge />
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>진행 중인 세션이 있습니다</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function ManagerDashBody({ classId }: { classId: number }) {
  const navigate = useNavigate();
  const { data: cls } = useGetClass(classId);
  const { data: sessions } = useGetSessions(classId);
  const { data: groups } = useGetGroups(classId);
  const active = sessions.filter((s) => s.active);
  const ended = sessions.filter((s) => !s.active);
  const live = active[0];

  const capacityLabel = cls.capacity != null ? String(cls.capacity) : '—';

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
        <Button variant="secondary" size="sm" onClick={() => navigate('/manager/students')}>
          학생 관리
        </Button>
      </div>

      <DashboardMetricsInfographic
        activeCount={active.length}
        endedCount={ended.length}
        groupCount={groups.length}
        capacity={capacityLabel}
      />

      <div
        className="qurie-app-split"
        style={{ gridTemplateColumns: 'minmax(0, 0.88fr) minmax(0, 1fr)' }}
      >
        <DashboardNoticesSection role="MANAGER" classId={classId} size={4} compact />

        {/* 세션에서 자료 열람이 빠져서, 강사는 여기서 바로 업로드·관리한다. */}
        <ClassMaterialsCard classId={classId} canManage title="강의자료" />
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
