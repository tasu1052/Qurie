import { useEffect, useRef, useState } from 'react';
import { AlertBanner, Button, FileDropzone, Input, Modal, UploadRow } from '../../ds';
import {
  useImportProjectGit,
  useImportProjectLocal,
  type ProjectImportResponse,
} from '../../data';
import { readLocalProjectFiles } from './readLocalProjectFiles';

type ProjectImportPanelProps = {
  sessionId: number;
  onImported: (result: ProjectImportResponse) => void;
};

export function ProjectImportPanel({ sessionId, onImported }: ProjectImportPanelProps) {
  const importLocal = useImportProjectLocal();
  const importGit = useImportProjectGit();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [gitOpen, setGitOpen] = useState(false);
  const [repoUrl, setRepoUrl] = useState('');
  const [branch, setBranch] = useState('main');
  const [subPath, setSubPath] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [uploadingName, setUploadingName] = useState<string | null>(null);

  useEffect(() => {
    const el = fileInputRef.current;
    if (!el) return;
    el.setAttribute('webkitdirectory', '');
    el.setAttribute('directory', '');
  }, []);

  const busy = importLocal.isPending || importGit.isPending;

  const handleLocalFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setError(null);
    setUploadingName(`${fileList.length}개 파일`);
    try {
      const files = await readLocalProjectFiles(fileList);
      if (Object.keys(files).length === 0) {
        setError('읽을 수 있는 텍스트 파일이 없습니다.');
        setUploadingName(null);
        return;
      }
      importLocal.mutate(
        { sessionId, files },
        {
          onSuccess: (data) => {
            setUploadingName(null);
            onImported(data);
          },
          onError: (err) => {
            setUploadingName(null);
            setError(err instanceof Error ? err.message : '로컬 임포트에 실패했습니다.');
          },
        },
      );
    } catch {
      setUploadingName(null);
      setError('로컬 파일을 읽는 중 오류가 발생했습니다.');
    }
  };

  const onGitImport = () => {
    if (!repoUrl.trim()) {
      setError('저장소 URL을 입력해 주세요.');
      return;
    }
    setError(null);
    importGit.mutate(
      {
        sessionId,
        repoUrl: repoUrl.trim(),
        branch: branch.trim() || undefined,
        subPath: subPath.trim() || undefined,
      },
      {
        onSuccess: (data) => {
          setGitOpen(false);
          setRepoUrl('');
          setBranch('main');
          setSubPath('');
          onImported(data);
        },
        onError: (err) => {
          setError(err instanceof Error ? err.message : 'Git 임포트에 실패했습니다.');
        },
      },
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '8px 6px' }}>
      {error ? (
        <AlertBanner
          tone="error"
          title="프로젝트 임포트 실패"
          description={error}
          actionLabel="닫기"
          onAction={() => setError(null)}
        />
      ) : null}

      {uploadingName && busy ? (
        <UploadRow name={uploadingName} percent={null} onCancel={() => undefined} />
      ) : (
        <FileDropzone
          title="프로젝트를 가져와 주세요"
          description="로컬 폴더를 선택하거나 공개 Git 저장소를 연결합니다."
          hint="폴더 · 텍스트 파일 · 공개 HTTPS Git"
          actionLabel="폴더 선택"
          onSelect={() => fileInputRef.current?.click()}
          secondary={
            <Button variant="secondary" size="sm" disabled={busy} onClick={() => setGitOpen(true)}>
              Git 연동
            </Button>
          }
        />
      )}

      <input
        ref={fileInputRef}
        type="file"
        multiple
        style={{ display: 'none' }}
        onChange={(e) => {
          void handleLocalFiles(e.target.files);
          e.target.value = '';
        }}
      />

      <Modal
        open={gitOpen}
        title="Git 저장소 임포트"
        description="공개 HTTPS 저장소만 지원합니다."
        primaryLabel={importGit.isPending ? '가져오는 중…' : '가져오기'}
        secondaryLabel="취소"
        onPrimary={onGitImport}
        onSecondary={() => setGitOpen(false)}
        onClose={() => setGitOpen(false)}
        width={480}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>저장소 URL</span>
            <Input
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              placeholder="https://github.com/org/repo.git"
              width="100%"
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>브랜치</span>
            <Input value={branch} onChange={(e) => setBranch(e.target.value)} placeholder="main" width="100%" />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>하위 경로 (선택)</span>
            <Input
              value={subPath}
              onChange={(e) => setSubPath(e.target.value)}
              placeholder="frontend/src"
              width="100%"
            />
          </label>
        </div>
      </Modal>
    </div>
  );
}
