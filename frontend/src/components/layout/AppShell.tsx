import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { Sidebar, Topbar } from '../../ds';
import logoSrc from '../../ds/assets/logo.png';
import { useAccountIdentity } from '../../hooks/useAccountIdentity';
import type { UserRole } from '../../network/core/types';
import { NotificationBell } from '../notifications/NotificationBell';
import { shellConfigByRole } from './shellConfig';
import { SidebarAccountFooter } from './SidebarAccountFooter';

const MOBILE_BREAKPOINT = 768;

export type AppShellProps = {
  role: UserRole;
  activeKey: string;
  breadcrumbs: string[];
  children: ReactNode;
};

function useIsMobile(breakpoint = MOBILE_BREAKPOINT) {
  const [mobile, setMobile] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(`(max-width: ${breakpoint}px)`).matches,
  );

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint}px)`);
    const onChange = () => setMobile(mq.matches);
    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [breakpoint]);

  return mobile;
}

export function AppShell({ role, activeKey, breadcrumbs, children }: AppShellProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const account = useAccountIdentity();
  const config = shellConfigByRole[role];
  const isMobile = useIsMobile();
  const [navOpen, setNavOpen] = useState(false);

  const items = config.nav.map(({ key, label, icon }) => ({ key, label, icon }));
  const goMe = () => navigate(config.mePath);

  useEffect(() => {
    setNavOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!isMobile) setNavOpen(false);
  }, [isMobile]);

  useEffect(() => {
    if (!navOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [navOpen]);

  const onNavSelect = (key: string) => {
    const item = config.nav.find((n) => n.key === key);
    if (!item) return;
    navigate({ pathname: item.path, search: location.search });
    setNavOpen(false);
  };

  return (
    <div
      className={`qurie-app-shell${navOpen ? ' qurie-app-shell--nav-open' : ''}`}
      style={{
        display: 'flex',
        height: '100dvh',
        overflow: 'hidden',
        background: 'var(--bg-app)',
        fontFamily: 'var(--font-sans)',
      }}
    >
      {isMobile && navOpen ? (
        <button
          type="button"
          className="qurie-app-shell__backdrop"
          aria-label="메뉴 닫기"
          onClick={() => setNavOpen(false)}
        />
      ) : null}
      <div className="qurie-app-shell__sidebar">
        <Sidebar
          items={items}
          activeKey={activeKey}
          logoSrc={logoSrc}
          onSelect={onNavSelect}
          footer={
            <SidebarAccountFooter name={account.name} email={account.email} onProfileClick={goMe} />
          }
        />
      </div>
      <div className="qurie-app-shell__main">
        <Topbar
          style={{ flexShrink: 0, width: '100%' }}
          breadcrumbs={breadcrumbs}
          userName={account.name}
          userEmail={account.email}
          hideSearch
          onUserClick={goMe}
          leading={
            isMobile ? (
              <button
                type="button"
                className="qurie-topbar__menu"
                aria-label={navOpen ? '메뉴 닫기' : '메뉴 열기'}
                aria-expanded={navOpen}
                onClick={() => setNavOpen((v) => !v)}
              >
                {navOpen ? <X size={18} strokeWidth={1.75} /> : <Menu size={18} strokeWidth={1.75} />}
              </button>
            ) : null
          }
          actions={<NotificationBell role={account.role} />}
        />
        {children}
      </div>
    </div>
  );
}
