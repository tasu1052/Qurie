import { useNavigate, useParams } from 'react-router-dom';
import { StudentShell, PageMain } from '../../components/layout/StudentShell';
import { MockRowBoundary } from '../../components/feedback/MockRowBoundary';
import { Badge, LiveBadge, Button, Skeleton } from '../../ds';
import { useClassLobbyRow } from '../../data';
import javaTech from '../../ds/assets/tech/java_100.png';

function LobbySkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Skeleton width="100%" height={120} radius={16} />
      <div className="qurie-master-split">
        <Skeleton width="100%" height={280} radius={16} />
        <Skeleton width="100%" height={280} radius={16} />
      </div>
    </div>
  );
}

export default function ClassLobbyPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const row = useClassLobbyRow(id);

  return (
    <StudentShell activeKey="class" breadcrumbs={['서울 1반', '클래스']}>
      <PageMain>
        <MockRowBoundary
          status={row.status}
          skeleton={<LobbySkeleton />}
          onRetry={row.refetch}
          emptyMessage="클래스 정보가 없습니다"
        >
          {row.data && (
            <>
              <div
                style={{
                  background: 'var(--ink)',
                  borderRadius: 16,
                  padding: 28,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 20,
                  color: 'var(--text-inverse)',
                }}
              >
                <span
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 12,
                    background: 'var(--text-inverse)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    opacity: 0.92,
                  }}
                >
                  <img src={javaTech} width={30} height={30} alt="Java" style={{ objectFit: 'contain' }} />
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', opacity: 0.72 }}>
                      {row.data.track}
                    </span>
                    {row.data.statusLabel === 'LIVE' ? (
                      <LiveBadge />
                    ) : (
                      <Badge status="accent">{row.data.statusLabel}</Badge>
                    )}
                  </div>
                  <h1 style={{ fontSize: 22, fontWeight: 700, margin: '4px 0 0', color: 'var(--text-inverse)' }}>{row.data.name}</h1>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10, maxWidth: 320 }}>
                    <div style={{ flex: 1, height: 6, borderRadius: 999, background: 'var(--grey-600)', overflow: 'hidden' }}>
                      <div style={{ width: `${row.data.progress}%`, height: '100%', background: 'var(--accent)' }} />
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 600 }}>{row.data.progress}%</span>
                  </div>
                </div>
                <Button variant="accent" onClick={() => navigate('/app')}>
                  대시보드
                </Button>
              </div>

              <div className="qurie-master-split">
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
                    <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                      세션 기록
                    </span>
                    {row.data.sessions.map((s) => (
                      <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10, border: '1px solid var(--border)', borderRadius: 12, padding: '12px 14px' }}>
                        <span style={{ flex: 1, fontFamily: 'var(--font-mono)', fontSize: 12.5, fontWeight: 600 }}>{s.title}</span>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.date}</span>
                        {s.status === 'LIVE' ? (
                          <LiveBadge />
                        ) : (
                          <Badge status="neutral">{s.status}</Badge>
                        )}
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
                    }}
                  >
                    <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                      학습 자료
                    </span>
                    <div className="qurie-card-grid" style={{ marginTop: 14, gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
                      {row.data.materials.map((m) => (
                        <div key={m.id} style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 14 }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{m.title}</span>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, fontFamily: 'var(--font-mono)' }}>{m.size}</div>
                        </div>
                      ))}
                    </div>
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
                    <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                      내 그룹
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 17, fontWeight: 700 }}>{row.data.group.name}</span>
                      <Badge status="accent">{row.data.group.role}</Badge>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {row.data.group.members.map((m) => (
                        <span
                          key={m}
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: '50%',
                            background: 'var(--accent-soft)',
                            color: 'var(--accent)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 11,
                            fontWeight: 700,
                          }}
                        >
                          {m}
                        </span>
                      ))}
                    </div>
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
                      공지
                    </span>
                    {row.data.notices.map((n) => (
                      <div key={n.id} style={{ borderBottom: '1px solid var(--divider)', paddingBottom: 10 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{n.title}</span>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{n.date}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </MockRowBoundary>
      </PageMain>
    </StudentShell>
  );
}
