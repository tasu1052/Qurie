import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { StudentShell, PageMain } from '../../components/layout/StudentShell';
import {
  AlertBanner,
  Badge,
  Button,
  EmptyState,
  LiveBadge,
  RowErrorFallback,
  Skeleton,
} from '../../ds';
import {
  QueryAsyncBoundary,
  useGetMyClasses,
  useGetMyGroups,
  useGetSessions,
  useMe,
  type GroupDetailResponse,
  type GroupMemberResponse,
  type SessionResponse,
} from '../../data';
import { DashboardNoticesSection } from '../../components/notices/DashboardNoticesSection';
import { saveSessionTitle } from '../../components/session/sessionProjectStorage';

function DashSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Skeleton width="100%" height={140} radius={16} />
      <div className="qurie-master-split">
        <Skeleton width="100%" height={220} radius={16} />
        <Skeleton width="100%" height={220} radius={16} delay={0.06} />
      </div>
    </div>
  );
}

function openSessionInNewTab(
  sessionId: number,
  title: string | undefined,
  onBlocked: (id: number) => void,
) {
  if (title) saveSessionTitle(sessionId, title);
  const qs = title ? `?title=${encodeURIComponent(title)}` : '';
  const url = `/session/${sessionId}${qs}`;
  const win = window.open(url, '_blank');
  if (!win) {
    onBlocked(sessionId);
    return;
  }
  win.opener = null;
}

