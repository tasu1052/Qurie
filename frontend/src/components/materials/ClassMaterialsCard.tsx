import { useRef, useState } from 'react';
import { Download, FileText, Trash2, Upload } from 'lucide-react';
import { Button, Skeleton } from '../../ds';
import {
  useDeleteClassMaterial,
  useDownloadClassMaterial,
  useGetClassMaterials,
  useUploadClassMaterial,
} from '../../data';

/** 백엔드 ClassMaterialService.MAX_FILE_BYTES(30MB)와 맞춘다 — 서버 왕복 전에 걸러 준다. */
const MAX_UPLOAD_BYTES = 30_000_000;

function formatBytes(bytes: number): string {
  if (bytes < 1_000) return `${bytes}B`;
  if (bytes < 1_000_000) return `${(bytes / 1_000).toFixed(1)}KB`;
  return `${(bytes / 1_000_000).toFixed(1)}MB`;
}

/**
 * 반(클래스) 강의자료 카드. 세션에서 자료 열람이 빠지면서 대시보드가 자료의 단일 창구다.
 * canManage(강사)면 업로드·삭제까지, 아니면 목록·다운로드만 제공한다.
 */
export function ClassMaterialsCard({
  classId,
  canManage = false,
  title = '학습자료',
}: {
  classId: number;
  canManage?: boolean;
  title?: string;
}) {
  const materialsQuery = useGetClassMaterials(classId);
  const upload = useUploadClassMaterial();
  const remove = useDeleteClassMaterial();
  const download = useDownloadClassMaterial();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);

  const materials = materialsQuery.data ?? [];

  const onPickFile = (file: File | null) => {
    if (!file) return;
    if (file.size > MAX_UPLOAD_BYTES) {
      setError('파일이 너무 큽니다. 최대 30MB까지 업로드할 수 있습니다.');
      return;
    }
    setError(null);
    upload.mutate(
      { classId, file },
      {
        onError: () => setError('자료 업로드에 실패했습니다. 잠시 후 다시 시도해 주세요.'),
      },
    );
  };

  const onDownload = (materialId: number, fileName: string) => {
    setError(null);
    download.mutate(
      { classId, materialId, fileName },
      {
        onError: () => setError('자료 다운로드에 실패했습니다. 잠시 후 다시 시도해 주세요.'),
      },
    );
  };

  const onConfirmDelete = (materialId: number) => {
    setError(null);
    remove.mutate(
      { classId, materialId },
      {
        onSuccess: () => setPendingDeleteId(null),
        onError: () => setError('자료 삭제에 실패했습니다. 잠시 후 다시 시도해 주세요.'),
      },
    );
  };

  return (
    <div
      style={{
        background: 'var(--surface-card)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        boxShadow: 'var(--shadow-card)',
        padding: 24,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        minWidth: 0,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: 'var(--text-secondary)',
          }}
        >
          {title} ({materials.length})
        </span>
        {canManage ? (
          <>
            <input
              ref={fileInputRef}
              type="file"
              style={{ display: 'none' }}
              onChange={(e) => {
                onPickFile(e.target.files?.[0] ?? null);
                e.target.value = '';
              }}
            />
            <Button
              variant="secondary"
              size="sm"
              icon={<Upload size={13} />}
              disabled={upload.isPending}
              onClick={() => fileInputRef.current?.click()}
            >
              {upload.isPending ? '업로드 중…' : '자료 업로드'}
            </Button>
          </>
        ) : null}
      </div>

      {error ? (
        <span style={{ fontSize: 12.5, color: 'var(--status-error)' }}>{error}</span>
      ) : null}

      {materialsQuery.isPending ? (
        <Skeleton width="100%" height={52} radius={10} />
      ) : materialsQuery.isError ? (
        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          자료 목록을 불러오지 못했습니다.
        </span>
      ) : materials.length === 0 ? (
        <span style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
          {canManage
            ? '아직 올린 자료가 없습니다. 자료를 업로드하면 학생 대시보드에 바로 표시돼요.'
            : '아직 등록된 자료가 없습니다. 강사가 업로드하면 여기에 표시돼요.'}
        </span>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {materials.map((m) => (
            <div
              key={m.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                border: '1px solid var(--border)',
                borderRadius: 12,
                padding: '10px 12px',
                minWidth: 0,
              }}
            >
              <FileText size={15} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0, flex: 1 }}>
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: 'var(--ink)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                  title={m.fileName}
                >
                  {m.fileName}
                </span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                  {formatBytes(m.byteSize)} · {m.uploaderName} ·{' '}
                  {new Date(m.createdAt).toLocaleDateString('ko-KR')}
                </span>
              </div>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                {pendingDeleteId === m.id ? (
                  <>
                    <button
                      type="button"
                      onClick={() => onConfirmDelete(m.id)}
                      disabled={remove.isPending}
                      style={{
                        border: 'none',
                        background: 'transparent',
                        color: 'var(--status-error)',
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                        fontFamily: 'var(--font-sans)',
                        padding: '4px 6px',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {remove.isPending ? '삭제 중…' : '삭제 확인'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setPendingDeleteId(null)}
                      style={{
                        border: 'none',
                        background: 'transparent',
                        color: 'var(--text-muted)',
                        fontSize: 12,
                        cursor: 'pointer',
                        fontFamily: 'var(--font-sans)',
                        padding: '4px 6px',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      취소
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      title="다운로드"
                      aria-label={`${m.fileName} 다운로드`}
                      onClick={() => onDownload(m.id, m.fileName)}
                      disabled={download.isPending}
                      style={{
                        border: 'none',
                        background: 'transparent',
                        color: 'var(--text-secondary)',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        padding: 4,
                      }}
                    >
                      <Download size={14} />
                    </button>
                    {canManage ? (
                      <button
                        type="button"
                        title="삭제"
                        aria-label={`${m.fileName} 삭제`}
                        onClick={() => setPendingDeleteId(m.id)}
                        style={{
                          border: 'none',
                          background: 'transparent',
                          color: 'var(--status-error)',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          padding: 4,
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    ) : null}
                  </>
                )}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
