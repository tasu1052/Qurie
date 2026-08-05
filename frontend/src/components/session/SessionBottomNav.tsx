import { FileCode, Files, MessageSquare, Sparkles } from 'lucide-react';
import type { SessionMobileView } from './sessionPanelLayout';

const ITEMS: { id: SessionMobileView; label: string; Icon: typeof FileCode }[] = [
  { id: 'editor', label: '코드', Icon: FileCode },
  { id: 'explorer', label: '파일', Icon: Files },
  { id: 'community', label: '채팅', Icon: MessageSquare },
  { id: 'quiz', label: '퀴즈', Icon: Sparkles },
];

type SessionBottomNavProps = {
  active: SessionMobileView;
  onChange: (view: SessionMobileView) => void;
};

export function SessionBottomNav({ active, onChange }: SessionBottomNavProps) {
  return (
    <nav
      aria-label="세션 패널"
      style={{
        flexShrink: 0,
        display: 'flex',
        alignItems: 'stretch',
        borderTop: '1px solid var(--border)',
        background: 'var(--surface-card)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      {ITEMS.map(({ id, label, Icon }) => {
        const isActive = active === id;
        return (
          <button
            key={id}
            type="button"
            aria-current={isActive ? 'page' : undefined}
            onClick={() => onChange(id)}
            style={{
              flex: 1,
              minHeight: 52,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 3,
              border: 'none',
              background: isActive ? 'var(--status-accent-bg)' : 'transparent',
              color: isActive ? 'var(--accent)' : 'var(--text-muted)',
              cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
              padding: '6px 4px',
            }}
          >
            <Icon size={18} strokeWidth={isActive ? 2.25 : 1.75} />
            <span style={{ fontSize: 10, fontWeight: isActive ? 700 : 500, lineHeight: 1 }}>{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
