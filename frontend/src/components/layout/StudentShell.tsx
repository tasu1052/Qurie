import type { ReactNode } from 'react';
import { AppShell, type AppShellProps } from './AppShell';

type StudentShellProps = Omit<AppShellProps, 'role'> & { children: ReactNode };

export function StudentShell({ activeKey, breadcrumbs, children }: StudentShellProps) {
  return (
    <AppShell role="STUDENT" activeKey={activeKey} breadcrumbs={breadcrumbs}>
      {children}
    </AppShell>
  );
}

export { PageMain } from './PageMain';
