import { useMemo, type CSSProperties } from 'react';

const COLORS = ['#5B8DEF', '#34C759', '#FF9F0A', '#FF375F', '#AF52DE', '#64D2FF'];

/** 완료 축하용 컨페티. pointer-events 없음. */
export function ConfettiBurst() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 28 }, (_, id) => ({
        id,
        left: `${6 + ((id * 17) % 88)}%`,
        dx: `${(id % 2 === 0 ? -1 : 1) * (8 + (id % 5) * 4)}px`,
        size: 5 + (id % 4),
        color: COLORS[id % COLORS.length],
        delay: `${(id % 10) * 0.04}s`,
        duration: `${0.9 + (id % 5) * 0.12}s`,
      })),
    [],
  );

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >
      {pieces.map((p) => (
        <span
          key={p.id}
          style={
            {
              '--dx': p.dx,
              position: 'absolute',
              left: p.left,
              top: -8,
              width: p.size,
              height: p.size,
              borderRadius: p.id % 2 === 0 ? 2 : '50%',
              background: p.color,
              animation: `qurie-confetti-fall ${p.duration} ease-out ${p.delay} forwards`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
