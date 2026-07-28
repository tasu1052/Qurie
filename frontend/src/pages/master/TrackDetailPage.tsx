import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Settings, TriangleAlert } from 'lucide-react';
import { MasterShell, PageMain } from '../../components/layout/MasterShell';
import { MockRowBoundary } from '../../components/feedback/MockRowBoundary';
import {
  Badge,
  Button,
  ChartLegend,
  LineChart,
  Skeleton,
  StatCard,
  StatCardRow,
} from '../../ds';
import { useTrackDetailRow } from '../../data';
import javaTech from '../../ds/assets/tech/java_100.png';

const metricChips = ['퀴즈 참여율', '정답률', 'Streak 유지율', '세션 빈도'] as const;

function DetailSkeleton() {
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
            <Skeleton width="60%" height={14} delay={i * 0.08} />
            <Skeleton width="40%" height={28} delay={i * 0.08 + 0.04} style={{ marginTop: 12 }} />
          </div>
        ))}
      </StatCardRow>
    </div>
  );
}

export default function TrackDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const row = useTrackDetailRow(id);
  const [metric, setMetric] = useState<(typeof metricChips)[number]>('퀴즈 참여율');

  return (
    <MasterShell activeKey="tracks" breadcrumbs={['SSAFY 서울캠퍼스', '대시보드', 'Java 전공 (서울)']}>
      <PageMain>
        <MockRowBoundary
          status={row.status}
          skeleton={<DetailSkeleton />}
          onRetry={row.refetch}
          emptyMessage="트랙 데이터가 없습니다"
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
                  gap: 24,
                }}
              >
                <span
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 12,
                    background: 'var(--surface-sunken)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <img src={javaTech} width={30} height={30} alt="Java" style={{ objectFit: 'contain' }} />
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--accent)' }}>
                      Track
                    </span>
                    <Badge status="success">{row.data.meta.statusLabel}</Badge>
                  </div>
                  <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>{row.data.meta.name}</h1>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{row.data.meta.subtitle}</span>
                </div>
                <Button variant="secondary" icon={<Settings size={14} strokeWidth={1.75} />} onClick={() => undefined}>
                  트랙 설정
                </Button>
              </div>

              <StatCardRow>
                {row.data.kpis.map((item, i) => (
                  <StatCard key={i} {...item} />
                ))}
              </StatCardRow>

              <div className="qurie-master-split" style={{ gridTemplateColumns: 'minmax(0, 1.6fr) minmax(0, 1fr)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24, minWidth: 0 }}>
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
                        클래스 현황
                      </span>
                      <Link to="/master/classes" style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)', textDecoration: 'none' }}>
                        클래스 관리 <span style={{ fontWeight: 800 }}>&gt;</span>
                      </Link>
                    </div>
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1.6fr 1fr 0.7fr 0.7fr 0.9fr 0.9fr 0.9fr',
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
                      <span>담당 매니저</span>
                      <span>학생</span>
                      <span>세션</span>
                      <span>퀴즈 참여율</span>
                      <span>정답률</span>
                      <span>상태</span>
                    </div>
                    {row.data.classes.map((c) => (
                      <div
                        key={c.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => navigate(`/master/analytics/${c.id}`)}
                        onKeyDown={(e) => e.key === 'Enter' && navigate(`/master/analytics/${c.id}`)}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '1.6fr 1fr 0.7fr 0.7fr 0.9fr 0.9fr 0.9fr',
                          padding: '13px 24px',
                          borderBottom: '1px solid var(--divider)',
                          fontSize: 13,
                          alignItems: 'center',
                          cursor: 'pointer',
                        }}
                      >
                        <span style={{ fontWeight: 600, color: 'var(--ink)' }}>{c.name}</span>
                        <span style={{ color: 'var(--text-secondary)' }}>{c.manager}</span>
                        <span style={{ color: 'var(--text-secondary)' }}>{c.students}</span>
                        <span style={{ color: 'var(--text-secondary)' }}>{c.sessions}</span>
                        <span style={{ color: 'var(--ink)' }}>{c.quizRate}</span>
                        <span style={{ color: c.accuracyAccent ? 'var(--accent)' : 'var(--ink)', fontWeight: 700 }}>{c.accuracy}</span>
                        <Badge status={c.status === 'active' ? 'success' : 'neutral'}>{c.statusLabel}</Badge>
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
                      gap: 16,
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
                    <LineChart series={row.data.chartSeries} labels={row.data.chartLabels} height={180} />
                    <ChartLegend items={row.data.chartSeries.map((s) => ({ label: s.name ?? '', accent: s.accent }))} />
                  </div>
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <TriangleAlert size={16} strokeWidth={1.75} style={{ color: 'var(--status-warning)' }} />
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>주의가 필요한 클래스</span>
                    </div>
                    {row.data.alerts.map((a) => (
                      <div
                        key={a.id}
                        style={{
                          border: `1px solid ${a.severity === 'warning' ? 'var(--status-warning-bg)' : 'var(--border)'}`,
                          background: a.severity === 'warning' ? 'var(--status-warning-bg)' : 'transparent',
                          borderRadius: 12,
                          padding: 14,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 6,
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>{a.className}</span>
                          <span
                            style={{
                              marginLeft: 'auto',
                              fontSize: 11,
                              fontWeight: 700,
                              color: a.severity === 'warning' ? 'var(--status-warning)' : 'var(--status-error)',
                            }}
                          >
                            {a.label}
                          </span>
                        </div>
                        <span style={{ fontSize: 12, lineHeight: 1.55, color: 'var(--text-secondary)' }}>{a.body}</span>
                        <Link
                          to={`/master/analytics/${a.classId}`}
                          style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)', textDecoration: 'none' }}
                        >
                          클래스 분석 보기 <span style={{ fontWeight: 800 }}>&gt;</span>
                        </Link>
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
                      담당 매니저
                    </span>
                    {row.data.managers.map((m) => (
                      <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span
                          style={{
                            width: 30,
                            height: 30,
                            borderRadius: '50%',
                            background: m.avatarTone === 'accent' ? 'var(--accent-soft)' : 'var(--tertiary-100)',
                            color: m.avatarTone === 'accent' ? 'var(--accent)' : 'var(--quaternary-400)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 11,
                            fontWeight: 700,
                          }}
                        >
                          {m.initial}
                        </span>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{m.name}</span>
                          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{m.detail}</span>
                        </div>
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--status-success)' }} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </MockRowBoundary>
      </PageMain>
    </MasterShell>
  );
}
