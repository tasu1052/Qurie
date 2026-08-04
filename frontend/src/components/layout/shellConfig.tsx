import type { ReactNode } from 'react';
import {
  LayoutDashboard,
  Layers,
  BookOpen,
  Users,
  Megaphone,
  UserRound,
  PlayCircle,
  FileText,
  User,
} from 'lucide-react';
import type { UserRole } from '../../network/core/types';

const iconProps = { size: 16, strokeWidth: 1.75 } as const;

export type ShellNavItem = {
  key: string;
  label: string;
  path: string;
  icon: ReactNode;
};

export type ShellRoleConfig = {
  nav: ShellNavItem[];
  mePath: string;
};

const masterNav: ShellNavItem[] = [
  { key: 'dashboard', label: '대시보드', path: '/master', icon: <LayoutDashboard {...iconProps} /> },
  { key: 'tracks', label: '트랙 관리', path: '/master/tracks', icon: <Layers {...iconProps} /> },
  { key: 'classes', label: '클래스 관리', path: '/master/classes', icon: <BookOpen {...iconProps} /> },
  { key: 'members', label: '매니저 관리', path: '/master/members', icon: <Users {...iconProps} /> },
  { key: 'announcements', label: '공지사항', path: '/master/announcements', icon: <Megaphone {...iconProps} /> },
  { key: 'me', label: '마이페이지', path: '/master/me', icon: <UserRound {...iconProps} /> },
];

const managerNav: ShellNavItem[] = [
  { key: 'dashboard', label: '대시보드', path: '/manager', icon: <LayoutDashboard {...iconProps} /> },
  { key: 'students', label: '학생 관리', path: '/manager/students', icon: <Users {...iconProps} /> },
  { key: 'sessions', label: '세션', path: '/manager/sessions', icon: <PlayCircle {...iconProps} /> },
  { key: 'quizzes', label: '세션 목록', path: '/manager/quizzes', icon: <BookOpen {...iconProps} /> },
  { key: 'announcements', label: '공지사항', path: '/manager/announcements', icon: <Megaphone {...iconProps} /> },
  { key: 'me', label: '마이페이지', path: '/manager/me', icon: <UserRound {...iconProps} /> },
];

const studentNav: ShellNavItem[] = [
  { key: 'dashboard', label: '대시보드', path: '/app', icon: <LayoutDashboard {...iconProps} /> },
  { key: 'quizzes', label: '세션 목록', path: '/app/quizzes', icon: <BookOpen {...iconProps} /> },
  { key: 'report', label: '리포트', path: '/app/report', icon: <FileText {...iconProps} /> },
  { key: 'me', label: '마이페이지', path: '/app/me', icon: <User {...iconProps} /> },
];

/** All roles share the same shell chrome; only nav items and me path differ. */
export const shellConfigByRole: Record<UserRole, ShellRoleConfig> = {
  MASTER: { nav: masterNav, mePath: '/master/me' },
  MANAGER: { nav: managerNav, mePath: '/manager/me' },
  STUDENT: { nav: studentNav, mePath: '/app/me' },
};

export function roleFromBasePath(basePath: '/app' | '/manager'): UserRole {
  return basePath === '/manager' ? 'MANAGER' : 'STUDENT';
}
