import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { StudentShell, PageMain } from '../../components/layout/StudentShell';
import { MockRowBoundary } from '../../components/feedback/MockRowBoundary';
import {
  Badge,
  Button,
  DonutChart,
  Modal,
  Select,
  Skeleton,
  StatCard,
  StatCardRow,
} from '../../ds';
import { useStudentDashboardRow } from '../../data';

function DashSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Skeleton width="100%" height={140} radius={16} />
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

export default function StudentDashboardPage() {
  const navigate = useNavigate();
  const row = useStudentDashboardRow();
  const [createOpen, setCreateOpen] = useState(false);
  const [title, setTitle] = useState('');

  return (
    <StudentShell activeKey="dashboard" breadcrumbs={['서울 1반', '대시보드']}>
      <PageMain>
        <MockRowBoundary
          status={row.status}
          skeleton={<DashSkeleton />}
          onRetry={row.refetch}
          emptyMessage="세션이 없습니다"
        >
          {row.data && (
            <>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'minmax(0, 1.6fr) minmax(0, 1fr)',
                  gap: 24,
                }}
              >
                <div
                  style={{
                    background: 'var(--ink)',
                    color: 'var(--surface-card)',
                    borderRadius: 16,
                    padding: 28,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 14,
                    minWidth: 0,
                  }}
                >
                  <span style={{ fontSize: 13, opacity: 0.72 }}>안녕하세요, 박민수님</span>
                  <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: 'var(--surface-card)' }}>
                    오늘 LIVE 세션이 진행 중입니다
                  </h1>
                  <span style={{ fontSize: 13, opacity: 0.72 }}>react-hooks-deep-dive · 14:00–16:00</span>
                  <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                    <Button variant="accent" onClick={() => undefined}>LIVE 입장</Button>
                    <Button
                      variant="secondary"
                      icon={<Plus size={14} strokeWidth={1.75} />}
                      onClick={() => setCreateOpen(true)}
                      style={{ background: 'transparent', color: 'var(--text-inverse)', borderColor: 'var(--border-strong)' }}
                    >
                      세션 생성
                    </Button>
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
                    alignItems: 'center',
                    gap: 12,
                    minWidth: 0,
                  }}
                >
                  <span style={{ alignSelf: 'flex-start', fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                    주간 목표
                  </span>
                  <DonutChart
                    segments={[
                      { label: '완료', value: 4, accent: true },
                      { label: '남음', value: 1 },
                    ]}
                    size={140}
                    centerValue="4/5"
                    centerLabel="세션"
                  />
                </div>
              </div>

              <StatCardRow>
                {row.data.kpis.map((item, i) => (
                  <StatCard key={i} {...item} />
                ))}
              </StatCardRow>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                    나의 세션
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 4 }}>
                  {row.data.sessions.map((s) => (
                    <div
                      key={s.id}
                      style={{
                        minWidth: 260,
                        background: 'var(--surface-card)',
                        border: '1px solid var(--border)',
                        borderRadius: 16,
                        boxShadow: 'var(--shadow-card)',
                        padding: 20,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 10,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Badge status={s.status === 'LIVE' ? 'accent' : s.status === '예정' ? 'warning' : 'neutral'}>
                          {s.status}
                        </Badge>
                      </div>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>
                        {s.title}
                      </span>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.time}</span>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => (s.action === '리포트' ? navigate('/app/report') : undefined)}
                      >
                        {s.action}
                      </Button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setCreateOpen(true)}
                    style={{
                      minWidth: 180,
                      border: '1.5px dashed var(--grey-100)',
                      borderRadius: 16,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      cursor: 'pointer',
                      background: 'transparent',
                      fontFamily: 'var(--font-sans)',
                      color: 'var(--text-muted)',
                    }}
                  >
                    <Plus size={18} strokeWidth={1.75} />
                    <span style={{ fontSize: 13, fontWeight: 600 }}>세션 생성</span>
                  </button>
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
                    gap: 12,
                    minWidth: 0,
                  }}
                >
                  <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                    최근 성적
                  </span>
                  {row.data.grades.map((g) => (
                    <div key={g.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ flex: 1, fontFamily: 'var(--font-mono)', fontSize: 12.5, color: 'var(--ink)' }}>{g.session}</span>
                      <span style={{ fontWeight: 700, color: 'var(--accent)' }}>{g.score}</span>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{g.date}</span>
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
                    gap: 12,
                    minWidth: 0,
                  }}
                >
                  <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                    복습 추천
                  </span>
                  {row.data.reviews.map((r) => (
                    <div key={r.id} style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 12 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{r.title}</span>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{r.reason}</div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </MockRowBoundary>

        <Modal
          open={createOpen}
          title="세션 생성"
          description="제목과 공개 범위를 설정하세요."
          primaryLabel="생성하기"
          secondaryLabel="취소"
          onPrimary={() => setCreateOpen(false)}
          onSecondary={() => setCreateOpen(false)}
          onClose={() => setCreateOpen(false)}
          width={480}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>제목</span>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="session-slug"
                style={{
                  border: '1px solid var(--border-strong)',
                  borderRadius: 999,
                  padding: '10px 16px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 14,
                }}
              />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>공개 범위</span>
              <Select
                options={[
                  { value: 'public', label: '공개' },
                  { value: 'private', label: '비공개' },
                ]}
                value="public"
                onChange={() => undefined}
              />
            </label>
          </div>
        </Modal>
      </PageMain>
    </StudentShell>
  );
}
