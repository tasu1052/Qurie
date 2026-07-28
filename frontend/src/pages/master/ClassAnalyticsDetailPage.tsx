import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Download } from 'lucide-react';
import { MasterShell, PageMain } from '../../components/layout/MasterShell';
import { MockRowBoundary } from '../../components/feedback/MockRowBoundary';
import {
  BarChart,
  Button,
  ChartLegend,
  LineChart,
  Select,
  Skeleton,
  StatCard,
  StatCardRow,
} from '../../ds';
import { useClassAnalyticsRow } from '../../data';

const metricChips = ['정답률', '퀴즈 참여율', 'Streak 유지율', '세션 빈도', '평점'] as const;

function DetailSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <StatCardRow>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} style={{ background: 'var(--surface-card)', border: '1px solid var(--border)', borderRadius: 'var(--card-radius)', padding: 'var(--stat-card-padding)' }}>
            <Skeleton width="50%" height={14} delay={i * 0.08} />
            <Skeleton width="40%" height={28} delay={i * 0.08 + 0.04} style={{ marginTop: 12 }} />
          </div>
        ))}
      </StatCardRow>
      <Skeleton width="100%" height={280} radius={16} />
    </div>
  );
}

export default function ClassAnalyticsDetailPage() {
  const { classId } = useParams<{ classId: string }>();
  const row = useClassAnalyticsRow(classId);
  const [active, setActive] = useState<Set<string>>(new Set(['정답률', '퀴즈 참여율']));

  const toggle = (chip: string) => {
    setActive((prev) => {
      const next = new Set(prev);
      if (next.has(chip)) next.delete(chip);
      else next.add(chip);
      return next;
    });
  };

  return (
    <MasterShell
      activeKey="analytics"
      breadcrumbs={['분석 리포트', 'Java 전공 (서울)', '서울 1반']}
    >
      <PageMain>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>서울 1반 — 클래스 분석</h1>
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

        <MockRowBoundary
          status={row.status}
          skeleton={<DetailSkeleton />}
          onRetry={row.refetch}
          emptyMessage="클래스 분석 데이터가 없습니다"
        >
          {row.data && (
            <>
              <StatCardRow>
                {row.data.kpis.map((item, i) => (
                  <StatCard key={i} {...item} />
                ))}
              </StatCardRow>

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
                  <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                    지표 추이 — 세션 단위
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
                    <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                      카테고리별 정답률
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
                    <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                      세션 요약
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
