import { useNavigate } from 'react-router-dom';
import { Plus, Settings } from 'lucide-react';
import { ManagerShell, PageMain } from '../../components/layout/ManagerShell';
import { MockRowBoundary } from '../../components/feedback/MockRowBoundary';
import {
  Badge,
  Button,
  LoadMore,
  RiskBadge,
  Skeleton,
  StatCard,
  StatCardRow,
} from '../../ds';
import { useManagerDashboardRow } from '../../data';

function DashSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Skeleton width="100%" height={100} radius={16} />
      <StatCardRow>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} style={{ background: 'var(--surface-card)', border: '1px solid var(--border)', borderRadius: 'var(--card-radius)', padding: 'var(--stat-card-padding)' }}>
            <Skeleton width="50%" height={14} delay={i * 0.08} />
            <Skeleton width="40%" height={28} delay={i * 0.08 + 0.04} style={{ marginTop: 12 }} />
          </div>
        ))}
      </StatCardRow>
    </div>
  );
}

export default function ManagerDashboardPage() {
  const navigate = useNavigate();
  const row = useManagerDashboardRow();

  return (
    <ManagerShell activeKey="dashboard" breadcrumbs={['서울 1반', '대시보드']}>
      <PageMain>
        <MockRowBoundary
          status={row.status}
          skeleton={<DashSkeleton />}
          onRetry={row.refetch}
          emptyMessage="클래스 데이터가 없습니다"
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
                  gap: 14,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--accent)' }}>
                      {row.data.header.track}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                      <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>{row.data.header.name}</h1>
                      <Badge status="success">{row.data.header.statusLabel}</Badge>
                    </div>
                    <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{row.data.header.period}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Button variant="secondary" icon={<Settings size={14} strokeWidth={1.75} />} onClick={() => undefined}>
                      설정
                    </Button>
                    <Button variant="primary" icon={<Plus size={14} strokeWidth={1.75} />} onClick={() => undefined}>
                      세션 개설
                    </Button>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ flex: 1, height: 6, borderRadius: 999, background: 'var(--divider)', overflow: 'hidden' }}>
                    <div style={{ width: `${row.data.header.progress}%`, height: '100%', background: 'var(--accent)' }} />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)' }}>{row.data.header.progress}%</span>
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
                    gap: 14,
                    minWidth: 0,
                  }}
                >
                  <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                    오늘의 세션
                  </span>
                  {row.data.sessions.map((s) => (
                    <div
                      key={s.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        border: '1px solid var(--border)',
                        borderRadius: 12,
                        padding: '12px 14px',
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5, fontWeight: 600, color: 'var(--ink)' }}>
                            {s.title}
                          </span>
                          <Badge status={s.status === 'LIVE' ? 'accent' : s.status === '예정' ? 'warning' : 'neutral'}>
                            {s.status}
                          </Badge>
                        </div>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                          {s.time} · {s.participants}
                        </span>
                      </div>
                      <Button variant="secondary" size="sm" onClick={() => undefined}>
                        {s.action}
                      </Button>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 24, minWidth: 0 }}>
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
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                        학생 Top 5
                      </span>
                      <button
                        type="button"
                        onClick={() => navigate('/manager/students')}
                        style={{
                          background: 'none',
                          border: 'none',
                          fontSize: 12.5,
                          fontWeight: 600,
                          color: 'var(--accent)',
                          cursor: 'pointer',
                          fontFamily: 'var(--font-sans)',
                        }}
                      >
                        전체 보기
                      </button>
                    </div>
                    {row.data.topStudents.map((s) => (
                      <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{s.name}</span>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.group}</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)' }}>{s.completion}</span>
                      </div>
                    ))}
                    <LoadMore label="40명 더 보기" onClick={() => navigate('/manager/students')} />
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
                    }}
                  >
                    <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                      주의 학생
                    </span>
                    {row.data.atRisk.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => navigate(`/manager/students/${s.id}`)}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 4,
                          alignItems: 'flex-start',
                          background: 'none',
                          border: '1px solid var(--border)',
                          borderRadius: 12,
                          padding: 12,
                          cursor: 'pointer',
                          fontFamily: 'var(--font-sans)',
                          textAlign: 'left',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>{s.name}</span>
                          <RiskBadge level={s.level === '위험' ? 'danger' : 'warning'} label={s.level} />
                        </div>
                        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{s.reason}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </MockRowBoundary>
      </PageMain>
    </ManagerShell>
  );
}
