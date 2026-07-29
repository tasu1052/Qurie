import React from 'react';
export function Modal({
  open = true,
  title,
  description = null,
  children,
  primaryLabel = null,
  secondaryLabel = null,
  onPrimary,
  onSecondary,
  onClose,
  width = 440,
  style = {},
}) {
  if (!open) return null;
  const btn = {
    borderRadius: 'var(--radius-control)',
    padding: '10px 18px',
    fontSize: 14,
    fontWeight: 600,
    fontFamily: 'var(--font-sans)',
    cursor: 'pointer',
  };
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'var(--scrim-modal)',
        backdropFilter: 'blur(10px) saturate(1.15)',
        WebkitBackdropFilter: 'blur(10px) saturate(1.15)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        fontFamily: 'var(--font-sans)',
        padding: 24,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--surface-modal)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-modal)',
          border: '1px solid var(--border-strong)',
          width,
          maxWidth: 'calc(100vw - 48px)',
          padding: 28,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          ...style,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 600, color: 'var(--ink)' }}>{title}</h3>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                style={{
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--text-muted)',
                  fontSize: 17,
                  cursor: 'pointer',
                  lineHeight: 1,
                  padding: 4,
                }}
              >
                ×
              </button>
            )}
          </div>
          {description && (
            <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.55 }}>{description}</p>
          )}
        </div>
        {children}
        {(primaryLabel || secondaryLabel) && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
            {secondaryLabel && (
              <button
                type="button"
                onClick={onSecondary}
                style={{
                  ...btn,
                  background: 'var(--surface-modal)',
                  color: 'var(--ink)',
                  border: '1px solid var(--border-strong)',
                }}
              >
                {secondaryLabel}
              </button>
            )}
            {primaryLabel && (
              <button
                type="button"
                onClick={onPrimary}
                style={{
                  ...btn,
                  background: 'var(--ink)',
                  color: 'var(--text-inverse)',
                  border: '1px solid transparent',
                }}
              >
                {primaryLabel}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
