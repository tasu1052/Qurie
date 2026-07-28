import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { ManagerShell, PageMain } from '../../components/layout/ManagerShell';
import { MockRowBoundary } from '../../components/feedback/MockRowBoundary';
import {
  Badge,
  Button,
  ChartLegend,
  DonutChart,
  LineChart,
  Skeleton,
  StatCard,
  StatCardRow,
} from '../../ds';
import { useStudentOverviewRow } from '../../data';

function OverviewSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Skeleton width="100%" height={90} radius={16} />
      <StatCardRow>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} style={{ background: 'var(--surface-card-solid)', border: '1px solid var(--border)', borderRadius: 'var(--card-radius)', padding: 'var(--stat-card-padding)' }}>
            <Skeleton width="50%" height={14} delay={i * 0.08} />
          </div>
        ))}
      </StatCardRow>
    </div>
  );
}

export default function StudentOverviewPage() {
  const { id } = useParams<{ id: string }>();
  const row = useStudentOverviewRow(id);
  const [comment, setComment] = useState('');

  return (
    <ManagerShell activeKey="students" breadcrumbs={['서울 1반', '학생 관리', '박민수']}>
      <PageMain>
        <MockRowBoundary
          status={row.status}
          skeleton={<OverviewSkeleton />}
          onRetry={row.refetch}
          emptyMessage="학생 데이터가 없습니다"
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
                  alignItems: 'center',
                  gap: 16,
                }}
              >
                <span
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    background: 'var(--tertiary-100)',
                    color: 'var(--quaternary-400)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 17,
                    fontWeight: 700,
                  }}
                >
                  박
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>{row.data.name}</h1>
                    <Badge status="neutral">{row.data.systemRole}</Badge>
                    <Badge status="accent">{row.data.group} {row.data.groupRole}</Badge>
                  </div>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                    {row.data.email} · 클래스 역할 {row.data.classRole}
                  </span>
                </div>
                <Button variant="secondary" onClick={() => undefined}>리포트 이력</Button>
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
                    alignItems: 'center',
                    gap: 16,
                    minWidth: 0,
                  }}
                >
                  <span style={{ alignSelf: 'flex-start', fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                    난이도별 정답 분포
                  </span>
                  <DonutChart
                    segments={row.data.difficulty}
                    size={180}
                    centerValue="84%"
                    centerLabel="평균"
                  />
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
                  <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                    주간 참여 · 정답률
                  </span>
                  <LineChart series={row.data.weeklySeries} labels={row.data.weeklyLabels} height={180} />
                  <ChartLegend items={row.data.weeklySeries.map((s) => ({ label: s.name ?? '', accent: s.accent }))} />
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
                    세션별 성과
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
                  <span>완료율</span>
                  <span>평점</span>
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
                    <span>{s.completion}</span>
                    <span style={{ fontWeight: 600 }}>{s.rating}</span>
                  </div>
                ))}
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
                  gap: 14,
                }}
              >
                <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                  매니저 코멘트
                </span>
                {row.data.comments.map((c) => (
                  <div key={c.id} style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 14 }}>
                    <div style={{ display: 'flex', gap: 8, fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>
                      <span style={{ fontWeight: 600, color: 'var(--ink)' }}>{c.author}</span>
                      <span>{c.date}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: 'var(--text-secondary)' }}>{c.body}</p>
                  </div>
                ))}
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="코멘트를 입력하세요"
                  style={{
                    border: '1px solid var(--border-strong)',
                    borderRadius: 12,
                    padding: 12,
                    minHeight: 80,
                    fontFamily: 'var(--font-sans)',
                    fontSize: 14,
                    resize: 'vertical',
                  }}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button variant="primary" size="sm" onClick={() => setComment('')}>
                    코멘트 저장
                  </Button>
                </div>
              </div>
            </>
          )}
        </MockRowBoundary>
      </PageMain>
    </ManagerShell>
  );
}
