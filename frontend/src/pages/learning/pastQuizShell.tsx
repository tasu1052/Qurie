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
  return (
    <AppShell role={roleFromBasePath(basePath)} activeKey="quizzes" breadcrumbs={breadcrumbs}>
      <PageMain>{children}</PageMain>
    </AppShell>
  );
}
