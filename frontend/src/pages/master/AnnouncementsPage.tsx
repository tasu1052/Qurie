import { useEffect, useMemo, useState } from 'react';
import { Pencil, Pin, Plus, Trash2 } from 'lucide-react';
import { ConfirmDeleteOverlay } from '../../components/overlays/ConfirmDeleteOverlay';
import { MasterShell, PageMain } from '../../components/layout/MasterShell';
import {
  AlertBanner,
  Badge,
  EmptyState,
  Input,
  Modal,
  RowErrorFallback,
  Select,
  Skeleton,
} from '../../ds';
import {
  QueryAsyncBoundary,
  useCreateNotice,
  useDeleteNotice,
  useGetClasses,
  useGetNotices,
  useGetTracks,
  useUpdateNotice,
  type NoticeResponse,
  type NoticeScope,
} from '../../data';
import { useOpenNoticeDetail } from '../../hooks/useOpenNoticeDetail';

type ScopeFilter = '전체' | 'TRACK' | 'CLASS';

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
  onOpen,
  onDelete,
  onEdit,
  deleting,
}: {
  item: NoticeResponse;
  onOpen: () => void;
  onDelete: () => void;
  onEdit: () => void;
  deleting: boolean;
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
        padding: '20px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        cursor: 'pointer',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {item.pinned ? (
          <>
            <Pin size={14} strokeWidth={1.75} style={{ color: 'var(--accent)' }} />
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: 'var(--accent)',
              }}
            >
              고정됨
            </span>
          </>
        ) : null}
        <Badge status={item.pinned ? 'accent' : 'neutral'}>{scopeLabel(item.scope)}</Badge>
        {item.targetName ? (
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{item.targetName}</span>
        ) : null}
        <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-muted)' }}>
          {new Date(item.createdAt).toLocaleDateString('ko-KR')}
        </span>
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
      </div>
      <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)', margin: 0 }}>{item.title}</h3>
      <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: 'var(--text-secondary)' }}>
        {item.body}
      </p>
      <div style={{ display: 'flex', gap: 14, fontSize: 12, color: 'var(--text-muted)' }}>
        <span>작성: {item.authorName}</span>
      </div>
    </div>
  );
}

