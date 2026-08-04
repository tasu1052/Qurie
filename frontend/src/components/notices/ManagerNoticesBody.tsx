import { useEffect, useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { ConfirmDeleteOverlay } from '../overlays/ConfirmDeleteOverlay';
import { AlertBanner, Badge, Button, EmptyState, Input, Modal } from '../../ds';
import {
  useCreateNotice,
  useDeleteNotice,
  useGetClass,
  useGetNotices,
  useUpdateNotice,
  type NoticeResponse,
} from '../../data';
import { useOpenNoticeDetail } from '../../hooks/useOpenNoticeDetail';
import {
  apiErrorMessage,
  NOTICE_LIST_PAGE_SIZE,
  NoticeCard,
  NoticesPagination,
  ScopeFilterTabs,
  type ScopeFilter,
} from './noticesShared';

export function ManagerNoticesBody({ classId }: { classId: number }) {
  const openNotice = useOpenNoticeDetail();
  const { data: cls } = useGetClass(classId);
  const [scope, setScope] = useState<ScopeFilter>('CLASS');
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<NoticeResponse | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<NoticeResponse | null>(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [pinned, setPinned] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filters = useMemo(
    () => ({
      page,
      size: NOTICE_LIST_PAGE_SIZE,
      scope: scope === '전체' ? undefined : scope,
      classId,
      forAudience: true as const,
    }),
    [scope, classId, page],
  );

  useEffect(() => {
    setPage(1);
  }, [scope]);

  const { data: noticesPage } = useGetNotices(filters);
  const createNotice = useCreateNotice();
  const updateNotice = useUpdateNotice();
  const deleteNotice = useDeleteNotice();
  const notices = noticesPage.data;
  const totalNotices = noticesPage.meta.total;
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
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
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

      <ScopeFilterTabs
        scope={scope}
        onChange={setScope}
        options={[
          { key: '전체', label: '전체' },
          { key: 'TRACK', label: '트랙' },
          { key: 'CLASS', label: '클래스' },
        ]}
      />

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
                onDelete={() => setDeleteTarget(n)}
              />
            );
          })}
          <NoticesPagination page={page} total={totalNotices} onPage={setPage} />
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
