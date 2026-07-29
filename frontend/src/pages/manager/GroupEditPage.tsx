import { useMemo, useState, type CSSProperties } from 'react';
import { GripVertical, Trash2, X } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { ManagerShell, PageMain } from '../../components/layout/ManagerShell';
import { ConfirmDeleteOverlay } from '../../components/overlays/ConfirmDeleteOverlay';
import {
  Badge,
  Button,
  EmptyState,
  Input,
  RowErrorFallback,
  RowSection,
  Skeleton,
  Spinner,
} from '../../ds';
import {
  QueryAsyncBoundary,
  useDeleteGroup,
  useEditGroup,
  useGetGroupCandidates,
  useGetGroupDetail,
  useMe,
  type GroupDetailResponse,
  type GroupMemberCandidateResponse,
} from '../../data';

type DraftMember = {
  userId: number;
  name: string;
  email: string;
  role: 'LEADER' | 'PARTICIPANT';
};

function avatarChar(name: string) {
  return name.trim().slice(0, 1) || '?';
}

function EditSkeleton() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
      <Skeleton width="100%" height={420} radius={16} />
      <Skeleton width="100%" height={420} radius={16} delay={0.08} />
    </div>
  );
}

function GroupEditForm({
  groupId,
  classId,
  detail,
  candidates,
}: {
  groupId: number;
  classId: number;
  detail: GroupDetailResponse;
  candidates: GroupMemberCandidateResponse[];
}) {
  const navigate = useNavigate();
  const editGroup = useEditGroup();
  const deleteGroup = useDeleteGroup();

  const [name, setName] = useState(detail.name);
  const [description, setDescription] = useState(detail.description);
  const [members, setMembers] = useState<DraftMember[]>(
    detail.members.map((m) => ({
      userId: m.userId,
      name: m.name,
      email: m.email,
      role: m.role,
    })),
  );
  const [selected, setSelected] = useState<number[]>([]);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const leaderId = members.find((m) => m.role === 'LEADER')?.userId ?? null;
  const memberIds = members.map((m) => m.userId);

  const dirty = useMemo(() => {
    const origIds = detail.members.map((m) => m.userId).sort((a, b) => a - b);
    const nextIds = [...memberIds].sort((a, b) => a - b);
    const origLeader = detail.members.find((m) => m.role === 'LEADER')?.userId ?? null;
    return (
      name !== detail.name ||
      description !== detail.description ||
      origLeader !== leaderId ||
      origIds.length !== nextIds.length ||
      origIds.some((id, i) => id !== nextIds[i])
    );
  }, [detail, name, description, memberIds, leaderId]);

  const addMembers = (ids: number[]) => {
    const byId = new Map(candidates.map((c) => [c.userId, c]));
    setMembers((prev) => {
      const existing = new Set(prev.map((m) => m.userId));
      const next = [...prev];
      for (const id of ids) {
        if (existing.has(id)) continue;
        const c = byId.get(id);
        if (!c) continue;
        next.push({
          userId: c.userId,
          name: c.name,
          email: c.email,
          role: 'PARTICIPANT',
        });
      }
      return next;
    });
    setSelected([]);
  };

  const removeMember = (userId: number) => {
    setMembers((prev) => prev.filter((m) => m.userId !== userId));
  };

  const setLeader = (userId: number) => {
    setMembers((prev) =>
      prev.map((m) => ({
        ...m,
        role: m.userId === userId ? 'LEADER' : 'PARTICIPANT',
      })),
    );
  };

  const onSave = () => {
    editGroup.mutate({
      groupId,
      name: name.trim(),
      description: description.trim(),
      memberIds,
      leaderId: leaderId ?? undefined,
    });
  };

  const onDelete = () => {
    deleteGroup.mutate(
      { groupId, classId },
      {
        onSuccess: () => navigate('/manager/groups', { replace: true }),
      },
    );
  };

  const toggleSelect = (userId: number) => {
    setSelected((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId],
    );
  };

  const panelStyle: CSSProperties = {
    background: 'var(--surface-card)',
    border: '1px solid var(--border)',
    borderRadius: 16,
    boxShadow: 'var(--shadow-card)',
    padding: 24,
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    minHeight: 480,
  };

  return (
    <>
      <ManagerShell activeKey="groups" breadcrumbs={['그룹 관리', detail.name]}>
        <PageMain>
          <RowSection style={{ gap: 24 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
              }}
            >
              <div>
                <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>{name || detail.name}</h1>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  구성원을 추가·제거하고 리더를 지정한 뒤 저장하세요.
                </span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <Button
                  variant="secondary"
                  icon={<Trash2 size={14} strokeWidth={1.75} />}
                  onClick={() => setDeleteOpen(true)}
                >
                  삭제
                </Button>
                <Button
                  variant="accent"
                  disabled={!dirty || editGroup.isPending || !name.trim() || !description.trim()}
                  onClick={onSave}
                >
                  {editGroup.isPending ? '저장 중…' : '저장'}
                </Button>
              </div>
            </div>

            {editGroup.isPending ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)', fontSize: 13 }}>
                <Spinner size="sm" />
                변경사항을 저장하는 중…
              </div>
            ) : null}

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
                gap: 24,
              }}
            >
              <div
                style={{
                  ...panelStyle,
                  outline: dragOver ? '2px solid var(--accent)' : undefined,
                  outlineOffset: 2,
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  const raw = e.dataTransfer.getData('application/x-qurie-user-id');
                  const id = Number(raw);
                  if (Number.isFinite(id) && id > 0) addMembers([id]);
                }}
              >
                <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: 'var(--text-muted)',
                      letterSpacing: '0.04em',
                    }}
                  >
                    그룹 이름
                  </span>
                  <Input value={name} onChange={(e) => setName(e.target.value)} width="100%" />
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: 'var(--text-muted)',
                      letterSpacing: '0.04em',
                    }}
                  >
                    설명
                  </span>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    style={{
                      width: '100%',
                      resize: 'vertical',
                      border: '1px solid var(--border-strong)',
                      borderRadius: 12,
                      padding: '10px 14px',
                      fontFamily: 'var(--font-sans)',
                      fontSize: 14,
                      color: 'var(--ink)',
                      background: 'var(--surface-card)',
                      boxSizing: 'border-box',
                    }}
                  />
                </label>

                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>
                  멤버 {members.length}
                </span>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1, overflow: 'auto' }}>
                  {members.length === 0 ? (
                    <EmptyState
                      message="멤버가 없습니다"
                      description="오른쪽에서 학생을 추가하세요."
                      actionLabel="목록으로"
                      onAction={() => navigate('/manager/groups')}
                    />
                  ) : (
                    members.map((m) => (
                      <div
                        key={m.userId}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          padding: '10px 12px',
                          border: '1px solid var(--divider)',
                          borderRadius: 12,
                          background: 'var(--surface-card)',
                        }}
                      >
                        <span
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
                          {avatarChar(m.name)}
                        </span>
                        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
                          <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink)' }}>
                            {m.name}
                          </span>
                          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{m.email}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setLeader(m.userId)}
                          style={{
                            border: `1px solid ${m.role === 'LEADER' ? 'var(--accent)' : 'var(--border-strong)'}`,
                            background: m.role === 'LEADER' ? 'var(--accent-softer)' : 'transparent',
                            color: m.role === 'LEADER' ? 'var(--accent)' : 'var(--text-secondary)',
                            borderRadius: 999,
                            padding: '4px 10px',
                            fontSize: 11,
                            fontWeight: 600,
                            cursor: 'pointer',
                            fontFamily: 'var(--font-sans)',
                          }}
                        >
                          LEADER
                        </button>
                        <button
                          type="button"
                          aria-label={`${m.name} 제거`}
                          onClick={() => removeMember(m.userId)}
                          style={{
                            border: 'none',
                            background: 'transparent',
                            color: 'var(--text-muted)',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            padding: 4,
                          }}
                        >
                          <X size={14} strokeWidth={1.75} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div style={panelStyle}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 8,
                  }}
                >
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>
                    클래스 학생
                  </span>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={selected.length === 0}
                    onClick={() => addMembers(selected)}
                  >
                    선택 항목 추가{selected.length ? ` (${selected.length})` : ''}
                  </Button>
                </div>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                    overflow: 'auto',
                    maxHeight: 520,
                  }}
                >
                  {candidates.map((c: GroupMemberCandidateResponse) => {
                    const inThis = memberIds.includes(c.userId);
                    const otherGroup =
                      c.currentGroupId != null && c.currentGroupId !== groupId
                        ? c.currentGroupName
                        : null;
                    const disabled = inThis;
                    return (
                      <div
                        key={c.userId}
                        draggable={!disabled}
                        onDragStart={(e) => {
                          if (disabled) {
                            e.preventDefault();
                            return;
                          }
                          e.dataTransfer.setData('application/x-qurie-user-id', String(c.userId));
                          e.dataTransfer.effectAllowed = 'copy';
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          padding: '10px 12px',
                          borderRadius: 12,
                          border: '1px solid var(--divider)',
                          opacity: disabled ? 0.45 : 1,
                          background: disabled ? 'var(--surface-sunken)' : 'var(--surface-card)',
                          cursor: disabled ? 'not-allowed' : 'grab',
                        }}
                      >
                        <input
                          type="checkbox"
                          disabled={disabled}
                          checked={selected.includes(c.userId)}
                          onChange={() => toggleSelect(c.userId)}
                          aria-label={`${c.name} 선택`}
                        />
                        <GripVertical size={14} strokeWidth={1.75} color="var(--text-muted)" />
                        <span
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: '50%',
                            background: 'var(--surface-sunken)',
                            color: 'var(--text-secondary)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 11,
                            fontWeight: 700,
                          }}
                        >
                          {avatarChar(c.name)}
                        </span>
                        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
                          <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink)' }}>
                            {c.name}
                          </span>
                          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{c.email}</span>
                        </div>
                        {inThis ? (
                          <Badge status="neutral">이 그룹</Badge>
                        ) : otherGroup ? (
                          <Badge status="neutral">{otherGroup}</Badge>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </RowSection>
        </PageMain>
      </ManagerShell>

      <ConfirmDeleteOverlay
        open={deleteOpen}
        title="그룹 삭제"
        description="그룹을 삭제하면 구성원 배정이 해제됩니다. 이 작업은 되돌릴 수 없습니다."
        confirmText={detail.name}
        childCounts={[`멤버 ${detail.memberCount}명`]}
        onClose={() => setDeleteOpen(false)}
        onConfirm={onDelete}
        confirmLabel="삭제"
      />
    </>
  );
}

function GroupEditBody({
  groupId,
  classId,
}: {
  groupId: number;
  classId: number;
}) {
  const { data: detail } = useGetGroupDetail(groupId);
  const { data: candidates } = useGetGroupCandidates(classId);

  return (
    <GroupEditForm
      key={`${detail.id}-${detail.updatedAt}`}
      groupId={groupId}
      classId={classId}
      detail={detail}
      candidates={candidates}
    />
  );
}

export default function GroupEditPage() {
  const { id } = useParams();
  const groupId = Number(id);
  const navigate = useNavigate();
  const { data: me } = useMe();
  const classId = me.classId;
  const hasValidClassId = typeof classId === 'number' && Number.isFinite(classId) && classId > 0;
  const hasValidGroupId = Number.isFinite(groupId) && groupId > 0;
  const [rowKey, setRowKey] = useState(0);

  if (!hasValidClassId || !hasValidGroupId) {
    return (
      <ManagerShell activeKey="groups" breadcrumbs={['그룹 관리', '그룹']}>
        <PageMain>
          <EmptyState
            message="그룹을 열 수 없습니다"
            description="유효한 클래스와 그룹이 필요합니다."
            actionLabel="그룹 목록"
            onAction={() => navigate('/manager/groups')}
          />
        </PageMain>
      </ManagerShell>
    );
  }

  return (
    <QueryAsyncBoundary
      key={rowKey}
      suspenseFallback={
        <ManagerShell activeKey="groups" breadcrumbs={['그룹 관리', '…']}>
          <PageMain>
            <EditSkeleton />
          </PageMain>
        </ManagerShell>
      }
      errorFallback={
        <ManagerShell activeKey="groups" breadcrumbs={['그룹 관리', '그룹']}>
          <PageMain>
            <RowErrorFallback
              onRetry={() => setRowKey((k) => k + 1)}
              title="그룹을 불러오지 못했습니다"
              description="잠시 후 다시 시도해 주세요."
            />
          </PageMain>
        </ManagerShell>
      }
    >
      <GroupEditBody groupId={groupId} classId={classId} />
    </QueryAsyncBoundary>
  );
}
