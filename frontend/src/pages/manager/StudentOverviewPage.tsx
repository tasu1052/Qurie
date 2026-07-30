import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ManagerShell, PageMain } from '../../components/layout/ManagerShell';
import { MockRowBoundary } from '../../components/feedback/MockRowBoundary';
import {
  Badge,
  Button,
  ChartLegend,
  DonutChart,
  EmptyState,
  LineChart,
  RowErrorFallback,
  Skeleton,
  StatCard,
  StatCardRow,
} from '../../ds';
import {
  QueryAsyncBoundary,
  useGetClass,
  useGetClassMembers,
  useGetUserProfile,
  useMe,
  useStudentOverviewRow,
} from '../../data';

function OverviewSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Skeleton width="100%" height={90} radius={16} />
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
          </div>
        ))}
      </StatCardRow>
    </div>
  );
}

function StudentHeader({ userId, classId }: { userId: number; classId: number }) {
  const { data: profile } = useGetUserProfile(userId);
  const { data: cls } = useGetClass(classId);
  const { data: membersPage } = useGetClassMembers(classId, { size: 100 });
  const member = useMemo(
    () => membersPage.data.find((m) => m.userId === userId) ?? null,
    [membersPage.data, userId],
  );

  return (
    <div
      style={{
        background: 'var(--surface-card)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        boxShadow: 'var(--shadow-card)',
        padding: 24,
        display: 'flex',
        alignItems: 'center',
        gap: 16,
      }}
    >
      <span
        style={{
          width: 48,
          height: 48,
          borderRadius: '50%',
          background: 'var(--tertiary-100)',
          color: 'var(--quaternary-400)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 17,
          fontWeight: 700,
        }}
      >
        {profile.name.trim().slice(0, 1) || '?'}
      </span>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>{profile.name}</h1>
          <Badge status="neutral">{profile.role}</Badge>
          {member?.groupName ? <Badge status="accent">{member.groupName}</Badge> : null}
        </div>
        <span
          style={{
            fontSize: 13,
            color: 'var(--text-secondary)',
            fontFamily: 'var(--font-mono)',
          }}
        >
          {profile.email} · {cls.name}
        </span>
      </div>
      <Button variant="secondary" onClick={() => undefined}>
        리포트 이력
      </Button>
    </div>
  );
}

