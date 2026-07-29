import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../theme/ThemeProvider';

/** Sidebar control — sits above the account chip; toggles `data-theme`. */
export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={isDark ? '라이트 모드' : '다크 모드'}
      aria-label={isDark ? '라이트 모드로 전환' : '다크 모드로 전환'}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        width: '100%',
        border: 'none',
        background: 'transparent',
        color: 'var(--text-secondary)',
        cursor: 'pointer',
        fontFamily: 'var(--font-sans)',
        fontSize: 14,
        fontWeight: 500,
        padding: '9px 14px',
        borderRadius: 'var(--radius-pill)',
        textAlign: 'left',
        lineHeight: 1,
        transition: 'background 140ms ease-out',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'var(--surface-hover)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent';
      }}
    >
      <span style={{ display: 'flex', width: 18, justifyContent: 'center', flexShrink: 0 }}>
        {isDark ? <Sun size={16} strokeWidth={1.75} /> : <Moon size={16} strokeWidth={1.75} />}
      </span>
      <span>{isDark ? '라이트 모드' : '다크 모드'}</span>
    </button>
  );
}
