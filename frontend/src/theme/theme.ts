export type ThemeMode = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'theme';

/** 랜딩·마케팅 화면에서 ThemeProvider 가 dark 로 덮어쓰지 못하게 잠근다. */
let forceLightLocked = false;

export function isForceLightLocked(): boolean {
  return forceLightLocked;
}

/** 잠그면 즉시 light 적용. 해제 시 호출측에서 applyTheme 로 복구한다. */
export function setForceLightTheme(locked: boolean) {
  forceLightLocked = locked;
  if (locked) {
    const root = document.documentElement;
    root.setAttribute('data-theme', 'light');
    root.style.colorScheme = 'light';
  }
}

export function getSystemTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function readStoredTheme(): ThemeMode | null {
  try {
    const raw = localStorage.getItem(THEME_STORAGE_KEY) ?? localStorage.getItem('qurie.theme');
    if (raw === 'light' || raw === 'dark') return raw;
  } catch {
    /* ignore */
  }
  return null;
}

export function resolveInitialTheme(): ThemeMode {
  return readStoredTheme() ?? getSystemTheme();
}

/** DOM에만 반영. 저장은 persistTheme / 사용자 토글에서만 한다. */
export function applyTheme(theme: ThemeMode) {
  const next = forceLightLocked ? 'light' : theme;
  const root = document.documentElement;
  root.setAttribute('data-theme', next);
  root.style.colorScheme = next;
}

export function persistTheme(theme: ThemeMode) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    /* ignore */
  }
}

export function clearStoredTheme() {
  try {
    localStorage.removeItem(THEME_STORAGE_KEY);
    localStorage.removeItem('qurie.theme');
  } catch {
    /* ignore */
  }
}

export function toggleTheme(current: ThemeMode): ThemeMode {
  const next: ThemeMode = current === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  persistTheme(next);
  return next;
}
