import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Download } from 'lucide-react';
import { MasterShell, PageMain } from '../../components/layout/MasterShell';
import { MockRowBoundary } from '../../components/feedback/MockRowBoundary';
import {
  Badge,
  BarChart,
  Button,
  ChartLegend,
  EmptyState,
  LineChart,
  RowErrorFallback,
  Select,
  Skeleton,
  StatCard,
  StatCardRow,
} from '../../ds';
import {
  QueryAsyncBoundary,
  useClassAnalyticsRow,
  useGetClass,
  useGetClassAnalytics,
} from '../../data';

const metricChips = ['정답률', '퀴즈 참여율', 'Streak 유지율', '세션 빈도', '평점'] as const;

/** 서버가 0~1 비율과 0~100 퍼센트를 혼용할 수 있어 방어적으로 변환한다 (ClassDetailPage 의 formatRate 와 동일 규칙). */
function formatRate(value: number | null): string {
  if (value == null) return '—';
  const pct = value <= 1 ? value * 100 : value;
  return `${Math.round(pct)}%`;
}

function KpiSkeleton() {
  return (
    <StatCardRow>
      {[0, 1, 2, 3].map((i) => (
        <div key={i} style={{ background: 'var(--surface-card-solid)', border: '1px solid var(--border)', borderRadius: 'var(--card-radius)', padding: 'var(--stat-card-padding)' }}>
          <Skeleton width="50%" height={14} delay={i * 0.08} />
          <Skeleton width="40%" height={28} delay={i * 0.08 + 0.04} style={{ marginTop: 12 }} />
        </div>
      ))}
    </StatCardRow>
  );
}

/** 제목·KPI 는 실제 API(useGetClass/useGetClassAnalytics)로 채운다 — 추이·카테고리 차트만 데모 데이터. */
function AnalyticsHeaderAndKpis({ classId }: { classId: number }) {
  const { data: cls } = useGetClass(classId);
  const { data } = useGetClassAnalytics(classId);

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>{cls.name} — 클래스 분석</h1>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            지표를 선택해 독립적으로, 혹은 겹쳐서 비교하세요. 차트에 마우스를 올리면 세션별 수치가 표시됩니다.
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Select options={[{ value: '8', label: '최근 8개 세션' }]} value="8" onChange={() => undefined} />
          <Button variant="secondary" icon={<Download size={14} strokeWidth={1.75} />} onClick={() => undefined}>
            내보내기
          </Button>
        </div>
      </div>

      <StatCardRow>
        <StatCard label="평균 정답률" value={formatRate(data.avgAccuracy)} caption="발급된 리포트 기준" accent />
        <StatCard label="평균 완료율" value={formatRate(data.avgCompletionRate)} caption="퀴즈 완료 기준" />
        <StatCard
          label="리포트 반영 학생"
          value={String(data.reportedStudentCount)}
          caption={`전체 학생 ${data.studentCount}명`}
        />
        <StatCard label="세션" value={String(data.sessionCount)} caption={`진행 중 ${data.activeSessionCount}`} />
      </StatCardRow>
    </>
  );
}

function DetailSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Skeleton width="100%" height={280} radius={16} />
      <Skeleton width="100%" height={240} radius={16} delay={0.08} />
    </div>
  );
}

