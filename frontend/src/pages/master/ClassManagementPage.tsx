import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { isAxiosError } from 'axios';
import { Grid2x2, PlayCircle, Plus, Search, Users } from 'lucide-react';
import { MasterShell, PageMain } from '../../components/layout/MasterShell';
import { ConfirmDeleteOverlay } from '../../components/overlays/ConfirmDeleteOverlay';
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
  QueryAsyncBoundary,
  useCreateClass,
  useDeleteClass,
  useGetClasses,
  useGetTracks,
  type ClassResponse,
} from '../../data';

function apiErrorMessage(error: unknown, fallback: string): string {
  if (isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (typeof message === 'string' && message.trim()) return message;
  }
  return fallback;
}

function formatPeriod(startedAt: string | null, endedAt: string | null): string {
  if (!startedAt && !endedAt) return '기간 미설정';
  const fmt = (iso: string) => {
    const d = new Date(iso);
    return `${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
  };
  return `${startedAt ? fmt(startedAt) : '—'} – ${endedAt ? fmt(endedAt) : '—'}`;
}

function classStatus(endedAt: string | null): { status: 'active' | 'ended'; label: string } {
  if (endedAt && new Date(endedAt).getTime() < Date.now()) {
    return { status: 'ended', label: '종료' };
  }
  return { status: 'active', label: '진행 중' };
}

function GridSkeleton() {
  return (
    <div className="qurie-card-grid">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          style={{
            background: 'var(--surface-card)',
            border: '1px solid var(--border)',
            borderRadius: 16,
            padding: 24,
            minHeight: 260,
          }}
        >
          <Skeleton width="50%" height={12} delay={i * 0.08} />
          <Skeleton width="70%" height={17} delay={i * 0.08 + 0.04} style={{ marginTop: 12 }} />
          <Skeleton width="100%" height={40} delay={i * 0.08 + 0.08} style={{ marginTop: 14 }} />
        </div>
      ))}
    </div>
  );
}

function ClassCardView({
  item,
  trackLabel,
  onOpen,
  onDelete,
}: {
  item: ClassResponse;
  trackLabel: string;
  onOpen: () => void;
  onDelete: () => void;
}) {
  const { status, label } = classStatus(item.endedAt);
  const active = status === 'active';
  const [menuOpen, setMenuOpen] = useState(false);

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
        position: 'relative',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: 'var(--accent)',
          }}
        >
          {trackLabel}
        </span>
        <Badge status={active ? 'success' : 'neutral'}>{label}</Badge>
      </div>
      <div>
        <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--ink)', margin: 0 }}>{item.name}</h3>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          {formatPeriod(item.startedAt, item.endedAt)}
        </span>
      </div>
      <p style={{ margin: 0, fontSize: 13, lineHeight: 1.55, color: 'var(--text-secondary)' }}>
        {item.description || '설명이 없습니다.'}
      </p>
      <div style={{ display: 'flex', gap: 14, fontSize: 12.5, color: 'var(--text-secondary)' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <Users size={13} strokeWidth={1.75} />
          정원 {item.capacity ?? '—'}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <PlayCircle size={13} strokeWidth={1.75} />
          #{item.classNumber}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <Grid2x2 size={13} strokeWidth={1.75} />—
        </span>
      </div>
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
          {active ? '클래스 보기' : '상세 보기'} <span style={{ fontWeight: 800 }}>&gt;</span>
        </button>
        <div style={{ marginLeft: 'auto', position: 'relative' }}>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="클래스 메뉴"
            aria-expanded={menuOpen}
            style={{
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
          {menuOpen ? (
            <div
              style={{
                position: 'absolute',
                right: 0,
                bottom: '100%',
                marginBottom: 6,
                minWidth: 132,
                background: 'var(--surface-card)',
                border: '1px solid var(--border-strong)',
                borderRadius: 10,
                boxShadow: 'var(--shadow-card)',
                padding: 4,
                zIndex: 5,
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onOpen();
                }}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  border: 'none',
                  background: 'transparent',
                  padding: '8px 10px',
                  fontSize: 13,
                  fontFamily: 'var(--font-sans)',
                  color: 'var(--ink)',
                  cursor: 'pointer',
                  borderRadius: 6,
                }}
              >
                상세 보기
              </button>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onDelete();
                }}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  border: 'none',
                  background: 'transparent',
                  padding: '8px 10px',
                  fontSize: 13,
                  fontFamily: 'var(--font-sans)',
                  color: 'var(--status-error)',
                  cursor: 'pointer',
                  borderRadius: 6,
                }}
              >
                삭제
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function ClassListBody() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [trackId, setTrackId] = useState<string>('all');
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState('');
  const [classNumber, setClassNumber] = useState('1');
  const [selectedTrack, setSelectedTrack] = useState('');
  const [capacity, setCapacity] = useState('45');
  const [createError, setCreateError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ClassResponse | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const { data: tracksPage } = useGetTracks({ size: 100 });
  const tracks = tracksPage.data;
  const trackOptions = useMemo(
    () => [
      { value: 'all', label: '전체 트랙' },
      ...tracks.map((t) => ({ value: String(t.id), label: t.name })),
    ],
    [tracks],
  );

  const classFilters = useMemo(
    () => ({
      size: 50,
      q: query.trim() || undefined,
      trackId: trackId === 'all' ? undefined : Number(trackId),
    }),
    [query, trackId],
  );

  const { data: classesPage } = useGetClasses(classFilters);
  const createClass = useCreateClass();
  const deleteClass = useDeleteClass();
  const classes = classesPage.data;

  const trackNameById = useMemo(() => {
    const map = new Map<number, string>();
    for (const t of tracks) map.set(t.id, t.name);
    return map;
  }, [tracks]);

  const onCreate = () => {
    setCreateError(null);
    if (!name.trim()) {
      setCreateError('클래스 이름을 입력하세요.');
      return;
    }
    const tid = Number(selectedTrack || tracks[0]?.id);
    if (!Number.isFinite(tid)) {
      setCreateError('트랙을 선택하세요.');
      return;
    }
    const num = Number(classNumber);
    if (!Number.isFinite(num) || num < 1) {
      setCreateError('반 번호는 1 이상이어야 합니다.');
      return;
    }
    createClass.mutate(
      {
        trackId: tid,
        classNumber: num,
        name: name.trim(),
        capacity: capacity.trim() ? Number(capacity) : undefined,
      },
      {
        onSuccess: () => {
          setCreateOpen(false);
          setName('');
          setClassNumber('1');
          setCapacity('45');
        },
        onError: (err) => setCreateError(apiErrorMessage(err, '클래스 생성에 실패했습니다.')),
      },
    );
  };

  const onConfirmDelete = () => {
    if (!deleteTarget) return;
    setDeleteError(null);
    deleteClass.mutate(
      { classId: deleteTarget.id },
      {
        onSuccess: () => setDeleteTarget(null),
        onError: (err) => setDeleteError(apiErrorMessage(err, '클래스 삭제에 실패했습니다.')),
      },
    );
  };

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>클래스 관리</h1>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            트랙 과정 단위로 클래스를 생성하고 참여자를 배정하세요.
          </span>
        </div>
        <Button
          variant="primary"
          icon={<Plus size={15} strokeWidth={1.75} />}
          onClick={() => {
            setSelectedTrack(String(tracks[0]?.id ?? ''));
            setCreateOpen(true);
          }}
        >
          클래스 생성
        </Button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Input
          placeholder="클래스 검색…"
          icon={<Search size={14} strokeWidth={1.75} />}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          width={240}
        />
        <Select options={trackOptions} value={trackId} onChange={setTrackId} />
        <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-muted)' }}>
          총 {classesPage.meta.total}개 클래스
        </span>
      </div>

      {classes.length === 0 ? (
        <EmptyState
          message="클래스가 없습니다"
          description="트랙을 선택한 뒤 새 클래스를 만들어 보세요."
          actionLabel="클래스 생성"
          onAction={() => setCreateOpen(true)}
        />
      ) : (
        <div className="qurie-card-grid">
          {classes.map((c) => {
            return (
              <ClassCardView
                key={c.id}
                item={c}
                trackLabel={trackNameById.get(c.trackId) ?? `track #${c.trackId}`}
                onOpen={() => navigate(`/master/classes/${c.id}`)}
                onDelete={() => setDeleteTarget(c)}
              />
            );
          })}
          <button
            type="button"
            onClick={() => {
              setSelectedTrack(String(tracks[0]?.id ?? ''));
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
              minHeight: 260,
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
              새 클래스 만들기
            </span>
          </button>
        </div>
      )}

      <Modal
        open={createOpen}
        title="클래스 생성"
        description="트랙을 지정해 새 클래스를 만듭니다."
        primaryLabel={createClass.isPending ? '생성 중…' : '생성하기'}
        secondaryLabel="취소"
        onPrimary={onCreate}
        onSecondary={() => setCreateOpen(false)}
        onClose={() => setCreateOpen(false)}
        width={480}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {createError ? <AlertBanner tone="error" title="생성 실패" description={createError} /> : null}
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>클래스 이름</span>
            <Input
              placeholder="예: 서울 6반"
              value={name}
              onChange={(e) => setName(e.target.value)}
              width="100%"
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>트랙</span>
            <Select
              options={tracks.map((t) => ({ value: String(t.id), label: t.name }))}
              value={selectedTrack || String(tracks[0]?.id ?? '')}
              onChange={setSelectedTrack}
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>반 번호</span>
            <Input
              type="number"
              value={classNumber}
              onChange={(e) => setClassNumber(e.target.value)}
              width="100%"
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>정원</span>
            <Input
              type="number"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              width="100%"
            />
          </label>
        </div>
      </Modal>

      <ConfirmDeleteOverlay
        open={!!deleteTarget}
        title="클래스 삭제"
        description="클래스를 삭제하면 세션·그룹·참여 기록이 함께 영향을 받습니다."
        confirmText={deleteTarget?.name ?? ''}
        childCounts={[]}
        conflict
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

export default function ClassManagementPage() {
  const [rowKey, setRowKey] = useState(0);

  return (
    <MasterShell activeKey="classes" breadcrumbs={['SSAFY 서울캠퍼스', '클래스 관리']}>
      <PageMain>
        <QueryAsyncBoundary
          key={rowKey}
          suspenseFallback={<GridSkeleton />}
          errorFallback={
            <RowErrorFallback
              onRetry={() => setRowKey((k) => k + 1)}
              title="클래스를 불러오지 못했습니다"
              description="목록을 다시 불러와 주세요."
            />
          }
        >
          <ClassListBody />
        </QueryAsyncBoundary>
      </PageMain>
    </MasterShell>
  );
}
