import type { ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  FileText,
  User,
  Bell,
} from 'lucide-react';
import { Button, Sidebar, Topbar } from '../../ds';
import logoSrc from '../../ds/assets/logo.png';
import { useGetMyClasses, useLogout, useMe } from '../../data';
import { SidebarAccountFooter } from './SidebarAccountFooter';

const iconProps = { size: 16, strokeWidth: 1.75 } as const;

type AppShellProps = {
  activeKey: string;
  breadcrumbs: string[];
  children: ReactNode;
};

export function StudentShell({ activeKey, breadcrumbs, children }: AppShellProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { data: user } = useMe();
  const { data: myClasses } = useGetMyClasses();
  const logout = useLogout();
  const classPath =
    myClasses[0] != null ? `/app/classes/${myClasses[0].id}` : '/app';

  const studentNav = [
    { key: 'dashboard', label: '대시보드', path: '/app', icon: <LayoutDashboard {...iconProps} /> },
    { key: 'class', label: '클래스', path: classPath, icon: <BookOpen {...iconProps} /> },
    { key: 'report', label: '종합 리포트', path: '/app/report', icon: <FileText {...iconProps} /> },
    { key: 'me', label: '마이페이지', path: '/app/me', icon: <User {...iconProps} /> },
  ];

  const items = studentNav.map(({ key, label, icon }) => ({ key, label, icon }));
  const goMe = () => navigate('/app/me');

  const onLogout = () => {
    logout.mutate(undefined, {
      onSettled: () => navigate('/login', { replace: true }),
    });
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-app)', fontFamily: 'var(--font-sans)' }}>
      <Sidebar
        items={items}
        activeKey={activeKey}
        logoSrc={logoSrc}
        onSelect={(key) => {
          const item = studentNav.find((n) => n.key === key);
          if (!item) return;
          navigate({ pathname: item.path, search: location.search });
        }}
        footer={
          <SidebarAccountFooter
            name={user.name}
            email={user.email}
            onLogout={onLogout}
            onProfileClick={goMe}
            avatarStyle={{
              background: 'var(--tertiary-100)',
              color: 'var(--quaternary-400)',
            }}
          />
        }
      />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Topbar
          breadcrumbs={breadcrumbs}
          userName={user.name}
          userRole={user.role}
          hideSearch
          onUserClick={goMe}
          actions={
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: 'var(--text-secondary)', display: 'flex', cursor: 'pointer' }}>
                <Bell size={17} strokeWidth={1.75} />
              </span>
              <Button variant="ghost" size="sm" onClick={onLogout} disabled={logout.isPending}>
                로그아웃
              </Button>
            </span>
          }
        />
        {children}
      </div>
    </div>
  );
}

export { PageMain } from './MasterShell';
