/** webkitdirectory 업로드에서 상대 경로 → 파일 내용 맵을 만든다. */
export async function readLocalProjectFiles(fileList: FileList): Promise<Record<string, string>> {
  const entries = Array.from(fileList);
  if (entries.length === 0) return {};

  const paths = entries.map((file) => {
    const rel = (file as File & { webkitRelativePath?: string }).webkitRelativePath;
    return rel && rel.length > 0 ? rel : file.name;
  });

  const roots = new Set(
    paths.map((p) => {
      const i = p.indexOf('/');
      return i === -1 ? '' : p.slice(0, i);
    }),
  );
  const onlyRoot = roots.size === 1 ? [...roots][0] : '';
  const rootPrefix = onlyRoot ? `${onlyRoot}/` : '';

  const files: Record<string, string> = {};
  await Promise.all(
    entries.map(async (file, idx) => {
      let path = paths[idx];
      if (rootPrefix && path.startsWith(rootPrefix)) {
        path = path.slice(rootPrefix.length);
      }
      if (!path || path.includes('node_modules/') || path.startsWith('.')) return;
      try {
        files[path] = await file.text();
      } catch {
        // binary 등은 스킵
      }
    }),
  );
  return files;
}

export function languageFromPath(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase() ?? '';
  switch (ext) {
    case 'java':
      return 'java';
    case 'js':
    case 'jsx':
    case 'mjs':
    case 'cjs':
      return 'javascript';
    case 'ts':
    case 'tsx':
      return 'typescript';
    case 'py':
      return 'python';
    case 'html':
    case 'htm':
      return 'html';
    case 'css':
      return 'css';
    case 'cpp':
    case 'cc':
    case 'cxx':
    case 'hpp':
    case 'h':
      return 'cpp';
    case 'json':
      return 'json';
    case 'md':
      return 'markdown';
    case 'sql':
      return 'sql';
    default:
      return 'typescript';
  }
}
