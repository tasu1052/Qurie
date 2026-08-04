import { useLayoutEffect } from 'react';
import { applyTheme, resolveInitialTheme, setForceLightTheme } from '../theme/theme';

/**
 * 마케팅 화면(랜딩·데모 요청)을 항상 라이트 모드로 고정한다.
 * ThemeProvider 의 applyTheme(dark) 보다 우선한다.
 */
export function useMarketingLightTheme() {
  useLayoutEffect(() => {
    setForceLightTheme(true);
    return () => {
      setForceLightTheme(false);
      applyTheme(resolveInitialTheme());
    };
  }, []);
}
