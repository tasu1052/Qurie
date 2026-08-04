import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Badge,
  Button,
  EmptyState,
  LiveBadge,
  Pagination,
  RowErrorFallback,
  Skeleton,
} from '../../ds';
import {
  QueryAsyncBoundary,
  useGetSessions,
  useMe,
  type SessionResponse,
} from '../../data';
import { getPastQuizSetBySessionId } from '../../mocks/pastLearning';
import { PastQuizShell } from './pastQuizShell';
import { SESSION_LIST_PAGE_TITLE, usePastQuizBasePath, type PastQuizBasePath } from './pastQuizPaths';

const PAGE_SIZE = 20;

function sessionStatus(s: SessionResponse): 'LIVE' | '종료' {
  if (s.active) return 'LIVE';
  return '종료';
}

function formatSessionTime(iso: string): string {
  return new Date(iso).toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function TableSkeleton() {
  return (
    <div
      style={{
        background: 'var(--surface-card)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        padding: 24,
      }}
    >
      {[0, 1, 2, 3].map((i) => (
        <Skeleton key={i} width="100%" height={36} delay={i * 0.08} style={{ marginBottom: 10 }} />
      ))}
    </div>
  );
}

function SessionListTable({
  classId,
  basePath,
  statusFilter,
}: {
  classId: number;
  basePath: PastQuizBasePath;
  statusFilter: string;
}) {
  const navigate = useNavigate();
  const { data: sessions } = useGetSessions(classId);
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    return sessions.filter((s) => {
      const status = sessionStatus(s);
      if (statusFilter === '전체') return true;
      if (statusFilter === '진행중') return status === 'LIVE';
      if (statusFilter === '종료') return status === '종료';
      return true;
    });
  }, [sessions, statusFilter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const rangeStart = filtered.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(safePage * PAGE_SIZE, filtered.length);

  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  if (filtered.length === 0) {
    return (
      <EmptyState
        message="세션이 없습니다"
        description={
          statusFilter === '종료'
            ? '종료된 세션이 없습니다.'
            : statusFilter === '진행중'
              ? '진행 중인 세션이 없습니다.'
              : '강사가 세션을 열면 여기에 표시돼요.'
        }
        actionLabel={basePath === '/manager' ? '세션 만들기' : '대시보드'}
        onAction={() => navigate(basePath === '/manager' ? '/manager/sessions' : '/app')}
      />
    );
  }

  return (
    <>
      <div
        style={{
          background: 'var(--surface-card)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          boxShadow: 'var(--shadow-card)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1.2fr 0.8fr 1.4fr',
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
          <span>시작</span>
          <span>상태</span>
          <span style={{ textAlign: 'right' }}>액션</span>
        </div>
        {pageItems.map((s) => {
          const status = sessionStatus(s);
          const quizMock = getPastQuizSetBySessionId(s.id);
          return (
            <div
              key={s.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1.2fr 0.8fr 1.4fr',
                padding: '13px 24px',
                borderBottom: '1px solid var(--divider)',
                fontSize: 13,
                alignItems: 'center',
              }}
            >
              <span style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 12.5,
                    color: 'var(--ink)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    flexWrap: 'wrap',
                  }}
                >
                  {s.title}
                  {s.classPublic ? <Badge status="accent">수업</Badge> : null}
                </span>
                {quizMock ? (
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    퀴즈 {quizMock.scoreCorrect}/{quizMock.scoreTotal}
                  </span>
                ) : null}
              </span>
              <span style={{ color: 'var(--text-secondary)' }}>{formatSessionTime(s.createdAt)}</span>
              {status === 'LIVE' ? <LiveBadge /> : <Badge status="neutral">종료</Badge>}
              <span style={{ textAlign: 'right', display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={!quizMock}
                  onClick={() => {
                    if (quizMock) navigate(`${basePath}/quizzes/${quizMock.quizSetId}`);
                  }}
                >
                  지난 퀴즈
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(`/session/${s.id}/report`)}
                >
                  세션 리포트
                </Button>
              </span>
            </div>
          );
        })}
      </div>
      {filtered.length > PAGE_SIZE ? (
        <Pagination
          page={safePage}
          pageCount={pageCount}
          pageSize={PAGE_SIZE}
          rangeLabel={`${rangeStart}–${rangeEnd} / ${filtered.length}개`}
          onPage={setPage}
        />
      ) : null}
    </>
  );
}

type PastQuizListPageProps = {
  basePath?: PastQuizBasePath;
};

export default function PastQuizListPage({ basePath: basePathProp }: PastQuizListPageProps) {
  const navigate = useNavigate();
  const basePath = usePastQuizBasePath(basePathProp);
  const { data: me } = useMe();
  const classId = me.classId;
  const hasValidClassId = typeof classId === 'number' && Number.isFinite(classId) && classId > 0;
  const [status, setStatus] = useState('전체');
  const [rowKey, setRowKey] = useState(0);
  const chips = ['전체', '진행중', '종료'];

  return (
    <PastQuizShell basePath={basePath} breadcrumbs={[SESSION_LIST_PAGE_TITLE]}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>{SESSION_LIST_PAGE_TITLE}</h1>
        <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
          클래스 세션을 확인하고, 종료된 세션의 퀴즈·리포트를 열 수 있어요.
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        {chips.map((c) => {
          const active = status === c;
          return (
            <button
              key={c}
              type="button"
              onClick={() => setStatus(c)}
              style={{
                borderRadius: 999,
                padding: '6px 14px',
                fontSize: 12,
                fontWeight: active ? 600 : 400,
                cursor: 'pointer',
                fontFamily: 'var(--font-sans)',
                border: `1px solid ${active ? 'var(--accent)' : 'var(--border-strong)'}`,
                background: active ? 'var(--accent-softer)' : 'var(--surface-card)',
                color: active ? 'var(--accent)' : 'var(--text-secondary)',
              }}
            >
              {c}
            </button>
          );
        })}
      </div>

      {!hasValidClassId ? (
        <EmptyState
          message="소속 클래스가 없습니다"
          description="반 배정 후 세션 목록을 볼 수 있습니다."
          actionLabel={basePath === '/manager' ? '대시보드' : '마이페이지'}
          onAction={() => navigate(basePath === '/manager' ? '/manager' : '/app/me')}
        />
      ) : (
        <QueryAsyncBoundary
          key={rowKey}
          suspenseFallback={<TableSkeleton />}
          errorFallback={
            <RowErrorFallback
              onRetry={() => setRowKey((k) => k + 1)}
              title="세션 목록을 불러오지 못했습니다"
            />
          }
        >
          <SessionListTable classId={classId} basePath={basePath} statusFilter={status} />
        </QueryAsyncBoundary>
      )}
    </PastQuizShell>
  );
}
