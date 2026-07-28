import { useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { ManagerShell, PageMain } from '../../components/layout/ManagerShell';
import { MockRowBoundary } from '../../components/feedback/MockRowBoundary';
import { Badge, Button, Input, Modal, Pagination, Select, Skeleton } from '../../ds';
import { useManagerGroupsRow } from '../../data';

function GridSkeleton() {
  return (
    <div className="qurie-card-grid">
      {[0, 1, 2].map((i) => (
        <Skeleton key={i} width="100%" height={180} radius={16} delay={i * 0.08} />
      ))}
    </div>
  );
}

export default function GroupListPage() {
  const row = useManagerGroupsRow();
  const [status, setStatus] = useState('전체');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [groupName, setGroupName] = useState('');

  return (
    <ManagerShell activeKey="groups" breadcrumbs={['서울 1반', '그룹']}>
      <PageMain>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>그룹</h1>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              그룹 역할은 LEADER / PARTICIPANT입니다.
            </span>
          </div>
          <Button variant="primary" icon={<Plus size={14} strokeWidth={1.75} />} onClick={() => setCreateOpen(true)}>
            그룹 만들기
          </Button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {['전체', '활동', '종료'].map((c) => {
            const active = status === c;
            return (
              <button
                key={c}
                type="button"
                onClick={() => setStatus(c)}
                style={{
                  borderRadius: 999,
                  padding: '6px 14px',
                  fontSize: 12,
                  fontWeight: active ? 600 : 400,
                  cursor: 'pointer',
                  fontFamily: 'var(--font-sans)',
                  border: `1px solid ${active ? 'var(--accent)' : 'var(--border-strong)'}`,
                  background: active ? 'var(--accent-softer)' : 'var(--surface-card)',
                  color: active ? 'var(--accent)' : 'var(--text-secondary)',
                }}
              >
                {c}
              </button>
            );
          })}
          <Input
            placeholder="그룹 검색…"
            icon={<Search size={14} strokeWidth={1.75} />}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            width={220}
            style={{ marginLeft: 'auto' }}
          />
        </div>

        <MockRowBoundary status={row.status} skeleton={<GridSkeleton />} onRetry={row.refetch} emptyMessage="그룹이 없습니다" emptyActionLabel="그룹 만들기" onEmptyAction={() => setCreateOpen(true)} label="row · groups">
          {row.data && (
            <>
              <div className="qurie-card-grid">
                {row.data
                  .filter((g) => {
                    if (query && !g.name.includes(query)) return false;
                    if (status === '전체') return true;
                    return g.status === status;
                  })
                  .map((g) => (
                    <div
                      key={g.id}
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
                        <h3 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>{g.name}</h3>
                        <Badge status={g.status === '활동' ? 'success' : 'neutral'}>{g.status}</Badge>
                      </div>
                      <div style={{ display: 'flex', gap: -6 }}>
                        {Array.from({ length: Math.min(g.members, 4) }).map((_, i) => (
                          <span
                            key={i}
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
                              marginLeft: i === 0 ? 0 : -6,
                              border: '2px solid var(--surface-card)',
                            }}
                          >
                            {String.fromCharCode(65 + i)}
                          </span>
                        ))}
                      </div>
                      <span style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>
                        LEADER {g.leader} · {g.period} · 세션 {g.sessions}
                      </span>
                      <Button variant="secondary" size="sm" onClick={() => undefined}>
                        그룹 열기
                      </Button>
                    </div>
                  ))}
                <button
                  type="button"
                  onClick={() => setCreateOpen(true)}
                  style={{
                    border: '1.5px dashed var(--grey-100)',
                    borderRadius: 16,
                    minHeight: 180,
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
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>새 그룹</span>
                </button>
              </div>
              <Pagination
                page={page}
                pageCount={1}
                pageSize={12}
                rangeLabel={`1–${row.data.length} / ${row.data.length}개`}
                onPage={setPage}
              />
            </>
          )}
        </MockRowBoundary>

        <Modal
          open={createOpen}
          title="그룹 만들기"
          description="이름과 LEADER를 지정하세요."
          primaryLabel="생성하기"
          secondaryLabel="취소"
          onPrimary={() => setCreateOpen(false)}
          onSecondary={() => setCreateOpen(false)}
          onClose={() => setCreateOpen(false)}
          width={480}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>그룹 이름</span>
              <Input placeholder="그룹 E" value={groupName} onChange={(e) => setGroupName(e.target.value)} width="100%" />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>LEADER</span>
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
