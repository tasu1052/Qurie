import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { StudentShell, PageMain } from '../../components/layout/StudentShell';
import {
  AlertBanner,
  Badge,
  Button,
  EmptyState,
  LiveBadge,
  Modal,
  RowErrorFallback,
  Skeleton,
} from '../../ds';
import {
  QueryAsyncBoundary,
  useCreateSession,
  useGetClass,
  useGetGroups,
  useGetSessions,
} from '../../data';
import { saveSessionTitle } from '../../components/session/sessionProjectStorage';

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
  const createSession = useCreateSession();
  const [createOpen, setCreateOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [popupBlockedSessionId, setPopupBlockedSessionId] = useState<number | null>(null);
  const active = sessions.filter((s) => s.active);
  const livePublic = active.find((s) => s.classPublic) ?? null;

  const openSessionInNewTab = (sessionId: number, title?: string) => {
    if (title) saveSessionTitle(sessionId, title);
    const qs = title ? `?title=${encodeURIComponent(title)}` : '';
    const url = `/session/${sessionId}${qs}`;
    const win = window.open(url, '_blank');
    if (!win) {
      setPopupBlockedSessionId(sessionId);
      return;
    }
    win.opener = null;
    setPopupBlockedSessionId(null);
  };

  const onCreateSession = () => {
    if (!title.trim()) return;
    createSession.mutate(
      { classId, title: title.trim() },
      {
        onSuccess: (created) => {
          setCreateOpen(false);
          setTitle('');
          openSessionInNewTab(created.id, created.title);
        },
      },
    );
  };

  return (
    <>
      {popupBlockedSessionId != null ? (
        <AlertBanner
          tone="warning"
          title="브라우저가 새 창 열기를 차단했습니다."
          description="브라우저의 팝업 차단을 해제한 뒤 다시 시도해 주세요."
          actionLabel="확인"
          onAction={() => setPopupBlockedSessionId(null)}
        />
      ) : null}

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
            {livePublic ? <LiveBadge /> : <Badge status="accent">대기</Badge>}
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: '4px 0 0', color: 'var(--text-inverse)' }}>
            {cls.name}
          </h1>
          <p style={{ margin: '8px 0 0', fontSize: 13, opacity: 0.75 }}>
            {livePublic
              ? `수업 LIVE · ${livePublic.title}`
              : cls.description || '클래스 로비'}
          </p>
        </div>
        {livePublic ? (
          <Button variant="accent" onClick={() => openSessionInNewTab(livePublic.id, livePublic.title)}>
            LIVE 입장
          </Button>
        ) : null}
        <Button
          variant="secondary"
          icon={<Plus size={14} strokeWidth={1.75} />}
          onClick={() => setCreateOpen(true)}
          style={{
            background: 'transparent',
            color: 'var(--text-inverse)',
            borderColor: 'var(--border-strong)',
          }}
        >
          세션 생성
        </Button>
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
              actionLabel="세션 생성"
              onAction={() => setCreateOpen(true)}
            />
          ) : (
            sessions.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => openSessionInNewTab(s.id, s.title)}
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
                {s.classPublic ? <Badge status="accent">수업</Badge> : null}
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
              학습자료
            </span>
            <Badge status="warning">API 미구현</Badge>
            <span style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
              API 미구현: 강사가 업로드한 교육/학습자료 목록 연동 전입니다.
            </span>
            <EmptyState
              message="API 미구현"
              description="자료 조회 API가 구현되면 업로드된 교육/학습자료 카드가 표시됩니다."
              actionLabel="새로고침"
              onAction={() => navigate(0)}
            />
          </div>
        </div>
      </div>

      <Modal
        open={createOpen}
        title="세션 생성"
        description="이 클래스에 새 실습 세션을 만듭니다."
        primaryLabel={createSession.isPending ? '생성 중…' : '생성'}
        secondaryLabel="취소"
        onPrimary={onCreateSession}
        onSecondary={() => setCreateOpen(false)}
        onClose={() => setCreateOpen(false)}
      >
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="세션 제목"
          style={{
            width: '100%',
            border: '1px solid var(--border-strong)',
            borderRadius: 8,
            padding: '10px 12px',
            fontFamily: 'var(--font-sans)',
            fontSize: 14,
            boxSizing: 'border-box',
          }}
        />
      </Modal>
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
