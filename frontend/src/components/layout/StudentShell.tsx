import type { ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  FileText,
  User,
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

const studentNav = [
  { key: 'dashboard', label: '대시보드', path: '/app', icon: <LayoutDashboard {...iconProps} /> },
  { key: 'class', label: '클래스', path: '/app/classes/seoul-1', icon: <BookOpen {...iconProps} /> },
  { key: 'report', label: '종합 리포트', path: '/app/report', icon: <FileText {...iconProps} /> },
  { key: 'me', label: '마이페이지', path: '/app/me', icon: <User {...iconProps} /> },
];

export function StudentShell({ activeKey, breadcrumbs, children }: AppShellProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const items = studentNav.map(({ key, label, icon }) => ({ key, label, icon }));

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
              박
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.3 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>박민수</span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>minsu@ssafy.com</span>
            </div>
          </div>
        }
      />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Topbar
          breadcrumbs={breadcrumbs}
          userName="박민수"
          userRole="STUDENT"
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
