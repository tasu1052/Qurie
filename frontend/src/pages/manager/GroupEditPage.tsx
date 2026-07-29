import { isAxiosError } from 'axios';
import { useMemo, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';
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

type DragPayload = {
  userId: number;
  name: string;
  email: string;
  from: 'pool' | 'members';
  width: number;
  height: number;
  offsetX: number;
  offsetY: number;
  x: number;
  y: number;
};

function avatarChar(name: string) {
  return name.trim().slice(0, 1) || '?';
}

function saveErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (typeof message === 'string' && message.trim()) return message;
  }
  return '저장에 실패했습니다. 잠시 후 다시 시도해 주세요.';
}

function EditSkeleton() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
      <Skeleton width="100%" height={420} radius={16} />
      <Skeleton width="100%" height={420} radius={16} delay={0.08} />
    </div>
  );
}

function StudentCardFace({
  name,
  email,
  trailing,
  muted,
}: {
  name: string;
  email: string;
  trailing?: ReactNode;
  muted?: boolean;
}) {
  return (
    <>
      <GripVertical size={14} strokeWidth={1.75} color="var(--text-muted)" />
      <span
        style={{
          width: 28,
          height: 28,
          borderRadius: '50%',
          background: muted ? 'var(--surface-sunken)' : 'var(--accent-soft)',
          color: muted ? 'var(--text-secondary)' : 'var(--accent)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 11,
          fontWeight: 700,
          flex: 'none',
        }}
      >
        {avatarChar(name)}
      </span>
      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
        <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink)' }}>{name}</span>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{email}</span>
      </div>
      {trailing}
    </>
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
  const membersPanelRef = useRef<HTMLDivElement>(null);
  const poolPanelRef = useRef<HTMLDivElement>(null);

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
  const [saveError, setSaveError] = useState<string | null>(null);
  const [drag, setDrag] = useState<DragPayload | null>(null);
  const [dropTarget, setDropTarget] = useState<'members' | 'pool' | null>(null);

  const leaderId = members.find((m) => m.role === 'LEADER')?.userId ?? null;
  const memberIdSet = useMemo(() => new Set(members.map((m) => m.userId)), [members]);

  const studentById = useMemo(() => {
    const map = new Map<number, GroupMemberCandidateResponse>();
    for (const c of candidates) map.set(c.userId, c);
    for (const m of detail.members) {
      if (!map.has(m.userId)) {
        map.set(m.userId, { userId: m.userId, name: m.name, email: m.email });
      }
    }
    return map;
  }, [candidates, detail.members]);

  const poolStudents = useMemo(() => {
    const seen = new Set<number>();
    const next: GroupMemberCandidateResponse[] = [];
    for (const c of candidates) {
      if (memberIdSet.has(c.userId) || seen.has(c.userId)) continue;
      seen.add(c.userId);
      next.push(c);
    }
    for (const m of detail.members) {
      if (memberIdSet.has(m.userId) || seen.has(m.userId)) continue;
      seen.add(m.userId);
      next.push({ userId: m.userId, name: m.name, email: m.email });
    }
    return next;
  }, [candidates, detail.members, memberIdSet]);

  const dirty = useMemo(() => {
    const origIds = detail.members.map((m) => m.userId).sort((a, b) => a - b);
    const nextIds = [...memberIdSet].sort((a, b) => a - b);
    const origLeader = detail.members.find((m) => m.role === 'LEADER')?.userId ?? null;
    return (
      name !== detail.name ||
      description !== detail.description ||
      origLeader !== leaderId ||
      origIds.length !== nextIds.length ||
      origIds.some((id, i) => id !== nextIds[i])
    );
  }, [detail, name, description, memberIdSet, leaderId]);

  const addMembers = (ids: number[]) => {
    setMembers((prev) => {
      const existing = new Set(prev.map((m) => m.userId));
      const next = [...prev];
      for (const id of ids) {
        if (existing.has(id)) continue;
        const c = studentById.get(id);
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
    setSelected((prev) => prev.filter((id) => !ids.includes(id)));
    setSaveError(null);
  };

  const removeMember = (userId: number) => {
    setMembers((prev) => prev.filter((m) => m.userId !== userId));
    setSelected((prev) => prev.filter((id) => id !== userId));
  };

  const setLeader = (userId: number) => {
    setMembers((prev) =>
      prev.map((m) => ({
        ...m,
        role: m.userId === userId ? 'LEADER' : 'PARTICIPANT',
      })),
    );
  };

  const hitTestPanels = (clientX: number, clientY: number): 'members' | 'pool' | null => {
    const membersBox = membersPanelRef.current?.getBoundingClientRect();
    const poolBox = poolPanelRef.current?.getBoundingClientRect();
    if (
      membersBox &&
      clientX >= membersBox.left &&
      clientX <= membersBox.right &&
      clientY >= membersBox.top &&
      clientY <= membersBox.bottom
    ) {
      return 'members';
    }
    if (
      poolBox &&
      clientX >= poolBox.left &&
      clientX <= poolBox.right &&
      clientY >= poolBox.top &&
      clientY <= poolBox.bottom
    ) {
      return 'pool';
    }
    return null;
  };

  const beginDrag = (
    e: ReactPointerEvent<HTMLDivElement>,
    payload: { userId: number; name: string; email: string; from: 'pool' | 'members' },
  ) => {
    // 체크박스/버튼 클릭은 드래그 시작하지 않음
    const target = e.target as HTMLElement;
    if (target.closest('input, button, a, label')) return;

    e.preventDefault();
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    card.setPointerCapture(e.pointerId);
    setDrag({
      ...payload,
      width: rect.width,
      height: rect.height,
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
      x: e.clientX,
      y: e.clientY,
    });
    setDropTarget(hitTestPanels(e.clientX, e.clientY));
  };

  const onDragMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!drag) return;
    setDrag((prev) =>
      prev
        ? {
            ...prev,
            x: e.clientX,
            y: e.clientY,
          }
        : null,
    );
    setDropTarget(hitTestPanels(e.clientX, e.clientY));
  };

  const endDrag = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!drag) return;
    const target = hitTestPanels(e.clientX, e.clientY);
    if (drag.from === 'pool' && target === 'members') {
      addMembers([drag.userId]);
    } else if (drag.from === 'members' && target === 'pool') {
      removeMember(drag.userId);
    }
    setDrag(null);
    setDropTarget(null);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
  };

  const onSave = () => {
    setSaveError(null);
    editGroup.mutate(
      {
        groupId,
        name: name.trim(),
        description: description.trim(),
        memberIds: members.map((m) => m.userId),
        leaderId: leaderId ?? undefined,
      },
      {
        onSuccess: () => setSaveError(null),
        onError: (error) => setSaveError(saveErrorMessage(error)),
      },
    );
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

  const cardBase: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 12px',
    borderRadius: 12,
    border: '1px solid var(--divider)',
    background: 'var(--surface-card-solid)',
    userSelect: 'none',
    touchAction: 'none',
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
                  카드를 드래그해 멤버로 옮기거나 다시 풀로 빼세요. 저장을 눌러야 서버에 반영됩니다.
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
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  color: 'var(--text-secondary)',
                  fontSize: 13,
                }}
              >
                <Spinner size="sm" />
                변경사항을 저장하는 중…
              </div>
            ) : null}

            {saveError ? (
              <div
                role="alert"
                style={{
                  padding: '12px 14px',
                  borderRadius: 12,
                  border: '1px solid var(--status-error-border, #fecaca)',
                  background: 'var(--status-error-soft, #fef2f2)',
                  color: 'var(--status-error)',
                  fontSize: 13,
                  lineHeight: 1.5,
                }}
              >
                {saveError}
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
                ref={membersPanelRef}
                style={{
                  ...panelStyle,
                  outline: dropTarget === 'members' ? '2px solid var(--accent)' : undefined,
                  outlineOffset: 2,
                  transition: 'outline 120ms ease-out',
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
                      background: 'var(--surface-modal)',
                      boxSizing: 'border-box',
                    }}
                  />
                </label>

                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>
                  멤버 {members.length}
                </span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  오른쪽으로 드래그하면 멤버에서 빠집니다.
                </span>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1, overflow: 'auto' }}>
                  {members.length === 0 ? (
                    <EmptyState
                      message="멤버가 없습니다"
                      description="오른쪽 미배정 학생을 여기로 드래그하세요."
                      actionLabel="목록으로"
                      onAction={() => navigate('/manager/groups')}
                    />
                  ) : (
                    members.map((m) => {
                      const isGhost = drag?.userId === m.userId;
                      return (
                        <div
                          key={m.userId}
                          onPointerDown={(e) =>
                            beginDrag(e, {
                              userId: m.userId,
                              name: m.name,
                              email: m.email,
                              from: 'members',
                            })
                          }
                          onPointerMove={onDragMove}
                          onPointerUp={endDrag}
                          onPointerCancel={endDrag}
                          style={{
                            ...cardBase,
                            opacity: isGhost ? 0.25 : 1,
                            cursor: drag?.userId === m.userId ? 'grabbing' : 'grab',
                            boxShadow: isGhost ? 'none' : undefined,
                          }}
                        >
                          <StudentCardFace
                            name={m.name}
                            email={m.email}
                            trailing={
                              <>
                                <button
                                  type="button"
                                  onClick={() => setLeader(m.userId)}
                                  style={{
                                    border: `1px solid ${m.role === 'LEADER' ? 'var(--accent)' : 'var(--border-strong)'}`,
                                    background:
                                      m.role === 'LEADER' ? 'var(--accent-softer)' : 'transparent',
                                    color:
                                      m.role === 'LEADER' ? 'var(--accent)' : 'var(--text-secondary)',
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
                              </>
                            }
                          />
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div
                ref={poolPanelRef}
                style={{
                  ...panelStyle,
                  outline: dropTarget === 'pool' ? '2px solid var(--accent)' : undefined,
                  outlineOffset: 2,
                  transition: 'outline 120ms ease-out',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 8,
                  }}
                >
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>
                    미배정 학생
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
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  왼쪽으로 드래그하면 멤버로 들어갑니다. X로 빼면 여기로 바로 돌아옵니다.
                </span>

                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                    overflow: 'auto',
                    maxHeight: 420,
                  }}
                >
                  {poolStudents.length === 0 ? (
                    <EmptyState
                      message="미배정 학생이 없습니다"
                      description="멤버를 오른쪽으로 드래그하거나 X로 빼면 여기에 나타납니다."
                      actionLabel="목록으로"
                      onAction={() => navigate('/manager/groups')}
                    />
                  ) : (
                    poolStudents.map((c) => {
                      const isGhost = drag?.userId === c.userId;
                      return (
                        <div
                          key={c.userId}
                          onPointerDown={(e) =>
                            beginDrag(e, {
                              userId: c.userId,
                              name: c.name,
                              email: c.email,
                              from: 'pool',
                            })
                          }
                          onPointerMove={onDragMove}
                          onPointerUp={endDrag}
                          onPointerCancel={endDrag}
                          style={{
                            ...cardBase,
                            opacity: isGhost ? 0.25 : 1,
                            cursor: drag?.userId === c.userId ? 'grabbing' : 'grab',
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={selected.includes(c.userId)}
                            onChange={() => toggleSelect(c.userId)}
                            onPointerDown={(e) => e.stopPropagation()}
                            aria-label={`${c.name} 선택`}
                          />
                          <StudentCardFace
                            name={c.name}
                            email={c.email}
                            trailing={<Badge status="success">미배정</Badge>}
                          />
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </RowSection>
        </PageMain>
      </ManagerShell>

      {drag ? (
        <div
          style={{
            position: 'fixed',
            left: drag.x - drag.offsetX,
            top: drag.y - drag.offsetY,
            width: drag.width,
            height: drag.height,
            zIndex: 200,
            pointerEvents: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '10px 12px',
            borderRadius: 12,
            border: '1px solid var(--accent)',
            background: 'var(--surface-modal)',
            boxShadow: 'var(--shadow-modal)',
            boxSizing: 'border-box',
            transform: 'scale(1.02)',
            transition: 'box-shadow 120ms ease-out',
          }}
        >
          <StudentCardFace
            name={drag.name}
            email={drag.email}
            trailing={
              <Badge status={drag.from === 'pool' ? 'success' : 'accent'}>
                {drag.from === 'pool' ? '멤버로' : '풀로'}
              </Badge>
            }
          />
        </div>
      ) : null}

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
