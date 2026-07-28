import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, PlayCircle, Plus, Search, Users } from 'lucide-react';
import { MasterShell, PageMain } from '../../components/layout/MasterShell';
import { MockRowBoundary } from '../../components/feedback/MockRowBoundary';
import { ConfirmDeleteOverlay } from '../../components/overlays/ConfirmDeleteOverlay';
import { Badge, Button, Input, Modal, Pagination, Select, Skeleton } from '../../ds';
import { useTrackListRow } from '../../data';
import type { TrackListItem } from '../../data';
import javaTech from '../../ds/assets/tech/java_50.png';
import pythonTech from '../../ds/assets/tech/python_50.png';
import dbTech from '../../ds/assets/tech/database_50.png';

const techImg: Record<string, string> = { java: javaTech, python: pythonTech, database: dbTech };

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
  track: TrackListItem;
  onOpen: () => void;
  onDelete: () => void;
}) {
  const active = track.status === 'active';
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
          style={{
            width: 38,
            height: 38,
            borderRadius: 10,
            background: active ? 'var(--accent-softer)' : 'var(--surface-sunken)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <img
            src={techImg[track.tech]}
            width={22}
            height={22}
            alt={track.tech}
            style={{ objectFit: 'contain' }}
          />
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
            {track.techLabel}
          </span>
          <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--ink)', margin: 0 }}>
            {track.name}
          </h3>
        </div>
        <Badge status={active ? 'success' : 'neutral'} style={{ marginLeft: 'auto' }}>
          {track.statusLabel}
        </Badge>
      </div>
      <p style={{ margin: 0, fontSize: 13, lineHeight: 1.55, color: 'var(--text-secondary)' }}>
        {track.description}
      </p>
      <div style={{ display: 'flex', gap: 14, fontSize: 12.5, color: 'var(--text-secondary)' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <BookOpen size={13} strokeWidth={1.75} />
          클래스 {track.classCount}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <Users size={13} strokeWidth={1.75} />
          {track.studentCount}명
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <PlayCircle size={13} strokeWidth={1.75} />
          세션 {track.sessionCount}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div
          style={{
            flex: 1,
            height: 6,
            borderRadius: 999,
            background: 'var(--divider)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{ width: `${track.progress}%`, height: '100%', background: 'var(--accent)' }}
          />
        </div>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)' }}>
          {track.progress}%
        </span>
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          borderTop: '1px solid var(--divider)',
          paddingTop: 12,
        }}
      >
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

export default function TrackListPage() {
  const navigate = useNavigate();
  const row = useTrackListRow();
  const [query, setQuery] = useState('');
  const [techFilter, setTechFilter] = useState<'all' | 'java' | 'python' | 'database'>('all');
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState('');
  const [tech, setTech] = useState('java');
  const [desc, setDesc] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<TrackListItem | null>(null);

  const chips: Array<{ key: typeof techFilter; label: string }> = [
    { key: 'all', label: '전체' },
    { key: 'java', label: 'Java' },
    { key: 'python', label: 'Python' },
    { key: 'database', label: 'Data' },
  ];

  const filtered = (row.data ?? []).filter((t) => {
    if (techFilter !== 'all' && t.tech !== techFilter) return false;
    if (query && !t.name.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  return (
    <MasterShell activeKey="tracks" breadcrumbs={['SSAFY 서울캠퍼스', '트랙 관리']}>
      <PageMain>
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
            onClick={() => setCreateOpen(true)}
          >
            트랙 생성
          </Button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <Input
            placeholder="트랙 검색…"
            icon={<Search size={14} strokeWidth={1.75} />}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            width={240}
          />
          {chips.map((c) => {
            const active = techFilter === c.key;
            return (
              <button
                key={c.key}
                type="button"
                onClick={() => setTechFilter(c.key)}
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
            총 {filtered.length}개 트랙
          </span>
        </div>

        <MockRowBoundary
          status={row.status}
          skeleton={<GridSkeleton />}
          onRetry={row.refetch}
          emptyMessage="트랙이 없습니다"
          emptyActionLabel="트랙 생성"
          onEmptyAction={() => setCreateOpen(true)}
        >
          <div className="qurie-card-grid">
            {filtered.map((t) => (
              <TrackCardView
                key={t.id}
                track={t}
                onOpen={() => navigate(`/master/tracks/${t.id}`)}
                onDelete={() => setDeleteTarget(t)}
              />
            ))}
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
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
          <Pagination
            page={page}
            pageCount={1}
            pageSize={12}
            rangeLabel={`1–${filtered.length} / ${filtered.length}개 트랙`}
            onPage={setPage}
          />
        </MockRowBoundary>

        <Modal
          open={createOpen}
          title="트랙 생성"
          description="이름 · 기술 스택 · 설명을 설정하세요."
          primaryLabel="생성하기"
          secondaryLabel="취소"
          onPrimary={() => setCreateOpen(false)}
          onSecondary={() => setCreateOpen(false)}
          onClose={() => setCreateOpen(false)}
          width={480}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
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
          childCounts={
            deleteTarget
              ? [
                  `클래스 ${deleteTarget.classCount}`,
                  `학생 ${deleteTarget.studentCount}명`,
                  `세션 ${deleteTarget.sessionCount}`,
                ]
              : []
          }
          conflict
          onClose={() => setDeleteTarget(null)}
          onConfirm={() => setDeleteTarget(null)}
        />
      </PageMain>
    </MasterShell>
  );
}
