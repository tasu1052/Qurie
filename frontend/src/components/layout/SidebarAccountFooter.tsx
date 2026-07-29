import type { CSSProperties } from 'react';
import { LogOut } from 'lucide-react';
import { ThemeToggle } from '../theme/ThemeToggle';

type SidebarAccountFooterProps = {
  name: string;
  email: string;
  onLogout: () => void;
  /** Optional avatar background override (student shell uses tertiary). */
  avatarStyle?: CSSProperties;
};

/** Sidebar bottom: theme toggle above account chip. Shared by Master/Manager/Student shells. */
export function SidebarAccountFooter({
  name,
  email,
  onLogout,
  avatarStyle,
}: SidebarAccountFooterProps) {
  const initial = (name || '?').slice(0, 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <ThemeToggle />
      <div
        style={{
          borderTop: '1px solid var(--divider)',
          paddingTop: 14,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          paddingLeft: 6,
        }}
      >
        <span
          style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: 'var(--accent-soft)',
            color: 'var(--accent)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 12,
            fontWeight: 700,
            flexShrink: 0,
            ...avatarStyle,
          }}
        >
          {initial}
        </span>
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.3, minWidth: 0, flex: 1 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{name}</span>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {email}
          </span>
        </div>
        <button
          type="button"
          onClick={onLogout}
          title="로그아웃"
          style={{
            border: 'none',
            background: 'transparent',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            display: 'inline-flex',
            padding: 4,
          }}
        >
          <LogOut size={14} strokeWidth={1.75} />
        </button>
      </div>
    </div>
  );
}
