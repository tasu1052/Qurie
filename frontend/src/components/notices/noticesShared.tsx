import { isAxiosError } from 'axios';
import { Pencil, Pin, Trash2 } from 'lucide-react';
import { Badge, Skeleton } from '../../ds';
import type { NoticeResponse, NoticeScope } from '../../data';

export type ScopeFilter = '전체' | 'TRACK' | 'CLASS';

export function apiErrorMessage(error: unknown, fallback: string): string {
  if (isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (typeof message === 'string' && message.trim()) return message;
  }
  return fallback;
}

export function ListSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {[0, 1, 2].map((i) => (
        <Skeleton key={i} width="100%" height={120} radius={16} delay={i * 0.08} />
      ))}
    </div>
  );
}

export function scopeLabel(scope: NoticeScope): string {
  if (scope === 'ENTERPRISE') return '전체';
  if (scope === 'TRACK') return '트랙';
  return '클래스';
}

export function NoticeCard({
  item,
  canEdit = true,
  deleting,
  onOpen,
  onEdit,
  onDelete,
}: {
  item: NoticeResponse;
  canEdit?: boolean;
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
      <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)', margin: 0 }}>{item.title}</h3>
      <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>
        {item.body}
      </p>
      <div style={{ display: 'flex', gap: 14, fontSize: 12, color: 'var(--text-muted)' }}>
        <span>작성: {item.authorName}</span>
      </div>
    </div>
  );
}

export function ScopeFilterTabs({
  options,
  scope,
  onChange,
}: {
  options: readonly { key: ScopeFilter; label: string }[];
  scope: ScopeFilter;
  onChange: (scope: ScopeFilter) => void;
}) {
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {options.map((s) => {
        const active = scope === s.key;
        return (
          <button
            key={s.key}
            type="button"
            onClick={() => onChange(s.key)}
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
  );
}
