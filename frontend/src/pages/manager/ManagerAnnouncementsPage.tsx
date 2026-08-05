import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { isAxiosError } from 'axios';
import { Pencil, Pin, Plus, Trash2 } from 'lucide-react';
import { ManagerShell, PageMain } from '../../components/layout/ManagerShell';
import {
  AlertBanner,
  Badge,
  Button,
  EmptyState,
  Input,
  Modal,
  RowErrorFallback,
  Skeleton,
} from '../../ds';
import {
  QueryAsyncBoundary,
  useCreateNotice,
  useDeleteNotice,
  useGetClass,
  useGetNotices,
  useMe,
  useUpdateNotice,
  type NoticeResponse,
  type NoticeScope,
} from '../../data';
import { useOpenNoticeDetail } from '../../hooks/useOpenNoticeDetail';

type ScopeFilter = '전체' | 'TRACK' | 'CLASS';

function apiErrorMessage(error: unknown, fallback: string): string {
  if (isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (typeof message === 'string' && message.trim()) return message;
  }
  return fallback;
}

function ListSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {[0, 1, 2].map((i) => (
        <Skeleton key={i} width="100%" height={120} radius={16} delay={i * 0.08} />
      ))}
    </div>
  );
}

function scopeLabel(scope: NoticeScope): string {
  if (scope === 'ENTERPRISE') return '전체';
  if (scope === 'TRACK') return '트랙';
  return '클래스';
}

function NoticeCard({
  item,
  canEdit,
  deleting,
  onOpen,
  onEdit,
  onDelete,
}: {
  item: NoticeResponse;
  canEdit: boolean;
  deleting: boolean;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen();
        }
      }}
      style={{
        background: 'var(--surface-card)',
        border: `1px solid ${item.pinned ? 'var(--accent-soft)' : 'var(--border)'}`,
        borderRadius: 16,
        boxShadow: 'var(--shadow-card)',
        padding: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        cursor: 'pointer',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Badge status={item.pinned ? 'accent' : 'neutral'}>{scopeLabel(item.scope)}</Badge>
        {item.pinned ? <Pin size={12} strokeWidth={1.75} color="var(--accent)" /> : null}
        {item.targetName ? (
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{item.targetName}</span>
        ) : null}
        <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-muted)' }}>
          {new Date(item.createdAt).toLocaleDateString('ko-KR')}
        </span>
        {canEdit ? (
          <>
            <button
              type="button"
              title="수정"
              aria-label="공지 수정"
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              style={{
                border: 'none',
                background: 'transparent',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                display: 'inline-flex',
                padding: 4,
              }}
            >
              <Pencil size={14} strokeWidth={1.75} />
            </button>
            <button
              type="button"
              title="삭제"
              aria-label="공지 삭제"
              disabled={deleting}
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              style={{
                border: 'none',
                background: 'transparent',
                color: 'var(--status-error)',
                cursor: deleting ? 'wait' : 'pointer',
                display: 'inline-flex',
                padding: 4,
              }}
            >
              <Trash2 size={14} strokeWidth={1.75} />
            </button>
          </>
        ) : null}
      </div>
      <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>{item.title}</span>
      {/* overflowWrap: 공백 없는 긴 문자열(URL 등)이 카드 밖으로 넘치지 않게 강제 줄바꿈 */}
      <p
        style={{
          margin: 0,
          fontSize: 13,
          color: 'var(--text-secondary)',
          lineHeight: 1.55,
          whiteSpace: 'pre-wrap',
          overflowWrap: 'anywhere',
        }}
      >
        {item.body}
      </p>
      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>작성: {item.authorName}</span>
    </div>
  );
}

