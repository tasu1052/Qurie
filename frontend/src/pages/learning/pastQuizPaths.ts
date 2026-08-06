import { useLocation } from 'react-router-dom';

export type PastQuizBasePath = '/app' | '/manager';

export const SESSION_LIST_PAGE_TITLE = '세션 목록';

export function sessionListTitle(basePath: PastQuizBasePath): string {
  return basePath === '/manager' ? '세션' : SESSION_LIST_PAGE_TITLE;
}

export function sessionListPath(basePath: PastQuizBasePath): string {
  return basePath === '/manager' ? '/manager/sessions' : `${basePath}/quizzes`;
}

export function usePastQuizBasePath(explicit?: PastQuizBasePath): PastQuizBasePath {
  const { pathname } = useLocation();
  if (explicit) return explicit;
  return pathname.startsWith('/manager') ? '/manager' : '/app';
}
