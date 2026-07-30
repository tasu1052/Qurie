import { useMemo, useState } from 'react';
import { Pin, Plus } from 'lucide-react';
import { MasterShell, PageMain } from '../../components/layout/MasterShell';
import {
  AlertBanner,
  Badge,
  EmptyState,
  Input,
  Modal,
  RowErrorFallback,
  Skeleton,
} from '../../ds';
import { QueryAsyncBoundary, useGetNotices, type NoticeResponse, type NoticeScope } from '../../data';

type ScopeFilter = '전체' | 'ENTERPRISE' | 'TRACK' | 'CLASS';

function ListSkeleton() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        maxWidth: 880,
        width: '100%',
        margin: '0 auto',
      }}
    >
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

function NoticeCard({ item }: { item: NoticeResponse }) {
  return (
    <div
      style={{
        background: 'var(--surface-card)',
        border: `1px solid ${item.pinned ? 'var(--accent-soft)' : 'var(--border)'}`,
        borderRadius: 16,
        boxShadow: 'var(--shadow-card)',
        padding: '20px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
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
  const [scope, setScope] = useState<ScopeFilter>('전체');
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  const filters = useMemo(
    () => ({
      size: 50,
      scope: scope === '전체' ? undefined : scope,
    }),
    [scope],
  );

  const { data: noticesPage } = useGetNotices(filters);
  const notices = noticesPage.data;

  return (
    <div
      style={{
        maxWidth: 880,
        width: '100%',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        position: 'relative',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>공지사항</h1>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            전체 · 트랙 · 클래스 단위로 발송된 공지를 확인하세요.
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
          description="공지 작성 API가 아직 없어 조회만 가능합니다."
          actionLabel="전체 보기"
          onAction={() => setScope('전체')}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {notices.map((n) => (
            <NoticeCard key={n.id} item={n} />
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
        title="공지 작성"
        description="공지 생성 API가 아직 준비되지 않았습니다."
        primaryLabel="닫기"
        onPrimary={() => setOpen(false)}
        onClose={() => setOpen(false)}
        width={480}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <AlertBanner
            tone="info"
            title="백엔드 대기"
            description="POST /notices 가 추가되면 이 폼으로 공지를 작성할 수 있습니다."
          />
          <Input placeholder="제목" value={title} onChange={(e) => setTitle(e.target.value)} width="100%" />
          <Input placeholder="본문" value={body} onChange={(e) => setBody(e.target.value)} width="100%" />
        </div>
      </Modal>
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