function AnalyticsMock({ userId }: { userId: number }) {
  const row = useStudentOverviewRow(String(userId));
  const [comment, setComment] = useState('');

  return (
    <MockRowBoundary
      status={row.status}
      skeleton={<OverviewSkeleton />}
      onRetry={row.refetch}
      emptyMessage="학생 데이터가 없습니다"
    >
      {row.data && (
        <>
          <div
            style={{
              fontSize: 12,
              color: 'var(--text-muted)',
              marginTop: -8,
            }}
          >
            API 미구현: 아래 지표는 mock 데이터이며 분석 API 연동 전까지 참고용으로만 표시합니다.
          </div>
          <StatCardRow>
            {row.data.kpis.map((item, i) => (
              <StatCard key={i} {...item} />
            ))}
          </StatCardRow>

          <div className="qurie-master-split">
            <div
              style={{
                background: 'var(--surface-card)',
                border: '1px solid var(--border)',
                borderRadius: 16,
                boxShadow: 'var(--shadow-card)',
                padding: 24,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 16,
                minWidth: 0,
              }}
            >
              <span
                style={{
                  alignSelf: 'flex-start',
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: 'var(--text-secondary)',
                }}
              >
                난이도별 정답 분포
              </span>
              <DonutChart
                segments={row.data.difficulty}
                size={180}
                centerValue="84%"
                centerLabel="평균"
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
                minWidth: 0,
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: 'var(--text-secondary)',
                }}
              >
                주간 참여 · 정답률
              </span>
              <LineChart series={row.data.weeklySeries} labels={row.data.weeklyLabels} height={180} />
              <ChartLegend
                items={row.data.weeklySeries.map((s) => ({ label: s.name ?? '', accent: s.accent }))}
              />
            </div>
          </div>

          <div
            style={{
              background: 'var(--surface-card)',
              border: '1px solid var(--border)',
              borderRadius: 16,
              boxShadow: 'var(--shadow-card)',
              overflow: 'hidden',
            }}
          >
            <div style={{ padding: '20px 24px 14px' }}>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: 'var(--text-secondary)',
                }}
              >
                세션별 성과
              </span>
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1fr 1fr 1fr',
                padding: '10px 24px',
                borderBottom: '1px solid var(--divider)',
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: 'var(--text-muted)',
              }}
            >
              <span>세션</span>
              <span>정답률</span>
              <span>완료율</span>
              <span>평점</span>
            </div>
            {row.data.sessions.map((s) => (
              <div
                key={s.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 1fr 1fr 1fr',
                  padding: '13px 24px',
                  borderBottom: '1px solid var(--divider)',
                  fontSize: 13,
                }}
              >
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5 }}>{s.session}</span>
                <span style={{ fontWeight: 700, color: 'var(--accent)' }}>{s.accuracy}</span>
                <span>{s.completion}</span>
                <span style={{ fontWeight: 600 }}>{s.rating}</span>
              </div>
            ))}
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
              gap: 14,
            }}
          >
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: 'var(--text-secondary)',
              }}
            >
              매니저 코멘트
            </span>
            {row.data.comments.map((c) => (
              <div key={c.id} style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 14 }}>
                <div
                  style={{
                    display: 'flex',
                    gap: 8,
                    fontSize: 12,
                    color: 'var(--text-muted)',
                    marginBottom: 6,
                  }}
                >
                  <span style={{ fontWeight: 600, color: 'var(--ink)' }}>{c.author}</span>
                  <span>{c.date}</span>
                </div>
                <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: 'var(--text-secondary)' }}>
                  {c.body}
                </p>
              </div>
            ))}
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="코멘트를 입력하세요"
              style={{
                border: '1px solid var(--border-strong)',
                borderRadius: 12,
                padding: 12,
                minHeight: 80,
                fontFamily: 'var(--font-sans)',
                fontSize: 14,
                resize: 'vertical',
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button variant="primary" size="sm" onClick={() => setComment('')}>
                코멘트 저장
              </Button>
            </div>
          </div>
        </>
      )}
    </MockRowBoundary>
  );
}

function StudentOverviewBody({ userId, classId }: { userId: number; classId: number }) {
  return (
    <>
      <StudentHeader userId={userId} classId={classId} />
      <AnalyticsMock userId={userId} />
    </>
  );
}

function StudentOverviewGate() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const userId = Number(id);
  const { data: me } = useMe();
  const classId = me.classId;

  if (!Number.isFinite(userId) || userId <= 0) {
    return (
      <EmptyState
        message="잘못된 학생 경로입니다"
        description="학생 관리 목록에서 다시 선택해 주세요."
        actionLabel="학생 관리"
        onAction={() => navigate('/manager/students')}
      />
    );
  }

  if (classId == null || !Number.isFinite(classId) || classId <= 0) {
    return (
      <EmptyState
        message="담당 클래스가 없습니다"
        description="계정에 classId가 없어 학생 정보를 불러올 수 없습니다."
        actionLabel="대시보드"
        onAction={() => navigate('/manager')}
      />
    );
  }

  return <StudentOverviewBody userId={userId} classId={classId} />;
}

export default function StudentOverviewPage() {
  const [rowKey, setRowKey] = useState(0);

  return (
    <ManagerShell activeKey="students" breadcrumbs={['학생 관리', '상세']}>
      <PageMain>
        <QueryAsyncBoundary
          key={rowKey}
          suspenseFallback={<OverviewSkeleton />}
          errorFallback={
            <RowErrorFallback
              onRetry={() => setRowKey((k) => k + 1)}
              title="학생 정보를 불러오지 못했습니다"
            />
          }
        >
          <StudentOverviewGate />
        </QueryAsyncBoundary>
      </PageMain>
    </ManagerShell>
  );
}
