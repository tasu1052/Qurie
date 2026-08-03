import { useMemo, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { isAxiosError } from 'axios';
import { Users } from 'lucide-react';
import { MasterShell, PageMain } from '../../components/layout/MasterShell';
import { ConfirmDeleteOverlay } from '../../components/overlays/ConfirmDeleteOverlay';
import {
  AlertBanner,
  Badge,
  Button,
  RowErrorFallback,
  Skeleton,
  StatCard,
  StatCardRow,
} from '../../ds';
import {
  QueryAsyncBoundary,
  useDeleteClass,
  useGetClass,
  useGetClassAnalytics,
  useGetClassMembers,
  useGetTracks,
  type ClassMemberResponse,
  type UserRole,
} from '../../data';

function apiErrorMessage(error: unknown, fallback: string): string {
  if (isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (typeof message === 'string' && message.trim()) return message;
  }
  return fallback;
}

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

function MemberTable({ title, members }: { title: string; members: ClassMemberResponse[] }) {
  return (
    <div
      style={{
        background: 'var(--surface-card)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        boxShadow: 'var(--shadow-card)',
        overflow: 'hidden',
        minWidth: 0,
      }}
    >
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
          {title}
        </span>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{members.length}명</span>
      </div>
      {members.length === 0 ? (
        <p style={{ margin: '0 20px 20px', fontSize: 13, color: 'var(--text-muted)' }}>등록된 멤버가 없습니다.</p>
      ) : (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1.6fr 0.8fr 1fr',
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
            <span>그룹</span>
          </div>
          {members.map((m) => (
            <div
              key={m.userId}
              style={{
                display: 'grid',
                gridTemplateColumns: '1.6fr 0.8fr 1fr',
                padding: '12px 20px',
                borderBottom: '1px solid var(--divider)',
                fontSize: 13,
                alignItems: 'center',
              }}
            >
              <span style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                <span style={{ fontWeight: 600, color: 'var(--ink)' }}>{m.name}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)' }}>
                  {m.email}
                </span>
              </span>
              <span>{roleBadge(m.role)}</span>
              <span style={{ color: 'var(--text-secondary)' }}>{m.groupName ?? '—'}</span>
            </div>
          ))}
        </>
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
  const deleteClass = useDeleteClass();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const trackName = useMemo(
    () => tracksPage.data.find((t) => t.id === cls.trackId)?.name ?? `트랙 #${cls.trackId}`,
    [tracksPage.data, cls.trackId],
  );
  const { active, label } = classStatus(cls.endedAt);
  const managers = membersPage.data.filter((m) => m.role === 'MANAGER');
  const students = membersPage.data.filter((m) => m.role === 'STUDENT');

  const onConfirmDelete = () => {
    setDeleteError(null);
    deleteClass.mutate(
      { classId },
      {
        onSuccess: () => navigate('/master/classes', { replace: true }),
        onError: (err) => setDeleteError(apiErrorMessage(err, '클래스 삭제에 실패했습니다.')),
      },
    );
  };

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
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
          <Button variant="secondary" icon={<Users size={14} />} onClick={() => navigate(`/master/members?classId=${classId}`)}>
            회원 관리
          </Button>
          <Button variant="ghost" onClick={() => setDeleteOpen(true)}>
            삭제
          </Button>
        </div>
      </div>

      <div className="qurie-master-split">
        <MemberTable title="매니저" members={managers} />
        <MemberTable title="학생" members={students} />
      </div>

      <ClassAnalyticsSection classId={classId} className={cls.name} />

      <ConfirmDeleteOverlay
        open={deleteOpen}
        title="클래스 삭제"
        description="클래스를 삭제하면 세션·그룹·참여 기록이 함께 영향을 받습니다."
        confirmText={cls.name}
        childCounts={[]}
        conflict
        onClose={() => {
          setDeleteOpen(false);
          setDeleteError(null);
        }}
        onConfirm={onConfirmDelete}
      />
      {deleteError ? <AlertBanner tone="error" title="삭제 실패" description={deleteError} /> : null}
    </>
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
