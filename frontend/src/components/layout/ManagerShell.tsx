import type { ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  PlayCircle,
  Grid2x2,
  Settings,
  Bell,
  Search,
} from 'lucide-react';
import { Sidebar, Topbar } from '../../ds';
import logoSrc from '../../ds/assets/logo.png';

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
  { key: 'groups', label: '그룹', path: '/manager/groups', icon: <Grid2x2 {...iconProps} /> },
  { key: 'settings', label: '설정', path: '/manager/settings', icon: <Settings {...iconProps} /> },
];

export function ManagerShell({ activeKey, breadcrumbs, children }: AppShellProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const items = managerNav.map(({ key, label, icon }) => ({ key, label, icon }));

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-app)', fontFamily: 'var(--font-sans)' }}>
      <Sidebar
        items={items}
        activeKey={activeKey}
        logoSrc={logoSrc}
        onSelect={(key) => {
          const item = managerNav.find((n) => n.key === key);
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
                background: 'var(--accent-soft)',
                color: 'var(--accent)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              지
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.3 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>김지원</span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>jiwon@ssafy.com</span>
            </div>
          </div>
        }
      />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Topbar
          breadcrumbs={breadcrumbs}
          userName="김지원"
          userRole="MANAGER"
          searchIcon={<Search size={14} strokeWidth={1.75} />}
          actions={
            <span style={{ color: 'var(--text-secondary)', display: 'flex', cursor: 'pointer' }}>
              <Bell size={17} strokeWidth={1.75} />
            </span>
          }
        />
        {children}
      </div>
    </div>
  );
}

export { PageMain } from './MasterShell';
