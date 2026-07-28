import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';

/**
 * Horizontal card scroll row with the StatCardRow scroll affordance:
 * hidden scrollbar (.qurie-scroll-row — also gives the LIVE glow clip room)
 * plus round chevron arrows that appear at the overflowing edge.
 * Wheel / drag scrolling keeps working; arrows page by one card.
 */
export function CardScrollRow({
  children,
  step = 276,
}: {
  children: ReactNode;
  /** Scroll distance per arrow click — card width + gap. */
  step?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [can, setCan] = useState({ l: false, r: false });

  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setCan((c) => {
      const l = el.scrollLeft > 4;
      const r = el.scrollLeft + el.clientWidth < el.scrollWidth - 4;
      return c.l === l && c.r === r ? c : { l, r };
    });
  }, []);

  useEffect(() => {
    update();
    const el = ref.current;
    if (!el) return;
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(update) : null;
    ro?.observe(el);
    el.addEventListener('scroll', update, { passive: true });
    return () => {
      ro?.disconnect();
      el.removeEventListener('scroll', update);
    };
  }, [update]);

  const nudge = (d: number) => {
    ref.current?.scrollBy({ left: d * step, behavior: 'smooth' });
  };

  const arrow = (d: number) => (
    <button
      type="button"
      onClick={() => nudge(d)}
      aria-label={d > 0 ? '다음 카드' : '이전 카드'}
      style={{
        position: 'absolute',
        top: '50%',
        transform: 'translateY(-50%)',
        ...(d > 0 ? { right: -10 } : { left: -10 }),
        width: 32,
        height: 32,
        borderRadius: 999,
        border: '1px solid var(--border-strong)',
        background: 'var(--surface-card)',
        boxShadow: 'var(--shadow-card)',
        color: 'var(--accent)',
        fontSize: 17,
        fontWeight: 700,
        lineHeight: 1,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2,
        fontFamily: 'var(--font-sans)',
        padding: 0,
      }}
    >
      {d > 0 ? '›' : '‹'}
    </button>
  );

  return (
    <div style={{ position: 'relative', minWidth: 0 }}>
      <div ref={ref} className="qurie-scroll-row">
        {children}
      </div>
      {can.l && arrow(-1)}
      {can.r && arrow(1)}
    </div>
  );
}
