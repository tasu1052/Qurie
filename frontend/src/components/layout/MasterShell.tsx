import type { ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Layers,
  BookOpen,
  Users,
  Megaphone,
  UserRound,
  Settings,
} from 'lucide-react';
import { Button, Footer, Sidebar, Topbar } from '../../ds';
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

const masterNav = [
  { key: 'dashboard', label: '대시보드', path: '/master', icon: <LayoutDashboard {...iconProps} /> },
  { key: 'tracks', label: '트랙 관리', path: '/master/tracks', icon: <Layers {...iconProps} /> },
  { key: 'classes', label: '클래스 관리', path: '/master/classes', icon: <BookOpen {...iconProps} /> },
  { key: 'members', label: '회원 관리', path: '/master/members', icon: <Users {...iconProps} /> },
  { key: 'announcements', label: '공지사항', path: '/master/announcements', icon: <Megaphone {...iconProps} /> },
  { key: 'me', label: '마이페이지', path: '/master/me', icon: <UserRound {...iconProps} /> },
  { key: 'settings', label: '설정', path: '/master/settings', icon: <Settings {...iconProps} /> },
];

export function MasterShell({ activeKey, breadcrumbs, children }: AppShellProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { data: user } = useMe();
  const logout = useLogout();
  const items = masterNav.map(({ key, label, icon }) => ({ key, label, icon }));

  const goMe = () => navigate('/master/me');

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
          const item = masterNav.find((n) => n.key === key);
          if (!item) return;
          navigate({ pathname: item.path, search: location.search });
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

export function PageMain({ children }: { children: ReactNode }) {
  return (
    <main
      style={{
        flex: 1,
        width: '100%',
        maxWidth: 'var(--content-max)',
        marginInline: 'auto',
        padding: 'var(--content-pad)',
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: 24,
        boxSizing: 'border-box',
      }}
    >
      {children}
      <Footer />
    </main>
  );
}
