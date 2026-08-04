import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Download } from 'lucide-react';
import { MasterShell, PageMain } from '../../components/layout/MasterShell';
import { ApiIntegrationPanel } from '../../components/feedback/ApiIntegrationPanel';
import {
  Button,
  RowErrorFallback,
  Select,
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
        <StatCard
          label="완료율"
          value={formatPct(data.avgCompletionRate)}
          caption="평균"
        />
        <StatCard
          label="리포트 발급"
          value={String(data.reportedStudentCount)}
          caption="학생"
        />
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
      <ApiIntegrationPanel groupId="classAnalyticsTrends" />
    </>
  );
}

export default function ClassAnalyticsDetailPage() {
  const { classId: classIdParam } = useParams<{ classId: string }>();
  const classId = Number(classIdParam);
  const validClassId = Number.isFinite(classId) && classId > 0;
  const [rowKey, setRowKey] = useState(0);
  const [active, setActive] = useState<Set<string>>(new Set(['정답률', '퀴즈 참여율']));

  const toggle = (chip: string) => {
    setActive((prev) => {
      const next = new Set(prev);
      if (next.has(chip)) next.delete(chip);
      else next.add(chip);
      return next;
    });
  };

  const metricChips = ['정답률', '퀴즈 참여율', 'Streak 유지율', '세션 빈도', '평점'] as const;

  return (
    <MasterShell
      activeKey="analytics"
      breadcrumbs={['분석 리포트', 'Java 전공 (서울)', validClassId ? `클래스 #${classId}` : '클래스']}
    >
      <PageMain>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>
              {validClassId ? `클래스 #${classId} — 분석` : '클래스 분석'}
            </h1>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              요약 KPI는 API 연동됨. 세션 추이 차트는 추가 API가 필요합니다.
            </span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Select options={[{ value: '8', label: '최근 8개 세션' }]} value="8" onChange={() => undefined} disabled />
            <Button variant="secondary" icon={<Download size={14} strokeWidth={1.75} />} disabled>
              내보내기
            </Button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', opacity: 0.55 }}>
          {metricChips.map((chip) => {
            const on = active.has(chip);
            return (
              <button
                key={chip}
                type="button"
                disabled
                onClick={() => toggle(chip)}
                style={{
                  borderRadius: 999,
                  padding: '6px 14px',
                  fontSize: 12,
                  fontWeight: on ? 600 : 400,
                  cursor: 'not-allowed',
                  fontFamily: 'var(--font-sans)',
                  border: `1px solid ${on ? 'var(--accent)' : 'var(--border-strong)'}`,
                  background: on ? 'var(--accent-softer)' : 'var(--surface-card)',
                  color: on ? 'var(--accent)' : 'var(--text-secondary)',
                }}
              >
                {chip}
              </button>
            );
          })}
        </div>

        {!validClassId ? (
          <ApiIntegrationPanel groupId="classAnalyticsTrends" />
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