function MyGroupPanel({
  detail,
  onlineUserIds,
}: {
  detail: GroupDetailResponse;
  onlineUserIds: Set<number>;
}) {
  const leader = detail.members.find((m) => m.role === 'LEADER');

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
        minWidth: 0,
      }}
    >
      <div>
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: 'var(--text-secondary)',
          }}
        >
          내 그룹
        </span>
        <h2 style={{ margin: '6px 0 0', fontSize: 17, fontWeight: 700 }}>{detail.name}</h2>
        <p style={{ margin: '6px 0 0', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          {detail.description || '설명이 없습니다.'}
        </p>
      </div>
      {leader ? (
        <Badge status="accent">리더 {leader.name}</Badge>
      ) : (
        <span style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>리더 미지정</span>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {detail.members.map((m: GroupMemberResponse) => {
          const online = onlineUserIds.has(m.userId);
          return (
            <div
              key={m.userId}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 10px',
                borderRadius: 10,
                background: 'var(--surface-sunken)',
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: online ? 'var(--status-success)' : 'var(--border-strong)',
                  flexShrink: 0,
                }}
                title={online ? '접속 중' : '오프라인'}
              />
              <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>
                {m.name}
              </span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                {m.role === 'LEADER' ? '리더' : '멤버'}
                {online ? ' · 접속 중' : ''}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SessionCard({
  session,
  onEnter,
}: {
  session: SessionResponse;
  onEnter: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onEnter}
      style={{
        textAlign: 'left',
        background: 'var(--surface-card)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        padding: 18,
        cursor: 'pointer',
        fontFamily: 'var(--font-sans)',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        width: '100%',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        {session.active ? <LiveBadge /> : <Badge status="neutral">종료</Badge>}
        {session.classPublic ? <Badge status="accent">수업</Badge> : null}
        {!session.classPublic && session.groupId != null ? (
          <Badge status="neutral">그룹</Badge>
        ) : null}
      </div>
      <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>{session.title}</span>
      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
        {new Date(session.createdAt).toLocaleString('ko-KR')}
      </span>
    </button>
  );
}

function StudentDashWithClass({ classId }: { classId: number }) {
  const navigate = useNavigate();
  const { data: me } = useMe();
  const { data: myClasses } = useGetMyClasses();
  const { data: sessions } = useGetSessions(classId);
  const { data: myGroups } = useGetMyGroups(classId);
  const [popupBlockedSessionId, setPopupBlockedSessionId] = useState<number | null>(null);

  const className = myClasses.find((c) => c.id === classId)?.name ?? '내 클래스';
  const myGroup = myGroups[0] ?? null;
  const myGroupId = myGroup?.id ?? null;

  const activeSessions = useMemo(() => sessions.filter((s) => s.active), [sessions]);
  const joinableSessions = useMemo(
    () =>
      activeSessions.filter(
        (s) => s.classPublic || (myGroupId != null && s.groupId === myGroupId),
      ),
    [activeSessions, myGroupId],
  );
  const heroSession = useMemo(
    () => joinableSessions.find((s) => s.classPublic) ?? joinableSessions[0] ?? null,
    [joinableSessions],
  );

  /** 활성 세션 참가 여부는 목록만으로는 알 수 없어, 같은 그룹 멤버를 표시하고 접속 표시는 추후 소켓으로 확장. */
  const onlineUserIds = useMemo(() => new Set<number>(), []);

  return (
    <>
      <div
        style={{
          background: 'var(--ink)',
          color: 'var(--text-inverse)',
          borderRadius: 16,
          padding: 28,
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
      >
        <span style={{ fontSize: 13, opacity: 0.72 }}>안녕하세요, {me.name}님</span>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: 'var(--text-inverse)' }}>
          {heroSession ? '클래스 세션이 진행 중입니다' : '진행 중인 클래스 세션이 없습니다'}
        </h1>
        <span style={{ fontSize: 13, opacity: 0.72 }}>
          {heroSession
            ? heroSession.title
            : `${className} · 강사가 세션을 열면 여기 표시돼요`}
        </span>
        {heroSession ? (
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <Button
              variant="accent"
              onClick={() =>
                openSessionInNewTab(heroSession.id, heroSession.title, setPopupBlockedSessionId)
              }
            >
              세션 입장
            </Button>
          </div>
        ) : null}
      </div>

      {popupBlockedSessionId != null ? (
        <AlertBanner
          tone="warning"
          title="브라우저가 새 창 열기를 차단했습니다."
          description="브라우저의 팝업 차단을 해제한 뒤 다시 시도해 주세요."
          actionLabel="확인"
          onAction={() => setPopupBlockedSessionId(null)}
        />
      ) : null}

      <div className="qurie-master-split" style={{ gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)' }}>
        {myGroup != null ? (
          <MyGroupPanel detail={myGroup} onlineUserIds={onlineUserIds} />
        ) : (
          <div
            style={{
              background: 'var(--surface-card)',
              border: '1px solid var(--border)',
              borderRadius: 16,
              padding: 24,
            }}
          >
            <EmptyState
              message="배정된 그룹이 없습니다"
              description="강사가 그룹을 만들면 구성원과 접속 정보가 여기에 보여요."
              actionLabel="마이페이지"
              onAction={() => navigate('/app/me')}
            />
          </div>
        )}

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
            접속 가능 세션
          </span>
          {joinableSessions.length === 0 ? (
            <EmptyState
              message="입장할 세션이 없습니다"
              description="수업 공개 세션 또는 내 그룹 세션이 열리면 표시돼요."
              actionLabel="종합 리포트"
              onAction={() => navigate('/app/report')}
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {joinableSessions.map((s) => (
                <SessionCard
                  key={s.id}
                  session={s}
                  onEnter={() => openSessionInNewTab(s.id, s.title, setPopupBlockedSessionId)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <DashboardNoticesSection role="STUDENT" classId={classId} size={5} />

      <div
        style={{
          background: 'var(--surface-card)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          boxShadow: 'var(--shadow-card)',
          padding: 24,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
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
          학습자료
        </span>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.55 }}>
          학습자료 API가 준비되면 이 영역에 자료 목록이 표시돼요.
        </p>
      </div>
    </>
  );
}

function StudentDashBody() {
  const navigate = useNavigate();
  const { data: me } = useMe();
  const { data: myClasses } = useGetMyClasses();
  const classId = me.classId ?? myClasses[0]?.id ?? null;

  if (classId == null) {
    return (
      <EmptyState
        message="소속 클래스가 없습니다"
        description="클래스에 배정되면 세션과 대시보드가 표시돼요."
        actionLabel="마이페이지"
        onAction={() => navigate('/app/me')}
      />
    );
  }

  return <StudentDashWithClass classId={classId} />;
}

export default function StudentDashboardPage() {
  const [rowKey, setRowKey] = useState(0);

  return (
    <StudentShell activeKey="dashboard" breadcrumbs={['대시보드']}>
      <PageMain>
        <QueryAsyncBoundary
          key={rowKey}
          suspenseFallback={<DashSkeleton />}
          errorFallback={
            <RowErrorFallback
              onRetry={() => setRowKey((k) => k + 1)}
              title="대시보드를 불러오지 못했습니다"
            />
          }
        >
          <StudentDashBody />
        </QueryAsyncBoundary>
      </PageMain>
    </StudentShell>
  );
}
