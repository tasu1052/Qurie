import { useContext } from 'react';
import { ThemeContext, type ThemeContextValue } from './ThemeContext';

export type { ThemeContextValue };

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return ctx;
}

/** For ThemeToggle — returns null outside provider instead of throwing. */
export function useThemeOptional(): ThemeContextValue | null {
  return useContext(ThemeContext);
}
