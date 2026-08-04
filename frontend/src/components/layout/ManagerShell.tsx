import type { ReactNode } from 'react';
import { AppShell, type AppShellProps } from './AppShell';

type ManagerShellProps = Omit<AppShellProps, 'role'> & { children: ReactNode };

export function ManagerShell({ activeKey, breadcrumbs, children }: ManagerShellProps) {
  return (
    <AppShell role="MANAGER" activeKey={activeKey} breadcrumbs={breadcrumbs}>
      {children}
    </AppShell>
  );
}

export { PageMain } from './PageMain';
