import type { ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Layers,
  BookOpen,
  Users,
  Megaphone,
  BarChart3,
  Settings,
  Bell,
  Search,
} from 'lucide-react';
import { Footer, Sidebar, Topbar } from '../../ds';
import logoSrc from '../../ds/assets/logo.png';

const iconProps = { size: 16, strokeWidth: 1.75 } as const;

type AppShellProps = {
  activeKey: string;
  breadcrumbs: string[];
  children: ReactNode;
};

const masterNav = [
  { key: 'dashboard', label: '대시보드', path: '/master', icon: <LayoutDashboard {...iconProps} /> },
  { key: 'tracks', label: '트랙 관리', path: '/master/tracks', icon: <Layers {...iconProps} />, badge: '4' },
  { key: 'classes', label: '클래스 관리', path: '/master/classes', icon: <BookOpen {...iconProps} />, badge: '6' },
  { key: 'members', label: '회원 관리', path: '/master/members', icon: <Users {...iconProps} /> },
  { key: 'announcements', label: '공지사항', path: '/master/announcements', icon: <Megaphone {...iconProps} /> },
  { key: 'analytics', label: '분석 리포트', path: '/master/analytics', icon: <BarChart3 {...iconProps} /> },
  { key: 'settings', label: '설정', path: '/master/settings', icon: <Settings {...iconProps} /> },
];

export function MasterShell({ activeKey, breadcrumbs, children }: AppShellProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const items = masterNav.map(({ key, label, icon, badge }) => ({ key, label, icon, badge }));

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
          <div
            style={{
              borderTop: '1px solid var(--divider)',
              paddingTop: 16,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              paddingLeft: 6,
            }}
          >            <span
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
              김
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.3 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>김마스터</span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>master@ssafy.com</span>
            </div>
          </div>
        }
      />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Topbar
          breadcrumbs={breadcrumbs}
          userName="김마스터"
          userRole="MASTER"
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

export function PageMain({ children }: { children: ReactNode }) {
  return (
    <main
      style={{
        flex: 1,
        width: '100%',
        maxWidth: 'var(--content-max)',
        marginInline: 'auto',
        padding: 'var(--content-pad)',
        display: 'flex',
        flexDirection: 'column',
        gap: 24,
        minWidth: 0,
        minHeight: 0,
        boxSizing: 'border-box',
      }}
    >
      {children}
      <Footer />
    </main>
  );
}
