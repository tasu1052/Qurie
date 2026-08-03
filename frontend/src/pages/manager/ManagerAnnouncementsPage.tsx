import { useMemo, useState } from 'react';
import { Pin, Plus, Trash2 } from 'lucide-react';
import { ManagerShell, PageMain } from '../../components/layout/ManagerShell';
import {
  AlertBanner,
  Badge,
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
  useGetNotices,
  useMe,
  type NoticeResponse,
  type NoticeScope,
} from '../../data';

type ScopeFilter = '전체' | 'ENTERPRISE' | 'TRACK' | 'CLASS';

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
  canDelete,
  deleting,
  onDelete,
}: {
  item: NoticeResponse;
  canDelete: boolean;
  deleting: boolean;
  onDelete: () => void;
}) {
  return (
    <div
      style={{
        background: 'var(--surface-card)',
        border: `1px solid ${item.pinned ? 'var(--accent-soft)' : 'var(--border)'}`,
        borderRadius: 16,
        boxShadow: 'var(--shadow-card)',
        padding: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Badge status={item.pinned ? 'accent' : 'neutral'}>{scopeLabel(item.scope)}</Badge>
        {item.pinned ? <Pin size={12} strokeWidth={1.75} color="var(--accent)" /> : null}
        <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-muted)' }}>
          {new Date(item.createdAt).toLocaleDateString('ko-KR')}
        </span>
        {canDelete ? (
          <button
            type="button"
            title="삭제"
            aria-label="공지 삭제"
            disabled={deleting}
            onClick={onDelete}
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
        ) : null}
      </div>
      <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>{item.title}</span>
      <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.55 }}>{item.body}</p>
      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>작성: {item.authorName}</span>
    </div>
  );
}

function ManagerAnnouncementsBody({ classId }: { classId: number }) {
  const [scope, setScope] = useState<ScopeFilter>('전체');
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [pinned, setPinned] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filters = useMemo(
    () => ({
      size: 50,
      scope: scope === '전체' ? undefined : scope,
      classId,
    }),
    [scope, classId],
  );

  const { data: noticesPage } = useGetNotices(filters);
  const createNotice = useCreateNotice();
  const deleteNotice = useDeleteNotice();
  const notices = noticesPage.data;

  const resetForm = () => {
    setTitle('');
    setBody('');
    setPinned(false);
    setError(null);
  };

  const onCreate = () => {
    if (!title.trim() || !body.trim()) {
      setError('제목과 본문을 입력하세요.');
      return;
    }
    setError(null);
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
        },
        onError: () => setError('공지 작성에 실패했습니다. 담당 클래스 공지만 작성할 수 있어요.'),
      },
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>공지사항</h1>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            클래스 공지를 작성하고, 전체·트랙 공지도 확인할 수 있어요.
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
          description="오른쪽 아래 + 버튼으로 클래스 공지를 작성할 수 있어요."
          actionLabel="작성하기"
          onAction={() => setOpen(true)}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {notices.map((n) => (
            <NoticeCard
              key={n.id}
              item={n}
              canDelete={n.scope === 'CLASS' && n.classId === classId}
              deleting={deleteNotice.isPending}
              onDelete={() => deleteNotice.mutate(n.id)}
            />
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen(true)}
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
        title="클래스 공지 작성"
        description="담당 반에만 노출되는 공지를 작성해요."
        primaryLabel={createNotice.isPending ? '작성 중…' : '작성하기'}
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
        width={480}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {error ? <AlertBanner tone="error" title="작성 실패" description={error} /> : null}
          <Input placeholder="제목" value={title} onChange={(e) => setTitle(e.target.value)} width="100%" />
          <Input placeholder="본문" value={body} onChange={(e) => setBody(e.target.value)} width="100%" />
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
  const [rowKey, setRowKey] = useState(0);
  const classId = me.classId;

  if (classId == null || !Number.isFinite(classId) || classId <= 0) {
    return (
      <EmptyState
        message="담당 클래스가 없습니다"
        description="계정에 classId가 없어 공지를 불러올 수 없습니다."
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
