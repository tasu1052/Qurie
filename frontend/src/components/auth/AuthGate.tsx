import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Skeleton } from '../../ds';
import { QueryAsyncBoundary, useMe } from '../../data';
import { homePathForRole, roleMatchesPath } from './roleRoutes';

function AuthGateSkeleton() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-app)',
        fontFamily: 'var(--font-sans)',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: 280 }}>
        <Skeleton width="100%" height={20} />
        <Skeleton width="70%" height={14} />
        <Skeleton width="100%" height={120} radius={16} />
      </div>
    </div>
  );
}

function AuthGateInner() {
  const { data: user } = useMe();
  const location = useLocation();

  if (!roleMatchesPath(user.role, location.pathname)) {
    return <Navigate to={homePathForRole(user.role)} replace />;
  }

  return <Outlet />;
}

/**
 * Protects console routes: Suspense-loads /auth/me via teammate's QueryAsyncBoundary,
 * redirects to /login on failure, and corrects role ↔ path mismatches.
 */
export function AuthGate() {
  return (
    <QueryAsyncBoundary
      suspenseFallback={<AuthGateSkeleton />}
      errorFallback={<Navigate to="/login" replace />}
    >
      <AuthGateInner />
    </QueryAsyncBoundary>
  );
}
