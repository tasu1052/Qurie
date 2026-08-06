import { useQuery } from '@tanstack/react-query';
import { useMemo, useState, type CSSProperties } from 'react';
import { Calendar, Copy, Plus, Search, Shuffle, Trash2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { ManagerShell, PageMain } from '../../components/layout/ManagerShell';
import { ConfirmDeleteOverlay } from '../../components/overlays/ConfirmDeleteOverlay';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import {
  AlertBanner,
  Badge,
  Button,
  EmptyState,
  Input,
  Modal,
  RowErrorFallback,
  RowSection,
  Skeleton,
} from '../../ds';
import {
  humanizeApiError,
  QueryAsyncBoundary,
  useCreateGroup,
  useDeleteGroup,
  useDuplicateGroup,
  useEditGroup,
  useGetClassMembers,
  useGetGroupDetail,
  useGetGroups,
  useMe,
  useShuffleGroups,
  type GroupDetailResponse,
  type GroupResponse,
} from '../../data';
import { queryKeys } from '../../network/core/queryKeys';
import { getGroupCandidates } from '../../network/group/group-apis';

function pad2(n: number) {
  return String(n).padStart(2, '0');
}

/** Spring LocalDateTime용 로컬 시각 문자열 (UTC ISO 아님) */
function toLocalDateTime(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
}

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

function defaultPeriod() {
  const startedAt = new Date();
  const endedAt = new Date(startedAt);
  endedAt.setDate(endedAt.getDate() + 30);
  return { startedAt: toLocalDateTime(startedAt), endedAt: toLocalDateTime(endedAt) };
}

function toDateInputValue(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function dateInputToLocalStart(dateStr: string): string {
  return `${dateStr}T00:00:00`;
}

function dateInputToLocalEnd(dateStr: string): string {
  return `${dateStr}T23:59:59`;
}

function defaultDateInputs() {
  const period = defaultPeriod();
  return {
    startDate: toDateInputValue(period.startedAt),
    endDate: toDateInputValue(period.endedAt),
  };
}

function dateFieldStyle(): CSSProperties {
  return {
    width: '100%',
    height: 40,
    borderRadius: 10,
    border: '1px solid var(--border-strong)',
    background: 'var(--surface-card)',
    color: 'var(--ink)',
    padding: '0 12px',
    fontFamily: 'var(--font-sans)',
    fontSize: 13,
    boxSizing: 'border-box',
  };
}

function groupLetter(index: number): string {
  if (index < 26) return String.fromCharCode(65 + index);
  return String(index + 1);
}

function buildShuffleName(titlePrefix: string, index: number): string {
  const base = titlePrefix.trim() || '그룹';
  return `${base} ${groupLetter(index)}`;
}

function ShuffleModal({
  open,
  classId,
  onClose,
  onDone,
}: {
  open: boolean;
  classId: number;
  onClose: () => void;
  onDone: () => void;
}) {
  const { data: groups } = useGetGroups(classId);
  const { data: membersPage } = useGetClassMembers(classId, { size: 200 });
  const studentCount = useMemo(
    () => membersPage.data.filter((m) => m.role === 'STUDENT').length,
    [membersPage.data],
  );
  const shuffleGroups = useShuffleGroups();
  const deleteGroup = useDeleteGroup();
  const editGroup = useEditGroup();
  const [shuffleCount, setShuffleCount] = useState('4');
  const [titlePrefix, setTitlePrefix] = useState('그룹');
  const [batchDescription, setBatchDescription] = useState('');
  const shuffleDefaults = defaultDateInputs();
  const [shuffleStartDate, setShuffleStartDate] = useState(shuffleDefaults.startDate);
  const [shuffleEndDate, setShuffleEndDate] = useState(shuffleDefaults.endDate);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasExisting = groups.length > 0;
  // 백엔드: 기존 배정이 있으면 confirmed=true 필요. 그룹이 있으면 배정이 있을 수 있어 경고 후 확정한다.
  const count = Number(shuffleCount);
  const previewCount = Number.isFinite(count) && count > 0 ? Math.min(count, 5) : 0;
  const namePreview =
    previewCount > 0
      ? Array.from({ length: previewCount }, (_, i) => buildShuffleName(titlePrefix, i)).join(', ') +
        (count > 5 ? '…' : '')
      : '';

  const onShuffle = async () => {
    if (!Number.isFinite(count) || count < 1) return;
    if (count > studentCount) {
      setError(
        `그룹 수(${count})가 학생 수(${studentCount})보다 많습니다. 그룹 수를 줄이거나 학생을 추가해 주세요.`,
      );
      return;
    }
    if (!shuffleStartDate || !shuffleEndDate) {
      setError('시작일과 종료일을 선택하세요.');
      return;
    }
    if (shuffleStartDate > shuffleEndDate) {
      setError('종료일은 시작일 이후여야 합니다.');
      return;
    }
    const period = {
      startedAt: dateInputToLocalStart(shuffleStartDate),
      endedAt: dateInputToLocalEnd(shuffleEndDate),
    };
    const existingIds = groups.map((g) => g.id);
    const description =
      batchDescription.trim() || '랜덤 배정으로 생성된 그룹';

    setBusy(true);
    setError(null);
    try {
      const created: GroupDetailResponse[] = await shuffleGroups.mutateAsync({
        classId,
        groupCount: count,
        assignLeader: true,
        confirmed: hasExisting,
        ...period,
      });

      // 백엔드는 기존 배정만 비우고 빈 그룹은 남김 → 화면에서 정리
      const createdIds = new Set(created.map((g) => g.id));
      const obsolete = existingIds.filter((id) => !createdIds.has(id));
      await Promise.all(
        obsolete.map((groupId) => deleteGroup.mutateAsync({ groupId, classId })),
      );

      await Promise.all(
        created.map((g, index) =>
          editGroup.mutateAsync({
            groupId: g.id,
            name: buildShuffleName(titlePrefix, index),
            description,
          }),
        ),
      );

      onClose();
      onDone();
    } catch (err) {
      setError(humanizeApiError(err, '셔플에 실패했습니다. 잠시 후 다시 시도해 주세요.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      title="그룹 셔플"
      description="지정한 수만큼 새 그룹을 만들고 학생을 균등 재배정합니다. 기존 빈 그룹은 정리됩니다."
      primaryLabel={busy ? '재배정 중…' : '재배정'}
      secondaryLabel="취소"
      onPrimary={() => {
        void onShuffle();
      }}
      onSecondary={onClose}
      onClose={onClose}
      width={520}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {hasExisting ? (
          <AlertBanner
            tone="warning"
            title="기존 배정이 덮어써집니다"
            description={`현재 ${groups.length}개 그룹의 구성원 배정이 해제되고, 새 그룹으로 재배정됩니다. 빈 옛 그룹은 삭제됩니다.`}
          />
        ) : null}

        {error ? (
          <AlertBanner tone="error" title="재배정 실패" description={error} />
        ) : null}

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

        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>제목 접두어</span>
          <Input
            placeholder="그룹"
            value={titlePrefix}
            onChange={(e) => setTitlePrefix(e.target.value)}
            width="100%"
          />
          {namePreview ? (
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              생성 예시: {namePreview}
            </span>
          ) : null}
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>
            공통 설명 (모든 그룹에 적용)
          </span>
          <Input
            placeholder="랜덤 배정으로 생성된 그룹"
            value={batchDescription}
            onChange={(e) => setBatchDescription(e.target.value)}
            width="100%"
          />
        </label>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>시작일</span>
            <input
              type="date"
              value={shuffleStartDate}
              onChange={(e) => setShuffleStartDate(e.target.value)}
              style={dateFieldStyle()}
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>종료일</span>
            <input
              type="date"
              value={shuffleEndDate}
              onChange={(e) => setShuffleEndDate(e.target.value)}
              style={dateFieldStyle()}
            />
          </label>
        </div>
      </div>
    </Modal>
  );
}

function GroupCard({
  group,
  onChanged,
}: {
  group: GroupResponse;
  onChanged: () => void;
}) {
  const { data: detail } = useGetGroupDetail(group.id);
  const duplicate = useDuplicateGroup();
  const deleteGroup = useDeleteGroup();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const leader = detail.members.find((m) => m.role === 'LEADER');

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
        minHeight: 260,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--ink)', margin: 0 }}>{detail.name}</h3>
        <button
          type="button"
          title="그룹 삭제"
          aria-label="그룹 삭제"
          disabled={deleteGroup.isPending}
          onClick={() => setDeleteOpen(true)}
          style={{
            marginLeft: 'auto',
            border: '1px solid var(--border-strong)',
            background: 'var(--surface-card)',
            color: 'var(--status-error)',
            borderRadius: 999,
            padding: '6px 10px',
            cursor: deleteGroup.isPending ? 'wait' : 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontFamily: 'var(--font-sans)',
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          {deleteOpen ? <Trash2 size={13} strokeWidth={1.75} /> : null}
          그룹 삭제
        </button>
      </div>
      <p style={{ margin: 0, fontSize: 13, lineHeight: 1.55, color: 'var(--text-secondary)', minHeight: 40 }}>
        {detail.description || '설명이 없습니다.'}
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', minHeight: 28 }}>
        {leader ? (
          <Badge status="accent">리더 {leader.name}</Badge>
        ) : (
          <span style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>리더 미지정</span>
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
          marginTop: 'auto',
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
              },
              {
                onSuccess: () => {
                  onChanged();
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

      <ConfirmDeleteOverlay
        open={deleteOpen}
        title="그룹 삭제"
        description="이 작업은 되돌릴 수 없습니다."
        confirmText={detail.name}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => {
          deleteGroup.mutate(
            { groupId: detail.id, classId: detail.classId },
            { onSuccess: onChanged },
          );
        }}
        confirmLabel="삭제"
      />
    </div>
  );
}

function GroupGrid({
  classId,
  statusFilter,
  query,
  onOpenCreate,
  onRefresh,
}: {
  classId: number;
  statusFilter: string;
  query: string;
  onOpenCreate: () => void;
  onRefresh: () => void;
}) {
  const { data: groups } = useGetGroups(classId);
  const debouncedQuery = useDebouncedValue(query, 300);

  const filtered = useMemo(
    () =>
      groups.filter((g) => {
        const status = groupStatus(g.endedAt);
        if (debouncedQuery && !g.name.toLowerCase().includes(debouncedQuery.toLowerCase())) return false;
        if (statusFilter === '전체') return true;
        if (statusFilter === '활동') return status === '활동 중';
        return status === '종료';
      }),
    [groups, debouncedQuery, statusFilter],
  );

  return (
    <RowSection style={{ gap: 24 }}>
      {filtered.length === 0 ? (
        <EmptyState
          message="그룹이 없습니다"
          description={
            statusFilter === '종료'
              ? '종료된 그룹이 없습니다.'
              : '그룹 만들기로 새 그룹을 추가하세요.'
          }
          actionLabel={statusFilter === '종료' ? undefined : '그룹 만들기'}
          onAction={statusFilter === '종료' ? undefined : onOpenCreate}
        />
      ) : (
        <div className="qurie-card-grid">
          {filtered.map((g) => (
            <GroupCard key={g.id} group={g} onChanged={onRefresh} />
          ))}
        </div>
      )}
    </RowSection>
  );
}

export default function GroupListPage() {
  const navigate = useNavigate();
  const { data: me } = useMe();
  const classId = me.classId;
  const hasValidClassId = typeof classId === 'number' && Number.isFinite(classId) && classId > 0;
  const createGroup = useCreateGroup();
  const editGroup = useEditGroup();
  const [status, setStatus] = useState('전체');
  const [query, setQuery] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [shuffleOpen, setShuffleOpen] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const defaults = defaultDateInputs();
  const [startDate, setStartDate] = useState(defaults.startDate);
  const [endDate, setEndDate] = useState(defaults.endDate);
  const [selectedMemberIds, setSelectedMemberIds] = useState<number[]>([]);
  const [rowKey, setRowKey] = useState(0);
  const [createError, setCreateError] = useState<string | null>(null);

  const candidatesQuery = useQuery({
    queryKey: hasValidClassId ? queryKeys.groups.candidates(classId) : ['groups', 'candidates', 'idle'],
    queryFn: () => getGroupCandidates(classId as number),
    enabled: createOpen && hasValidClassId,
  });
  const candidates = candidatesQuery.data ?? [];

  const refresh = () => setRowKey((k) => k + 1);

  const resetCreateForm = () => {
    setGroupName('');
    setDescription('');
    const next = defaultDateInputs();
    setStartDate(next.startDate);
    setEndDate(next.endDate);
    setSelectedMemberIds([]);
    setCreateError(null);
  };

  const toggleMember = (userId: number) => {
    setSelectedMemberIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId],
    );
  };

  const onCreate = () => {
    if (!hasValidClassId) return;
    if (!groupName.trim()) {
      setCreateError('그룹 이름을 입력하세요.');
      return;
    }
    if (!description.trim()) {
      setCreateError('그룹 설명을 입력하세요.');
      return;
    }
    if (!startDate || !endDate) {
      setCreateError('시작일과 종료일을 선택하세요.');
      return;
    }
    if (startDate > endDate) {
      setCreateError('종료일은 시작일 이후여야 합니다.');
      return;
    }
    setCreateError(null);
    void (async () => {
      try {
        const created = await createGroup.mutateAsync({
          classId,
          name: groupName.trim(),
          description: description.trim(),
          startedAt: dateInputToLocalStart(startDate),
          endedAt: dateInputToLocalEnd(endDate),
        });
        if (selectedMemberIds.length > 0) {
          await editGroup.mutateAsync({
            groupId: created.id,
            memberIds: selectedMemberIds,
            leaderId: selectedMemberIds[0],
          });
        }
        setCreateOpen(false);
        resetCreateForm();
        refresh();
      } catch (err) {
        setCreateError(humanizeApiError(err, '그룹 생성에 실패했습니다.'));
      }
    })();
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
              onClick={() => {
                resetCreateForm();
                setCreateOpen(true);
              }}
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
              onOpenCreate={() => {
                resetCreateForm();
                setCreateOpen(true);
              }}
              onRefresh={refresh}
            />
          </QueryAsyncBoundary>
        )}

        <Modal
          open={createOpen}
          title="그룹 만들기"
          description="이름·기간을 입력하고 배정할 학생을 선택하세요. 첫 번째 선택 학생이 리더로 지정됩니다."
          primaryLabel={createGroup.isPending || editGroup.isPending ? '생성 중…' : '생성하기'}
          secondaryLabel="취소"
          onPrimary={onCreate}
          onSecondary={() => {
            setCreateOpen(false);
            resetCreateForm();
          }}
          onClose={() => {
            setCreateOpen(false);
            resetCreateForm();
          }}
          width={480}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {createError ? (
              <AlertBanner tone="error" title="생성 실패" description={createError} />
            ) : null}
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
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>시작일</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  style={dateFieldStyle()}
                />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>종료일</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  style={dateFieldStyle()}
                />
              </label>
            </div>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>
                멤버 배정 ({selectedMemberIds.length}명 선택)
              </span>
              <div
                style={{
                  maxHeight: 180,
                  overflowY: 'auto',
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  padding: 8,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                  background: 'var(--surface-sunken)',
                }}
              >
                {candidatesQuery.isLoading ? (
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', padding: 8 }}>불러오는 중…</span>
                ) : candidates.length === 0 ? (
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', padding: 8 }}>
                    배정 가능한 학생이 없습니다.
                  </span>
                ) : (
                  candidates.map((c) => (
                    <label
                      key={c.userId}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '6px 8px',
                        borderRadius: 8,
                        fontSize: 13,
                        cursor: 'pointer',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedMemberIds.includes(c.userId)}
                        onChange={() => toggleMember(c.userId)}
                        onMouseDown={(e) => e.preventDefault()}
                      />
                      <span style={{ fontWeight: 600, color: 'var(--ink)' }}>{c.name}</span>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        {c.email}
                      </span>
                    </label>
                  ))
                )}
              </div>
            </label>
          </div>
        </Modal>

        {shuffleOpen && hasValidClassId ? (
          <QueryAsyncBoundary
            suspenseFallback={
              <Modal
                open
                title="그룹 셔플"
                description="불러오는 중…"
                primaryLabel={null}
                secondaryLabel="취소"
                onSecondary={() => setShuffleOpen(false)}
                onClose={() => setShuffleOpen(false)}
                width={520}
              >
                <Skeleton width="100%" height={120} radius={12} />
              </Modal>
            }
            errorFallback={
              <Modal
                open
                title="그룹 셔플"
                description="기존 그룹 정보를 불러오지 못했습니다."
                primaryLabel={null}
                secondaryLabel="닫기"
                onSecondary={() => setShuffleOpen(false)}
                onClose={() => setShuffleOpen(false)}
                width={520}
              />
            }
          >
            <ShuffleModal
              open={shuffleOpen}
              classId={classId}
              onClose={() => setShuffleOpen(false)}
              onDone={refresh}
            />
          </QueryAsyncBoundary>
        ) : null}
      </PageMain>
    </ManagerShell>
  );
}