function AnnouncementsBody() {
  const openNotice = useOpenNoticeDetail();
  const [scope, setScope] = useState<ScopeFilter>('전체');
  const [open, setOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<NoticeResponse | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<NoticeResponse | null>(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [createScope, setCreateScope] = useState<NoticeScope>('TRACK');
  const [trackId, setTrackId] = useState('');
  const [classId, setClassId] = useState('');
  const [pinned, setPinned] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filters = useMemo(
    () => ({
      size: 50,
      scope: scope === '전체' ? undefined : scope,
    }),
    [scope],
  );

  const { data: noticesPage } = useGetNotices(filters);
  const { data: tracksPage } = useGetTracks({ size: 100 });
  const { data: classesPage } = useGetClasses({ size: 100 });
  const createNotice = useCreateNotice();
  const updateNotice = useUpdateNotice();
  const deleteNotice = useDeleteNotice();
  const notices = noticesPage.data;
  const tracks = tracksPage.data;
  const firstTrackId = tracks[0] ? String(tracks[0].id) : '';

  useEffect(() => {
    if (!open || editTarget || createScope !== 'TRACK') return;
    if (!trackId && firstTrackId) setTrackId(firstTrackId);
  }, [open, editTarget, createScope, trackId, firstTrackId]);

  const resetForm = () => {
    setTitle('');
    setBody('');
    setCreateScope('TRACK');
    setTrackId(firstTrackId);
    setClassId('');
    setPinned(false);
    setError(null);
    setEditTarget(null);
  };

  const openEdit = (item: NoticeResponse) => {
    setEditTarget(item);
    setTitle(item.title);
    setBody(item.body);
    setPinned(item.pinned);
    setError(null);
    setOpen(true);
  };

  const onCreate = () => {
    if (!title.trim() || !body.trim()) {
      setError('제목과 본문을 입력하세요.');
      return;
    }
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
          onError: () => setError('공지 수정에 실패했습니다.'),
        },
      );
      return;
    }
    if (createScope === 'TRACK' && !trackId) {
      setError('트랙을 선택하세요.');
      return;
    }
    if (createScope === 'CLASS' && !classId) {
      setError('클래스를 선택하세요.');
      return;
    }
    setError(null);
    createNotice.mutate(
      {
        scope: createScope,
        title: title.trim(),
        body: body.trim(),
        pinned,
        trackId: createScope === 'TRACK' ? Number(trackId) : undefined,
        classId: createScope === 'CLASS' ? Number(classId) : undefined,
      },
      {
        onSuccess: () => {
          setOpen(false);
          resetForm();
        },
        onError: () => setError('공지 작성에 실패했습니다.'),
      },
    );
  };

  const saving = createNotice.isPending || updateNotice.isPending;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>공지사항</h1>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            전체 · 트랙 · 클래스 단위로 공지를 관리해요.
          </span>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {(
            [
              { key: '전체', label: '전체' },
              { key: 'TRACK', label: '트랙' },
              { key: 'CLASS', label: '클래스' },
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
      </div>

      {notices.length === 0 ? (
        <EmptyState
          message="공지가 없습니다"
          description="오른쪽 아래 + 버튼으로 새 공지를 작성할 수 있어요."
          actionLabel="작성하기"
          onAction={() => {
            resetForm();
            setOpen(true);
          }}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {notices.map((n) => (
            <NoticeCard
              key={n.id}
              item={n}
              deleting={deleteNotice.isPending}
              onOpen={() => openNotice(n.id)}
              onEdit={() => openEdit(n)}
              onDelete={() => setDeleteTarget(n)}
            />
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => {
          resetForm();
          setOpen(true);
        }}
        style={{
          position: 'fixed',
          right: 32,
          bottom: 32,
          width: 52,
          height: 52,
          borderRadius: '50%',
          background: 'var(--ink)',
          color: 'var(--text-inverse)',
          border: 'none',
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: 'var(--shadow-modal)',
        }}
        aria-label="새 공지"
      >
        <Plus size={20} strokeWidth={1.75} />
      </button>

      <Modal
        open={open}
        title={editTarget ? '공지 수정' : '공지 작성'}
        description={
          editTarget
            ? '제목·본문·고정 여부를 수정해요.'
            : '범위와 대상을 선택한 뒤 제목·본문을 입력해요.'
        }
        primaryLabel={saving ? '저장 중…' : editTarget ? '수정하기' : '작성하기'}
        secondaryLabel="취소"
        onPrimary={onCreate}
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
          {!editTarget ? (
            <>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>범위</span>
                <Select
                  options={[
                    { value: 'TRACK', label: '트랙' },
                    { value: 'CLASS', label: '클래스' },
                  ]}
                  value={createScope}
                  onChange={(v) => setCreateScope(v as NoticeScope)}
                />
              </label>
              {createScope === 'TRACK' ? (
                <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>트랙</span>
                  <Select
                    options={tracks.map((t) => ({ value: String(t.id), label: t.name }))}
                    value={trackId}
                    onChange={setTrackId}
                  />
                </label>
              ) : null}
              {createScope === 'CLASS' ? (
                <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>클래스</span>
                  <Select
                    options={classesPage.data.map((c) => ({ value: String(c.id), label: c.name }))}
                    value={classId}
                    onChange={setClassId}
                  />
                </label>
              ) : null}
            </>
          ) : null}
          <Input placeholder="제목" value={title} onChange={(e) => setTitle(e.target.value)} width="100%" />
          <Input placeholder="본문" value={body} onChange={(e) => setBody(e.target.value)} width="100%" />
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
            <input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} />
            상단 고정
          </label>
        </div>
      </Modal>

      <ConfirmDeleteOverlay
        open={deleteTarget !== null}
        title="공지 삭제"
        description={
          deleteTarget
            ? `「${deleteTarget.title}」 공지를 삭제합니다. 이 작업은 되돌릴 수 없습니다.`
            : ''
        }
        confirmText={deleteTarget?.title ?? ''}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) deleteNotice.mutate(deleteTarget.id);
        }}
      />
    </div>
  );
}

export default function AnnouncementsPage() {
  const [rowKey, setRowKey] = useState(0);

  return (
    <MasterShell activeKey="announcements" breadcrumbs={['SSAFY 서울캠퍼스', '공지사항']}>
      <PageMain>
        <QueryAsyncBoundary
          key={rowKey}
          suspenseFallback={<ListSkeleton />}
          errorFallback={
            <RowErrorFallback
              onRetry={() => setRowKey((k) => k + 1)}
              title="공지를 불러오지 못했습니다"
              description="목록을 다시 불러와 주세요."
            />
          }
        >
          <AnnouncementsBody />
        </QueryAsyncBoundary>
      </PageMain>
    </MasterShell>
  );
}
