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
  sessionStorage.removeItem(`${QUIZ_SET_PREFIX}${sessionId}`);
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

const QUIZ_SET_PREFIX = 'qurie:session-quiz-set:';

/** 세션별 활성 퀴즈셋 id. 새로고침·재입장 시 생성 중/완료 상태를 이어가기 위함. */
export function saveSessionQuizSetId(sessionId: number, quizSetId: number): void {
  sessionStorage.setItem(`${QUIZ_SET_PREFIX}${sessionId}`, String(quizSetId));
}

export function loadSessionQuizSetId(sessionId: number): number | null {
  try {
    const raw = sessionStorage.getItem(`${QUIZ_SET_PREFIX}${sessionId}`);
    if (!raw) return null;
    const id = Number(raw);
    return Number.isFinite(id) && id > 0 ? id : null;
  } catch {
    return null;
  }
}

export function clearSessionQuizSetId(sessionId: number): void {
  sessionStorage.removeItem(`${QUIZ_SET_PREFIX}${sessionId}`);
}
