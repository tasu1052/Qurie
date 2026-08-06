import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlayCircle, Plus, Search, Users } from 'lucide-react';
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
  useCreateClass,
  useDeleteClass,
  useGetClasses,
  useGetTracks,
  type ClassResponse,
} from '../../data';

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

function parseClassNumberFromName(name: string): number {
  const match = name.match(/\d+/);
  if (match) {
    const num = Number(match[0]);
    if (Number.isFinite(num) && num >= 1) return num;
  }
  return 1;
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
  openMenuId,
  setOpenMenuId,
  onOpen,
  onDelete,
}: {
  item: ClassResponse;
  trackLabel: string;
  openMenuId: number | null;
  setOpenMenuId: (id: number | null) => void;
  onOpen: () => void;
  onDelete: () => void;
}) {
  const { status, label } = classStatus(item.endedAt);
  const active = status === 'active';
  const menuOpen = openMenuId === item.id;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen()}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen();
        }
      }}
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
        cursor: 'pointer',
        textAlign: 'left',
        fontFamily: 'var(--font-sans)',
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
      </div>
      <div style={{ display: 'flex', alignItems: 'center', marginTop: 'auto' }}>
        <div
          data-class-card-menu=""
          style={{ marginLeft: 'auto', position: 'relative' }}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => setOpenMenuId(menuOpen ? null : item.id)}
            aria-label="클래스 설정"
            aria-expanded={menuOpen}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              fontWeight: 600,
              fontFamily: 'var(--font-sans)',
              fontSize: 13,
              padding: '4px 0',
            }}
          >
            설정
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
                  setOpenMenuId(null);
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
  // 서버 검색이라 타이핑마다 호출되지 않도록 매니저 학생관리(클라이언트 필터)보다 여유 있게 둔다.
  const debouncedQuery = useDebouncedValue(query, 600);
  const [trackId, setTrackId] = useState<string>('all');
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState('');
  const [selectedTrack, setSelectedTrack] = useState('');
  const [capacity, setCapacity] = useState('45');
  const [createError, setCreateError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ClassResponse | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  useEffect(() => {
    if (openMenuId == null) return;
    const onDoc = (e: MouseEvent) => {
      const target = e.target;
      if (!(target instanceof Element)) return;
      if (target.closest('[data-class-card-menu]')) return;
      setOpenMenuId(null);
    };
    document.addEventListener('click', onDoc);
    return () => document.removeEventListener('click', onDoc);
  }, [openMenuId]);

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
      sort: 'name,asc',
      q: debouncedQuery.trim() || undefined,
      trackId: trackId === 'all' ? undefined : Number(trackId),
    }),
    [debouncedQuery, trackId],
  );

  const { data: classesPage } = useGetClasses(classFilters);
  const createClass = useCreateClass();
  const deleteClass = useDeleteClass();
  const classes = classesPage.data;
  const sortedClasses = useMemo(
    () => [...classes].sort((a, b) => a.name.localeCompare(b.name, 'ko')),
    [classes],
  );
  const hasActiveFilter = Boolean(debouncedQuery.trim()) || trackId !== 'all';

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
    createClass.mutate(
      {
        trackId: tid,
        classNumber: parseClassNumberFromName(name.trim()),
        name: name.trim(),
        capacity: capacity.trim() ? Number(capacity) : undefined,
      },
      {
        onSuccess: () => {
          setCreateOpen(false);
          setName('');
          setCapacity('45');
        },
        onError: (err) => setCreateError(humanizeApiError(err, '클래스 생성에 실패했습니다.')),
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
        onError: (err) => setDeleteError(humanizeApiError(err, '클래스 삭제에 실패했습니다.')),
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
            setCreateError(null);
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

      {sortedClasses.length === 0 ? (
        hasActiveFilter ? (
          <EmptyState
            message="검색 결과가 없습니다"
            description={
              debouncedQuery.trim()
                ? `"${debouncedQuery.trim()}"에 해당하는 클래스가 없습니다.`
                : '선택한 트랙에 클래스가 없습니다.'
            }
            actionLabel="필터 초기화"
            onAction={() => {
              setQuery('');
              setTrackId('all');
            }}
          />
        ) : (
          <EmptyState
            message="클래스가 없습니다"
            description="트랙을 선택한 뒤 새 클래스를 만들어 보세요."
            actionLabel="클래스 생성"
            onAction={() => {
              setCreateError(null);
              setCreateOpen(true);
            }}
          />
        )
      ) : (
        <div className="qurie-card-grid">
          {sortedClasses.map((c) => {
            return (
              <ClassCardView
                key={c.id}
                item={c}
                trackLabel={trackNameById.get(c.trackId) ?? `track #${c.trackId}`}
                openMenuId={openMenuId}
                setOpenMenuId={setOpenMenuId}
                onOpen={() => navigate(`/master/classes/${c.id}`)}
                onDelete={() => setDeleteTarget(c)}
              />
            );
          })}
          <button
            type="button"
            onClick={() => {
              setSelectedTrack(String(tracks[0]?.id ?? ''));
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
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>정원</span>
            <Input
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
