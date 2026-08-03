import { useEffect, useMemo, useRef, useState } from 'react';
import { isAxiosError } from 'axios';
import { useSearchParams } from 'react-router-dom';
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
  RowErrorFallback,
  Select,
  Skeleton,
  StatCard,
  StatCardRow,
  UploadRow,
} from '../../ds';
import {
  QueryAsyncBoundary,
  useCreateBulkInvitations,
  useCreateInvitation,
  useGetClassMembers,
  useGetClasses,
  useGetUsers,
  type ClassMemberResponse,
  type UserRole,
  type UserSummaryResponse,
} from '../../data';

function apiErrorMessage(error: unknown, fallback: string): string {
  if (isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (typeof message === 'string' && message.trim()) return message;
  }
  return fallback;
}

function KpiSkeleton() {
  return (
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
          <Skeleton width="30%" height={28} delay={i * 0.08 + 0.04} style={{ marginTop: 12 }} />
        </div>
      ))}
    </StatCardRow>
  );
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

type MemberRow = {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  weeklySessionCount?: number;
  lastSessionCreatedAt?: string | null;
  groupName?: string | null;
};

function toRowFromUser(u: UserSummaryResponse): MemberRow {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    weeklySessionCount: u.weeklySessionCount,
    lastSessionCreatedAt: u.lastSessionCreatedAt,
  };
}

function toRowFromMember(m: ClassMemberResponse): MemberRow {
  return {
    id: m.userId,
    name: m.name,
    email: m.email,
    role: m.role,
    groupName: m.groupName,
  };
}

function MembersChrome({
  members,
  totalCaption,
  classFilter,
  setClassFilter,
  classOptions,
  query,
  setQuery,
  roleFilter,
  setRoleFilter,
  onOpenInvite,
  inviteOpen,
  closeInvite,
  onInvite,
  inviteEmail,
  setInviteEmail,
  inviteClassId,
  setInviteClassId,
  createPending,
  inviteError,
  inviteOk,
  classes,
  bulkFile,
  onPickBulkFile,
  onClearBulkFile,
  onBulkInvite,
  bulkPending,
  bulkSummary,
}: {
  members: MemberRow[];
  totalCaption: number;
  classFilter: string;
  setClassFilter: (v: string) => void;
  classOptions: { value: string; label: string }[];
  query: string;
  setQuery: (v: string) => void;
  roleFilter: 'all' | UserRole;
  setRoleFilter: (v: 'all' | UserRole) => void;
  onOpenInvite: () => void;
  inviteOpen: boolean;
  closeInvite: () => void;
  onInvite: () => void;
  inviteEmail: string;
  setInviteEmail: (v: string) => void;
  inviteClassId: string;
  setInviteClassId: (v: string) => void;
  createPending: boolean;
  inviteError: string | null;
  inviteOk: string | null;
  classes: { id: number; name: string }[];
  bulkFile: File | null;
  onPickBulkFile: () => void;
  onClearBulkFile: () => void;
  onBulkInvite: () => void;
  bulkPending: boolean;
  bulkSummary: string | null;
}) {
  const debouncedQuery = useDebouncedValue(query, 300);
  const filtered = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    return members.filter((m) => {
      if (roleFilter !== 'all' && m.role !== roleFilter) return false;
      if (!q) return true;
      return m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q);
    });
  }, [members, debouncedQuery, roleFilter]);

  const counts = useMemo(
    () => ({
      total: totalCaption,
      managers: members.filter((u) => u.role === 'MANAGER').length,
      students: members.filter((u) => u.role === 'STUDENT').length,
      masters: members.filter((u) => u.role === 'MASTER').length,
    }),
    [members, totalCaption],
  );

  const pending = createPending || bulkPending;
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>회원 관리</h1>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            소속 멤버를 조회하고 강사(매니저) 초대를 발송합니다.
          </span>
        </div>
        <Button variant="primary" icon={<UserPlus size={15} strokeWidth={1.75} />} onClick={onOpenInvite}>
          멤버 초대
        </Button>
      </div>

      <StatCardRow>
        <StatCard label="전체" value={String(counts.total)} caption="users" />
        <StatCard label="마스터" value={String(counts.masters)} caption="MASTER" />
        <StatCard label="매니저" value={String(counts.managers)} caption="MANAGER" accent />
        <StatCard label="학생" value={String(counts.students)} caption="STUDENT" />
      </StatCardRow>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <Input
          placeholder="이름 · 이메일 검색…"
          icon={<Search size={14} strokeWidth={1.75} />}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          width={260}
        />
        <Select
          options={[
            { value: 'all', label: '전체 역할' },
            { value: 'MASTER', label: 'MASTER' },
            { value: 'MANAGER', label: 'MANAGER' },
            { value: 'STUDENT', label: 'STUDENT' },
          ]}
          value={roleFilter}
          onChange={(v) => setRoleFilter(v as typeof roleFilter)}
        />
        <Select options={classOptions} value={classFilter} onChange={setClassFilter} />
        <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-muted)' }}>
          <Filter size={12} style={{ marginRight: 4 }} />
          {filtered.length}명 표시
        </span>
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
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: classFilter === 'all' ? '2fr 1.1fr 1.2fr 1fr' : '2fr 1.1fr 1.2fr',
            padding: '12px 24px',
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
          {classFilter === 'all' ? (
            <>
              <span>주간 세션</span>
              <span style={{ textAlign: 'right' }}>최근 세션</span>
            </>
          ) : (
            <span>그룹</span>
          )}
        </div>
        {filtered.length === 0 ? (
          <div style={{ padding: 24, fontSize: 13, color: 'var(--text-muted)' }}>회원이 없습니다.</div>
        ) : (
          filtered.map((m) => (
            <div
              key={m.id}
              style={{
                display: 'grid',
                gridTemplateColumns: classFilter === 'all' ? '2fr 1.1fr 1.2fr 1fr' : '2fr 1.1fr 1.2fr',
                padding: '13px 24px',
                borderBottom: '1px solid var(--divider)',
                fontSize: 13,
                alignItems: 'center',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: m.role === 'MASTER' ? 'var(--secondary-100)' : 'var(--accent-soft)',
                    color: m.role === 'MASTER' ? 'var(--ink)' : 'var(--accent)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  {(m.name || '?').slice(0, 1)}
                </span>
                <span style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontWeight: 600, color: 'var(--ink)' }}>{m.name}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)' }}>
                    {m.email}
                  </span>
                </span>
              </span>
              <span style={{ display: 'inline-flex', justifySelf: 'start' }}>{roleBadge(m.role)}</span>
              {classFilter === 'all' ? (
                <>
                  <span>{m.weeklySessionCount ?? '—'}</span>
                  <span style={{ textAlign: 'right', color: 'var(--text-muted)' }}>
                    {m.lastSessionCreatedAt
                      ? new Date(m.lastSessionCreatedAt).toLocaleDateString('ko-KR')
                      : '—'}
                  </span>
                </>
              ) : (
                <span style={{ color: 'var(--text-secondary)' }}>{m.groupName ?? '—'}</span>
              )}
            </div>
          ))
        )}
      </div>

      <Modal
        open={inviteOpen}
        title="강사(매니저) 초대"
        description="이메일 한 명 또는 엑셀·CSV로 일괄 초대합니다. 마스터는 매니저만 초대할 수 있어요."
        primaryLabel={primaryLabel}
        secondaryLabel={inviteOk || bulkSummary ? '닫기' : '취소'}
        onPrimary={primaryAction}
        onSecondary={closeInvite}
        onClose={closeInvite}
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
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>클래스</span>
            <Select
              options={classes.map((c) => ({ value: String(c.id), label: c.name }))}
              value={inviteClassId || String(classes[0]?.id ?? '')}
              onChange={setInviteClassId}
            />
          </label>
          {bulkFile ? (
            <UploadRow name={bulkFile.name} percent={100} onCancel={onClearBulkFile} />
          ) : (
            <FileDropzone
              title="엑셀·CSV 일괄 초대"
              description="이메일 열이 있는 .xlsx / .xls / .csv 파일을 업로드하세요."
              hint="역할은 매니저로 고정됩니다"
              actionLabel="파일 선택"
              onSelect={onPickBulkFile}
            />
          )}
        </div>
      </Modal>
    </>
  );
}

