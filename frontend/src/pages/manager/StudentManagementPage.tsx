import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Shuffle } from 'lucide-react';
import { ManagerShell, PageMain } from '../../components/layout/ManagerShell';
import { MockRowBoundary } from '../../components/feedback/MockRowBoundary';
import { Badge, Button, Input, Modal, Select, Skeleton } from '../../ds';
import { useManagerStudentsRow } from '../../data';
import type { ClassRole } from '../../data';

function TableSkeleton() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 24 }}>
      <Skeleton width="100%" height={360} radius={16} />
      <Skeleton width="100%" height={360} radius={16} />
    </div>
  );
}

export default function StudentManagementPage() {
  const navigate = useNavigate();
  const row = useManagerStudentsRow();
  const [query, setQuery] = useState('');
  const [roles, setRoles] = useState<Record<string, ClassRole>>({});
  const [groupOpen, setGroupOpen] = useState(false);
  const [groupName, setGroupName] = useState('');

  return (
    <ManagerShell activeKey="students" breadcrumbs={['서울 1반', '학생 관리']}>
      <PageMain>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>학생 관리</h1>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              클래스 역할은 ADMIN / STUDENT만 지원합니다. 참여자를 배정하고 그룹을 구성하세요.
            </span>
          </div>
          <Button variant="primary" icon={<Plus size={14} strokeWidth={1.75} />} onClick={() => undefined}>
            참여자 배정
          </Button>
        </div>

        <MockRowBoundary
          status={row.status}
          skeleton={<TableSkeleton />}
          onRetry={row.refetch}
          emptyMessage="학생이 없습니다"
        >
          {row.data && (
            <div className="qurie-master-split" style={{ gridTemplateColumns: 'minmax(0, 1.6fr) minmax(0, 1fr)' }}>
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
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '16px 24px', borderBottom: '1px solid var(--divider)' }}>
                  <Input
                    placeholder="학생 검색…"
                    icon={<Search size={14} strokeWidth={1.75} />}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    width={220}
                  />
                  <Select
                    options={[
                      { value: 'all', label: '전체 역할' },
                      { value: 'ADMIN', label: 'ADMIN' },
                      { value: 'STUDENT', label: 'STUDENT' },
                    ]}
                    value="all"
                    onChange={() => undefined}
                  />
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1.6fr 1fr 1fr 1fr 0.9fr',
                    padding: '10px 24px',
                    borderBottom: '1px solid var(--divider)',
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    color: 'var(--text-muted)',
                  }}
                >
                  <span>학생</span>
                  <span>클래스 역할</span>
                  <span>그룹</span>
                  <span>완료율</span>
                  <span>액티비티</span>
                </div>
                {row.data.students
                  .filter((s) => !query || s.name.includes(query) || s.email.includes(query))
                  .map((s) => {
                    const role = roles[s.id] ?? s.role;
                    return (
                      <div
                        key={s.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => navigate(`/manager/students/${s.id}`)}
                        onKeyDown={(e) => e.key === 'Enter' && navigate(`/manager/students/${s.id}`)}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '1.6fr 1fr 1fr 1fr 0.9fr',
                          padding: '13px 24px',
                          borderBottom: '1px solid var(--divider)',
                          fontSize: 13,
                          alignItems: 'center',
                          cursor: 'pointer',
                        }}
                      >
                        <span style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: 600, color: 'var(--ink)' }}>{s.name}</span>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)' }}>{s.email}</span>
                        </span>
                        <span
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => e.stopPropagation()}
                          role="presentation"
                        >
                          <Select
                            size="sm"
                            options={[
                              { value: 'ADMIN', label: 'ADMIN' },
                              { value: 'STUDENT', label: 'STUDENT' },
                            ]}
                            value={role}
                            onChange={(v) => setRoles((prev) => ({ ...prev, [s.id]: v as ClassRole }))}
                          />
                        </span>
                        <span style={{ color: 'var(--text-secondary)' }}>{s.group}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ flex: 1, height: 5, borderRadius: 999, background: 'var(--divider)', overflow: 'hidden', maxWidth: 72 }}>
                            <div style={{ width: `${s.completion}%`, height: '100%', background: 'var(--accent)' }} />
                          </div>
                          <span style={{ fontSize: 12, fontWeight: 600 }}>{s.completion}%</span>
                        </div>
                        <Badge status={s.activity === '활성' ? 'success' : s.activity === '주의' ? 'warning' : 'error'}>
                          {s.activity}
                        </Badge>
                      </div>
                    );
                  })}
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
                      그룹
                    </span>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <Button variant="secondary" size="sm" icon={<Shuffle size={13} strokeWidth={1.75} />} onClick={() => undefined}>
                        랜덤
                      </Button>
                      <Button variant="primary" size="sm" icon={<Plus size={13} strokeWidth={1.75} />} onClick={() => setGroupOpen(true)}>
                        생성
                      </Button>
                    </div>
                  </div>
                  {row.data.groups.slice(0, 3).map((g) => (
                    <div key={g.id} style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>{g.name}</span>
                        <Badge status={g.status === '활동' ? 'success' : 'neutral'}>{g.status}</Badge>
                      </div>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        LEADER {g.leader} · {g.members}명 · 세션 {g.sessions}
                      </span>
                    </div>
                  ))}
                </div>
                <div
                  style={{
                    background: 'var(--accent-softer)',
                    border: '1px solid var(--accent-soft)',
                    borderRadius: 12,
                    padding: 14,
                    fontSize: 12.5,
                    lineHeight: 1.6,
                    color: 'var(--text-body)',
                  }}
                >
                  클래스 역할은 <span style={{ fontWeight: 600, color: 'var(--ink)' }}>ADMIN</span>과{' '}
                  <span style={{ fontWeight: 600, color: 'var(--ink)' }}>STUDENT</span>만 사용합니다. TEMP_ADMIN은 지원하지 않습니다.
                </div>
              </div>
            </div>
          )}
        </MockRowBoundary>

        <Modal
          open={groupOpen}
          title="그룹 생성"
          description="이름과 LEADER를 지정하고 멤버를 배정하세요."
          primaryLabel="생성하기"
          secondaryLabel="취소"
          onPrimary={() => setGroupOpen(false)}
          onSecondary={() => setGroupOpen(false)}
          onClose={() => setGroupOpen(false)}
          width={480}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>그룹 이름</span>
              <Input placeholder="그룹 E" value={groupName} onChange={(e) => setGroupName(e.target.value)} width="100%" />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>LEADER</span>
              <Select
                options={[
                  { value: 'sujin', label: '이수진' },
                  { value: 'minsu', label: '박민수' },
                ]}
                value="sujin"
                onChange={() => undefined}
              />
            </label>
          </div>
        </Modal>
      </PageMain>
    </ManagerShell>
  );
}
