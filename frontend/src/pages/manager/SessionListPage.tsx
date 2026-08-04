import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { Plus, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ConfirmDeleteOverlay } from '../../components/overlays/ConfirmDeleteOverlay';
import { ManagerShell, PageMain } from '../../components/layout/ManagerShell';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import {
  AlertBanner,
  Badge,
  LiveBadge,
  Button,
  EmptyState,
  Input,
  Modal,
  Pagination,
  RowErrorFallback,
  Skeleton,
} from '../../ds';
import {
  QueryAsyncBoundary,
  useCreateSession,
  useDeleteSession,
  useGetGroups,
  useGetSessions,
  useMe,
  type SessionResponse,
} from '../../data';
import { queryKeys } from '../../network/core/queryKeys';
import { getGroups } from '../../network/group/group-apis';
import { getSessions } from '../../network/session/session-apis';
import { saveSessionTitle } from '../../components/session/sessionProjectStorage';

function apiErrorMessage(error: unknown, fallback: string): string {
  if (isAxiosError(error)) {
    const data = error.response?.data;
    if (typeof data === 'object' && data !== null) {
      const message = (data as { message?: unknown }).message;
      if (typeof message === 'string' && message.trim()) return message;
    }
    if (typeof error.message === 'string' && error.message.trim() && error.message !== 'Network Error') {
      return error.message;
    }
  }
  return fallback;
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

function sessionStatus(s: SessionResponse): 'LIVE' | '종료' {
  if (s.active) return 'LIVE';
  return '종료';
}

const SESSION_PAGE_SIZE = 20;

const SESSION_TABLE_MIN_WIDTH = 920;
const SESSION_TABLE_COLUMNS =
  'minmax(180px, 2fr) minmax(130px, 1.2fr) minmax(88px, max-content) minmax(168px, max-content)';

function SessionTable({
  classId,
  statusFilter,
  query,
  page,
  onPage,
  onEmptyCreate,
  onEnter,
  onReport,
  onDelete,
}: {
  classId: number;
  statusFilter: string;
  query: string;
  page: number;
  onPage: (p: number) => void;
  onEmptyCreate: () => void;
  onEnter: (sessionId: number, title: string) => void;
  onReport: (sessionId: number) => void;
  onDelete: (session: SessionResponse) => void;
}) {
  const { data: sessions } = useGetSessions(classId);
  const { data: groups } = useGetGroups(classId);
  const debouncedQuery = useDebouncedValue(query, 300);
  const groupNameById = useMemo(() => {
    const map = new Map<number, string>();
    for (const g of groups) map.set(g.id, g.name);
    return map;
  }, [groups]);

  const filtered = sessions.filter((s) => {
    const status = sessionStatus(s);
    if (debouncedQuery && !s.title.toLowerCase().includes(debouncedQuery.toLowerCase())) return false;
    if (statusFilter === '전체') return true;
    if (statusFilter === '진행') return status === 'LIVE';
    if (statusFilter === '종료') return status === '종료';
    return true;
  });

  const pageCount = Math.max(1, Math.ceil(filtered.length / SESSION_PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const pageItems = filtered.slice(
    (safePage - 1) * SESSION_PAGE_SIZE,
    safePage * SESSION_PAGE_SIZE,
  );
  const rangeStart = filtered.length === 0 ? 0 : (safePage - 1) * SESSION_PAGE_SIZE + 1;
  const rangeEnd = Math.min(safePage * SESSION_PAGE_SIZE, filtered.length);

  useEffect(() => {
    if (page > pageCount) onPage(pageCount);
  }, [page, pageCount, onPage]);

  if (filtered.length === 0) {
    return (
      <EmptyState
        message="세션이 없습니다"
        actionLabel="세션 만들기"
        onAction={onEmptyCreate}
      />
    );
  }

  return (
    <div className="qurie-table-card">
      <div className="qurie-table-scroll">
        <div
          className="qurie-table-inner"
          style={{ minWidth: SESSION_TABLE_MIN_WIDTH, ['--qurie-table-min' as string]: `${SESSION_TABLE_MIN_WIDTH}px` }}
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
              const groupLabel =
                s.groupId != null ? groupNameById.get(s.groupId) ?? `그룹 #${s.groupId}` : null;
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
                      {!s.classPublic && groupLabel ? (
                        <Badge status="neutral">{groupLabel}</Badge>
                      ) : null}
                    </span>
                  </span>
                  <span style={{ color: 'var(--text-secondary)', minWidth: 0, wordBreak: 'break-word' }}>
                    {formatSessionTime(s.createdAt)}
                  </span>
                  <span className="qurie-table-status">
                    {status === 'LIVE' ? <LiveBadge /> : <Badge status="neutral">{status}</Badge>}
                  </span>
                  <span className="qurie-table-actions">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        if (status === '종료') onReport(s.id);
                        else onEnter(s.id, s.title);
                      }}
                    >
                      {status === '종료' ? '리포트' : '입장'}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => onDelete(s)}>
                      삭제
                    </Button>
                  </span>
                </div>
              );
            })}
          </div>
        </div>
        {filtered.length > SESSION_PAGE_SIZE ? (
          <div style={{ padding: '14px 24px', borderTop: '1px solid var(--divider)' }}>
            <Pagination
              page={safePage}
              pageCount={pageCount}
              pageSize={SESSION_PAGE_SIZE}
              rangeLabel={`${rangeStart}–${rangeEnd} / ${filtered.length}개`}
              onPage={onPage}
            />
          </div>
        ) : null}
    </div>
  );
}

