import { useEffect, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { ManagerShell, PageMain } from '../../components/layout/ManagerShell';
import {
  Badge,
  LiveBadge,
  Button,
  EmptyState,
  Input,
  Modal,
  Pagination,
  RowErrorFallback,
  RowSection,
  Skeleton,
} from '../../ds';
import {
  QueryAsyncBoundary,
  useCreateSession,
  useGetSessions,
  useMe,
  type SessionResponse,
} from '../../data';

function TableSkeleton() {
  return (
    <div
      style={{
        background: 'var(--surface-card)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        padding: 24,
      }}
    >
      {[0, 1, 2, 3].map((i) => (
        <Skeleton key={i} width="100%" height={36} delay={i * 0.08} style={{ marginBottom: 10 }} />
      ))}
    </div>
  );
}

function sessionStatus(s: SessionResponse): 'LIVE' | '종료' | '예정' {
  if (s.active) return 'LIVE';
  if (s.endedAt) return '종료';
  return '예정';
}

function SessionTable({
  classId,
  statusFilter,
  query,
  page,
  onPage,
  onEmptyCreate,
}: {
  classId: number;
  statusFilter: string;
  query: string;
  page: number;
  onPage: (p: number) => void;
  onEmptyCreate: () => void;
}) {
  const { data: sessions } = useGetSessions(classId);

  const filtered = sessions.filter((s) => {
    const status = sessionStatus(s);
    if (query && !s.title.toLowerCase().includes(query.toLowerCase())) return false;
    if (statusFilter === '전체') return true;
    if (statusFilter === '진행') return status === 'LIVE';
    return status === statusFilter;
  });

  if (filtered.length === 0) {
    return (
      <EmptyState
        message="세션이 없습니다"
        actionLabel="세션 만들기"
        onAction={onEmptyCreate}
      />
    );
  }

  return (
    <RowSection style={{ gap: 24 }}>
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
        {filtered.map((s) => {
          const status = sessionStatus(s);
          return (
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
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5, color: 'var(--ink)' }}>{s.title}</span>
              <span style={{ color: 'var(--text-secondary)' }}>#{s.createdBy}</span>
              <span style={{ color: 'var(--text-secondary)' }}>
                {new Date(s.createdAt).toLocaleString('ko-KR', { hour12: false })}
              </span>
              <span style={{ color: 'var(--ink)' }}>—</span>
              {status === 'LIVE' ? (
                <LiveBadge />
              ) : (
                <Badge status={status === '예정' ? 'warning' : 'neutral'}>{status}</Badge>
              )}
              <span style={{ textAlign: 'right', display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                <Button variant="secondary" size="sm" onClick={() => undefined}>
                  {status === '종료' ? '리포트' : status === 'LIVE' ? '입장' : '편집'}
                </Button>
              </span>
            </div>
          );
        })}
      </div>
      <Pagination
        page={page}
        pageCount={1}
        pageSize={10}
        rangeLabel={`1–${filtered.length} / ${filtered.length}개`}
        onPage={onPage}
      />
    </RowSection>
  );
}

export default function SessionListPage() {
  const [params] = useSearchParams();
  const classIdParam = params.get('classId');
  const classId = classIdParam ? Number(classIdParam) : NaN;
  const hasValidClassId = Number.isFinite(classId) && classId > 0;
  const { data: me } = useMe();
  const createSession = useCreateSession();
  const [status, setStatus] = useState('전체');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [rowKey, setRowKey] = useState(0);

  const chips = ['전체', '진행', '예정', '종료'];

  useEffect(() => {
    if (hasValidClassId) {
      localStorage.setItem('qurie.lastClassId', String(classId));
    }
  }, [classId, hasValidClassId]);

  const onCreate = () => {
    if (!hasValidClassId) return;
    if (!title.trim()) return;
    createSession.mutate(
      { classId, title: title.trim(), createdBy: me.id },
      {
        onSuccess: () => {
          setCreateOpen(false);
          setTitle('');
          setRowKey((k) => k + 1);
        },
      },
    );
  };

  return (
    <ManagerShell activeKey="sessions" breadcrumbs={['서울 1반', '세션']}>
      <PageMain>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>세션</h1>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              클래스 세션을 생성하고 상태를 관리하세요.
            </span>
          </div>
          <Button
            variant="primary"
            icon={<Plus size={14} strokeWidth={1.75} />}
            onClick={() => setCreateOpen(true)}
          >
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

        {!hasValidClassId ? (
          <EmptyState
            message="classId 쿼리스트링이 없습니다"
            description="예: /manager/sessions?classId=12"
          />
        ) : (
          <QueryAsyncBoundary
            key={rowKey}
            suspenseFallback={<TableSkeleton />}
            errorFallback={
              <RowErrorFallback
                onRetry={() => setRowKey((k) => k + 1)}
                title="이 영역을 불러오지 못했습니다"
                description="이 행만 실패했습니다. 나머지 영역은 정상적으로 표시됩니다."
              />
            }
          >
            <SessionTable
              classId={classId}
              statusFilter={status}
              query={query}
              page={page}
              onPage={setPage}
              onEmptyCreate={() => setCreateOpen(true)}
            />
          </QueryAsyncBoundary>
        )}

        <Modal
          open={createOpen}
          title="세션 만들기"
          description="제목을 입력하면 세션이 생성됩니다."
          primaryLabel={createSession.isPending ? '생성 중…' : '생성하기'}
          secondaryLabel="취소"
          onPrimary={onCreate}
          onSecondary={() => setCreateOpen(false)}
          onClose={() => setCreateOpen(false)}
          width={480}
        >
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>세션 제목</span>
            <Input
              placeholder="react-hooks-deep-dive"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              width="100%"
            />
          </label>
        </Modal>
      </PageMain>
    </ManagerShell>
  );
}
