const STORAGE_PREFIX = 'qurie:session-project:';
const TITLE_PREFIX = 'qurie:session-title:';
const ACTIVE_FILE_PREFIX = 'qurie:session-active-file:';

export type SessionProjectRef = {
  projectId: number;
  versionHash: string;
};

export function saveSessionTitle(sessionId: number, title: string): void {
  const trimmed = title.trim();
  if (!trimmed) return;
  sessionStorage.setItem(`${TITLE_PREFIX}${sessionId}`, trimmed);
}

export function loadSessionTitle(sessionId: number): string | null {
  try {
    const raw = sessionStorage.getItem(`${TITLE_PREFIX}${sessionId}`);
    return raw && raw.trim() ? raw.trim() : null;
  } catch {
    return null;
  }
}

export function loadSessionProject(sessionId: number): SessionProjectRef | null {
  try {
    const raw = sessionStorage.getItem(`${STORAGE_PREFIX}${sessionId}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SessionProjectRef;
    if (
      typeof parsed.projectId !== 'number' ||
      !Number.isFinite(parsed.projectId) ||
      typeof parsed.versionHash !== 'string'
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function saveSessionProject(sessionId: number, ref: SessionProjectRef): void {
  sessionStorage.setItem(`${STORAGE_PREFIX}${sessionId}`, JSON.stringify(ref));
}

export function clearSessionProject(sessionId: number): void {
  sessionStorage.removeItem(`${STORAGE_PREFIX}${sessionId}`);
  sessionStorage.removeItem(`${ACTIVE_FILE_PREFIX}${sessionId}`);
}

export function saveSessionActiveFile(sessionId: number, path: string): void {
  const trimmed = path.trim();
  if (!trimmed) return;
  sessionStorage.setItem(`${ACTIVE_FILE_PREFIX}${sessionId}`, trimmed);
}

export function loadSessionActiveFile(sessionId: number): string | null {
  try {
    const raw = sessionStorage.getItem(`${ACTIVE_FILE_PREFIX}${sessionId}`);
    return raw && raw.trim() ? raw.trim() : null;
  } catch {
    return null;
  }
}
