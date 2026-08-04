import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Layers,
  BookOpen,
  Users,
  Megaphone,
  UserRound,
  Menu,
  X,
} from 'lucide-react';
import { Footer, Sidebar, Topbar } from '../../ds';
import logoSrc from '../../ds/assets/logo.png';
import { useMe } from '../../data';
import { NotificationBell } from '../notifications/NotificationBell';
import { SidebarAccountFooter } from './SidebarAccountFooter';

const iconProps = { size: 16, strokeWidth: 1.75 } as const;
const MOBILE_BREAKPOINT = 768;

type AppShellProps = {
  activeKey: string;
  breadcrumbs: string[];
  children: ReactNode;
};

const masterNav = [
  { key: 'dashboard', label: '대시보드', path: '/master', icon: <LayoutDashboard {...iconProps} /> },
  { key: 'tracks', label: '트랙 관리', path: '/master/tracks', icon: <Layers {...iconProps} /> },
  { key: 'classes', label: '클래스 관리', path: '/master/classes', icon: <BookOpen {...iconProps} /> },
  { key: 'members', label: '매니저 관리', path: '/master/members', icon: <Users {...iconProps} /> },
  { key: 'announcements', label: '공지사항', path: '/master/announcements', icon: <Megaphone {...iconProps} /> },
  { key: 'me', label: '마이페이지', path: '/master/me', icon: <UserRound {...iconProps} /> },
];

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

export function MasterShell({ activeKey, breadcrumbs, children }: AppShellProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { data: user } = useMe();
  const isMobile = useIsMobile();
  const [navOpen, setNavOpen] = useState(false);
  const items = masterNav.map(({ key, label, icon }) => ({ key, label, icon }));

  const goMe = () => navigate('/master/me');

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
    const item = masterNav.find((n) => n.key === key);
    if (!item) return;
    navigate({ pathname: item.path, search: location.search });
    setNavOpen(false);
  };

  return (
    <div
      className={`qurie-master-shell${navOpen ? ' qurie-master-shell--nav-open' : ''}`}
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
          className="qurie-master-shell__backdrop"
          aria-label="메뉴 닫기"
          onClick={() => setNavOpen(false)}
        />
      ) : null}
      <div className="qurie-master-shell__sidebar">
        <Sidebar
          items={items}
          activeKey={activeKey}
          logoSrc={logoSrc}
          onSelect={onNavSelect}
          footer={
            <SidebarAccountFooter
              name={user.name}
              email={user.email}
              onProfileClick={goMe}
            />
          }
        />
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: 0 }}>
        <Topbar
          style={{ flexShrink: 0 }}
          breadcrumbs={breadcrumbs}
          userName={user.name}
          userRole={user.role}
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
          actions={<NotificationBell role={user.role} />}
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
        minHeight: 0,
        overflowY: 'auto',
        scrollbarGutter: 'stable',
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
