import { useMemo, useState } from 'react';
import { isAxiosError } from 'axios';
import { Filter, Mail, Search, UserPlus } from 'lucide-react';
import { MasterShell, PageMain } from '../../components/layout/MasterShell';
import {
  AlertBanner,
  Badge,
  Button,
  Input,
  Modal,
  RowErrorFallback,
  Select,
  Skeleton,
  StatCard,
  StatCardRow,
} from '../../ds';
import {
  QueryAsyncBoundary,
  useCreateInvitation,
  useGetClasses,
  useGetUsers,
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

function MembersBody() {
  const [inviteOpen, setInviteOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('MANAGER');
  const [classId, setClassId] = useState('');
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteOk, setInviteOk] = useState<string | null>(null);

  const filters = useMemo(
    () => ({
      size: 50,
      q: query.trim() || undefined,
      role: roleFilter === 'all' ? undefined : roleFilter,
    }),
    [query, roleFilter],
  );

  const { data: usersPage } = useGetUsers(filters);
  const { data: classesPage } = useGetClasses({ size: 100 });
  const createInvitation = useCreateInvitation();

  const users = usersPage.data;
  const classes = classesPage.data;

  const counts = useMemo(() => {
    const all = users;
    return {
      total: usersPage.meta.total,
      managers: all.filter((u) => u.role === 'MANAGER').length,
      students: all.filter((u) => u.role === 'STUDENT').length,
      masters: all.filter((u) => u.role === 'MASTER').length,
    };
  }, [users, usersPage.meta.total]);

  const onInvite = () => {
    setInviteError(null);
    setInviteOk(null);
    const emails = email
      .split(',')
      .map((e) => e.trim())
      .filter(Boolean);
    if (emails.length === 0) {
      setInviteError('이메일을 입력하세요.');
      return;
    }
    const cid = Number(classId || classes[0]?.id);
    if (!Number.isFinite(cid)) {
      setInviteError('초대할 클래스를 선택하세요.');
      return;
    }
    // 한 명씩 순차 초대
    const first = emails[0];
    createInvitation.mutate(
      { email: first, classId: cid, role },
      {
        onSuccess: (res) => {
          setInviteOk(`${res.email} 초대 완료 · 만료 ${new Date(res.expiresAt).toLocaleString('ko-KR')}`);
          setEmail(emails.slice(1).join(', '));
          if (emails.length === 1) setInviteOpen(false);
        },
        onError: (err) => setInviteError(apiErrorMessage(err, '초대에 실패했습니다.')),
      },
    );
  };

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>회원 관리</h1>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            소속 멤버를 조회하고 초대를 발송합니다.
          </span>
        </div>
        <Button
          variant="primary"
          icon={<UserPlus size={15} strokeWidth={1.75} />}
          onClick={() => {
            setClassId(String(classes[0]?.id ?? ''));
            setInviteOpen(true);
          }}
        >
          멤버 초대
        </Button>
      </div>

      <StatCardRow>
        <StatCard label="전체" value={String(counts.total)} caption="users" />
        <StatCard label="마스터" value={String(counts.masters)} caption="MASTER" />
        <StatCard label="매니저" value={String(counts.managers)} caption="MANAGER" accent />
        <StatCard label="학생" value={String(counts.students)} caption="STUDENT" />
      </StatCardRow>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
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
        <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-muted)' }}>
          <Filter size={12} style={{ marginRight: 4 }} />
          초대 목록/재발송 API는 아직 없습니다
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
            gridTemplateColumns: '2fr 1.1fr 1.2fr 1fr',
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
          <span>주간 세션</span>
          <span style={{ textAlign: 'right' }}>최근 세션</span>
        </div>
        {users.length === 0 ? (
          <div style={{ padding: 24, fontSize: 13, color: 'var(--text-muted)' }}>회원이 없습니다.</div>
        ) : (
          users.map((m: UserSummaryResponse) => (
            <div
              key={m.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1.1fr 1.2fr 1fr',
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
              <span>{roleBadge(m.role)}</span>
              <span>{m.weeklySessionCount}</span>
              <span style={{ textAlign: 'right', color: 'var(--text-muted)' }}>
                {m.lastSessionCreatedAt
                  ? new Date(m.lastSessionCreatedAt).toLocaleDateString('ko-KR')
                  : '—'}
              </span>
            </div>
          ))
        )}
      </div>

      <Modal
        open={inviteOpen}
        title="새 멤버 초대"
        description="이메일로 멤버를 초대합니다. 클래스가 필요합니다."
        primaryLabel={createInvitation.isPending ? '발송 중…' : '초대장 발송하기'}
        secondaryLabel="취소"
        onPrimary={onInvite}
        onSecondary={() => setInviteOpen(false)}
        onClose={() => setInviteOpen(false)}
        width={520}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {inviteError ? <AlertBanner tone="error" title="초대 실패" description={inviteError} /> : null}
          {inviteOk ? <AlertBanner tone="success" title="초대 완료" description={inviteOk} /> : null}
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>이메일 주소</span>
            <Input
              placeholder="name@ssafy.com"
              icon={<Mail size={15} strokeWidth={1.75} />}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              width="100%"
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>시스템 역할</span>
            <Select
              options={[
                { value: 'MANAGER', label: '매니저 (MANAGER)' },
                { value: 'STUDENT', label: '학생 (STUDENT)' },
              ]}
              value={role}
              onChange={(v) => setRole(v as UserRole)}
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>클래스</span>
            <Select
              options={classes.map((c) => ({ value: String(c.id), label: c.name }))}
              value={classId || String(classes[0]?.id ?? '')}
              onChange={setClassId}
            />
          </label>
        </div>
      </Modal>
    </>
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
          <MembersBody />
        </QueryAsyncBoundary>
      </PageMain>
    </MasterShell>
  );
}
