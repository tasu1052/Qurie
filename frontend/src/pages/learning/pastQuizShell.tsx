import type { ReactNode } from 'react';
import { StudentShell, PageMain } from '../../components/layout/StudentShell';
import { ManagerShell } from '../../components/layout/ManagerShell';
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
  if (basePath === '/manager') {
    return (
      <ManagerShell activeKey="quizzes" breadcrumbs={breadcrumbs}>
        <PageMain>{children}</PageMain>
      </ManagerShell>
    );
  }
  return (
    <StudentShell activeKey="quizzes" breadcrumbs={breadcrumbs}>
      <PageMain>{children}</PageMain>
    </StudentShell>
  );
}
