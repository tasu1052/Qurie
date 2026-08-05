import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { MasterShell, PageMain } from '../../components/layout/MasterShell';
import {
  RowErrorFallback,
  Skeleton,
  StatCard,
  StatCardRow,
} from '../../ds';
import { QueryAsyncBoundary, useGetClassAnalytics } from '../../data';

function formatPct(value: number | null | undefined): string {
  if (value == null || Number.isNaN(Number(value))) return '—';
  return `${Number(value).toFixed(0)}%`;
}

function DetailSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
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

function ClassAnalyticsBody({ classId }: { classId: number }) {
  const { data } = useGetClassAnalytics(classId);

  return (
    <>
      <StatCardRow>
        <StatCard label="학생" value={String(data.studentCount)} caption="STUDENT" />
        <StatCard label="매니저" value={String(data.managerCount)} caption="MANAGER" />
        <StatCard label="그룹" value={String(data.groupCount)} caption="ACTIVE" />
        <StatCard
          label="정답률"
          value={formatPct(data.avgAccuracy)}
          caption={`세션 ${data.sessionCount} · LIVE ${data.activeSessionCount}`}
          accent
        />
      </StatCardRow>
      <StatCardRow>
        <StatCard label="완료율" value={formatPct(data.avgCompletionRate)} caption="평균" />
        <StatCard label="리포트 발급" value={String(data.reportedStudentCount)} caption="학생" />
        <StatCard
          label="평균 소요"
          value={
            data.avgElapsedMs != null && data.avgElapsedMs > 0
              ? `${Math.round(data.avgElapsedMs / 60000)}분`
              : '—'
          }
          caption="문항당"
        />
      </StatCardRow>
    </>
  );
}

export default function ClassAnalyticsDetailPage() {
  const { classId: classIdParam } = useParams<{ classId: string }>();
  const classId = Number(classIdParam);
  const validClassId = Number.isFinite(classId) && classId > 0;
  const [rowKey, setRowKey] = useState(0);

  return (
    <MasterShell
      activeKey="analytics"
      breadcrumbs={['분석 리포트', 'Java 전공 (서울)', validClassId ? `클래스 #${classId}` : '클래스']}
    >
      <PageMain>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>
            {validClassId ? `클래스 #${classId} — 분석` : '클래스 분석'}
          </h1>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            클래스 KPI 요약입니다. 세션별 추이 차트는 추후 API 연동 예정입니다.
          </span>
        </div>

        {!validClassId ? (
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>유효한 클래스 ID가 필요합니다.</p>
        ) : (
          <QueryAsyncBoundary
            key={rowKey}
            suspenseFallback={<DetailSkeleton />}
            errorFallback={
              <RowErrorFallback
                onRetry={() => setRowKey((k) => k + 1)}
                title="클래스 분석을 불러오지 못했습니다"
              />
            }
          >
            <ClassAnalyticsBody classId={classId} />
          </QueryAsyncBoundary>
        )}
      </PageMain>
    </MasterShell>
  );
}
