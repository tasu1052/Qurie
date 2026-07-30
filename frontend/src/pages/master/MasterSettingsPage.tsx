import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { isAxiosError } from 'axios';
import { MasterShell, PageMain } from '../../components/layout/MasterShell';
import {
  AlertBanner,
  Button,
  EmptyState,
  RowErrorFallback,
  Skeleton,
} from '../../ds';
import {
  QueryAsyncBoundary,
  useGetTracks,
  useMe,
  useUpdateTrack,
  type TrackSummaryResponse,
} from '../../data';

function apiErrorMessage(error: unknown, fallback: string): string {
  if (isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (typeof message === 'string' && message.trim()) return message;
  }
  return fallback;
}

function SettingsSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Skeleton width="100%" height={120} radius={16} />
      <Skeleton width="100%" height={220} radius={16} />
    </div>
  );
}

function TrackEditRow({ track }: { track: TrackSummaryResponse }) {
  const updateTrack = useUpdateTrack();
  const [name, setName] = useState(track.name);
  const [description, setDescription] = useState(track.description ?? '');
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const dirty =
    name.trim() !== track.name || (description.trim() || '') !== (track.description ?? '');

  const onSave = () => {
    setError(null);
    setSaved(false);
    if (!name.trim()) {
      setError('트랙 이름을 입력하세요.');
      return;
    }
    updateTrack.mutate(
      {
        trackId: track.id,
        name: name.trim(),
        description: description.trim() || undefined,
        tech: track.tech ?? undefined,
      },
      {
        onSuccess: () => setSaved(true),
        onError: (err) => setError(apiErrorMessage(err, '트랙 저장에 실패했습니다.')),
      },
    );
  };

  return (
    <div
      style={{
        border: '1px solid var(--border)',
        borderRadius: 12,
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          track #{track.id}
          {track.tech ? ` · ${track.tech}` : ''}
          {` · 클래스 ${track.classCount}`}
        </span>
        {saved && !dirty ? (
          <span style={{ fontSize: 12, color: 'var(--status-green)', fontWeight: 600 }}>저장됨</span>
        ) : null}
      </div>

      {error ? <AlertBanner tone="error" title="저장 실패" description={error} /> : null}

      <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13 }}>
        <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>트랙 이름</span>
        <input
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setSaved(false);
          }}
          style={{
            border: '1px solid var(--border-strong)',
            borderRadius: 8,
            padding: '8px 10px',
            fontFamily: 'var(--font-sans)',
            fontSize: 14,
          }}
        />
      </label>

      <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13 }}>
        <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>설명</span>
        <textarea
          value={description}
          onChange={(e) => {
            setDescription(e.target.value);
            setSaved(false);
          }}
          rows={2}
          style={{
            border: '1px solid var(--border-strong)',
            borderRadius: 8,
            padding: '8px 10px',
            fontFamily: 'var(--font-sans)',
            fontSize: 13,
            resize: 'vertical',
          }}
        />
      </label>

      <div>
        <Button variant="primary" size="sm" onClick={onSave} disabled={!dirty || updateTrack.isPending}>
          {updateTrack.isPending ? '저장 중…' : '저장'}
        </Button>
      </div>
    </div>
  );
}

function MasterSettingsBody() {
  const navigate = useNavigate();
  const { data: me } = useMe();
  const { data: tracksPage } = useGetTracks({ size: 50 });
  const tracks = tracksPage.data;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
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
          maxWidth: 640,
        }}
      >
        <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>부트캠프 (Enterprise)</h2>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.55 }}>
          부트캠프 이름 수정 API가 아직 없습니다. 현재 enterpriseId만 확인할 수 있습니다.
        </p>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 0',
            borderTop: '1px solid var(--divider)',
            fontSize: 13,
          }}
        >
          <span style={{ color: 'var(--text-muted)' }}>enterpriseId</span>
          <span style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{me.enterpriseId}</span>
        </div>
        <AlertBanner
          tone="info"
          title="백엔드 대기"
          description="Enterprise GET/PATCH가 추가되면 이 섹션에서 부트캠프 이름을 수정할 수 있습니다."
        />
      </div>

      <div
        style={{
          background: 'var(--surface-card)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          boxShadow: 'var(--shadow-card)',
          padding: 24,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          maxWidth: 640,
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>트랙 설정</h2>
          <p style={{ margin: '6px 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>
            과정(트랙) 이름과 설명을 수정합니다.
          </p>
        </div>

        {tracks.length === 0 ? (
          <EmptyState
            message="등록된 트랙이 없습니다"
            description="트랙 관리에서 먼저 트랙을 만들어 주세요."
            actionLabel="트랙 관리로"
            onAction={() => navigate('/master/tracks')}
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {tracks.map((track) => (
              <TrackEditRow key={track.id} track={track} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function MasterSettingsPage() {
  const [rowKey, setRowKey] = useState(0);

  return (
    <MasterShell activeKey="settings" breadcrumbs={['설정']}>
      <PageMain>
        <QueryAsyncBoundary
          key={rowKey}
          suspenseFallback={<SettingsSkeleton />}
          errorFallback={
            <RowErrorFallback
              onRetry={() => setRowKey((k) => k + 1)}
              title="설정을 불러오지 못했습니다"
              description="트랙 목록을 다시 불러와 주세요."
            />
          }
        >
          <MasterSettingsBody />
        </QueryAsyncBoundary>
      </PageMain>
    </MasterShell>
  );
}
