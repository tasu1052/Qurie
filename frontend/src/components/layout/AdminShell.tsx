import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, LogOut } from 'lucide-react';
import { Button, Sidebar, Topbar } from '../../ds';
import logoSrc from '../../ds/assets/logo.png';
import { getAdminSession, logoutAdmin } from '../../data';
import { PageMain } from './MasterShell';

const iconProps = { size: 16, strokeWidth: 1.75 } as const;

type AdminShellProps = {
  activeKey: string;
  breadcrumbs: string[];
  children: ReactNode;
};

const adminNav = [
  { key: 'bootcamps', label: '부트캠프', path: '/admin', icon: <Building2 {...iconProps} /> },
];

export function AdminShell({ activeKey, breadcrumbs, children }: AdminShellProps) {
  const navigate = useNavigate();
  const session = getAdminSession();
  const name = session?.name ?? '관리자';
  const email = session?.email ?? '';
  const initial = name.slice(0, 1);
  const items = adminNav.map(({ key, label, icon }) => ({ key, label, icon }));

  const onLogout = () => {
    logoutAdmin();
    navigate('/admin/login', { replace: true });
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-app)', fontFamily: 'var(--font-sans)' }}>
      <Sidebar
        items={items}
        activeKey={activeKey}
        logoSrc={logoSrc}
        onSelect={(key) => {
          const item = adminNav.find((n) => n.key === key);
          if (item) navigate(item.path);
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
              {initial}
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.3, minWidth: 0, flex: 1 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{name}</span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {email}
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
          userName={name}
          userRole="ADMIN"
          hideSearch
          actions={
            <Button variant="ghost" size="sm" onClick={onLogout}>
              로그아웃
            </Button>
          }
        />
        {children}
      </div>
    </div>
  );
}

export { PageMain };
