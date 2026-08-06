import { useMemo, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { Settings } from 'lucide-react';
import { MasterShell, PageMain } from '../../components/layout/MasterShell';
import { ConfirmDeleteOverlay } from '../../components/overlays/ConfirmDeleteOverlay';
import { getUserProfileExtras } from '../../utils/userProfileExtras';
import {
  AlertBanner,
  Badge,
  Button,
  Input,
  Modal,
  RowErrorFallback,
  Skeleton,
  StatCard,
  StatCardRow,
} from '../../ds';
import {
  humanizeApiError,
  QueryAsyncBoundary,
  useDeleteClass,
  useGetClass,
  useGetClassAnalytics,
  useGetClassMembers,
  useGetTracks,
  useUpdateClass,
  type ClassMemberResponse,
  type UserRole,
} from '../../data';

const MEMBER_GRID = 'minmax(160px, 1.6fr) minmax(88px, 0.75fr) minmax(100px, 1fr) minmax(88px, 0.9fr)';

function classStatus(endedAt: string | null): { active: boolean; label: string } {
  if (endedAt && new Date(endedAt).getTime() < Date.now()) {
    return { active: false, label: '종료' };
  }
  return { active: true, label: '진행 중' };
}

function roleBadge(role: UserRole) {
  if (role === 'MASTER') return <Badge status="ink">MASTER</Badge>;
  if (role === 'MANAGER') return <Badge status="accent">MANAGER</Badge>;
  return <Badge status="neutral">STUDENT</Badge>;
}

function DetailSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Skeleton width="40%" height={28} />
      <StatCardRow>
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              background: 'var(--surface-card-solid)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--card-radius)',
              padding: 'var(--stat-card-padding)',
            }}
          >
            <Skeleton width="50%" height={14} delay={i * 0.08} />
            <Skeleton width="40%" height={28} delay={i * 0.08 + 0.04} style={{ marginTop: 12 }} />
          </div>
        ))}
      </StatCardRow>
      <Skeleton width="100%" height={220} radius={16} />
    </div>
  );
}

