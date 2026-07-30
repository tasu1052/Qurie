import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { StudentShell, PageMain } from '../../components/layout/StudentShell';
import {
  Badge,
  Button,
  EmptyState,
  LiveBadge,
  RowErrorFallback,
  Skeleton,
} from '../../ds';
import {
  QueryAsyncBoundary,
  useGetClass,
  useGetGroups,
  useGetNotices,
  useGetSessions,
} from '../../data';

function LobbySkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Skeleton width="100%" height={120} radius={16} />
      <div className="qurie-master-split">
        <Skeleton width="100%" height={280} radius={16} />
        <Skeleton width="100%" height={280} radius={16} />
      </div>
    </div>
  );
}

function ClassLobbyBody({ classId }: { classId: number }) {
  const navigate = useNavigate();
  const { data: cls } = useGetClass(classId);
  const { data: sessions } = useGetSessions(classId);
  const { data: groups } = useGetGroups(classId);
  const { data: noticesPage } = useGetNotices({ classId, size: 5 });
  const active = sessions.filter((s) => s.active);
  const live = active[0];

  return (
    <>
      <div
        style={{
          background: 'var(--ink)',
          borderRadius: 16,
          padding: 28,
          display: 'flex',
          alignItems: 'center',
          gap: 20,
          color: 'var(--text-inverse)',
        }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                opacity: 0.72,
              }}
            >
              track #{cls.trackId}
            </span>
            {live ? <LiveBadge /> : <Badge status="accent">대기</Badge>}
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: '4px 0 0', color: 'var(--text-inverse)' }}>
            {cls.name}
          </h1>
          <p style={{ margin: '8px 0 0', fontSize: 13, opacity: 0.75 }}>
            {cls.description || '클래스 로비'}
          </p>
        </div>
        {live ? (
          <Button variant="accent" onClick={() => navigate(`/session/${live.id}`)}>
            LIVE 입장
          </Button>
        ) : null}
      </div>

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
            gap: 12,
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
            세션
          </span>
          {sessions.length === 0 ? (
            <EmptyState
              message="세션이 없습니다"
              actionLabel="대시보드"
              onAction={() => navigate('/app')}
            />
          ) : (
            sessions.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => navigate(`/session/${s.id}`)}
                style={{
                  textAlign: 'left',
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  padding: '12px 14px',
                  background: 'var(--surface-card)',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-sans)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                {s.active ? <LiveBadge /> : <Badge status="neutral">종료</Badge>}
                <span style={{ fontWeight: 600, fontSize: 13 }}>{s.title}</span>
              </button>
            ))
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, minWidth: 0 }}>
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
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: 'var(--text-secondary)',
              }}
            >
              그룹 ({groups.length})
            </span>
            {groups.length === 0 ? (
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>그룹이 없습니다.</span>
            ) : (
              groups.slice(0, 5).map((g) => (
                <div key={g.id} style={{ fontSize: 13, fontWeight: 600 }}>
                  {g.name}
                </div>
              ))
            )}
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
              gap: 12,
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
              공지
            </span>
            {noticesPage.data.length === 0 ? (
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>공지가 없습니다.</span>
            ) : (
              noticesPage.data.map((n) => (
                <div key={n.id}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{n.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {new Date(n.createdAt).toLocaleDateString('ko-KR')}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default function ClassLobbyPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const classId = Number(id);
  const [rowKey, setRowKey] = useState(0);

  if (!Number.isFinite(classId) || classId <= 0) {
    return (
      <StudentShell activeKey="class" breadcrumbs={['클래스']}>
        <PageMain>
          <EmptyState
            message="잘못된 클래스 경로입니다"
            description="대시보드에서 다시 진입해 주세요."
            actionLabel="대시보드"
            onAction={() => navigate('/app')}
          />
        </PageMain>
      </StudentShell>
    );
  }

  return (
    <StudentShell activeKey="class" breadcrumbs={['클래스']}>
      <PageMain>
        <QueryAsyncBoundary
          key={rowKey}
          suspenseFallback={<LobbySkeleton />}
          errorFallback={
            <RowErrorFallback
              onRetry={() => setRowKey((k) => k + 1)}
              title="클래스 정보를 불러오지 못했습니다"
            />
          }
        >
          <ClassLobbyBody classId={classId} />
        </QueryAsyncBoundary>
      </PageMain>
    </StudentShell>
  );
}
