import type { ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  FileText,
  User,
  Bell,
  Search,
  LogOut,
} from 'lucide-react';
import { Button, Sidebar, Topbar } from '../../ds';
import logoSrc from '../../ds/assets/logo.png';
import { useLogout, useMe } from '../../data';

const iconProps = { size: 16, strokeWidth: 1.75 } as const;

type AppShellProps = {
  activeKey: string;
  breadcrumbs: string[];
  children: ReactNode;
};

const studentNav = [
  { key: 'dashboard', label: '대시보드', path: '/app', icon: <LayoutDashboard {...iconProps} /> },
  { key: 'class', label: '클래스', path: '/app/classes/seoul-1', icon: <BookOpen {...iconProps} /> },
  { key: 'report', label: '종합 리포트', path: '/app/report', icon: <FileText {...iconProps} /> },
  { key: 'me', label: '마이페이지', path: '/app/me', icon: <User {...iconProps} /> },
];

export function StudentShell({ activeKey, breadcrumbs, children }: AppShellProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { data: user } = useMe();
  const logout = useLogout();
  const items = studentNav.map(({ key, label, icon }) => ({ key, label, icon }));
  const initial = (user.name || '?').slice(0, 1);

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
          <div
            style={{
              borderTop: '1px solid var(--divider)',
              paddingTop: 16,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              paddingLeft: 6,
            }}
          >
            <span
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: 'var(--tertiary-100)',
                color: 'var(--quaternary-400)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              {initial}
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.3, minWidth: 0, flex: 1 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{user.name}</span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user.email}
              </span>
            </div>
            <button
              type="button"
              onClick={onLogout}
              title="로그아웃"
              style={{
                border: 'none',
                background: 'transparent',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                display: 'inline-flex',
                padding: 4,
              }}
            >
              <LogOut size={14} strokeWidth={1.75} />
            </button>
          </div>
        }
      />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Topbar
          breadcrumbs={breadcrumbs}
          userName={user.name}
          userRole={user.role}
          searchIcon={<Search size={14} strokeWidth={1.75} />}
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
