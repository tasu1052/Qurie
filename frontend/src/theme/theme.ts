export type ThemeMode = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'theme';

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
  const root = document.documentElement;
  root.setAttribute('data-theme', theme);
  root.style.colorScheme = theme;
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
