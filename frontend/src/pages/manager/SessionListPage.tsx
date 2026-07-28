import { useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { ManagerShell, PageMain } from '../../components/layout/ManagerShell';
import { MockRowBoundary } from '../../components/feedback/MockRowBoundary';
import { Badge, Button, Input, Modal, Pagination, Skeleton } from '../../ds';
import { useManagerSessionsRow } from '../../data';

function TableSkeleton() {
  return (
    <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border)', borderRadius: 16, padding: 24 }}>
      {[0, 1, 2, 3].map((i) => (
        <Skeleton key={i} width="100%" height={36} delay={i * 0.08} style={{ marginBottom: 10 }} />
      ))}
    </div>
  );
}

export default function SessionListPage() {
  const row = useManagerSessionsRow();
  const [status, setStatus] = useState('전체');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [title, setTitle] = useState('');

  const chips = ['전체', '진행', '예정', '종료'];

  return (
    <ManagerShell activeKey="sessions" breadcrumbs={['서울 1반', '세션']}>
      <PageMain>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>세션</h1>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>클래스 세션을 생성하고 상태를 관리하세요.</span>
          </div>
          <Button variant="primary" icon={<Plus size={14} strokeWidth={1.75} />} onClick={() => setCreateOpen(true)}>
            세션 만들기
          </Button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {chips.map((c) => {
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
            placeholder="세션 검색…"
            icon={<Search size={14} strokeWidth={1.75} />}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            width={220}
            style={{ marginLeft: 'auto' }}
          />
        </div>

        <MockRowBoundary status={row.status} skeleton={<TableSkeleton />} onRetry={row.refetch} emptyMessage="세션이 없습니다" emptyActionLabel="세션 만들기" onEmptyAction={() => setCreateOpen(true)} label="row · sessions">
          {row.data && (
            <>
              <div
                style={{
                  background: 'var(--surface-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 16,
                  boxShadow: 'var(--shadow-card)',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 1fr 1.2fr 1fr 0.8fr 1.2fr',
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
                  <span>생성자</span>
                  <span>시작</span>
                  <span>참여</span>
                  <span>상태</span>
                  <span style={{ textAlign: 'right' }}>액션</span>
                </div>
                {row.data
                  .filter((s) => {
                    if (query && !s.slug.includes(query)) return false;
                    if (status === '전체') return true;
                    if (status === '진행') return s.status === 'LIVE';
                    return s.status === status;
                  })
                  .map((s) => (
                    <div
                      key={s.id}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '2fr 1fr 1.2fr 1fr 0.8fr 1.2fr',
                        padding: '13px 24px',
                        borderBottom: '1px solid var(--divider)',
                        fontSize: 13,
                        alignItems: 'center',
                      }}
                    >
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5, color: 'var(--ink)' }}>{s.slug}</span>
                      <span style={{ color: 'var(--text-secondary)' }}>{s.creator}</span>
                      <span style={{ color: 'var(--text-secondary)' }}>{s.start}</span>
                      <span style={{ color: 'var(--ink)' }}>{s.participants}</span>
                      <Badge status={s.status === 'LIVE' ? 'accent' : s.status === '예정' ? 'warning' : 'neutral'}>{s.status}</Badge>
                      <span style={{ textAlign: 'right', display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        <Button variant="secondary" size="sm" onClick={() => undefined}>
                          {s.status === '종료' ? '리포트' : s.status === 'LIVE' ? '입장' : '편집'}
                        </Button>
                      </span>
                    </div>
                  ))}
              </div>
              <Pagination
                page={page}
                pageCount={1}
                pageSize={10}
                rangeLabel={`1–${row.data.length} / ${row.data.length}개`}
                onPage={setPage}
              />
            </>
          )}
        </MockRowBoundary>

        <Modal
          open={createOpen}
          title="세션 만들기"
          description="제목을 입력하면 slug가 자동 생성됩니다."
          primaryLabel="생성하기"
          secondaryLabel="취소"
          onPrimary={() => setCreateOpen(false)}
          onSecondary={() => setCreateOpen(false)}
          onClose={() => setCreateOpen(false)}
          width={480}
        >
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>세션 제목</span>
            <Input placeholder="react-hooks-deep-dive" value={title} onChange={(e) => setTitle(e.target.value)} width="100%" />
          </label>
        </Modal>
      </PageMain>
    </ManagerShell>
  );
}
