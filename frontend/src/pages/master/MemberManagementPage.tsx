import { useEffect, useMemo, useRef, useState } from 'react';
import { isAxiosError } from 'axios';
import { Filter, Mail, Search, UserPlus } from 'lucide-react';
import { MasterShell, PageMain } from '../../components/layout/MasterShell';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import {
  AlertBanner,
  Badge,
  Button,
  FileDropzone,
  Input,
  Modal,
  Pagination,
  RowErrorFallback,
  Select,
  Skeleton,
  UploadRow,
} from '../../ds';
import {
  QueryAsyncBoundary,
  useCreateBulkInvitations,
  useCreateInvitation,
  useGetClasses,
  useGetUsers,
  type UserRole,
  type UserSummaryResponse,
} from '../../data';
import {
  getUserProfileExtras,
  REGION_OPTIONS,
  regionLabel,
} from '../../utils/userProfileExtras';
import { validateInviteFile } from '../../utils/validateInviteFile';

function apiErrorMessage(error: unknown, fallback: string): string {
  if (isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (typeof message === 'string' && message.trim()) return message;
  }
  return fallback;
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
      {[0, 1, 2, 3, 4].map((i) => (
        <Skeleton key={i} width="100%" height={40} delay={i * 0.08} style={{ marginBottom: 10 }} />
      ))}
    </div>
  );
}

function roleBadge(role: UserRole) {
  if (role === 'MASTER') return <Badge status="ink">MASTER</Badge>;
  if (role === 'MANAGER') return <Badge status="accent">MANAGER</Badge>;
  return <Badge status="neutral">STUDENT</Badge>;
}

type ManagerRow = {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  phone: string;
  region: string;
  gender: string;
};

function toManagerRow(u: UserSummaryResponse): ManagerRow {
  const extras = getUserProfileExtras(u.email);
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    phone: extras.phone ?? '—',
    region: regionLabel(extras.region),
    gender: extras.gender ?? '—',
  };
}

const regionOptions = REGION_OPTIONS.map((r) => ({ value: r.value, label: r.label }));

const MANAGER_PAGE_SIZE = 20;