function MemberList({ members }: { members: ClassMemberResponse[] }) {
  return (
    <div className="qurie-table-card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px 12px' }}>
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: 'var(--text-secondary)',
          }}
        >
          멤버
        </span>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{members.length}명</span>
      </div>
      {members.length === 0 ? (
        <p style={{ margin: '0 20px 20px', fontSize: 13, color: 'var(--text-muted)' }}>등록된 멤버가 없습니다.</p>
      ) : (
        <div className="qurie-table-scroll">
          <div style={{ minWidth: 720 }} className="qurie-table-inner">
            <div
              className="qurie-table-grid"
              style={{
                gridTemplateColumns: MEMBER_GRID,
                padding: '10px 20px',
                borderBottom: '1px solid var(--divider)',
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: 'var(--text-muted)',
              }}
            >
              <span>멤버</span>
              <span>역할</span>
              <span>전화번호</span>
              <span>그룹</span>
            </div>
            {members.map((m) => {
              const phone = getUserProfileExtras(m.email).phone;
              return (
                <div
                  key={m.userId}
                  className="qurie-table-grid"
                  style={{
                    gridTemplateColumns: MEMBER_GRID,
                    padding: '12px 20px',
                    borderBottom: '1px solid var(--divider)',
                    fontSize: 13,
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <span style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                    <span style={{ fontWeight: 600, color: 'var(--ink)', wordBreak: 'break-word' }}>{m.name}</span>
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 12,
                        color: 'var(--text-muted)',
                        wordBreak: 'break-all',
                      }}
                    >
                      {m.email}
                    </span>
                  </span>
                  <span style={{ minWidth: 0 }}>{roleBadge(m.role)}</span>
                  <span style={{ color: 'var(--text-secondary)', minWidth: 0, wordBreak: 'break-word' }}>
                    {phone || '—'}
                  </span>
                  <span style={{ color: 'var(--text-secondary)', minWidth: 0, wordBreak: 'break-word' }}>
                    {m.groupName ?? '—'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function formatRate(value: number | null): string {
  if (value == null) return '—';
  const pct = value <= 1 ? value * 100 : value;
  return `${Math.round(pct)}%`;
}

function formatMs(value: number | null): string {
  if (value == null) return '—';
  if (value < 1000) return `${value}ms`;
  return `${(value / 1000).toFixed(1)}s`;
}

function ClassAnalyticsSection({ classId, className }: { classId: number; className: string }) {
  const { data } = useGetClassAnalytics(classId);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>{className} — 클래스 분석</h2>
        <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
          리포트가 쌓인 학생 {data.reportedStudentCount}명 기준으로 집계해요.
        </span>
      </div>
      <StatCardRow>
        <StatCard label="학생" value={String(data.studentCount)} />
        <StatCard label="매니저" value={String(data.managerCount)} />
        <StatCard label="그룹" value={String(data.groupCount)} />
        <StatCard label="세션" value={`${data.activeSessionCount}/${data.sessionCount}`} caption="진행 중 / 전체" />
      </StatCardRow>
      <StatCardRow>
        <StatCard label="평균 정답률" value={formatRate(data.avgAccuracy)} />
        <StatCard label="평균 완료율" value={formatRate(data.avgCompletionRate)} />
        <StatCard label="평균 소요" value={formatMs(data.avgElapsedMs)} />
        <StatCard label="리포트 반영" value={`${data.reportedStudentCount}명`} />
      </StatCardRow>
    </div>
  );
}

function ClassDetailBody({ classId }: { classId: number }) {
  const navigate = useNavigate();
  const { data: cls } = useGetClass(classId);
  const { data: tracksPage } = useGetTracks({ size: 100 });
  const { data: membersPage } = useGetClassMembers(classId, { size: 200 });
  const updateClass = useUpdateClass();
  const deleteClass = useDeleteClass();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editCapacity, setEditCapacity] = useState('');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const trackName = useMemo(
    () => tracksPage.data.find((t) => t.id === cls.trackId)?.name ?? `트랙 #${cls.trackId}`,
    [tracksPage.data, cls.trackId],
  );
  const { active, label } = classStatus(cls.endedAt);
  const orderedMembers = useMemo(
    () => [
      ...membersPage.data.filter((m) => m.role === 'MANAGER'),
      ...membersPage.data.filter((m) => m.role === 'STUDENT'),
      ...membersPage.data.filter((m) => m.role !== 'MANAGER' && m.role !== 'STUDENT'),
    ],
    [membersPage.data],
  );

  const openSettings = () => {
    setEditName(cls.name);
    setEditDesc(cls.description ?? '');
    setEditCapacity(cls.capacity != null ? String(cls.capacity) : '');
    setSaveError(null);
    setSettingsOpen(true);
  };

  const onSaveSettings = () => {
    setSaveError(null);
    if (!editName.trim()) {
      setSaveError('클래스 이름을 입력하세요.');
      return;
    }
    const cap = editCapacity.trim();
    const capacityNum = cap ? Number(cap) : undefined;
    if (cap && (!Number.isFinite(capacityNum) || capacityNum! < 1)) {
      setSaveError('정원은 1 이상의 숫자여야 합니다.');
      return;
    }
    updateClass.mutate(
      {
        classId,
        name: editName.trim(),
        description: editDesc.trim() || undefined,
        capacity: capacityNum,
        classNumber: cls.classNumber,
      },
      {
        onSuccess: () => setSettingsOpen(false),
        onError: (err) => setSaveError(humanizeApiError(err, '클래스 저장에 실패했습니다.')),
      },
    );
  };

  const onConfirmDelete = () => {
    setDeleteError(null);
    deleteClass.mutate(
      { classId },
      {
        onSuccess: () => navigate('/master/classes', { replace: true }),
        onError: (err) => setDeleteError(humanizeApiError(err, '클래스 삭제에 실패했습니다.')),
      },
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, minWidth: 0, width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>{cls.name}</h1>
            <Badge status={active ? 'success' : 'neutral'}>{label}</Badge>
          </div>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            {trackName} · 반 #{cls.classNumber}
            {cls.capacity != null ? ` · 정원 ${cls.capacity}` : ''}
          </span>
          {cls.description ? (
            <p style={{ margin: '8px 0 0', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {cls.description}
            </p>
          ) : null}
        </div>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          <Button variant="secondary" icon={<Settings size={14} />} onClick={openSettings}>
            클래스 관리
          </Button>
          <Button variant="ghost" onClick={() => setDeleteOpen(true)}>
            삭제
          </Button>
        </div>
      </div>

      <MemberList members={orderedMembers} />

      <ClassAnalyticsSection classId={classId} className={cls.name} />

      <Modal
        open={settingsOpen}
        title="클래스 관리"
        description="클래스 이름·설명·정원을 수정합니다."
        primaryLabel={updateClass.isPending ? '저장 중…' : '저장하기'}
        secondaryLabel="취소"
        onPrimary={onSaveSettings}
        onSecondary={() => setSettingsOpen(false)}
        onClose={() => setSettingsOpen(false)}
        width={480}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {saveError ? <AlertBanner tone="error" title="저장 실패" description={saveError} /> : null}
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>클래스 이름</span>
            <Input value={editName} onChange={(e) => setEditName(e.target.value)} width="100%" />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>설명</span>
            <Input value={editDesc} onChange={(e) => setEditDesc(e.target.value)} width="100%" />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>정원</span>
            <Input value={editCapacity} onChange={(e) => setEditCapacity(e.target.value)} width="100%" />
          </label>
        </div>
      </Modal>

      <ConfirmDeleteOverlay
        open={deleteOpen}
        title="클래스 삭제"
        description="클래스를 삭제하면 세션·그룹·참여 기록이 함께 영향을 받습니다."
        confirmText={cls.name}
        onClose={() => {
          setDeleteOpen(false);
          setDeleteError(null);
        }}
        onConfirm={onConfirmDelete}
      />
      {deleteError ? <AlertBanner tone="error" title="삭제 실패" description={deleteError} /> : null}
    </div>
  );
}

export default function ClassDetailPage() {
  const { classId: raw } = useParams<{ classId: string }>();
  const classId = Number(raw);
  const [rowKey, setRowKey] = useState(0);

  if (!Number.isFinite(classId) || classId <= 0) {
    return <Navigate to="/master/classes" replace />;
  }

  return (
    <MasterShell activeKey="classes" breadcrumbs={['SSAFY 서울캠퍼스', '클래스 관리', '상세']}>
      <PageMain>
        <div style={{ marginBottom: 8 }}>
          <Link
            to="/master/classes"
            style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}
          >
            ← 클래스 목록
          </Link>
        </div>
        <QueryAsyncBoundary
          key={rowKey}
          suspenseFallback={<DetailSkeleton />}
          errorFallback={
            <RowErrorFallback
              onRetry={() => setRowKey((k) => k + 1)}
              title="클래스를 불러오지 못했습니다"
            />
          }
        >
          <ClassDetailBody classId={classId} />
        </QueryAsyncBoundary>
      </PageMain>
    </MasterShell>
  );
}
