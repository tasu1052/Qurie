import type { ReactNode } from 'react';
import { useMe } from '../../data';
import { AppShell, type AppShellProps } from './AppShell';
import { PageMain } from './PageMain';

export type AppPageProps = Omit<AppShellProps, 'role'> & {
  children: ReactNode;
};

/** Role-aware page wrapper — master shell standard (AppShell + PageMain). */
export function AppPage({ activeKey, breadcrumbs, children }: AppPageProps) {
  const { data: user } = useMe();

  return (
    <AppShell role={user.role} activeKey={activeKey} breadcrumbs={breadcrumbs}>
      <PageMain>{children}</PageMain>
    </AppShell>
  );
}

export { PageMain } from './PageMain';