function ManagersBody({ classes }: { classes: { id: number; name: string }[] }) {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query, 300);
  const [regionFilter, setRegionFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteClassId, setInviteClassId] = useState('');
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteOk, setInviteOk] = useState<string | null>(null);
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [bulkSummary, setBulkSummary] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const createInvitation = useCreateInvitation();
  const createBulk = useCreateBulkInvitations();

  const { data: usersPage } = useGetUsers({ size: 200, role: 'MANAGER' });
  const managers = usersPage.data.map(toManagerRow);

  const filtered = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    return managers.filter((m) => {
      if (regionFilter !== 'all') {
        const extras = getUserProfileExtras(m.email);
        if (extras.region !== regionFilter) return false;
      }
      if (!q) return true;
      return (
        m.name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        m.phone.toLowerCase().includes(q) ||
        m.region.toLowerCase().includes(q)
      );
    });
  }, [managers, debouncedQuery, regionFilter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / MANAGER_PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const pageItems = filtered.slice(
    (safePage - 1) * MANAGER_PAGE_SIZE,
    safePage * MANAGER_PAGE_SIZE,
  );
  const rangeStart = filtered.length === 0 ? 0 : (safePage - 1) * MANAGER_PAGE_SIZE + 1;
  const rangeEnd = Math.min(safePage * MANAGER_PAGE_SIZE, filtered.length);
  const loadedCount = managers.length;
  const totalCount = usersPage.meta.total;

  useEffect(() => {
    setPage(1);
  }, [debouncedQuery, regionFilter]);

  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  const resetInviteMessages = () => {
    setInviteError(null);
    setInviteOk(null);
    setBulkSummary(null);
  };

  const onInvite = () => {
    resetInviteMessages();
    const emails = inviteEmail
      .split(',')
      .map((e) => e.trim())
      .filter(Boolean);
    if (emails.length === 0) {
      setInviteError('이메일을 입력하거나 엑셀·CSV 파일을 선택하세요.');
      return;
    }
    const cid = Number(inviteClassId || classes[0]?.id);
    if (!Number.isFinite(cid)) {
      setInviteError('초대할 클래스를 선택하세요.');
      return;
    }
    createInvitation.mutate(
      { email: emails[0], classId: cid, role: 'MANAGER' },
      {
        onSuccess: (res) => {
          setInviteOk(
            `${res.email}으로 초대장을 보냈습니다. 만료 ${new Date(res.expiresAt).toLocaleString('ko-KR')}`,
          );
          setInviteEmail(emails.slice(1).join(', '));
        },
        onError: (err) => setInviteError(apiErrorMessage(err, '초대에 실패했습니다.')),
      },
    );
  };

  const onBulkInvite = () => {
    resetInviteMessages();
    if (!bulkFile) {
      setInviteError('업로드할 파일을 선택하세요.');
      return;
    }
    const fileError = validateInviteFile(bulkFile);
    if (fileError) {
      setInviteError(fileError);
      return;
    }
    const cid = Number(inviteClassId || classes[0]?.id);
    if (!Number.isFinite(cid)) {
      setInviteError('초대할 클래스를 선택하세요.');
      return;
    }
    createBulk.mutate(
      { file: bulkFile, classId: cid, role: 'MANAGER' },
      {
        onSuccess: (res) => {
          setBulkSummary(`전체 ${res.total}건 · 성공 ${res.invited} · 실패 ${res.failed}`);
          setBulkFile(null);
        },
        onError: (err) => setInviteError(apiErrorMessage(err, '일괄 초대에 실패했습니다.')),
      },
    );
  };

  const pending = createInvitation.isPending || createBulk.isPending;
  const primaryAction = bulkFile ? onBulkInvite : onInvite;
  const primaryLabel = pending
    ? '발송 중…'
    : bulkFile
      ? '엑셀·CSV 일괄 초대'
      : inviteOk
        ? '추가로 발송'
        : '초대장 발송하기';

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.xlsx,.xls,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0] ?? null;
          if (file) {
            const err = validateInviteFile(file);
            if (err) {
              setInviteError(err);
              setBulkFile(null);
              e.target.value = '';
              return;
            }
          }
          setBulkFile(file);
          setInviteEmail('');
          resetInviteMessages();
          e.target.value = '';
        }}
      />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>매니저 관리</h1>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            매니저를 조회하고 강사 초대를 발송합니다.
          </span>
        </div>
        <Button variant="primary" icon={<UserPlus size={15} strokeWidth={1.75} />} onClick={() => {
          setInviteClassId(String(classes[0]?.id ?? ''));
          setInviteEmail('');
          setBulkFile(null);
          resetInviteMessages();
          setInviteOpen(true);
        }}>
          매니저 초대
        </Button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <Input
          placeholder="이름 · 이메일 · 전화 · 지역 검색…"
          icon={<Search size={14} strokeWidth={1.75} />}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          width={260}
        />
        <Select options={regionOptions} value={regionFilter} onChange={setRegionFilter} />
        <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-muted)' }}>
          <Filter size={12} style={{ marginRight: 4 }} />
          {filtered.length}명 표시
          {totalCount > loadedCount ? ` · 총 ${totalCount}명 중 ${loadedCount}명 로드됨` : null}
        </span>
      </div>

      <div className="qurie-table-card">
        <div className="qurie-table-scroll">
          <div style={{ minWidth: 800 }}>
            <div
              className="qurie-table-grid"
              style={{
                gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr',
                padding: '12px 24px',
                borderBottom: '1px solid var(--divider)',
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: 'var(--text-muted)',
              }}
            >
              <span>매니저</span>
              <span>역할</span>
              <span>전화번호</span>
              <span>지역</span>
              <span>성별</span>
            </div>
            {filtered.length === 0 ? (
              <div style={{ padding: 24, fontSize: 13, color: 'var(--text-muted)' }}>매니저가 없습니다.</div>
            ) : (
              pageItems.map((m) => (
                <div
                  key={m.id}
                  className="qurie-table-grid"
                  style={{
                    gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr',
                    padding: '13px 24px',
                    borderBottom: '1px solid var(--divider)',
                    fontSize: 13,
                    alignItems: 'center',
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                    <span
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        background: 'var(--accent-soft)',
                        color: 'var(--accent)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 12,
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                    >
                      {(m.name || '?').slice(0, 1)}
                    </span>
                    <span style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                      <span style={{ fontWeight: 600, color: 'var(--ink)' }}>{m.name}</span>
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 12,
                          color: 'var(--text-muted)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {m.email}
                      </span>
                    </span>
                  </span>
                  <span style={{ display: 'inline-flex', justifySelf: 'start' }}>{roleBadge(m.role)}</span>
                  <span>{m.phone}</span>
                  <span>{m.region}</span>
                  <span>{m.gender}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {filtered.length > MANAGER_PAGE_SIZE ? (
        <Pagination
          page={safePage}
          pageCount={pageCount}
          pageSize={MANAGER_PAGE_SIZE}
          rangeLabel={`${rangeStart}–${rangeEnd} / ${filtered.length}명`}
          onPage={setPage}
        />
      ) : null}

      <Modal
        open={inviteOpen}
        title="강사(매니저) 초대"
        description="이메일 한 명 또는 엑셀·CSV로 일괄 초대합니다. 마스터는 매니저만 초대할 수 있어요."
        primaryLabel={primaryLabel}
        secondaryLabel={inviteOk || bulkSummary ? '닫기' : '취소'}
        onPrimary={primaryAction}
        onSecondary={() => {
          setInviteOpen(false);
          setBulkFile(null);
          resetInviteMessages();
        }}
        onClose={() => {
          setInviteOpen(false);
          setBulkFile(null);
          resetInviteMessages();
        }}
        width={520}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {inviteError ? <AlertBanner tone="error" title="초대 실패" description={inviteError} /> : null}
          {inviteOk ? <AlertBanner tone="success" title="초대 발송 완료" description={inviteOk} /> : null}
          {bulkSummary ? (
            <AlertBanner tone="success" title="일괄 초대 결과" description={bulkSummary} />
          ) : null}
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>이메일 주소</span>
            <Input
              placeholder="name@ssafy.com"
              icon={<Mail size={15} strokeWidth={1.75} />}
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              width="100%"
              disabled={!!bulkFile}
            />
          </label>
          {classes.length > 1 ? (
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>배정 클래스</span>
              <Select
                options={classes.map((c) => ({ value: String(c.id), label: c.name }))}
                value={inviteClassId || String(classes[0]?.id ?? '')}
                onChange={setInviteClassId}
              />
            </label>
          ) : classes[0] ? (
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              배정 클래스: {classes[0].name}
            </span>
          ) : null}
          {bulkFile ? (
            <UploadRow name={bulkFile.name} percent={100} onCancel={() => setBulkFile(null)} />
          ) : (
            <FileDropzone
              title="엑셀·CSV 일괄 초대"
              description="이메일 열이 있는 .xlsx / .xls / .csv 파일을 업로드하세요."
              hint="역할은 매니저로 고정됩니다"
              actionLabel="파일 선택"
              onSelect={() => fileInputRef.current?.click()}
            />
          )}
        </div>
      </Modal>
    </>
  );
}

function ManagersGate() {
  const { data: classesPage } = useGetClasses({ size: 100 });
  return <ManagersBody classes={classesPage.data} />;
}

export default function MemberManagementPage() {
  const [rowKey, setRowKey] = useState(0);

  return (
    <MasterShell activeKey="members" breadcrumbs={['SSAFY 서울캠퍼스', '매니저 관리']}>
      <PageMain>
        <QueryAsyncBoundary
          key={rowKey}
          suspenseFallback={<TableSkeleton />}
          errorFallback={
            <RowErrorFallback
              onRetry={() => setRowKey((k) => k + 1)}
              title="매니저 목록을 불러오지 못했습니다"
            />
          }
        >
          <ManagersGate />
        </QueryAsyncBoundary>
      </PageMain>
    </MasterShell>
  );
}
