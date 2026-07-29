import { Navigate, Outlet } from 'react-router-dom';
import { getAdminSession } from '../../data';

/**
 * Protects /admin console routes with a local admin session
 * (separate from MASTER/MANAGER/STUDENT AuthGate).
 */
export function AdminGate() {
  const session = getAdminSession();
  if (!session) {
    return <Navigate to="/admin/login" replace />;
  }
  return <Outlet />;
}
