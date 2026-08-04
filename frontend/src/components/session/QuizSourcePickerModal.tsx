import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getProjectFiles } from '../../data';
import { queryKeys } from '../../network/core/queryKeys';
import { Modal } from '../../ds';
import { SessionFileExplorer } from './SessionFileExplorer';
import {
  pathsInQuizScope,
  type QuizSourceSelection,
} from './quizSourceScope';

type QuizSourcePickerModalProps = {
  open: boolean;
  projectId: number;
  initialSelection?: QuizSourceSelection | null;
  confirming?: boolean;
  onClose: () => void;
  onConfirm: (selection: QuizSourceSelection) => void;
};

/**
 * 퀴즈 생성 전 출제 대상(파일 또는 폴더) 선택.
 * open 될 때마다 Body 를 새로 마운트해 initialSelection 을 맞춘다(effect setState 회피).
 */
export function QuizSourcePickerModal({
  open,
  projectId,
  initialSelection = null,
  confirming = false,
  onClose,
  onConfirm,
}: QuizSourcePickerModalProps) {
  if (!open) return null;
  return (
    <QuizSourcePickerModalBody
      key={`${initialSelection?.kind ?? 'none'}:${initialSelection?.path ?? ''}`}
      projectId={projectId}
      initialSelection={initialSelection}
      confirming={confirming}
      onClose={onClose}
      onConfirm={onConfirm}
    />
  );
}

function QuizSourcePickerModalBody({
  projectId,
  initialSelection = null,
  confirming = false,
  onClose,
  onConfirm,
}: Omit<QuizSourcePickerModalProps, 'open'>) {
  const [selection, setSelection] = useState<QuizSourceSelection | null>(initialSelection ?? null);

  const filesQuery = useQuery({
    queryKey: queryKeys.projects.files(projectId),
    queryFn: () => getProjectFiles(projectId),
  });

  const allPaths = useMemo(
    () => (filesQuery.data ?? []).map((f) => f.path),
    [filesQuery.data],
  );

  const scopedCount = useMemo(() => {
    if (!selection) return 0;
    if (!filesQuery.data) {
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
      ? '파일을 선택하세요.'
      : selection.kind === 'file'
        ? `선택: ${selection.path}`
        : `선택: ${selection.path}/ · ${scopedCount}개 파일`;

  return (
    <Modal
      open
      title="출제 대상 선택"
      description="파일을 하나 고르면 그 범위로 퀴즈를 생성합니다."
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
