import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download } from 'lucide-react';
import { MasterShell, PageMain } from '../../components/layout/MasterShell';
import { MockRowBoundary } from '../../components/feedback/MockRowBoundary';
import {
  Badge,
  BarChart,
  Button,
  ChartLegend,
  LineChart,
  Select,
  Skeleton,
  StatCard,
  StatCardRow,
} from '../../ds';
import { useTrackAnalyticsRow } from '../../data';

const metricChips = ['퀴즈 참여율', '정답률', 'Streak 유지율', '세션 빈도'] as const;

function AnalyticsSkeleton() {
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
      <Skeleton width="100%" height={240} radius={16} />
    </div>
  );
}

export default function TrackAnalyticsPage() {
  const navigate = useNavigate();
  const row = useTrackAnalyticsRow();
  const [metric, setMetric] = useState<(typeof metricChips)[number]>('퀴즈 참여율');

  return (
    <MasterShell activeKey="analytics" breadcrumbs={['SSAFY 서울캠퍼스', '분석 리포트']}>
      <PageMain>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>트랙 분석</h1>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              트랙 단위 성과를 먼저 확인하고, 클래스를 클릭하면 클래스 상세 분석으로 이동합니다.
            </span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Select
              options={[{ value: 'java-major', label: 'Java 전공 (서울)' }]}
              value="java-major"
              onChange={() => undefined}
            />
            <Select options={[{ value: '8w', label: '최근 8주' }]} value="8w" onChange={() => undefined} />
            <Button variant="secondary" icon={<Download size={14} strokeWidth={1.75} />} onClick={() => undefined}>
              내보내기
            </Button>
          </div>
        </div>

        <MockRowBoundary
          status={row.status}
          skeleton={<AnalyticsSkeleton />}
          onRetry={row.refetch}
          emptyMessage="분석 데이터가 없습니다"
        >
          {row.data && (
            <>
              <StatCardRow>
                {row.data.kpis.map((item, i) => (
                  <StatCard key={i} {...item} />
                ))}
              </StatCardRow>

              <div className="qurie-master-split" style={{ gridTemplateColumns: 'minmax(0, 1.6fr) minmax(0, 1fr)' }}>
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
                      클래스별 지표 추이
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>지표 칩을 선택해 비교 관점을 바꿉니다</span>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {metricChips.map((chip) => {
                      const active = metric === chip;
                      return (
                        <button
                          key={chip}
                          type="button"
                          onClick={() => setMetric(chip)}
                          style={{
                            borderRadius: 999,
                            padding: '6px 12px',
                            fontSize: 12,
                            fontWeight: active ? 600 : 400,
                            cursor: 'pointer',
                            fontFamily: 'var(--font-sans)',
                            border: `1px solid ${active ? 'var(--accent)' : 'var(--border-strong)'}`,
                            background: active ? 'var(--accent-softer)' : 'var(--surface-card)',
                            color: active ? 'var(--accent)' : 'var(--text-secondary)',
                          }}
                        >
                          {chip}
                        </button>
                      );
                    })}
                  </div>
                  <LineChart series={row.data.chartSeries} labels={row.data.chartLabels} height={190} />
                  <ChartLegend items={row.data.chartSeries.map((s) => ({ label: s.name ?? '', accent: s.accent }))} />
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
                    gap: 16,
                    minWidth: 0,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                      클래스별 비교 — {metric}
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>좌측 지표 칩과 연동됩니다</span>
                  </div>
                  <BarChart data={row.data.barData} height={190} showValues />
                  <ChartLegend items={[{ label: metric, accent: true }]} />
                </div>
              </div>

              <div
                style={{
                  background: 'var(--surface-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 16,
                  boxShadow: 'var(--shadow-card)',
                  overflow: 'hidden',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px 14px' }}>
                  <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                    클래스별 요약
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>클래스를 클릭하면 상세 분석으로 이동합니다</span>
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1.6fr 0.7fr 0.9fr 0.9fr 0.7fr 0.8fr',
                    padding: '10px 24px',
                    borderBottom: '1px solid var(--divider)',
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    color: 'var(--text-muted)',
                  }}
                >
                  <span>클래스</span>
                  <span>세션</span>
                  <span>완료율</span>
                  <span>정답률</span>
                  <span>평점</span>
                  <span style={{ textAlign: 'right' }}>추세</span>
                </div>
                {row.data.summaries.map((s) => (
                  <div
                    key={s.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => navigate(`/master/analytics/${s.id}`)}
                    onKeyDown={(e) => e.key === 'Enter' && navigate(`/master/analytics/${s.id}`)}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1.6fr 0.7fr 0.9fr 0.9fr 0.7fr 0.8fr',
                      padding: '13px 24px',
                      borderBottom: '1px solid var(--divider)',
                      fontSize: 13,
                      alignItems: 'center',
                      cursor: 'pointer',
                    }}
                  >
                    <span style={{ fontWeight: 600, color: 'var(--ink)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      {s.name}
                      {s.ended && <Badge status="neutral">종료</Badge>}
                    </span>
                    <span style={{ color: 'var(--text-secondary)' }}>{s.sessions}</span>
                    <span style={{ color: 'var(--ink)' }}>{s.completion}</span>
                    <span style={{ color: s.accuracyAccent ? 'var(--accent)' : 'var(--ink)', fontWeight: s.accuracyAccent ? 700 : 400 }}>
                      {s.accuracy}
                    </span>
                    <span style={{ color: 'var(--ink)', fontWeight: 600 }}>{s.rating}</span>
                    <span
                      style={{
                        textAlign: 'right',
                        fontWeight: 600,
                        color:
                          s.trendTone === 'success'
                            ? 'var(--status-success)'
                            : s.trendTone === 'error'
                              ? 'var(--status-error)'
                              : 'var(--text-muted)',
                      }}
                    >
                      {s.trend}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </MockRowBoundary>
      </PageMain>
    </MasterShell>
  );
}
