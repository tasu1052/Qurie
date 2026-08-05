import type { ReactNode } from 'react';
import { AppShell } from '../../components/layout/AppShell';
import { PageMain } from '../../components/layout/PageMain';
import { roleFromBasePath } from '../../components/layout/shellConfig';
import type { PastQuizBasePath } from './pastQuizPaths';

export function PastQuizShell({
  basePath,
  breadcrumbs,
  children,
}: {
  basePath: PastQuizBasePath;
  breadcrumbs: string[];
  children: ReactNode;
}) {
  // 매니저는 '세션 목록' 탭을 없애고 세션 탭에 통합했으므로 사이드바 하이라이트도 sessions 로 맞춘다.
  const activeKey = basePath === '/manager' ? 'sessions' : 'quizzes';
  return (
    <AppShell role={roleFromBasePath(basePath)} activeKey={activeKey} breadcrumbs={breadcrumbs}>
      <PageMain>{children}</PageMain>
    </AppShell>
  );
}
