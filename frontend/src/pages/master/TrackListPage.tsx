import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Plus, Search } from 'lucide-react';
import { MasterShell, PageMain } from '../../components/layout/MasterShell';
import { ConfirmDeleteOverlay } from '../../components/overlays/ConfirmDeleteOverlay';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import {
  AlertBanner,
  Badge,
  Button,
  EmptyState,
  Input,
  Modal,
  RowErrorFallback,
  Select,
  Skeleton,
} from '../../ds';
import {
  humanizeApiError,
  QueryAsyncBoundary,
  useCreateTrack,
  useDeleteTrack,
  useGetTracks,
  type TrackSummaryResponse,
} from '../../data';
import javaTech from '../../ds/assets/tech/java_50.png';
import pythonTech from '../../ds/assets/tech/python_50.png';
import dbTech from '../../ds/assets/tech/database_50.png';

const techImg: Record<string, string> = { java: javaTech, python: pythonTech, database: dbTech };

function normalizeTech(tech: string | null): 'java' | 'python' | 'database' | 'other' {
  const t = (tech ?? '').toLowerCase();
  if (t.includes('java')) return 'java';
  if (t.includes('python')) return 'python';
  if (t.includes('data') || t.includes('db')) return 'database';
  return 'other';
}

function GridSkeleton() {
  return (
    <div className="qurie-card-grid">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          style={{
            background: 'var(--surface-card)',
            border: '1px solid var(--border)',
            borderRadius: 16,
            padding: 24,
            minHeight: 240,
          }}
        >
          <Skeleton width="70%" height={17} delay={i * 0.08} />
          <Skeleton width="100%" height={40} delay={i * 0.08 + 0.04} style={{ marginTop: 14 }} />
          <Skeleton width="50%" height={12} delay={i * 0.08 + 0.08} style={{ marginTop: 14 }} />
        </div>
      ))}
    </div>
  );
}

function TrackCardView({
  track,
  onOpen,
  onDelete,
}: {
  track: TrackSummaryResponse;
  onOpen: () => void;
  onDelete: () => void;
}) {
  const techKey = normalizeTech(track.tech);
  const img = techImg[techKey];
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
        gap: 14,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span
          className="tech-icon-wrap"
          style={{
            width: 38,
            height: 38,
            borderRadius: 10,
            background: 'var(--accent-softer)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {img ? (
            <img src={img} width={22} height={22} alt={track.tech ?? 'tech'} className="tech-icon" style={{ objectFit: 'contain' }} />
          ) : (
            <BookOpen size={18} strokeWidth={1.75} />
          )}
        </span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 0 }}>
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
            }}
          >
            {track.tech ?? 'TRACK'}
          </span>
          <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--ink)', margin: 0 }}>{track.name}</h3>
        </div>
        <Badge status="success" style={{ marginLeft: 'auto' }}>
          활성
        </Badge>
      </div>
      <p style={{ margin: 0, fontSize: 13, lineHeight: 1.55, color: 'var(--text-secondary)' }}>
        {track.description || '설명이 없습니다.'}
      </p>
      <span style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>클래스 {track.classCount}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 'auto' }}>
        <button
          type="button"
          onClick={onOpen}
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--accent)',
            cursor: 'pointer',
            fontFamily: 'var(--font-sans)',
          }}
        >
          트랙 상세 <span style={{ fontWeight: 800 }}>&gt;</span>
        </button>
        <button
          type="button"
          onClick={onDelete}
          aria-label="트랙 삭제"
          style={{
            marginLeft: 'auto',
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            fontWeight: 700,
            letterSpacing: 1,
            fontFamily: 'var(--font-sans)',
            fontSize: 13,
            padding: 0,
          }}
        >
          ⋯
        </button>
      </div>
    </div>
  );
}