export default function ClassAnalyticsDetailPage() {
  const navigate = useNavigate();
  const { classId } = useParams<{ classId: string }>();
  const classIdNum = Number(classId);
  const hasValidClassId = Number.isFinite(classIdNum) && classIdNum > 0;
  const row = useClassAnalyticsRow(classId);
  const [active, setActive] = useState<Set<string>>(new Set(['정답률', '퀴즈 참여율']));
  const [kpiKey, setKpiKey] = useState(0);

  const toggle = (chip: string) => {
    setActive((prev) => {
      const next = new Set(prev);
      if (next.has(chip)) next.delete(chip);
      else next.add(chip);
      return next;
    });
  };

  // 경로 파라미터가 숫자가 아니면 실제 API 를 호출할 수 없으므로 빈 상태만 보여준다
  if (!hasValidClassId) {
    return (
      <MasterShell activeKey="analytics" breadcrumbs={['분석 리포트', '클래스 분석']}>
        <PageMain>
          <EmptyState
            message="클래스를 찾을 수 없습니다"
            description="유효한 클래스 경로로 다시 접근해 주세요."
            actionLabel="클래스 관리로"
            onAction={() => navigate('/master/classes')}
          />
        </PageMain>
      </MasterShell>
    );
  }

  return (
    <MasterShell
      activeKey="analytics"
      breadcrumbs={['분석 리포트', '클래스 분석']}
    >
      <PageMain>
        <QueryAsyncBoundary
          key={kpiKey}
          suspenseFallback={<KpiSkeleton />}
          errorFallback={
            <RowErrorFallback
              onRetry={() => setKpiKey((k) => k + 1)}
              title="클래스 KPI를 불러오지 못했습니다"
            />
          }
        >
          <AnalyticsHeaderAndKpis classId={classIdNum} />
        </QueryAsyncBoundary>

        <MockRowBoundary
          status={row.status}
          skeleton={<DetailSkeleton />}
          onRetry={row.refetch}
          emptyMessage="클래스 분석 데이터가 없습니다"
        >
          {row.data && (
            <>
              <div
                style={{
                  background: 'var(--surface-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 16,
                  boxShadow: 'var(--shadow-card)',
                  padding: 24,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 16,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  {/* 시계열 API 가 아직 없어 차트는 데모 데이터 — 실데이터로 오인하지 않도록 뱃지로 표시 */}
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                    지표 추이 — 세션 단위
                    <Badge status="warning">데모</Badge>
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>지표 칩을 클릭해 켜고 끌 수 있습니다</span>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {metricChips.map((chip) => {
                    const on = active.has(chip);
                    return (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => toggle(chip)}
                        style={{
                          borderRadius: 999,
                          padding: '6px 12px',
                          fontSize: 12,
                          fontWeight: on ? 600 : 400,
                          cursor: 'pointer',
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
                <LineChart
                  series={row.data.series.filter((s) => active.has(s.name ?? ''))}
                  labels={row.data.labels}
                  height={240}
                  showDots
                />
                <ChartLegend
                  items={row.data.series
                    .filter((s) => active.has(s.name ?? ''))
                    .map((s) => ({ label: s.name ?? '', accent: s.accent }))}
                />
              </div>

              <div className="qurie-master-split" style={{ gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.6fr)' }}>
                <div
                  style={{
                    background: 'var(--surface-card)',
                    border: '1px solid var(--border)',
                    borderRadius: 16,
                    boxShadow: 'var(--shadow-card)',
                    padding: 24,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 16,
                    minWidth: 0,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                      카테고리별 정답률
                      <Badge status="warning">데모</Badge>
                    </span>
                    <Select options={[{ value: 'all', label: '전체 세션' }]} value="all" onChange={() => undefined} size="sm" />
                  </div>
                  <BarChart data={row.data.categories} height={200} showValues />
                  <ChartLegend items={[{ label: '카테고리 정답률', accent: true }]} />
                </div>

                <div
                  style={{
                    background: 'var(--surface-card)',
                    border: '1px solid var(--border)',
                    borderRadius: 16,
                    boxShadow: 'var(--shadow-card)',
                    overflow: 'hidden',
                    minWidth: 0,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px 14px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                      세션 요약
                      <Badge status="warning">데모</Badge>
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>최근 4개</span>
                  </div>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1.7fr 0.9fr 0.9fr 0.9fr 0.7fr',
                      padding: '10px 24px',
                      borderBottom: '1px solid var(--divider)',
                      fontSize: 11,
                      fontWeight: 600,
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      color: 'var(--text-muted)',
                    }}
                  >
                    <span>세션</span>
                    <span>완료율</span>
                    <span>정답률</span>
                    <span>액티비티</span>
                    <span style={{ textAlign: 'right' }}>평점</span>
                  </div>
                  {row.data.sessions.map((s) => (
                    <div
                      key={s.id}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1.7fr 0.9fr 0.9fr 0.9fr 0.7fr',
                        padding: '13px 24px',
                        borderBottom: '1px solid var(--divider)',
                        fontSize: 13,
                        alignItems: 'center',
                      }}
                    >
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink)' }}>{s.session}</span>
                      <span style={{ color: 'var(--ink)' }}>{s.completion}</span>
                      <span style={{ color: s.accuracyAccent ? 'var(--accent)' : 'var(--ink)', fontWeight: s.accuracyAccent ? 700 : 400 }}>
                        {s.accuracy}
                      </span>
                      <span
                        style={{
                          color:
                            s.activityTone === 'warning'
                              ? 'var(--status-warning)'
                              : s.activityTone === 'error'
                                ? 'var(--status-error)'
                                : 'var(--ink)',
                          fontWeight: s.activityTone ? 600 : 400,
                        }}
                      >
                        {s.activity}
                      </span>
                      <span style={{ textAlign: 'right', fontWeight: 600 }}>{s.rating}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </MockRowBoundary>
      </PageMain>
    </MasterShell>
  );
}
