import type { CSSProperties, KeyboardEvent } from 'react';
import { LogOut } from 'lucide-react';
import { ThemeToggle } from '../theme/ThemeToggle';

type SidebarAccountFooterProps = {
  name: string;
  email: string;
  onLogout?: () => void;
  /** Navigate to my page when the account chip is clicked. */
  onProfileClick?: () => void;
  /** Optional avatar background override (student shell uses tertiary). */
  avatarStyle?: CSSProperties;
};

/** Sidebar bottom: theme toggle above account chip. Shared by Master/Manager/Student shells. */
export function SidebarAccountFooter({
  name,
  email,
  onLogout,
  onProfileClick,
  avatarStyle,
}: SidebarAccountFooterProps) {
  const initial = (name || '?').slice(0, 1);

  const onChipKeyDown = (e: KeyboardEvent) => {
    if (!onProfileClick) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onProfileClick();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ padding: '2px 6px 0' }}>
        <ThemeToggle label="다크 모드" />
      </div>
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
        <div
          role={onProfileClick ? 'button' : undefined}
          tabIndex={onProfileClick ? 0 : undefined}
          onClick={onProfileClick}
          onKeyDown={onChipKeyDown}
          title={onProfileClick ? '마이페이지' : undefined}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            minWidth: 0,
            flex: 1,
            cursor: onProfileClick ? 'pointer' : 'default',
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
        </div>
        {onLogout ? (
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
        ) : null}
      </div>
    </div>
  );
}
