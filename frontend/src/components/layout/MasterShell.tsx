import type { ReactNode } from 'react';
import { useMe } from '../../data';
import { AppShell, type AppShellProps } from './AppShell';

type ShellProps = Omit<AppShellProps, 'role'> & { children: ReactNode };

/** @deprecated Prefer AppPage for full pages, or AppShell + PageMain. */
function RoleShell({ activeKey, breadcrumbs, children }: ShellProps) {
  const { data: user } = useMe();
  return (
    <AppShell role={user.role} activeKey={activeKey} breadcrumbs={breadcrumbs}>
      {children}
    </AppShell>
  );
}

export const MasterShell = RoleShell;
export const ManagerShell = RoleShell;
export const StudentShell = RoleShell;

export { PageMain } from './PageMain';
