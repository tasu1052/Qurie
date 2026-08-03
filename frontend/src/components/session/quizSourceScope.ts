export type QuizSourceSelection = {
  path: string;
  kind: 'file' | 'dir';
};

/** 선택 경로에 포함되는 프로젝트 파일 목록. */
export function pathsInQuizScope(allPaths: string[], selection: QuizSourceSelection): string[] {
  if (selection.kind === 'file') {
    return allPaths.filter((p) => p === selection.path);
  }
  const prefix = selection.path.endsWith('/') ? selection.path : `${selection.path}/`;
  return allPaths.filter((p) => p === selection.path || p.startsWith(prefix));
}

const CODE_EXTS = [
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.java',
  '.py',
  '.kt',
  '.go',
  '.c',
  '.cpp',
  '.h',
  '.cs',
  '.rs',
  '.swift',
];

function isCodePath(path: string): boolean {
  const lower = path.toLowerCase();
  return CODE_EXTS.some((ext) => lower.endsWith(ext));
}

/** AI pick_primary 가 코드 파일을 먼저 고르도록 정렬. */
export function sortQuizTargetFiles(paths: string[]): string[] {
  return [...paths].sort((a, b) => {
    const ac = isCodePath(a) ? 0 : 1;
    const bc = isCodePath(b) ? 0 : 1;
    if (ac !== bc) return ac - bc;
    return a.localeCompare(b);
  });
}
