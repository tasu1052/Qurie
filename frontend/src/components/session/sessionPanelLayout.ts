import { useCallback, useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react';

const LEFT_KEY = 'qurie:session-panel:left';
const RIGHT_KEY = 'qurie:session-panel:right';

function readStored(key: string, fallback: number): number {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return fallback;
    const n = Number(raw);
    return Number.isFinite(n) ? n : fallback;
  } catch {
    return fallback;
  }
}

function writeStored(key: string, value: number) {
  try {
    sessionStorage.setItem(key, String(value));
  } catch {
    // ignore
  }
}

export function useViewportWidth() {
  const [width, setWidth] = useState(() => (typeof window === 'undefined' ? 1440 : window.innerWidth));

  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return width;
}

export type SessionMobileView = 'editor' | 'explorer' | 'community' | 'quiz';

/** Desktop: 3-column. Stacked (<1100px): bottom tabs, one panel at a time. */
export function sessionChromeVisibility(vw: number) {
  const stacked = vw < 1100;
  return {
    stacked,
    isMobile: vw < 768,
    showRight: !stacked,
    showLeft: !stacked,
    compactHeader: vw < 980,
    narrowHeader: vw < 720,
  };
}

export function useSessionPanelSizes() {
  const [leftWidth, setLeftWidthState] = useState(() => readStored(LEFT_KEY, 250));
  const [rightWidth, setRightWidthState] = useState(() => readStored(RIGHT_KEY, 320));

  const setLeftWidth = useCallback((n: number) => {
    const next = Math.round(Math.min(420, Math.max(180, n)));
    setLeftWidthState(next);
    writeStored(LEFT_KEY, next);
  }, []);

  const setRightWidth = useCallback((n: number) => {
    const next = Math.round(Math.min(480, Math.max(240, n)));
    setRightWidthState(next);
    writeStored(RIGHT_KEY, next);
  }, []);

  return {
    leftWidth,
    rightWidth,
    setLeftWidth,
    setRightWidth,
  };
}

type DragAxis = 'x' | 'y';

/** Pointer-drag helper for panel edges. `sign` flips direction (e.g. right panel grows leftward). */
export function usePointerDrag(
  axis: DragAxis,
  value: number,
  setValue: (n: number) => void,
  sign: 1 | -1 = 1,
) {
  const start = useRef({ pointer: 0, size: 0 });
  const [dragging, setDragging] = useState(false);

  const onPointerDown = useCallback(
    (e: ReactPointerEvent<HTMLElement>) => {
      e.preventDefault();
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      start.current = {
        pointer: axis === 'x' ? e.clientX : e.clientY,
        size: value,
      };
      setDragging(true);
    },
    [axis, value],
  );

  const onPointerMove = useCallback(
    (e: ReactPointerEvent<HTMLElement>) => {
      if (!dragging) return;
      const current = axis === 'x' ? e.clientX : e.clientY;
      const delta = (current - start.current.pointer) * sign;
      setValue(start.current.size + delta);
    },
    [axis, dragging, setValue, sign],
  );

  const onPointerUp = useCallback(() => {
    setDragging(false);
  }, []);

  return { dragging, onPointerDown, onPointerMove, onPointerUp };
}

export function resizeHandleStyle(orientation: 'vertical' | 'horizontal', active: boolean): CSSProperties {
  if (orientation === 'vertical') {
    return {
      width: 4,
      flexShrink: 0,
      cursor: 'col-resize',
      background: active ? 'var(--accent-soft)' : 'transparent',
      borderLeft: '1px solid var(--border)',
      alignSelf: 'stretch',
      touchAction: 'none',
    };
  }
  return {
    height: 4,
    flexShrink: 0,
    cursor: 'row-resize',
    background: active ? 'var(--accent-soft)' : 'transparent',
    borderTop: '1px solid var(--border)',
    width: '100%',
    touchAction: 'none',
  };
}
