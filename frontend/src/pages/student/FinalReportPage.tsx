import { Download, Share2 } from 'lucide-react';
import { StudentShell, PageMain } from '../../components/layout/StudentShell';
import { MockRowBoundary } from '../../components/feedback/MockRowBoundary';
import {
  Badge,
  BarChart,
  Button,
  ChartLegend,
  DonutChart,
  LineChart,
  LoadMore,
  Skeleton,
  StatCard,
  StatCardRow,
} from '../../ds';
import { useFinalReportRow } from '../../data';

function ReportSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Skeleton width="100%" height={80} radius={16} />
      <StatCardRow>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} style={{ background: 'var(--surface-card)', border: '1px solid var(--border)', borderRadius: 'var(--card-radius)', padding: 'var(--stat-card-padding)' }}>
            <Skeleton width="50%" height={14} delay={i * 0.08} />
          </div>
        ))}
      </StatCardRow>
    </div>
  );
}

export default function FinalReportPage() {
  const row = useFinalReportRow();

  return (
    <StudentShell activeKey="report" breadcrumbs={['종합 리포트']}>
      <PageMain>
        <MockRowBoundary
          status={row.status}
          skeleton={<ReportSkeleton />}
          onRetry={row.refetch}
          emptyMessage="리포트가 없습니다"
        >
          {row.data && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>종합 리포트</h1>
                    <Badge status="neutral">STUDENT</Badge>
                  </div>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                    {row.data.name} · {row.data.className}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Button variant="secondary" icon={<Share2 size={14} strokeWidth={1.75} />} onClick={() => undefined}>
                    공유
                  </Button>
                  <Button variant="secondary" icon={<Download size={14} strokeWidth={1.75} />} onClick={() => undefined}>
                    PDF
                  </Button>
                </div>
              </div>

              <StatCardRow>
                {row.data.kpis.map((item, i) => (
                  <StatCard key={i} {...item} />
                ))}
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
                    gap: 16,
                    minWidth: 0,
                  }}
                >
                  <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                    세션 정답률
                  </span>
                  <LineChart series={row.data.lineSeries} labels={row.data.lineLabels} height={180} />
                  <ChartLegend items={row.data.lineSeries.map((s) => ({ label: s.name ?? '', accent: s.accent }))} />
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
                    alignItems: 'center',
                    gap: 16,
                    minWidth: 0,
                  }}
                >
                  <span style={{ alignSelf: 'flex-start', fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                    난이도 분포
                  </span>
                  <DonutChart segments={row.data.difficulty} size={160} centerValue="84%" centerLabel="평균" />
                </div>
              </div>

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
                    gap: 16,
                    minWidth: 0,
                  }}
                >
                  <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                    카테고리별 정답률
                  </span>
                  <BarChart data={row.data.categories} height={180} showValues />
                  <ChartLegend items={[{ label: '카테고리', accent: true }]} />
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
                  <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                    강사 코멘트 · 누적 평점 4.3
                  </span>
                  <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: 'var(--text-secondary)' }}>{row.data.comment}</p>
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
                <div style={{ padding: '20px 24px 14px' }}>
                  <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                    세션 리포트
                  </span>
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 1fr 1fr 1fr',
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
                  <span>정답률</span>
                  <span>평점</span>
                  <span style={{ textAlign: 'right' }}>일자</span>
                </div>
                {row.data.sessions.map((s) => (
                  <div
                    key={s.id}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '2fr 1fr 1fr 1fr',
                      padding: '13px 24px',
                      borderBottom: '1px solid var(--divider)',
                      fontSize: 13,
                    }}
                  >
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5 }}>{s.session}</span>
                    <span style={{ fontWeight: 700, color: 'var(--accent)' }}>{s.accuracy}</span>
                    <span style={{ fontWeight: 600 }}>{s.rating}</span>
                    <span style={{ textAlign: 'right', color: 'var(--text-muted)' }}>{s.date}</span>
                  </div>
                ))}
                <div style={{ padding: 16 }}>
                  <LoadMore label="이전 세션 더 보기" onClick={() => undefined} />
                </div>
              </div>
            </>
          )}
        </MockRowBoundary>
      </PageMain>
    </StudentShell>
  );
}