export default function SessionListPage() {
  const navigate = useNavigate();
  const { data: me } = useMe();
  const classId = me.classId;
  const hasValidClassId = typeof classId === 'number' && Number.isFinite(classId) && classId > 0;
  const createSession = useCreateSession();
  const deleteSession = useDeleteSession();
  const [status, setStatus] = useState('전체');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [classPublic, setClassPublic] = useState(false);
  const [groupId, setGroupId] = useState<number | ''>('');
  const [createError, setCreateError] = useState<string | null>(null);
  const [rowKey, setRowKey] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<SessionResponse | null>(null);
  const [popupBlockedSessionId, setPopupBlockedSessionId] = useState<number | null>(null);

  const groupsQuery = useQuery({
    queryKey: hasValidClassId ? queryKeys.groups.list(classId) : ['groups', 'idle'],
    queryFn: () => getGroups(classId as number),
    enabled: createOpen && hasValidClassId,
  });

  const chips = ['전체', '진행', '종료'];

  useEffect(() => {
    setPage(1);
  }, [status, query]);

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

  const resetCreateForm = () => {
    setTitle('');
    setClassPublic(false);
    setGroupId('');
    setCreateError(null);
  };

  const onCreate = () => {
    if (!hasValidClassId) return;
    if (!title.trim()) return;
    if (!classPublic && (groupId === '' || !Number.isFinite(groupId))) {
      setCreateError('일반 세션은 그룹을 지정해야 만들 수 있습니다.');
      return;
    }
    setCreateError(null);

    void (async () => {
      if (classPublic) {
        try {
          const existing = await getSessions(classId);
          if (existing.some((s) => s.classPublic && s.active)) {
            setCreateError(
              '이미 진행 중인 수업 공개 세션이 있습니다. 기존 세션을 종료한 뒤 다시 시도해 주세요.',
            );
            return;
          }
        } catch {
          setCreateError('세션 목록을 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.');
          return;
        }
      }

      createSession.mutate(
        {
          classId,
          title: title.trim(),
          ...(classPublic ? { classPublic: true } : { groupId: groupId as number }),
        },
        {
          onSuccess: (created) => {
            setCreateOpen(false);
            resetCreateForm();
            setRowKey((k) => k + 1);
            openSessionInNewTab(created.id, created.title);
          },
          onError: (err) => {
            const msg = apiErrorMessage(err, '세션 생성에 실패했습니다.');
            if (classPublic && /public|공개|already|exist|duplicate|중복/i.test(msg)) {
              setCreateError(
                '이미 진행 중인 수업 공개 세션이 있습니다. 기존 세션을 종료한 뒤 다시 시도해 주세요.',
              );
              return;
            }
            setCreateError(msg);
          },
        },
      );
    })();
  };

  return (
    <ManagerShell activeKey="sessions" breadcrumbs={['서울 1반', '세션']}>
      <PageMain>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, minWidth: 0, width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>세션</h1>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              클래스 세션을 생성하고 상태를 관리하세요.
            </span>
          </div>
          <Button
            variant="primary"
            icon={<Plus size={14} strokeWidth={1.75} />}
            onClick={() => setCreateOpen(true)}
          >
            세션 만들기
          </Button>
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

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
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
          <Input
            placeholder="세션 검색…"
            icon={<Search size={14} strokeWidth={1.75} />}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            width={220}
            style={{ marginLeft: 'auto' }}
          />
        </div>

        {!hasValidClassId ? (
          <EmptyState
            message="소속 클래스가 없습니다"
            description="반 배정 후 다시 로그인하면 세션을 볼 수 있습니다."
            actionLabel="대시보드"
            onAction={() => navigate('/manager')}
          />
        ) : (
          <QueryAsyncBoundary
            key={rowKey}
            suspenseFallback={<TableSkeleton />}
            errorFallback={
              <RowErrorFallback
                onRetry={() => setRowKey((k) => k + 1)}
                title="이 영역을 불러오지 못했습니다"
                description="이 행만 실패했습니다. 나머지 영역은 정상적으로 표시됩니다."
              />
            }
          >
            <SessionTable
              classId={classId}
              statusFilter={status}
              query={query}
              page={page}
              onPage={setPage}
              onEmptyCreate={() => setCreateOpen(true)}
              onEnter={openSessionInNewTab}
              onReport={(sessionId) => navigate(`/session/${sessionId}/report`)}
              onDelete={setDeleteTarget}
            />
          </QueryAsyncBoundary>
        )}

        <Modal
          open={createOpen}
          title="세션 만들기"
          description="제목을 입력하면 세션이 생성됩니다. 수업 공개는 반 전체, 아니면 그룹 단위로 열 수 있어요. 강사만 생성할 수 있고, 프로젝트 임포트는 그룹 리더가 담당해요."
          primaryLabel={createSession.isPending ? '생성 중…' : '생성하기'}
          secondaryLabel="취소"
          onPrimary={onCreate}
          onSecondary={() => {
            setCreateOpen(false);
            resetCreateForm();
          }}
          onClose={() => {
            setCreateOpen(false);
            resetCreateForm();
          }}
          width={480}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>세션 제목</span>
              <Input
                placeholder="예: React Hooks 심화"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                width="100%"
              />
            </label>
            <label
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                fontSize: 13,
                color: 'var(--ink)',
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={classPublic}
                onChange={(e) => {
                  setClassPublic(e.target.checked);
                  setCreateError(null);
                }}
                style={{ marginTop: 2 }}
              />
              <span>
                <span style={{ fontWeight: 600 }}>수업 공개 세션</span>
                <span style={{ display: 'block', marginTop: 4, fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                  강사만 생성할 수 있어요. 학생 대시보드 LIVE에 표시돼요.
                </span>
              </span>
            </label>
            {!classPublic ? (
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>그룹</span>
                <select
                  value={groupId === '' ? '' : String(groupId)}
                  onChange={(e) => {
                    const v = e.target.value;
                    setGroupId(v === '' ? '' : Number(v));
                    setCreateError(null);
                  }}
                  style={{
                    width: '100%',
                    height: 40,
                    borderRadius: 10,
                    border: '1px solid var(--border-strong)',
                    background: 'var(--surface-card)',
                    color: 'var(--ink)',
                    padding: '0 12px',
                    fontFamily: 'var(--font-sans)',
                    fontSize: 13,
                  }}
                >
                  <option value="">그룹을 선택하세요</option>
                  {(groupsQuery.data ?? []).map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
                <span style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                  일반 세션은 그룹을 지정해야 만들 수 있어요. 해당 그룹 구성원만 입장할 수 있어요.
                </span>
              </label>
            ) : null}
            {createError ? <AlertBanner tone="error" title={createError} /> : null}
          </div>
        </Modal>

        <ConfirmDeleteOverlay
          open={deleteTarget != null}
          title="세션 삭제"
          description={
            <>
              이 작업은 되돌릴 수 없습니다.
              <br />
              세션 `<code>{deleteTarget?.title}</code>` 을(를) 삭제합니다.
            </>
          }
          confirmText={deleteTarget?.title ?? ''}
          onClose={() => setDeleteTarget(null)}
          onConfirm={() => {
            if (!deleteTarget) return;
            deleteSession.mutate(
              { id: deleteTarget.id, classId: deleteTarget.classId },
              {
                onSuccess: () => {
                  setRowKey((k) => k + 1);
                  setDeleteTarget(null);
                },
              },
            );
          }}
          confirmLabel={deleteSession.isPending ? '삭제 중…' : '삭제'}
        />
        </div>
      </PageMain>
    </ManagerShell>
  );
}
