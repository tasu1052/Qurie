import { FileCode, FileJson, FileText } from 'lucide-react';
import { QueryAsyncBoundary, useGetProjectFiles } from '../../data';
import { RowErrorFallback, Skeleton } from '../../ds';

function fileIcon(path: string) {
  if (path.endsWith('.json')) return <FileJson size={13} />;
  if (path.endsWith('.md')) return <FileText size={13} />;
  return <FileCode size={13} />;
}

function FilesBody({
  projectId,
  activePath,
  onSelect,
}: {
  projectId: number;
  activePath: string | null;
  onSelect: (path: string) => void;
}) {
  const { data: files } = useGetProjectFiles(projectId);

  if (files.length === 0) {
    return (
      <p style={{ margin: '8px 6px', fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>
        가져온 파일이 없습니다.
      </p>
    );
  }

  const sorted = [...files].sort((a, b) => a.path.localeCompare(b.path));

  return (
    <>
      {sorted.map((f) => {
        const active = activePath === f.path;
        return (
          <button
            key={f.path}
            type="button"
            onClick={() => onSelect(f.path)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 8px',
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
            title={f.path}
          >
            {fileIcon(f.path)}
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {f.path}
            </span>
            {active ? (
              <span
                style={{
                  marginLeft: 'auto',
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: 'var(--accent)',
                  flexShrink: 0,
                }}
              />
            ) : null}
          </button>
        );
      })}
    </>
  );
}

type SessionFileExplorerProps = {
  projectId: number;
  activePath: string | null;
  onSelect: (path: string) => void;
};

export function SessionFileExplorer({ projectId, activePath, onSelect }: SessionFileExplorerProps) {
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
      <FilesBody projectId={projectId} activePath={activePath} onSelect={onSelect} />
    </QueryAsyncBoundary>
  );
}
