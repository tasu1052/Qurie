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
import { getSessionReport } from '../../network/session/session-apis';
import { saveSessionTitle } from '../../components/session/sessionProjectStorage';
import { PastQuizShell } from './pastQuizShell';
import { SESSION_LIST_PAGE_TITLE, usePastQuizBasePath, type PastQuizBasePath } from './pastQuizPaths';

const PAGE_SIZE = 20;

/** Two action buttons (지난 퀴즈 + 세션 리포트) need a wider action column than manager sessions. */
const SESSION_TABLE_MIN_WIDTH = 960;
const SESSION_TABLE_COLUMNS =
  'minmax(160px, 2fr) minmax(120px, 1.2fr) minmax(88px, max-content) minmax(240px, max-content)';

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
  // 종료된 세션까지 받아야 '전체/종료' 칩이 실제 데이터를 보여준다
  const { data: sessions } = useGetSessions(classId, { includeEnded: true });
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const list = sessions.filter((s) => {
      const status = sessionStatus(s);
      if (statusFilter === '전체') return true;
      if (statusFilter === '진행중') return status === 'LIVE';
      if (statusFilter === '종료') return status === '종료';
      return true;
    });
    // 정렬: LIVE 먼저 → LIVE 안에서는 수업(클래스 공개) 세션 우선 → 생성일 최신순.
    // 종료 세션은 그 뒤에 최신순으로 이어진다.
    return [...list].sort((a, b) => {
      if (a.active !== b.active) return a.active ? -1 : 1;
      if (a.active && a.classPublic !== b.classPublic) return a.classPublic ? -1 : 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
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

  const [quizLoadingId, setQuizLoadingId] = useState<number | null>(null);

  /** LIVE 세션 입장 — 세션 화면은 새 탭에서 열리고, 팝업이 차단되면 현재 탭으로 이동한다. */
  const enterSession = (s: SessionResponse) => {
    saveSessionTitle(s.id, s.title);
    const url = `/session/${s.id}?title=${encodeURIComponent(s.title)}`;
    const win = window.open(url, '_blank');
    if (!win) {
      navigate(`/session/${s.id}?title=${encodeURIComponent(s.title)}`);
      return;
    }
    win.opener = null;
  };

  const openPastQuiz = async (sessionId: number) => {
    setQuizLoadingId(sessionId);
    try {
      const report = await getSessionReport(sessionId);
      if (report.quizSetId != null) {
        navigate(`${basePath}/quizzes/${report.quizSetId}`);
        return;
      }
      navigate(`/session/${sessionId}/report`);
    } catch {
      navigate(`/session/${sessionId}/report`);
    } finally {
      setQuizLoadingId(null);
    }
  };

  if (filtered.length === 0) {
    // 종료 필터의 빈 화면에서는 '세션 만들기' 같은 액션이 어울리지 않으므로 안내만 보여준다.
    if (statusFilter === '종료') {
      return <EmptyState message="종료된 세션이 없습니다" />;
    }
    return (
      <EmptyState
        message={statusFilter === '진행중' ? '진행 중인 세션이 없습니다' : '세션이 없습니다'}
        description="강사가 세션을 열면 여기에 표시돼요."
        actionLabel={basePath === '/manager' ? '세션 만들기' : '대시보드'}
        onAction={() => navigate(basePath === '/manager' ? '/manager/sessions' : '/app')}
      />
    );
  }

  return (
    <div className="qurie-table-card">
      <div className="qurie-table-scroll">
        <div
          className="qurie-table-inner"
          style={{
            minWidth: SESSION_TABLE_MIN_WIDTH,
            ['--qurie-table-min' as string]: `${SESSION_TABLE_MIN_WIDTH}px`,
          }}
        >
          <div
            className="qurie-table-grid"
            style={{
              gridTemplateColumns: SESSION_TABLE_COLUMNS,
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
            return (
              <div
                key={s.id}
                className="qurie-table-grid"
                style={{
                  gridTemplateColumns: SESSION_TABLE_COLUMNS,
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
                      wordBreak: 'break-word',
                    }}
                  >
                    {s.title}
                    {s.classPublic ? <Badge status="accent">수업</Badge> : null}
                  </span>
                </span>
                <span style={{ color: 'var(--text-secondary)', minWidth: 0, wordBreak: 'break-word' }}>
                  {formatSessionTime(s.createdAt)}
                </span>
                <span className="qurie-table-status">
                  {status === 'LIVE' ? <LiveBadge /> : <Badge status="neutral">종료</Badge>}
                </span>
                <span className="qurie-table-actions">
                  {status === 'LIVE' ? (
                    <Button variant="secondary" size="sm" onClick={() => enterSession(s)}>
                      입장
                    </Button>
                  ) : (
                    <>
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={quizLoadingId === s.id}
                        onClick={() => void openPastQuiz(s.id)}
                      >
                        {quizLoadingId === s.id ? '열기…' : '지난 퀴즈'}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/session/${s.id}/report`)}
                      >
                        세션 리포트
                      </Button>
                    </>
                  )}
                </span>
              </div>
            );
          })}
        </div>
      </div>
      {filtered.length > PAGE_SIZE ? (
        <div style={{ padding: '14px 24px', borderTop: '1px solid var(--divider)' }}>
          <Pagination
            page={safePage}
            pageCount={pageCount}
            pageSize={PAGE_SIZE}
            rangeLabel={`${rangeStart}–${rangeEnd} / ${filtered.length}개`}
            onPage={setPage}
          />
        </div>
      ) : null}
    </div>
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, minWidth: 0, width: '100%' }}>
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
      </div>
    </PastQuizShell>
  );
}
