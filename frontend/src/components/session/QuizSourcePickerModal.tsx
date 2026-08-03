import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getProjectFiles } from '../../data';
import { queryKeys } from '../../network/core/queryKeys';
import { Modal } from '../../ds';
import { SessionFileExplorer } from './SessionFileExplorer';

export type QuizSourceSelection = {
  path: string;
  kind: 'file' | 'dir';
};

type QuizSourcePickerModalProps = {
  open: boolean;
  projectId: number;
  initialSelection?: QuizSourceSelection | null;
  confirming?: boolean;
  onClose: () => void;
  onConfirm: (selection: QuizSourceSelection) => void;
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

/**
 * 퀴즈 생성 전 출제 대상(파일 또는 폴더) 선택.
 * 세션 좌측과 같은 트리를 쓰고, 폴더는 chevron으로만 펼친다.
 */
export function QuizSourcePickerModal({
  open,
  projectId,
  initialSelection = null,
  confirming = false,
  onClose,
  onConfirm,
}: QuizSourcePickerModalProps) {
  const [selection, setSelection] = useState<QuizSourceSelection | null>(initialSelection);

  useEffect(() => {
    if (open) {
      setSelection(initialSelection ?? null);
    }
  }, [open, initialSelection]);

  const filesQuery = useQuery({
    queryKey: queryKeys.projects.files(projectId),
    queryFn: () => getProjectFiles(projectId),
    enabled: open,
  });

  const allPaths = useMemo(
    () => (filesQuery.data ?? []).map((f) => f.path),
    [filesQuery.data],
  );

  const scopedCount = useMemo(() => {
    if (!selection) return 0;
    if (!filesQuery.data) {
      // 목록 로딩 중 — 파일 선택은 진행 가능, 폴더는 개수 확인 후
      return selection.kind === 'file' ? 1 : 0;
    }
    return pathsInQuizScope(allPaths, selection).length;
  }, [allPaths, selection, filesQuery.data]);

  const canConfirm =
    selection != null &&
    !confirming &&
    scopedCount > 0 &&
    (selection.kind === 'file' || filesQuery.isSuccess);

  const summary =
    selection == null
      ? '파일 또는 폴더를 선택하세요.'
      : selection.kind === 'file'
        ? `선택: ${selection.path}`
        : `선택: ${selection.path}/ · ${scopedCount}개 파일`;

  return (
    <Modal
      open={open}
      title="출제 대상 선택"
      description="파일 또는 폴더를 하나 고르면 그 범위로 퀴즈를 생성합니다."
      width={480}
      secondaryLabel="취소"
      onSecondary={onClose}
      onClose={onClose}
      primaryLabel={confirming ? '생성 중…' : '이 대상으로 생성'}
      onPrimary={() => {
        if (!canConfirm || !selection) return;
        onConfirm(selection);
      }}
      style={{ maxHeight: 'min(80vh, 640px)' }}
    >
      <div
        style={{
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          background: 'var(--surface-sunken)',
          maxHeight: 320,
          overflow: 'auto',
          padding: 6,
        }}
      >
        <SessionFileExplorer
          projectId={projectId}
          activePath={selection?.path ?? null}
          selectionMode="fileOrDir"
          onSelect={(path, kind) => {
            setSelection({ path, kind: kind ?? 'file' });
          }}
        />
      </div>
      <p
        style={{
          margin: 0,
          fontSize: 12.5,
          color: selection && scopedCount === 0 ? 'var(--status-error)' : 'var(--text-secondary)',
          lineHeight: 1.45,
        }}
      >
        {selection && scopedCount === 0
          ? '선택한 폴더에 파일이 없습니다.'
          : summary}
      </p>
    </Modal>
  );
}