function AllUsersBody({
  classFilter,
  setClassFilter,
  classOptions,
  classes,
}: {
  classFilter: string;
  setClassFilter: (v: string) => void;
  classOptions: { value: string; label: string }[];
  classes: { id: number; name: string }[];
}) {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query, 300);
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');
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

  const filters = useMemo(
    () => ({
      size: 200,
      q: debouncedQuery.trim() || undefined,
      role: roleFilter === 'all' ? undefined : roleFilter,
    }),
    [debouncedQuery, roleFilter],
  );
  const { data: usersPage } = useGetUsers(filters);
  const members = usersPage.data.map(toRowFromUser);

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

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.xlsx,.xls,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0] ?? null;
          setBulkFile(file);
          setInviteEmail('');
          resetInviteMessages();
          e.target.value = '';
        }}
      />
      <MembersChrome
        members={members}
        totalCaption={usersPage.meta.total}
        classFilter={classFilter}
        setClassFilter={setClassFilter}
        classOptions={classOptions}
        query={query}
        setQuery={setQuery}
        roleFilter={roleFilter}
        setRoleFilter={setRoleFilter}
        onOpenInvite={() => {
          setInviteClassId(String(classes[0]?.id ?? ''));
          setInviteEmail('');
          setBulkFile(null);
          resetInviteMessages();
          setInviteOpen(true);
        }}
        inviteOpen={inviteOpen}
        closeInvite={() => {
          setInviteOpen(false);
          setBulkFile(null);
          resetInviteMessages();
        }}
        onInvite={onInvite}
        inviteEmail={inviteEmail}
        setInviteEmail={setInviteEmail}
        inviteClassId={inviteClassId}
        setInviteClassId={setInviteClassId}
        createPending={createInvitation.isPending}
        inviteError={inviteError}
        inviteOk={inviteOk}
        classes={classes}
        bulkFile={bulkFile}
        onPickBulkFile={() => fileInputRef.current?.click()}
        onClearBulkFile={() => setBulkFile(null)}
        onBulkInvite={onBulkInvite}
        bulkPending={createBulk.isPending}
        bulkSummary={bulkSummary}
      />
    </>
  );
}

