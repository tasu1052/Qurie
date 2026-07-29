/**
 * Temporary admin console store (localStorage).
 * Swap for real admin/bootcamp API hooks via `src/data/` when backend lands.
 */

export type AdminSession = {
  email: string;
  name: string;
};

export type MasterInviteStatus = 'PENDING' | 'ACCEPTED' | 'EXPIRED';

export type MasterInvite = {
  email: string;
  token: string;
  status: MasterInviteStatus;
  invitedAt: string;
};

/** Bootcamp ≈ enterprise row created by Qurie staff. */
export type AdminBootcamp = {
  id: number;
  name: string;
  createdAt: string;
  masterInvite: MasterInvite | null;
};

const SESSION_KEY = 'qurie.admin.session';
const BOOTCAMPS_KEY = 'qurie.admin.bootcamps';
const NEXT_ID_KEY = 'qurie.admin.nextId';

/** Sample Qurie staff account (DB seed on backend; mirrored here for UI-only login). */
export const ADMIN_SAMPLE = {
  email: 'admin@qurie.app',
  password: 'admin1234',
  name: '큐리 관리자',
} as const;

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

const seedBootcamps: AdminBootcamp[] = [
  {
    id: 1,
    name: 'SSAFY 서울캠퍼스',
    createdAt: '2026-07-01T09:00:00.000Z',
    masterInvite: {
      email: 'master@ssafy.com',
      token: 'dev-master-ssafy-1',
      status: 'PENDING',
      invitedAt: '2026-07-02T10:00:00.000Z',
    },
  },
];

export function getAdminSession(): AdminSession | null {
  return readJson<AdminSession | null>(SESSION_KEY, null);
}

export function setAdminSession(session: AdminSession | null) {
  if (!session) {
    localStorage.removeItem(SESSION_KEY);
    return;
  }
  writeJson(SESSION_KEY, session);
}

export function loginAdmin(email: string, password: string): AdminSession | null {
  if (email.trim() === ADMIN_SAMPLE.email && password === ADMIN_SAMPLE.password) {
    const session: AdminSession = { email: ADMIN_SAMPLE.email, name: ADMIN_SAMPLE.name };
    setAdminSession(session);
    return session;
  }
  return null;
}

export function logoutAdmin() {
  setAdminSession(null);
}

export function listBootcamps(): AdminBootcamp[] {
  const stored = readJson<AdminBootcamp[] | null>(BOOTCAMPS_KEY, null);
  if (!stored) {
    writeJson(BOOTCAMPS_KEY, seedBootcamps);
    writeJson(NEXT_ID_KEY, 2);
    return seedBootcamps;
  }
  return stored;
}

function nextBootcampId(): number {
  const next = readJson<number>(NEXT_ID_KEY, 2);
  writeJson(NEXT_ID_KEY, next + 1);
  return next;
}

export function getBootcamp(id: number): AdminBootcamp | undefined {
  return listBootcamps().find((b) => b.id === id);
}

export function createBootcamp(name: string): AdminBootcamp {
  const bootcamp: AdminBootcamp = {
    id: nextBootcampId(),
    name: name.trim(),
    createdAt: new Date().toISOString(),
    masterInvite: null,
  };
  const list = listBootcamps();
  writeJson(BOOTCAMPS_KEY, [bootcamp, ...list]);
  return bootcamp;
}

export function inviteMaster(bootcampId: number, email: string): AdminBootcamp | null {
  const list = listBootcamps();
  const idx = list.findIndex((b) => b.id === bootcampId);
  if (idx < 0) return null;

  const token = `dev-master-${bootcampId}-${Date.now().toString(36)}`;
  const updated: AdminBootcamp = {
    ...list[idx],
    masterInvite: {
      email: email.trim(),
      token,
      status: 'PENDING',
      invitedAt: new Date().toISOString(),
    },
  };
  const next = [...list];
  next[idx] = updated;
  writeJson(BOOTCAMPS_KEY, next);
  return updated;
}

export function signupInviteUrl(token: string): string {
  const base = typeof window !== 'undefined' ? window.location.origin : '';
  return `${base}/signup?token=${encodeURIComponent(token)}`;
}
