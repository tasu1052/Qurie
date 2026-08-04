export type UserProfileExtras = {
  phone?: string;
  region?: string;
  gender?: string;
};

const STORAGE_KEY = 'qurie-user-profile-extras';

function readAll(): Record<string, UserProfileExtras> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, UserProfileExtras>;
    }
  } catch {
    /* ignore */
  }
  return {};
}

function writeAll(map: Record<string, UserProfileExtras>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

export function getUserProfileExtras(email: string): UserProfileExtras {
  const key = email.trim().toLowerCase();
  if (!key) return {};
  return readAll()[key] ?? {};
}

export function setUserProfileExtras(email: string, extras: UserProfileExtras) {
  const key = email.trim().toLowerCase();
  if (!key) return;
  const map = readAll();
  map[key] = { ...map[key], ...extras };
  writeAll(map);
}

export const REGION_OPTIONS = [
  { value: 'all', label: '전체 지역' },
  { value: 'seoul', label: '서울' },
  { value: 'daejeon', label: '대전' },
  { value: 'gwangju', label: '광주' },
  { value: 'gumi', label: '구미' },
  { value: 'busan', label: '부산' },
] as const;

export function regionLabel(value: string | undefined): string {
  if (!value || value === 'all') return '—';
  return REGION_OPTIONS.find((r) => r.value === value)?.label ?? value;
}