function ClassMembersBody({
  classId,
  classFilter,
  setClassFilter,
  classOptions,
  classes,
}: {
  classId: number;
  classFilter: string;
  setClassFilter: (v: string) => void;
  classOptions: { value: string; label: string }[];
  classes: { id: number; name: string }[];
}) {
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteClassId, setInviteClassId] = useState(String(classId));
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteOk, setInviteOk] = useState<string | null>(null);
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [bulkSummary, setBulkSummary] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const createInvitation = useCreateInvitation();
  const createBulk = useCreateBulkInvitations();
  const { data: membersPage } = useGetClassMembers(classId, { size: 200 });
  const members = membersPage.data.map(toRowFromMember);

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
    const cid = Number(inviteClassId || classId);
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
    const cid = Number(inviteClassId || classId);
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

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.xlsx,.xls,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0] ?? null;
          setBulkFile(file);
          setInviteEmail('');
          resetInviteMessages();
          e.target.value = '';
        }}
      />
      <MembersChrome
        members={members}
        totalCaption={membersPage.meta.total}
        classFilter={classFilter}
        setClassFilter={setClassFilter}
        classOptions={classOptions}
        query={query}
        setQuery={setQuery}
        roleFilter={roleFilter}
        setRoleFilter={setRoleFilter}
        onOpenInvite={() => {
          setInviteClassId(String(classId));
          setInviteEmail('');
          setBulkFile(null);
          resetInviteMessages();
          setInviteOpen(true);
        }}
        inviteOpen={inviteOpen}
        closeInvite={() => {
          setInviteOpen(false);
          setBulkFile(null);
          resetInviteMessages();
        }}
        onInvite={onInvite}
        inviteEmail={inviteEmail}
        setInviteEmail={setInviteEmail}
        inviteClassId={inviteClassId}
        setInviteClassId={setInviteClassId}
        createPending={createInvitation.isPending}
        inviteError={inviteError}
        inviteOk={inviteOk}
        classes={classes}
        bulkFile={bulkFile}
        onPickBulkFile={() => fileInputRef.current?.click()}
        onClearBulkFile={() => setBulkFile(null)}
        onBulkInvite={onBulkInvite}
        bulkPending={createBulk.isPending}
        bulkSummary={bulkSummary}
      />
    </>
  );
}

function MembersGate() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: classesPage } = useGetClasses({ size: 100 });
  const classes = classesPage.data;
  const classOptions = useMemo(
    () => [{ value: 'all', label: '전체 반' }, ...classes.map((c) => ({ value: String(c.id), label: c.name }))],
    [classes],
  );

  const urlClass = searchParams.get('classId');
  const classFilter =
    urlClass && classes.some((c) => String(c.id) === urlClass) ? urlClass : urlClass === 'all' || !urlClass ? 'all' : 'all';

  const setClassFilter = (v: string) => {
    const next = new URLSearchParams(searchParams);
    if (v === 'all') next.delete('classId');
    else next.set('classId', v);
    setSearchParams(next, { replace: true });
  };

  // sync invalid classId out of URL
  useEffect(() => {
    if (urlClass && urlClass !== 'all' && !classes.some((c) => String(c.id) === urlClass)) {
      const next = new URLSearchParams(searchParams);
      next.delete('classId');
      setSearchParams(next, { replace: true });
    }
  }, [urlClass, classes, searchParams, setSearchParams]);

  if (classFilter !== 'all') {
    return (
      <ClassMembersBody
        classId={Number(classFilter)}
        classFilter={classFilter}
        setClassFilter={setClassFilter}
        classOptions={classOptions}
        classes={classes}
      />
    );
  }

  return (
    <AllUsersBody
      classFilter={classFilter}
      setClassFilter={setClassFilter}
      classOptions={classOptions}
      classes={classes}
    />
  );
}

export default function MemberManagementPage() {
  const [rowKey, setRowKey] = useState(0);

  return (
    <MasterShell activeKey="members" breadcrumbs={['SSAFY 서울캠퍼스', '회원 관리']}>
      <PageMain>
        <QueryAsyncBoundary
          key={rowKey}
          suspenseFallback={
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <KpiSkeleton />
              <TableSkeleton />
            </div>
          }
          errorFallback={
            <RowErrorFallback
              onRetry={() => setRowKey((k) => k + 1)}
              title="회원 목록을 불러오지 못했습니다"
            />
          }
        >
          <MembersGate />
        </QueryAsyncBoundary>
      </PageMain>
    </MasterShell>
  );
}
