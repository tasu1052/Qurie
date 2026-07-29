import { useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { ManagerShell, PageMain } from '../../components/layout/ManagerShell';
import {
  Badge,
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
  useCreateGroup,
  useGetGroups,
  useMe,
  type GroupResponse,
} from '../../data';

function GridSkeleton() {
  return (
    <div className="qurie-card-grid">
      {[0, 1, 2].map((i) => (
        <Skeleton key={i} width="100%" height={180} radius={16} delay={i * 0.08} />
      ))}
    </div>
  );
}

function groupStatus(g: GroupResponse): '활동' | '종료' {
  return new Date(g.endedAt).getTime() > Date.now() ? '활동' : '종료';
}

function formatPeriod(g: GroupResponse): string {
  const start = new Date(g.startedAt);
  const end = new Date(g.endedAt);
  const fmt = (d: Date) =>
    `${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
  return `${fmt(start)}–${fmt(end)}`;
}

function toLocalDateTime(d: Date): string {
  return d.toISOString().slice(0, 19);
}

function GroupGrid({
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
  const { data: groups } = useGetGroups(classId);

  const filtered = groups.filter((g) => {
    const status = groupStatus(g);
    if (query && !g.name.toLowerCase().includes(query.toLowerCase())) return false;
    if (statusFilter === '전체') return true;
    return status === statusFilter;
  });

  if (filtered.length === 0) {
    return (
      <EmptyState
        message="그룹이 없습니다"
        actionLabel="그룹 만들기"
        onAction={onEmptyCreate}
      />
    );
  }

  return (
    <RowSection style={{ gap: 24 }}>
      <div className="qurie-card-grid">
        {filtered.map((g) => {
          const status = groupStatus(g);
          return (
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
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <h3 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>{g.name}</h3>
                <Badge status={status === '활동' ? 'success' : 'neutral'}>{status}</Badge>
              </div>
              <span style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                {g.description}
              </span>
              <span style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>{formatPeriod(g)}</span>
              <Button variant="secondary" size="sm" onClick={() => undefined}>
                그룹 열기
              </Button>
            </div>
          );
        })}
        <button
          type="button"
          onClick={onEmptyCreate}
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
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
            새 그룹
          </span>
        </button>
      </div>
      <Pagination
        page={page}
        pageCount={1}
        pageSize={12}
        rangeLabel={`1–${filtered.length} / ${filtered.length}개`}
        onPage={onPage}
      />
    </RowSection>
  );
}

export default function GroupListPage() {
  const { data: me } = useMe();
  const classId = me.classId;
  const hasValidClassId = typeof classId === 'number' && Number.isFinite(classId) && classId > 0;
  const createGroup = useCreateGroup();
  const [status, setStatus] = useState('전체');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [rowKey, setRowKey] = useState(0);

  const onCreate = () => {
    if (!hasValidClassId) return;
    if (!groupName.trim() || !description.trim()) return;

    const startedAt = new Date();
    const endedAt = new Date(startedAt);
    endedAt.setDate(endedAt.getDate() + 30);

    createGroup.mutate(
      {
        classId,
        name: groupName.trim(),
        description: description.trim(),
        startedAt: toLocalDateTime(startedAt),
        endedAt: toLocalDateTime(endedAt),
      },
      {
        onSuccess: () => {
          setCreateOpen(false);
          setGroupName('');
          setDescription('');
          setRowKey((k) => k + 1);
        },
      },
    );
  };

  return (
    <ManagerShell activeKey="groups" breadcrumbs={['서울 1반', '그룹']}>
      <PageMain>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>그룹</h1>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              클래스에 속한 스터디 그룹을 관리합니다.
            </span>
          </div>
          <Button
            variant="primary"
            icon={<Plus size={14} strokeWidth={1.75} />}
            onClick={() => setCreateOpen(true)}
            disabled={!hasValidClassId}
          >
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

        {!hasValidClassId ? (
          <EmptyState
            message="소속 클래스가 없습니다"
            description="반 배정 후 다시 로그인하면 그룹을 볼 수 있습니다."
          />
        ) : (
          <QueryAsyncBoundary
            key={rowKey}
            suspenseFallback={<GridSkeleton />}
            errorFallback={
              <RowErrorFallback
                onRetry={() => setRowKey((k) => k + 1)}
                title="이 영역을 불러오지 못했습니다"
                description="이 행만 실패했습니다. 나머지 영역은 정상적으로 표시됩니다."
              />
            }
          >
            <GroupGrid
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
          title="그룹 만들기"
          description="이름과 설명을 입력하면 그룹이 생성됩니다. 활동 기간은 생성일부터 30일입니다."
          primaryLabel={createGroup.isPending ? '생성 중…' : '생성하기'}
          secondaryLabel="취소"
          onPrimary={onCreate}
          onSecondary={() => setCreateOpen(false)}
          onClose={() => setCreateOpen(false)}
          width={480}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>그룹 이름</span>
              <Input
                placeholder="그룹 E"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                width="100%"
              />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>설명</span>
              <Input
                placeholder="Hooks 심화 스터디"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                width="100%"
              />
            </label>
          </div>
        </Modal>
      </PageMain>
    </ManagerShell>
  );
}