function TrackListBody() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query, 300);
  const [techFilter, setTechFilter] = useState<'all' | 'java' | 'python' | 'database'>('all');
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState('');
  const [tech, setTech] = useState('java');
  const [desc, setDesc] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TrackSummaryResponse | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const filters = useMemo(
    () => ({
      size: 100,
      q: debouncedQuery.trim() || undefined,
      tech: techFilter === 'all' ? undefined : techFilter,
    }),
    [debouncedQuery, techFilter],
  );

  const { data: tracksPage } = useGetTracks(filters);
  const createTrack = useCreateTrack();
  const deleteTrack = useDeleteTrack();
  const tracks = tracksPage.data;
  const total = tracksPage.meta.total;

  const chips: Array<{ key: typeof techFilter; label: string }> = [
    { key: 'all', label: '전체' },
    { key: 'java', label: 'Java' },
    { key: 'python', label: 'Python' },
    { key: 'database', label: 'Data' },
  ];

  const onCreate = () => {
    setCreateError(null);
    if (!name.trim()) {
      setCreateError('트랙 이름을 입력하세요.');
      return;
    }
    createTrack.mutate(
      { name: name.trim(), description: desc.trim() || undefined, tech },
      {
        onSuccess: () => {
          setCreateOpen(false);
          setName('');
          setDesc('');
          setTech('java');
        },
        onError: (err) => setCreateError(humanizeApiError(err, '트랙 생성에 실패했습니다.')),
      },
    );
  };

  const onConfirmDelete = () => {
    if (!deleteTarget) return;
    setDeleteError(null);
    deleteTrack.mutate(
      { trackId: deleteTarget.id },
      {
        onSuccess: () => setDeleteTarget(null),
        onError: (err) => setDeleteError(humanizeApiError(err, '트랙 삭제에 실패했습니다.')),
      },
    );
  };

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>트랙 관리</h1>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            기술 트랙 단위로 커리큘럼을 만들고 클래스를 배정하세요.
          </span>
        </div>
        <Button
          variant="primary"
          icon={<Plus size={15} strokeWidth={1.75} />}
          onClick={() => {
            setCreateError(null);
            setCreateOpen(true);
          }}
        >
          트랙 생성
        </Button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <Input
          placeholder="트랙 검색…"
          icon={<Search size={14} strokeWidth={1.75} />}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
          }}
          width={240}
        />
        {chips.map((c) => {
          const active = techFilter === c.key;
          return (
            <button
              key={c.key}
              type="button"
              onClick={() => {
                setTechFilter(c.key);
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: active ? 'var(--accent-softer)' : 'var(--surface-card)',
                border: `1px solid ${active ? 'var(--accent)' : 'var(--border-strong)'}`,
                color: active ? 'var(--accent)' : 'var(--text-secondary)',
                borderRadius: 999,
                padding: '7px 14px',
                fontSize: 12,
                fontWeight: active ? 600 : 400,
                cursor: 'pointer',
                fontFamily: 'var(--font-sans)',
              }}
            >
              {c.label}
            </button>
          );
        })}
        <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-muted)' }}>
          총 {total}개 트랙
        </span>
      </div>

      {tracks.length === 0 ? (
        debouncedQuery.trim() ? (
          <EmptyState
            message="검색 결과가 없습니다"
            description={`"${debouncedQuery.trim()}"에 해당하는 트랙이 없습니다.`}
            actionLabel="검색 초기화"
            onAction={() => setQuery('')}
          />
        ) : (
        <EmptyState
          message="트랙이 없습니다"
          description="첫 트랙을 만들어 클래스를 배정해 보세요."
          actionLabel="트랙 생성"
          onAction={() => {
            setCreateError(null);
            setCreateOpen(true);
          }}
        />
        )
      ) : (
        <>
          <div className="qurie-card-grid">
            {tracks.map((t) => (
              <TrackCardView
                key={t.id}
                track={t}
                onOpen={() => navigate(`/master/tracks/${t.id}`)}
                onDelete={() => setDeleteTarget(t)}
              />
            ))}
            <button
              type="button"
              onClick={() => {
                setCreateError(null);
                setCreateOpen(true);
              }}
              style={{
                border: '1.5px dashed var(--grey-100)',
                borderRadius: 16,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                padding: 24,
                minHeight: 240,
                cursor: 'pointer',
                color: 'var(--text-muted)',
                background: 'transparent',
                fontFamily: 'var(--font-sans)',
              }}
            >
              <span
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  background: 'var(--surface-sunken)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Plus size={18} strokeWidth={1.75} />
              </span>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
                새 트랙 만들기
              </span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                이름 · 기술 스택 · 설명을 설정하세요
              </span>
            </button>
          </div>
          <span style={{ marginTop: 4, fontSize: 12, color: 'var(--text-muted)' }}>총 {total}개 트랙</span>
        </>
      )}

      <Modal
        open={createOpen}
        title="트랙 생성"
        description="이름 · 기술 스택 · 설명을 설정하세요."
        primaryLabel={createTrack.isPending ? '생성 중…' : '생성하기'}
        secondaryLabel="취소"
        onPrimary={onCreate}
        onSecondary={() => setCreateOpen(false)}
        onClose={() => setCreateOpen(false)}
        width={480}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {createError ? <AlertBanner tone="error" title="생성 실패" description={createError} /> : null}
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>트랙 이름</span>
            <Input
              placeholder="예: Java 전공 (부산)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              width="100%"
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>기술 스택</span>
            <Select
              options={[
                { value: 'java', label: 'Java' },
                { value: 'python', label: 'Python' },
                { value: 'database', label: 'Database' },
              ]}
              value={tech}
              onChange={setTech}
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>설명</span>
            <Input
              placeholder="커리큘럼 요약을 입력하세요"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              width="100%"
            />
          </label>
        </div>
      </Modal>

      <ConfirmDeleteOverlay
        open={!!deleteTarget}
        title="트랙 삭제"
        description="트랙을 삭제하면 하위 클래스·세션·리포트가 함께 영향을 받습니다. 이 작업은 되돌릴 수 없습니다."
        confirmText={deleteTarget?.name ?? ''}
        onClose={() => {
          setDeleteTarget(null);
          setDeleteError(null);
        }}
        onConfirm={onConfirmDelete}
      />
      {deleteError ? <AlertBanner tone="error" title="삭제 실패" description={deleteError} /> : null}
    </>
  );
}

export default function TrackListPage() {
  const [rowKey, setRowKey] = useState(0);

  return (
    <MasterShell activeKey="tracks" breadcrumbs={['SSAFY 서울캠퍼스', '트랙 관리']}>
      <PageMain>
        <QueryAsyncBoundary
          key={rowKey}
          suspenseFallback={<GridSkeleton />}
          errorFallback={
            <RowErrorFallback
              onRetry={() => setRowKey((k) => k + 1)}
              title="트랙을 불러오지 못했습니다"
              description="목록을 다시 불러와 주세요."
            />
          }
        >
          <TrackListBody />
        </QueryAsyncBoundary>
      </PageMain>
    </MasterShell>
  );
}
