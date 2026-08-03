import { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, FileCode, FileJson, FileText, Folder } from 'lucide-react';
import { QueryAsyncBoundary, useGetProjectFiles } from '../../data';
import { RowErrorFallback, Skeleton } from '../../ds';

type TreeNode = {
  name: string;
  path: string;
  kind: 'file' | 'dir';
  children: TreeNode[];
};

export type FileExplorerSelectionMode = 'file' | 'fileOrDir';

function fileIcon(path: string) {
  if (path.endsWith('.json')) return <FileJson size={13} />;
  if (path.endsWith('.md')) return <FileText size={13} />;
  return <FileCode size={13} />;
}

export function buildFileTree(paths: string[]): TreeNode[] {
  const root: TreeNode[] = [];

  const ensureDir = (nodes: TreeNode[], name: string, dirPath: string): TreeNode => {
    let node = nodes.find((n) => n.kind === 'dir' && n.name === name);
    if (!node) {
      node = { name, path: dirPath, kind: 'dir', children: [] };
      nodes.push(node);
    }
    return node;
  };

  for (const fullPath of [...paths].sort((a, b) => a.localeCompare(b))) {
    const parts = fullPath.split('/').filter(Boolean);
    if (parts.length === 0) continue;
    let cursor = root;
    let acc = '';
    for (let i = 0; i < parts.length; i += 1) {
      const part = parts[i];
      acc = acc ? `${acc}/${part}` : part;
      const isFile = i === parts.length - 1;
      if (isFile) {
        if (!cursor.some((n) => n.kind === 'file' && n.path === fullPath)) {
          cursor.push({ name: part, path: fullPath, kind: 'file', children: [] });
        }
      } else {
        const dir = ensureDir(cursor, part, acc);
        cursor = dir.children;
      }
    }
  }

  const sortNodes = (nodes: TreeNode[]) => {
    nodes.sort((a, b) => {
      if (a.kind !== b.kind) return a.kind === 'dir' ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
    nodes.forEach((n) => {
      if (n.kind === 'dir') sortNodes(n.children);
    });
  };
  sortNodes(root);
  return root;
}

function TreeRows({
  nodes,
  depth,
  activePath,
  collapsed,
  selectionMode,
  onToggle,
  onSelect,
}: {
  nodes: TreeNode[];
  depth: number;
  activePath: string | null;
  collapsed: Set<string>;
  selectionMode: FileExplorerSelectionMode;
  onToggle: (path: string) => void;
  onSelect: (path: string, kind: 'file' | 'dir') => void;
}) {
  return (
    <>
      {nodes.map((node) => {
        if (node.kind === 'dir') {
          const open = !collapsed.has(node.path);
          const active = selectionMode === 'fileOrDir' && activePath === node.path;
          const padLeft = 8 + depth * 12;

          return (
            <div key={`d:${node.path}`}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  paddingLeft: padLeft,
                  borderRadius: 6,
                  background: active ? 'var(--accent-softer)' : 'transparent',
                  width: '100%',
                }}
              >
                <button
                  type="button"
                  onClick={() => onToggle(node.path)}
                  aria-label={open ? '폴더 접기' : '폴더 펼치기'}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 22,
                    height: 26,
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    color: 'var(--text-secondary)',
                    padding: 0,
                    flexShrink: 0,
                  }}
                >
                  {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (selectionMode === 'fileOrDir') {
                      onSelect(node.path, 'dir');
                    } else {
                      onToggle(node.path);
                    }
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '5px 8px 5px 0',
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    flex: 1,
                    minWidth: 0,
                    fontFamily: 'var(--font-sans)',
                    fontSize: 12.5,
                    fontWeight: active ? 600 : 400,
                    color: active ? 'var(--accent)' : 'var(--text-secondary)',
                    textAlign: 'left',
                  }}
                  title={node.path}
                >
                  <Folder size={13} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {node.name}
                  </span>
                </button>
              </div>
              {open ? (
                <TreeRows
                  nodes={node.children}
                  depth={depth + 1}
                  activePath={activePath}
                  collapsed={collapsed}
                  selectionMode={selectionMode}
                  onToggle={onToggle}
                  onSelect={onSelect}
                />
              ) : null}
            </div>
          );
        }

        const active = activePath === node.path;
        return (
          <button
            key={`f:${node.path}`}
            type="button"
            onClick={() => onSelect(node.path, 'file')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '5px 8px',
              paddingLeft: 8 + depth * 12 + 18,
              borderRadius: 6,
              background: active ? 'var(--accent-softer)' : 'transparent',
              fontSize: 12.5,
              fontWeight: active ? 600 : 400,
              color: active ? 'var(--accent)' : 'var(--text-secondary)',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
              textAlign: 'left',
              width: '100%',
            }}
            title={node.path}
          >
            {fileIcon(node.path)}
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {node.name}
            </span>
          </button>
        );
      })}
    </>
  );
}

function FilesBody({
  projectId,
  activePath,
  selectionMode,
  onSelect,
}: {
  projectId: number;
  activePath: string | null;
  selectionMode: FileExplorerSelectionMode;
  onSelect: (path: string, kind: 'file' | 'dir') => void;
}) {
  const { data: files } = useGetProjectFiles(projectId);
  const tree = useMemo(() => buildFileTree(files.map((f) => f.path)), [files]);
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set());

  if (files.length === 0) {
    return (
      <p style={{ margin: '8px 6px', fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>
        가져온 파일이 없습니다.
      </p>
    );
  }

  return (
    <TreeRows
      nodes={tree}
      depth={0}
      activePath={activePath}
      collapsed={collapsed}
      selectionMode={selectionMode}
      onToggle={(path) => {
        setCollapsed((prev) => {
          const next = new Set(prev);
          if (next.has(path)) next.delete(path);
          else next.add(path);
          return next;
        });
      }}
      onSelect={onSelect}
    />
  );
}

type SessionFileExplorerProps = {
  projectId: number;
  activePath: string | null;
  /** 기본 `file` — 세션 좌측 탐색기. `fileOrDir` — 퀴즈 출제 대상 선택. */
  selectionMode?: FileExplorerSelectionMode;
  onSelect: (path: string, kind?: 'file' | 'dir') => void;
};

export function SessionFileExplorer({
  projectId,
  activePath,
  selectionMode = 'file',
  onSelect,
}: SessionFileExplorerProps) {
  return (
    <QueryAsyncBoundary
      suspenseFallback={
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 8 }}>
          <Skeleton width="100%" height={28} />
          <Skeleton width="90%" height={28} delay={0.08} />
          <Skeleton width="80%" height={28} delay={0.16} />
        </div>
      }
      errorFallback={<RowErrorFallback title="파일 목록을 불러오지 못했습니다" />}
    >
      <FilesBody
        projectId={projectId}
        activePath={activePath}
        selectionMode={selectionMode}
        onSelect={onSelect}
      />
    </QueryAsyncBoundary>
  );
}
