import { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useMeOptional } from '../../data';
import { queryKeys } from '../../network/core/queryKeys';
import { getUserProfile } from '../../network/user/user-apis';
import { useThemeOptional } from '../../theme/useTheme';
import type { ThemeMode } from '../../theme/theme';

/**
 * 로그인 사용자의 프로필 theme 을 기기 localStorage 보다 우선 적용한다.
 * 다른 PC 에서도 같은 계정이면 다크모드가 따라가도록 한다.
 */
export function UserThemeSync() {
  const me = useMeOptional();
  const userId = me.data?.id;
  const profile = useQuery({
    queryKey: userId ? queryKeys.users.detail(userId) : ['users', 'theme', 'idle'],
    queryFn: () => getUserProfile(userId as number),
    enabled: Boolean(userId),
    staleTime: 60_000,
    retry: false,
  });
  const themeCtx = useThemeOptional();
  const appliedForUser = useRef<number | null>(null);

  useEffect(() => {
    if (!themeCtx || !userId || !profile.data) return;
    const remote = profile.data.theme;
    if (remote !== 'light' && remote !== 'dark') return;
    if (appliedForUser.current === userId && themeCtx.theme === remote) return;
    appliedForUser.current = userId;
    if (themeCtx.theme !== remote) {
      themeCtx.setTheme(remote as ThemeMode);
    }
  }, [themeCtx, userId, profile.data]);

  return null;
}
