import type { UserRole } from '../../network/core/types';
import type { AuthUserResponse } from '../../network/auth/auth-apis';

export function homePathForRole(role: UserRole): string {
  switch (role) {
    case 'MASTER':
      return '/master';
    case 'MANAGER':
      return '/manager';
    case 'STUDENT':
      return '/app';
    default:
      return '/login';
  }
}

export function roleMatchesPath(role: UserRole, pathname: string): boolean {
  if (role === 'MASTER') return pathname.startsWith('/master');
  if (role === 'MANAGER') return pathname.startsWith('/manager');
  if (role === 'STUDENT') return pathname.startsWith('/app');
  return false;
}

export function isAuthenticatedUser(user: AuthUserResponse | undefined): user is AuthUserResponse {
  return Boolean(user?.id && user.role);
}
