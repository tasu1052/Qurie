const STORAGE_PREFIX = 'qurie:session-project:';

export type SessionProjectRef = {
  projectId: number;
  versionHash: string;
};

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
}