function ManagerAnnouncementsBody({ classId }: { classId: number }) {
  const openNotice = useOpenNoticeDetail();
  const { data: cls } = useGetClass(classId);
  const [scope, setScope] = useState<ScopeFilter>('CLASS');
  const [open, setOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<NoticeResponse | null>(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [pinned, setPinned] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filters = useMemo(
    () => ({
      size: 50,
      scope: scope === '전체' ? undefined : scope,
      classId,
      // classId 등호만 쓰면 MASTER ENTERPRISE/TRACK 공지가 빠진다.
      forAudience: true as const,
    }),
    [scope, classId],
  );

  const { data: noticesPage } = useGetNotices(filters);
  const createNotice = useCreateNotice();
  const updateNotice = useUpdateNotice();
  const deleteNotice = useDeleteNotice();
  const notices = noticesPage.data;
  const saving = createNotice.isPending || updateNotice.isPending;

  const resetForm = () => {
    setTitle('');
    setBody('');
    setPinned(false);
    setError(null);
    setEditTarget(null);
  };

  const openCreate = () => {
    resetForm();
    setOpen(true);
  };

  const openEdit = (item: NoticeResponse) => {
    setEditTarget(item);
    setTitle(item.title);
    setBody(item.body);
    setPinned(item.pinned);
    setError(null);
    setOpen(true);
  };

  const onSave = () => {
    if (!title.trim() || !body.trim()) {
      setError('제목과 본문을 입력하세요.');
      return;
    }
    setError(null);

    if (editTarget) {
      updateNotice.mutate(
        {
          noticeId: editTarget.id,
          title: title.trim(),
          body: body.trim(),
          pinned,
        },
        {
          onSuccess: () => {
            setOpen(false);
            resetForm();
          },
          onError: (err) => setError(apiErrorMessage(err, '공지 수정에 실패했습니다.')),
        },
      );
      return;
    }

    createNotice.mutate(
      {
        scope: 'CLASS',
        classId,
        title: title.trim(),
        body: body.trim(),
        pinned,
      },
      {
        onSuccess: () => {
          setOpen(false);
          resetForm();
          setScope('CLASS');
        },
        onError: (err) =>
          setError(apiErrorMessage(err, '공지 작성에 실패했습니다. 담당 클래스 공지만 작성할 수 있어요.')),
      },
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>공지사항</h1>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            {cls.name} · 매니저는 클래스 공지만 작성할 수 있어요.
          </span>
        </div>
        <Button variant="primary" icon={<Plus size={15} strokeWidth={1.75} />} onClick={openCreate}>
          클래스 공지 작성
        </Button>
      </div>

      <AlertBanner
        tone="info"
        title="작성 범위"
        description="작성·수정·삭제는 담당 클래스 공지에만 가능합니다. 전체·트랙 공지는 조회만 할 수 있어요."
      />

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {(
          [
            { key: 'CLASS', label: '클래스' },
            { key: 'TRACK', label: '트랙' },
            { key: '전체', label: '전체' },
          ] as const
        ).map((s) => {
          const active = scope === s.key;
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => setScope(s.key)}
              style={{
                background: active ? 'var(--ink)' : 'var(--surface-card)',
                color: active ? 'var(--text-inverse)' : 'var(--text-secondary)',
                border: active ? 'none' : '1px solid var(--border-strong)',
                borderRadius: 999,
                padding: '5px 14px',
                fontSize: 12,
                fontWeight: active ? 600 : 400,
                cursor: 'pointer',
                fontFamily: 'var(--font-sans)',
              }}
            >
              {s.label}
            </button>
          );
        })}
      </div>

      {notices.length === 0 ? (
        <EmptyState
          message="공지가 없습니다"
          description="클래스 공지 작성 버튼으로 담당 반 공지를 올릴 수 있어요."
          actionLabel="클래스 공지 작성"
          onAction={openCreate}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {notices.map((n) => {
            const canEdit = n.scope === 'CLASS' && n.classId === classId;
            return (
              <NoticeCard
                key={n.id}
                item={n}
                canEdit={canEdit}
                deleting={deleteNotice.isPending}
                onOpen={() => openNotice(n.id)}
                onEdit={() => openEdit(n)}
                onDelete={() => deleteNotice.mutate(n.id)}
              />
            );
          })}
        </div>
      )}

      <Modal
        open={open}
        title={editTarget ? '클래스 공지 수정' : '클래스 공지 작성'}
        description={`${cls.name}에만 노출됩니다. 범위는 클래스로 고정돼요.`}
        primaryLabel={saving ? '저장 중…' : editTarget ? '수정하기' : '작성하기'}
        secondaryLabel="취소"
        onPrimary={onSave}
        onSecondary={() => {
          setOpen(false);
          resetForm();
        }}
        onClose={() => {
          setOpen(false);
          resetForm();
        }}
        width={520}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {error ? <AlertBanner tone="error" title="저장 실패" description={error} /> : null}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>범위</span>
            <Badge status="accent">클래스</Badge>
            <span style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>{cls.name}</span>
          </div>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>제목</span>
            <Input
              placeholder="예: 내일 세션 일정 안내"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              width="100%"
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>본문</span>
            <textarea
              placeholder="학생에게 전달할 내용을 입력하세요."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={6}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                border: '1px solid var(--border-strong)',
                borderRadius: 'var(--radius-control)',
                padding: '10px 14px',
                fontFamily: 'var(--font-sans)',
                fontSize: 14,
                color: 'var(--ink)',
                background: 'var(--surface-card)',
                resize: 'vertical',
                lineHeight: 1.5,
              }}
            />
          </label>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
            <input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} />
            상단 고정
          </label>
        </div>
      </Modal>
    </div>
  );
}

function ManagerAnnouncementsGate() {
  const { data: me } = useMe();
  const navigate = useNavigate();
  const [rowKey, setRowKey] = useState(0);
  const classId = me.classId;

  if (classId == null || !Number.isFinite(classId) || classId <= 0) {
    return (
      <EmptyState
        message="담당 클래스가 없습니다"
        description="계정에 classId가 없어 공지를 작성·조회할 수 없습니다."
        actionLabel="대시보드"
        onAction={() => navigate('/manager')}
      />
    );
  }

  return (
    <QueryAsyncBoundary
      key={rowKey}
      suspenseFallback={<ListSkeleton />}
      errorFallback={
        <RowErrorFallback onRetry={() => setRowKey((k) => k + 1)} title="공지를 불러오지 못했습니다" />
      }
    >
      <ManagerAnnouncementsBody classId={classId} />
    </QueryAsyncBoundary>
  );
}

export default function ManagerAnnouncementsPage() {
  return (
    <ManagerShell activeKey="announcements" breadcrumbs={['담당 클래스', '공지사항']}>
      <PageMain>
        <ManagerAnnouncementsGate />
      </PageMain>
    </ManagerShell>
  );
}
