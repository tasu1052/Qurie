import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  PlayCircle,
  BookOpen,
  Grid2x2,
  Megaphone,
  UserRound,
} from 'lucide-react';
import { Button, Sidebar, Topbar } from '../../ds';
import logoSrc from '../../ds/assets/logo.png';
import { useLogout, useMe } from '../../data';
import { NotificationBell } from '../notifications/NotificationBell';
import { SidebarAccountFooter } from './SidebarAccountFooter';

const iconProps = { size: 16, strokeWidth: 1.75 } as const;

type AppShellProps = {
  activeKey: string;
  breadcrumbs: string[];
  children: ReactNode;
};

const managerNav = [
  { key: 'dashboard', label: '대시보드', path: '/manager', icon: <LayoutDashboard {...iconProps} /> },
  { key: 'students', label: '학생 관리', path: '/manager/students', icon: <Users {...iconProps} /> },
  { key: 'sessions', label: '세션', path: '/manager/sessions', icon: <PlayCircle {...iconProps} /> },
  { key: 'quizzes', label: '지난 퀴즈', path: '/manager/quizzes', icon: <BookOpen {...iconProps} /> },
  { key: 'groups', label: '그룹', path: '/manager/groups', icon: <Grid2x2 {...iconProps} /> },
  { key: 'announcements', label: '공지사항', path: '/manager/announcements', icon: <Megaphone {...iconProps} /> },
  { key: 'me', label: '마이페이지', path: '/manager/me', icon: <UserRound {...iconProps} /> },
];

export function ManagerShell({ activeKey, breadcrumbs, children }: AppShellProps) {
  const navigate = useNavigate();
  const { data: user } = useMe();
  const logout = useLogout();
  const items = managerNav.map(({ key, label, icon }) => ({ key, label, icon }));

  const goMe = () => navigate('/manager/me');

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
          const item = managerNav.find((n) => n.key === key);
          if (!item) return;
          navigate(item.path);
        }}
        footer={
          <SidebarAccountFooter
            name={user.name}
            email={user.email}
            onLogout={onLogout}
            onProfileClick={goMe}
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
              <NotificationBell role={user.role} />
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
