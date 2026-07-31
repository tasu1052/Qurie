import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { onLogout } from '../../network/auth/logoutSignal';

/** 로그인이 필요한 화면들. 이 밖(랜딩·로그인 등)에 있으면 로그아웃 신호로 이동시키지 않는다. */
const PROTECTED_PREFIXES = ['/master', '/manager', '/app', '/session', '/admin'];

/**
 * 다른 탭에서 로그아웃했을 때 이 탭도 함께 정리한다.
 *
 * 쿠키는 지워졌지만 이 탭의 React Query 캐시에는 `me` 와 이전 사용자 데이터가 남아 있어
 * 다음 요청이 나갈 때까지 로그인 상태로 보인다 — 세션 방처럼 폴링이 없는 화면은 계속 그대로다.
 */
export function LogoutSync() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    return onLogout(() => {
      queryClient.clear();
      const onProtectedPage = PROTECTED_PREFIXES.some((prefix) =>
        location.pathname.startsWith(prefix),
      );
      if (onProtectedPage) {
        navigate('/login', { replace: true });
      }
    });
  }, [location.pathname, navigate, queryClient]);

  return null;
}
