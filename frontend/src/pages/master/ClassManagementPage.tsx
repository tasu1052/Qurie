import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Grid2x2, PlayCircle, Plus, Search, Users } from 'lucide-react';
import { MasterShell, PageMain } from '../../components/layout/MasterShell';
import { MockRowBoundary } from '../../components/feedback/MockRowBoundary';
import { ConfirmDeleteOverlay } from '../../components/overlays/ConfirmDeleteOverlay';
import { Badge, Button, Input, Modal, Select, Skeleton } from '../../ds';
import { useClassListRow } from '../../data';
import type { ClassCard } from '../../data';

function GridSkeleton() {
  return (
    <div className="qurie-card-grid">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <div key={i} style={{ background: 'var(--surface-card)', border: '1px solid var(--border)', borderRadius: 16, padding: 24, minHeight: 260 }}>
          <Skeleton width="50%" height={12} delay={i * 0.08} />
          <Skeleton width="70%" height={17} delay={i * 0.08 + 0.04} style={{ marginTop: 12 }} />
          <Skeleton width="100%" height={40} delay={i * 0.08 + 0.08} style={{ marginTop: 14 }} />
        </div>
      ))}
    </div>
  );
}

function ClassCardView({ item, onOpen, onDelete }: { item: ClassCard; onOpen: () => void; onDelete: () => void }) {
  const active = item.status === 'active';
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: item.mutedTrack ? 'var(--text-muted)' : 'var(--accent)',
          }}
        >
          {item.trackLabel}
        </span>
        <Badge status={active ? 'success' : 'neutral'}>{item.statusLabel}</Badge>
      </div>
      <div>
        <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--ink)', margin: 0 }}>{item.name}</h3>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{item.period}</span>
      </div>
      <p style={{ margin: 0, fontSize: 13, lineHeight: 1.55, color: 'var(--text-secondary)' }}>{item.description}</p>
      <div style={{ display: 'flex', gap: 14, fontSize: 12.5, color: 'var(--text-secondary)' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Users size={13} strokeWidth={1.75} />{item.students}명</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><PlayCircle size={13} strokeWidth={1.75} />세션 {item.sessions}</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Grid2x2 size={13} strokeWidth={1.75} />그룹 {item.groups}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ flex: 1, height: 6, borderRadius: 999, background: 'var(--divider)', overflow: 'hidden' }}>
          <div
            style={{
              width: `${item.progress}%`,
              height: '100%',
              background: item.status === 'ended' ? 'var(--grey-200)' : 'var(--accent)',
            }}
          />
        </div>
        <span style={{ fontSize: 12, fontWeight: 600, color: item.status === 'ended' ? 'var(--text-muted)' : 'var(--ink)' }}>
          {item.progress}%
        </span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--divider)', paddingTop: 12 }}>
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
          {item.status === 'ended' ? '결과 리포트 보기' : '클래스 열기'} <span style={{ fontWeight: 800 }}>&gt;</span>
        </button>
        <button
          type="button"
          onClick={onDelete}
          aria-label="클래스 삭제"
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

export default function ClassManagementPage() {
  const navigate = useNavigate();
  const row = useClassListRow();
  const [query, setQuery] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [track, setTrack] = useState('java-major');
  const [manager, setManager] = useState('jiwon');
  const [name, setName] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<ClassCard | null>(null);

  const filtered = (row.data ?? []).filter((c) => !query || c.name.includes(query) || c.trackLabel.includes(query));

  return (
    <MasterShell activeKey="classes" breadcrumbs={['SSAFY 서울캠퍼스', '클래스 관리']}>
      <PageMain>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>클래스 관리</h1>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              트랙 과정 단위로 클래스를 생성하고 참여자를 배정하세요.
            </span>
          </div>
          <Button variant="primary" icon={<Plus size={15} strokeWidth={1.75} />} onClick={() => setCreateOpen(true)}>
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
          <Select
            options={[
              { value: 'all', label: '전체 트랙' },
              { value: 'java', label: 'Java' },
              { value: 'python', label: 'Python' },
            ]}
            value="all"
            onChange={() => undefined}
          />
          <Select
            options={[
              { value: 'all', label: '전체 상태' },
              { value: 'active', label: '진행 중' },
              { value: 'ended', label: '종료' },
            ]}
            value="all"
            onChange={() => undefined}
          />
          <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-muted)' }}>총 {filtered.length}개 클래스</span>
        </div>

        <MockRowBoundary
          status={row.status}
          skeleton={<GridSkeleton />}
          onRetry={row.refetch}
          emptyMessage="클래스가 없습니다"
          emptyActionLabel="클래스 생성"
          onEmptyAction={() => setCreateOpen(true)}
          label="row · classes"
        >
          <div className="qurie-card-grid">
            {filtered.map((c) => (
              <ClassCardView
                key={c.id}
                item={c}
                onOpen={() =>
                  c.status === 'ended'
                    ? navigate(`/master/analytics/${c.id}`)
                    : navigate('/manager')
                }
                onDelete={() => setDeleteTarget(c)}
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
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>새 클래스 만들기</span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>이름 · 트랙 · 운영 기간을 설정하세요</span>
            </button>
          </div>
        </MockRowBoundary>

        <Modal
          open={createOpen}
          title="클래스 생성"
          description="트랙과 담당 매니저를 지정해 새 클래스를 만듭니다."
          primaryLabel="생성하기"
          secondaryLabel="취소"
          onPrimary={() => setCreateOpen(false)}
          onSecondary={() => setCreateOpen(false)}
          onClose={() => setCreateOpen(false)}
          width={480}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>클래스 이름</span>
              <Input placeholder="예: 서울 6반" value={name} onChange={(e) => setName(e.target.value)} width="100%" />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>트랙</span>
              <Select
                options={[
                  { value: 'java-major', label: 'Java 전공 (서울)' },
                  { value: 'python-nonmajor', label: 'Python 비전공 (서울)' },
                  { value: 'data-analysis', label: '데이터분석 (서울)' },
                ]}
                value={track}
                onChange={setTrack}
              />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>담당 매니저</span>
              <Select
                options={[
                  { value: 'jiwon', label: '김지원' },
                  { value: 'minsu', label: '박민수' },
                  { value: 'hana', label: '이하나' },
                ]}
                value={manager}
                onChange={setManager}
              />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>정원</span>
              <Input type="number" placeholder="45" width="100%" />
            </label>
          </div>
        </Modal>

        <ConfirmDeleteOverlay
          open={!!deleteTarget}
          title="클래스 삭제"
          description="클래스를 삭제하면 세션·그룹·참여 기록이 함께 영향을 받습니다."
          confirmText={deleteTarget?.name ?? ''}
          childCounts={
            deleteTarget
              ? [`학생 ${deleteTarget.students}명`, `세션 ${deleteTarget.sessions}`, `그룹 ${deleteTarget.groups}`]
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
