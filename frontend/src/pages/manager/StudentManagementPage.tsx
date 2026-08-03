import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight, Search } from 'lucide-react';
import { ManagerShell, PageMain } from '../../components/layout/ManagerShell';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import {
  Button,
  EmptyState,
  Input,
  RowErrorFallback,
  Skeleton,
} from '../../ds';
import {
  QueryAsyncBoundary,
  useGetClass,
  useGetClassMembers,
  useGetGroups,
  useMe,
  type ClassMemberResponse,
  type GroupResponse,
} from '../../data';

function TableSkeleton() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 24 }}>
      <Skeleton width="100%" height={360} radius={16} />
      <Skeleton width="100%" height={360} radius={16} />
    </div>
  );
}

function GroupsPanelSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Skeleton width="100%" height={64} radius={12} />
      <Skeleton width="100%" height={64} radius={12} delay={0.06} />
      <Skeleton width="100%" height={64} radius={12} delay={0.12} />
    </div>
  );
}

function groupStatus(endedAt: string): '활동' | '종료' {
  return new Date(endedAt).getTime() > Date.now() ? '활동' : '종료';
}

function GroupsSidePanel({
  classId,
}: {
  classId: number;
}) {
  const navigate = useNavigate();
  const { data: groups } = useGetGroups(classId);
  const preview = groups.slice(0, 3);

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
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: 'var(--text-secondary)',
          }}
        >
          그룹
        </span>
        <Button
          variant="ghost"
          size="sm"
          icon={<ChevronRight size={14} strokeWidth={1.75} />}
          onClick={() => navigate('/manager/groups')}
        >
          그룹 관리
        </Button>
      </div>

      {preview.length === 0 ? (
        <EmptyState
          message="그룹이 없습니다"
          description="그룹 관리에서 만들거나 셔플할 수 있어요."
          actionLabel="그룹 관리"
          onAction={() => navigate('/manager/groups')}
        />
      ) : (
        preview.map((g: GroupResponse) => {
          const status = groupStatus(g.endedAt);
          return (
            <Link
              key={g.id}
              to={`/manager/groups/${g.id}`}
              style={{
                border: '1px solid var(--border)',
                borderRadius: 12,
                padding: 12,
                textDecoration: 'none',
                display: 'block',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>{g.name}</span>
                <Badge status={status === '활동' ? 'success' : 'neutral'}>{status}</Badge>
              </div>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {g.description || '설명이 없습니다.'}
              </span>
            </Link>
          );
        })
      )}

      {groups.length > 3 ? (
        <Button variant="secondary" size="sm" onClick={() => navigate('/manager/groups')}>
          전체 {groups.length}개 보기
        </Button>
      ) : null}
    </div>
  );
}

function MembersTable({
  members,
  query,
  onQueryChange,
}: {
  members: ClassMemberResponse[];
  query: string;
  onQueryChange: (v: string) => void;
}) {
  const navigate = useNavigate();
  const debouncedQuery = useDebouncedValue(query, 300);
  const students = useMemo(() => members.filter((m) => m.role === 'STUDENT'), [members]);
  const filtered = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    return students.filter((m) => {
      if (!q) return true;
      return m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q);
    });
  }, [students, debouncedQuery]);

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
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '16px 24px',
          borderBottom: '1px solid var(--divider)',
        }}
      >
        <Input
          placeholder="학생 검색…"
          icon={<Search size={14} strokeWidth={1.75} />}
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          width={220}
        />
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.8fr 1.2fr',
          padding: '10px 24px',
          borderBottom: '1px solid var(--divider)',
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: 'var(--text-muted)',
        }}
      >
        <span>학생</span>
        <span>그룹</span>
      </div>
      {filtered.length === 0 ? (
        <div style={{ padding: 32 }}>
        <EmptyState
          message={students.length === 0 ? '학생이 없습니다' : '검색 결과가 없습니다'}
          description={
            students.length === 0
              ? '클래스에 배정된 학생이 없습니다.'
              : '이름·이메일을 바꿔 검색해 보세요.'
          }
          actionLabel="그룹 관리"
          onAction={() => navigate('/manager/groups')}
        />
        </div>
      ) : (
        filtered.map((m) => (
          <div
            key={m.userId}
            role="button"
            tabIndex={0}
            onClick={() => navigate(`/manager/students/detail/${m.userId}`)}
            onKeyDown={(e) =>
              e.key === 'Enter' && navigate(`/manager/students/detail/${m.userId}`)
            }
            style={{
              display: 'grid',
              gridTemplateColumns: '1.8fr 1.2fr',
              padding: '13px 24px',
              borderBottom: '1px solid var(--divider)',
              fontSize: 13,
              alignItems: 'center',
              cursor: 'pointer',
            }}
          >
            <span style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontWeight: 600, color: 'var(--ink)' }}>{m.name}</span>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 12,
                  color: 'var(--text-muted)',
                }}
              >
                {m.email}
              </span>
            </span>
            <span style={{ color: 'var(--text-secondary)' }}>{m.groupName ?? '—'}</span>
          </div>
        ))
      )}
    </div>
  );
}

