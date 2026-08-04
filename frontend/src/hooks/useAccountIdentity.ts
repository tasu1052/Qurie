import { useMe } from '../data';

/** Single source for account display across topbar, sidebar, and my page. */
export function useAccountIdentity() {
  const { data: user } = useMe();
  const name = user.name ?? '';
  const email = user.email ?? '';
  const initial = (name || '?').slice(0, 1);

  return {
    id: user.id,
    name,
    email,
    role: user.role,
    initial,
  };
}
