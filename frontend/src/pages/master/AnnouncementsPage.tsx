import { useMemo, useState } from 'react';
import { Pin, Plus } from 'lucide-react';
import { MasterShell, PageMain } from '../../components/layout/MasterShell';
import { MockRowBoundary } from '../../components/feedback/MockRowBoundary';
import { Badge, Input, Modal, Skeleton } from '../../ds';
import { useNoticesRow } from '../../data';
import type { NoticeItem } from '../../data';

type ScopeFilter = '전체' | '트랙' | '클래스';

function ListSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 880, width: '100%', margin: '0 auto' }}>
      {[0, 1, 2].map((i) => (
        <Skeleton key={i} width="100%" height={120} radius={16} delay={i * 0.08} />
      ))}
    </div>
  );
}

function NoticeCard({ item }: { item: NoticeItem }) {
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
        {item.pinned && (
          <>
            <Pin size={14} strokeWidth={1.75} style={{ color: 'var(--accent)' }} />
            <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--accent)' }}>
              고정됨
            </span>
          </>
        )}
        <Badge status={item.pinned ? 'accent' : 'neutral'}>{item.scopeLabel}</Badge>
        <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-muted)' }}>{item.date}</span>
      </div>
      <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)', margin: 0 }}>{item.title}</h3>
      <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: 'var(--text-secondary)' }}>{item.body}</p>
      <div style={{ display: 'flex', gap: 14, fontSize: 12, color: 'var(--text-muted)' }}>
        <span>작성: {item.author}</span>
        <span>조회 {item.views}</span>
      </div>
    </div>
  );
}

export default function AnnouncementsPage() {
  const row = useNoticesRow();
  const [scope, setScope] = useState<ScopeFilter>('전체');
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [target, setTarget] = useState<ScopeFilter>('전체');
  const [pinned, setPinned] = useState(false);

  const filtered = useMemo(() => {
    const items = row.data ?? [];
    if (scope === '전체') return items;
    return items.filter((n) => n.scope === scope);
  }, [row.data, scope]);

  return (
    <MasterShell activeKey="announcements" breadcrumbs={['SSAFY 서울캠퍼스', '공지사항']}>
      <PageMain>
        <div style={{ maxWidth: 880, width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16, position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>공지사항</h1>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                전체 · 트랙 · 클래스 단위로 발송된 공지를 확인하세요.
              </span>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {(['전체', '트랙', '클래스'] as ScopeFilter[]).map((s) => {
                const active = scope === s;
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setScope(s)}
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
                    {s}
                  </button>
                );
              })}
            </div>
          </div>

          <MockRowBoundary
            status={row.status}
            skeleton={<ListSkeleton />}
            onRetry={row.refetch}
            emptyMessage="공지가 없습니다"
            emptyActionLabel="새 공지 작성"
            onEmptyAction={() => setOpen(true)}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {filtered.map((n) => (
                <NoticeCard key={n.id} item={n} />
              ))}
            </div>
          </MockRowBoundary>
        </div>

        <button
          type="button"
          title="새 공지 작성"
          onClick={() => setOpen(true)}
          style={{
            position: 'fixed',
            right: 32,
            bottom: 32,
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: 'var(--ink)',
            color: 'var(--text-inverse)',
            border: 'none',
            boxShadow: 'var(--shadow-modal)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 4,
          }}
        >
          <Plus size={22} strokeWidth={1.75} />
        </button>

        <Modal
          open={open}
          title="새 공지 작성"
          description="전체 · 트랙 · 클래스 단위로 발송 대상을 지정할 수 있습니다."
          primaryLabel="게시하기"
          secondaryLabel="취소"
          onPrimary={() => setOpen(false)}
          onSecondary={() => setOpen(false)}
          onClose={() => setOpen(false)}
          width={560}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>제목</span>
              <Input placeholder="공지 제목을 입력하세요" value={title} onChange={(e) => setTitle(e.target.value)} width="100%" />
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>발송 대상</span>
              <div style={{ display: 'flex', gap: 4, background: 'var(--surface-sunken)', border: '1px solid var(--border)', borderRadius: 999, padding: 4 }}>
                {(['전체', '트랙', '클래스'] as ScopeFilter[]).map((s) => {
                  const active = target === s;
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setTarget(s)}
                      style={{
                        flex: 1,
                        padding: '6px 0',
                        borderRadius: 999,
                        fontSize: 12.5,
                        fontWeight: active ? 600 : 400,
                        background: active ? 'var(--surface-card)' : 'transparent',
                        color: active ? 'var(--ink)' : 'var(--text-secondary)',
                        border: 'none',
                        boxShadow: active ? 'var(--shadow-card)' : undefined,
                        cursor: 'pointer',
                        fontFamily: 'var(--font-sans)',
                      }}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>SSAFY 서울캠퍼스 전체 멤버 48명에게 발송됩니다.</span>
            </div>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>내용</span>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="공지 내용을 입력하세요. Markdown 서식을 지원합니다."
                style={{
                  border: '1px solid var(--border-strong)',
                  borderRadius: 12,
                  padding: '12px 16px',
                  fontSize: 14,
                  minHeight: 110,
                  lineHeight: 1.6,
                  fontFamily: 'var(--font-sans)',
                  resize: 'vertical',
                  color: 'var(--ink)',
                  background: 'var(--surface-card)',
                }}
              />
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-secondary)', cursor: 'pointer' }}>
              <input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} />
              상단 고정
            </label>
          </div>
        </Modal>
      </PageMain>
    </MasterShell>
  );
}