function StudentManagementBody({ classId }: { classId: number }) {
  const { data: cls } = useGetClass(classId);
  const { data: membersPage } = useGetClassMembers(classId, { size: 100 });
  const [query, setQuery] = useState('');
  const [groupPanelKey, setGroupPanelKey] = useState(0);

  const members = membersPage.data;
  const studentCount = members.filter((m) => m.role === 'STUDENT').length;

  return (
    <>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>학생 관리</h1>
        <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
          {cls.name} · 학생 {studentCount}명
        </span>
      </div>

      <div
        className="qurie-master-split"
        style={{ gridTemplateColumns: 'minmax(0, 1.6fr) minmax(0, 1fr)' }}
      >
        <MembersTable
          members={members}
          query={query}
          onQueryChange={setQuery}
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, minWidth: 0 }}>
          <QueryAsyncBoundary
            key={groupPanelKey}
            suspenseFallback={
              <div
                style={{
                  background: 'var(--surface-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 16,
                  padding: 24,
                }}
              >
                <GroupsPanelSkeleton />
              </div>
            }
            errorFallback={
              <RowErrorFallback
                onRetry={() => setGroupPanelKey((k) => k + 1)}
                title="그룹을 불러오지 못했습니다"
                description="이 패널만 실패했습니다."
              />
            }
          >
            <GroupsSidePanel classId={classId} />
          </QueryAsyncBoundary>
          <div
            style={{
              background: 'var(--accent-softer)',
              border: '1px solid var(--accent-soft)',
              borderRadius: 12,
              padding: 14,
              fontSize: 12.5,
              lineHeight: 1.6,
              color: 'var(--text-body)',
            }}
          >
            완료율·액티비티는 분석 API가 준비되면 붙입니다. 지금은 반 명단의 이름·역할·그룹만
            표시합니다.
          </div>
        </div>
      </div>
    </>
  );
}

function StudentManagementGate() {
  const navigate = useNavigate();
  const { data: me } = useMe();
  const classId = me.classId;

  if (classId == null || !Number.isFinite(classId) || classId <= 0) {
    return (
      <EmptyState
        message="담당 클래스가 없습니다"
        description="계정에 classId가 없어 반 명단을 불러올 수 없습니다."
        actionLabel="대시보드"
        onAction={() => navigate('/manager')}
      />
    );
  }

  return <StudentManagementBody classId={classId} />;
}

export default function StudentManagementPage() {
  const { data: me } = useMe();
  const [rowKey, setRowKey] = useState(0);
  const classLabel = me.classId != null ? `클래스 #${me.classId}` : '학생 관리';

  return (
    <ManagerShell activeKey="students" breadcrumbs={[classLabel, '학생 관리']}>
      <PageMain>
        <QueryAsyncBoundary
          key={rowKey}
          suspenseFallback={<TableSkeleton />}
          errorFallback={
            <RowErrorFallback
              onRetry={() => setRowKey((k) => k + 1)}
              title="학생 관리를 불러오지 못했습니다"
            />
          }
        >
          <StudentManagementGate />
        </QueryAsyncBoundary>
      </PageMain>
    </ManagerShell>
  );
}
