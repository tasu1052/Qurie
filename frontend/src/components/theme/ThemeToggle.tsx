import { useEffect, useState, type CSSProperties } from 'react';
import { useMeOptional, useUpdateUserProfile } from '../../data';
import { applyTheme, persistTheme, resolveInitialTheme } from '../../theme/theme';
import { useThemeOptional } from '../../theme/useTheme';

type ThemeToggleProps = {
  /** Controlled: dark when true. */
  checked?: boolean;
  onChange?: (dark: boolean) => void;
  /** Uncontrolled initial dark state (ignored when `checked` is set). */
  defaultChecked?: boolean;
  label?: string | null;
  size?: 'sm' | 'md';
  style?: CSSProperties;
};

/**
 * Switch toggle from dark-mode-for-cursor.md.
 * - Uncontrolled: flips `data-theme` on `<html>` (+ localStorage via persistTheme)
 * - Controlled: caller owns where `data-theme` is applied
 * - Inside ThemeProvider: syncs with shared theme state when uncontrolled props are used
 */
export function ThemeToggle({
  checked,
  onChange,
  defaultChecked = false,
  label = null,
  size = 'md',
  style = {},
}: ThemeToggleProps) {
  const ctx = useThemeOptional();
  const me = useMeOptional();
  const updateProfile = useUpdateUserProfile();
  const isControlled = checked != null;

  const [internal, setInternal] = useState(() => {
    if (isControlled) return Boolean(checked);
    if (ctx) return ctx.theme === 'dark';
    return resolveInitialTheme() === 'dark' || defaultChecked;
  });

  const on = isControlled ? Boolean(checked) : ctx ? ctx.theme === 'dark' : internal;

  useEffect(() => {
    if (isControlled || ctx) return;
    applyTheme(internal ? 'dark' : 'light');
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- mount only for uncontrolled standalone

  const persistRemoteTheme = (dark: boolean) => {
    const userId = me.data?.id;
    if (!userId) return;
    updateProfile.mutate({ userId, theme: dark ? 'dark' : 'light' });
  };

  const toggle = () => {
    const next = !on;
    if (isControlled) {
      onChange?.(next);
      persistRemoteTheme(next);
      return;
    }
    if (ctx) {
      ctx.setTheme(next ? 'dark' : 'light');
      persistRemoteTheme(next);
      return;
    }
    setInternal(next);
    applyTheme(next ? 'dark' : 'light');
    persistTheme(next ? 'dark' : 'light');
    persistRemoteTheme(next);
  };

  const dims = size === 'sm' ? { w: 36, h: 20 } : { w: 44, h: 24 };
  const inset = 2;
  const thumb = dims.h - inset * 2;

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, width: '100%', justifyContent: 'space-between', ...style }}>
      {label ? <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>{label}</span> : null}
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label={label ?? (on ? '라이트 모드로 전환' : '다크 모드로 전환')}
        onClick={toggle}
        style={{
          width: dims.w,
          height: dims.h,
          borderRadius: 'var(--radius-pill)',
          border: '1px solid var(--border-strong)',
          background: on ? 'var(--ink)' : 'var(--surface-sunken)',
          position: 'relative',
          cursor: 'pointer',
          padding: 0,
          boxSizing: 'border-box',
          display: 'inline-flex',
          alignItems: 'center',
          transition: 'background 180ms ease-out,border-color 180ms ease-out',
          flexShrink: 0,
        }}
      >
        <span
          style={{
            position: 'absolute',
            top: '50%',
            left: on ? dims.w - thumb - inset : inset,
            width: thumb,
            height: thumb,
            borderRadius: '50%',
            background: 'var(--text-inverse)',
            boxShadow: 'var(--shadow-card)',
            transform: 'translateY(-50%)',
            transition: 'left 180ms cubic-bezier(.22,1,.36,1)',
          }}
        />
      </button>
    </div>
  );
}

export type { ThemeToggleProps };
