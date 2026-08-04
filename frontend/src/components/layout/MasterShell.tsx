import type { ReactNode } from 'react';
import { AppShell, type AppShellProps } from './AppShell';

type MasterShellProps = Omit<AppShellProps, 'role'> & { children: ReactNode };

export function MasterShell({ activeKey, breadcrumbs, children }: MasterShellProps) {
  return (
    <AppShell role="MASTER" activeKey={activeKey} breadcrumbs={breadcrumbs}>
      {children}
    </AppShell>
  );
}

export { PageMain } from './PageMain';
