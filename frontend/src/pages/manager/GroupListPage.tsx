import { useMemo, useState } from 'react';
import { Calendar, Copy, Plus, Search, Shuffle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
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
  useDuplicateGroup,
  useGetGroupDetail,
  useGetGroups,
  useMe,
  useShuffleGroups,
  type GroupResponse,
} from '../../data';

function GridSkeleton() {
  return (
    <div className="qurie-card-grid">
      {[0, 1, 2].map((i) => (
        <Skeleton key={i} width="100%" height={220} radius={16} delay={i * 0.08} />
      ))}
    </div>
  );
}

function groupStatus(endedAt: string): '활동 중' | '종료' {
  return new Date(endedAt).getTime() > Date.now() ? '활동 중' : '종료';
}

function formatPeriod(startedAt: string, endedAt: string): string {
  const start = new Date(startedAt);
  const end = new Date(endedAt);
  const fmt = (d: Date) =>
    `${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
  return `${fmt(start)} – ${fmt(end)}`;
}

function toLocalDateTime(d: Date): string {
  return d.toISOString().slice(0, 19);
}

function defaultPeriod() {
  const startedAt = new Date();
  const endedAt = new Date(startedAt);
  endedAt.setDate(endedAt.getDate() + 30);
  return { startedAt: toLocalDateTime(startedAt), endedAt: toLocalDateTime(endedAt) };
}

function avatarChar(name: string) {
  return name.trim().slice(0, 1) || '?';
}

function GroupCard({
  group,
  onDuplicated,
}: {
  group: GroupResponse;
  onDuplicated: () => void;
}) {
  const navigate = useNavigate();
  const { data: detail } = useGetGroupDetail(group.id);
  const duplicate = useDuplicateGroup();
  const status = groupStatus(detail.endedAt);
  const leader = detail.members.find((m) => m.role === 'LEADER');
  const shown = detail.members.slice(0, 4);
  const extra = Math.max(0, detail.memberCount - shown.length);

  return (
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
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--ink)', margin: 0 }}>{detail.name}</h3>
        <span style={{ marginLeft: 'auto' }}>
          <Badge status={status === '활동 중' ? 'success' : 'neutral'}>{status}</Badge>
        </span>
      </div>
      <p style={{ margin: 0, fontSize: 13, lineHeight: 1.55, color: 'var(--text-secondary)' }}>
        {detail.description || '설명이 없습니다.'}
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex' }}>
          {shown.map((m, i) => (
            <span
              key={m.userId}
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: 'var(--surface-sunken)',
                border: '2px solid var(--surface-card)',
                color: 'var(--text-secondary)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 11,
                fontWeight: 700,
                marginLeft: i === 0 ? 0 : -8,
              }}
            >
              {avatarChar(m.name)}
            </span>
          ))}
          {extra > 0 && (
            <span
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: 'var(--surface-sunken)',
                border: '2px solid var(--surface-card)',
                color: 'var(--text-muted)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 11,
                fontWeight: 600,
                marginLeft: shown.length ? -8 : 0,
              }}
            >
              +{extra}
            </span>
          )}
        </div>
        {leader && (
          <Badge status="accent">LEADER {leader.name}</Badge>
        )}
      </div>
      <div style={{ display: 'flex', gap: 14, fontSize: 12.5, color: 'var(--text-secondary)' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
          <Calendar size={13} strokeWidth={1.75} />
          {formatPeriod(detail.startedAt, detail.endedAt)}
        </span>
        <span>멤버 {detail.memberCount}</span>
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderTop: '1px solid var(--divider)',
          paddingTop: 12,
        }}
      >
        <Link
          to={`/manager/groups/${detail.id}`}
          style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', textDecoration: 'none' }}
        >
          그룹 열기 <span style={{ fontWeight: 800 }}>&gt;</span>
        </Link>
        <button
          type="button"
          title="복제"
          aria-label="그룹 복제"
          disabled={duplicate.isPending}
          onClick={() =>
            duplicate.mutate(
              {
                groupId: detail.id,
                classId: detail.classId,
                name: `${detail.name} 사본`,
                includeMembers: true,
              },
              {
                onSuccess: (created) => {
                  onDuplicated();
                  navigate(`/manager/groups/${created.id}`);
                },
              },
            )
          }
          style={{
            border: 'none',
            background: 'transparent',
            color: 'var(--text-muted)',
            cursor: duplicate.isPending ? 'wait' : 'pointer',
            display: 'inline-flex',
            padding: 4,
          }}
        >
          <Copy size={15} strokeWidth={1.75} />
        </button>
      </div>
    </div>
  );
}

function GroupGrid({
  classId,
  statusFilter,
  query,
  page,
  onPage,
  onBlankCreate,
  onRefresh,
}: {
  classId: number;
  statusFilter: string;
  query: string;
  page: number;
  onPage: (p: number) => void;
  onBlankCreate: () => void;
  onRefresh: () => void;
}) {
  const { data: groups } = useGetGroups(classId);

  const filtered = useMemo(
    () =>
      groups.filter((g) => {
        const status = groupStatus(g.endedAt);
        if (query && !g.name.toLowerCase().includes(query.toLowerCase())) return false;
        if (statusFilter === '전체') return true;
        if (statusFilter === '활동') return status === '활동 중';
        return status === '종료';
      }),
    [groups, query, statusFilter],
  );

  return (
    <RowSection style={{ gap: 24 }}>
      {filtered.length === 0 ? (
        <EmptyState
          message="그룹이 없습니다"
          description="그룹 만들기로 추가하거나, 아래 빈 카드로 바로 시작할 수 있습니다."
          actionLabel="새 그룹 만들기"
          onAction={onBlankCreate}
        />
      ) : null}
      <div className="qurie-card-grid">
        {filtered.map((g) => (
          <GroupCard key={g.id} group={g} onDuplicated={onRefresh} />
        ))}
        <button
          type="button"
          onClick={onBlankCreate}
          style={{
            border: '1.5px dashed var(--grey-100)',
            borderRadius: 16,
            minHeight: 220,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            cursor: 'pointer',
            background: 'transparent',
            fontFamily: 'var(--font-sans)',
            color: 'var(--text-muted)',
            padding: 24,
          }}
        >
          <span
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: 'var(--surface-sunken)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Plus size={18} strokeWidth={1.75} />
          </span>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
            새 그룹 만들기
          </span>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            이름 · 구성원 · 기간을 설정하세요
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
  const navigate = useNavigate();
  const { data: me } = useMe();
  const classId = me.classId;
  const hasValidClassId = typeof classId === 'number' && Number.isFinite(classId) && classId > 0;
  const createGroup = useCreateGroup();
  const shuffleGroups = useShuffleGroups();
  const [status, setStatus] = useState('전체');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [shuffleOpen, setShuffleOpen] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [shuffleCount, setShuffleCount] = useState('4');
  const [rowKey, setRowKey] = useState(0);

  const refresh = () => setRowKey((k) => k + 1);

  const onCreate = () => {
    if (!hasValidClassId) return;
    if (!groupName.trim() || !description.trim()) return;
    const period = defaultPeriod();
    createGroup.mutate(
      {
        classId,
        name: groupName.trim(),
        description: description.trim(),
        ...period,
      },
      {
        onSuccess: () => {
          setCreateOpen(false);
          setGroupName('');
          setDescription('');
          refresh();
        },
      },
    );
  };

  const onBlankCreate = () => {
    if (!hasValidClassId || createGroup.isPending) return;
    const period = defaultPeriod();
    createGroup.mutate(
      {
        classId,
        name: '새 그룹',
        description: '설명을 입력하세요',
        ...period,
      },
      {
        onSuccess: (created) => navigate(`/manager/groups/${created.id}`),
      },
    );
  };

  const onShuffle = () => {
    if (!hasValidClassId) return;
    const count = Number(shuffleCount);
    if (!Number.isFinite(count) || count < 1) return;
    const period = defaultPeriod();
    shuffleGroups.mutate(
      {
        classId,
        groupCount: count,
        assignLeader: true,
        confirmed: true,
        ...period,
      },
      {
        onSuccess: () => {
          setShuffleOpen(false);
          refresh();
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
              학생을 소그룹으로 묶어 세션과 리뷰를 함께 진행합니다.
            </span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button
              variant="secondary"
              icon={<Shuffle size={14} strokeWidth={1.75} />}
              onClick={() => setShuffleOpen(true)}
              disabled={!hasValidClassId}
            >
              그룹 셔플
            </Button>
            <Button
              variant="accent"
              icon={<Plus size={14} strokeWidth={1.75} />}
              onClick={() => setCreateOpen(true)}
              disabled={!hasValidClassId}
            >
              그룹 만들기
            </Button>
          </div>
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
                {c === '활동' ? '활동 중' : c}
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
            actionLabel="대시보드"
            onAction={() => navigate('/manager')}
          />
        ) : (
          <QueryAsyncBoundary
            key={rowKey}
            suspenseFallback={<GridSkeleton />}
            errorFallback={
              <RowErrorFallback
                onRetry={refresh}
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
              onBlankCreate={onBlankCreate}
              onRefresh={refresh}
            />
          </QueryAsyncBoundary>
        )}

        <Modal
          open={createOpen}
          title="그룹 만들기"
          description="이름과 설명을 입력하면 빈 멤버로 그룹이 생성됩니다. 멤버는 상세에서 배정하세요."
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
                placeholder="A조 — 결제 모듈"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                width="100%"
              />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>설명</span>
              <Input
                placeholder="결제 도메인 리팩터링을 함께 리뷰하는 그룹입니다."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                width="100%"
              />
            </label>
          </div>
        </Modal>

        <Modal
          open={shuffleOpen}
          title="그룹 셔플"
          description="현재 그룹 구성이 초기화되고 전체 인원이 균등 재배정됩니다. 기존 그룹은 모두 대체됩니다."
          primaryLabel={shuffleGroups.isPending ? '재배정 중…' : '재배정'}
          secondaryLabel="취소"
          onPrimary={onShuffle}
          onSecondary={() => setShuffleOpen(false)}
          onClose={() => setShuffleOpen(false)}
          width={480}
        >
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>그룹 수</span>
            <Input
              type="number"
              placeholder="4"
              value={shuffleCount}
              onChange={(e) => setShuffleCount(e.target.value)}
              width="100%"
            />
          </label>
        </Modal>
      </PageMain>
    </ManagerShell>
  );
}
