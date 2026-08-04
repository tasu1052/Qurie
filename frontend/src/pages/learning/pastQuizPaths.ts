import { useLocation } from 'react-router-dom';

export type PastQuizBasePath = '/app' | '/manager';

export function usePastQuizBasePath(explicit?: PastQuizBasePath): PastQuizBasePath {
  const { pathname } = useLocation();
  if (explicit) return explicit;
  return pathname.startsWith('/manager') ? '/manager' : '/app';
}
