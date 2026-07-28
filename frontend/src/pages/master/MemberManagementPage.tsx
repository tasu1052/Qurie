import { useState } from 'react';
import { Filter, Mail, Search, UserPlus } from 'lucide-react';
import { MasterShell, PageMain } from '../../components/layout/MasterShell';
import { MockRowBoundary } from '../../components/feedback/MockRowBoundary';
import {
  Badge,
  Button,
  Input,
  InvitationRow,
  Modal,
  Select,
  Skeleton,
  StatCard,
  StatCardRow,
} from '../../ds';
import { useMemberKpiRow, useMemberListRow } from '../../data';
import type { MemberRow } from '../../data';

function KpiSkeleton() {
  return (
    <StatCardRow>
      {[0, 1, 2, 3].map((i) => (
        <div key={i} style={{ background: 'var(--surface-card)', border: '1px solid var(--border)', borderRadius: 'var(--card-radius)', padding: 'var(--stat-card-padding)' }}>
          <Skeleton width="50%" height={14} delay={i * 0.08} />
          <Skeleton width="30%" height={28} delay={i * 0.08 + 0.04} style={{ marginTop: 12 }} />
        </div>
      ))}
    </StatCardRow>
  );
}

function TableSkeleton() {
  return (
    <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border)', borderRadius: 16, padding: 24 }}>
      {[0, 1, 2, 3, 4].map((i) => (
        <Skeleton key={i} width="100%" height={40} delay={i * 0.08} style={{ marginBottom: 10 }} />
      ))}
    </div>
  );
}

function roleBadge(role: MemberRow['systemRole']) {
  if (role === 'MASTER') return <Badge status="ink">MASTER</Badge>;
  return (
    <Select
      size="sm"
      options={[
        { value: 'MANAGER', label: 'MANAGER' },
        { value: 'STUDENT', label: 'STUDENT' },
      ]}
      value={role}
      onChange={() => undefined}
    />
  );
}

function inviteBadge(status: MemberRow['inviteStatus']) {
  if (!status) return <span style={{ color: 'var(--text-muted)' }}>—</span>;
  const map = { ACCEPTED: 'success', PENDING: 'warning', EXPIRED: 'error' } as const;
  return <Badge status={map[status]}>{status}</Badge>;
}

function accountBadge(status: MemberRow['accountStatus']) {
  if (!status) return <span style={{ color: 'var(--text-muted)' }}>—</span>;
  return <Badge status={status === 'active' ? 'success' : 'error'}>{status === 'active' ? '활성' : '비활성'}</Badge>;
}

export default function MemberManagementPage() {
  const kpi = useMemberKpiRow();
  const list = useMemberListRow();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('MANAGER');
  const [query, setQuery] = useState('');

  return (
    <MasterShell activeKey="members" breadcrumbs={['SSAFY 서울캠퍼스', '회원 관리']}>
      <PageMain>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>회원 관리</h1>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              매니저 계정을 초대하고 상태를 관리하세요. 초대 링크는 48시간 동안 유효합니다.
            </span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="secondary" icon={<Filter size={14} strokeWidth={1.75} />} onClick={() => undefined}>
              필터
            </Button>
            <Button variant="primary" icon={<UserPlus size={14} strokeWidth={1.75} />} onClick={() => setInviteOpen(true)}>
              멤버 초대하기
            </Button>
          </div>
        </div>

        <MockRowBoundary status={kpi.status} skeleton={<KpiSkeleton />} onRetry={kpi.refetch} emptyMessage="KPI 데이터가 없습니다" label="row 1 · kpi">
          <StatCardRow>
            {(kpi.data ?? []).map((item, i) => (
              <StatCard key={i} {...item} />
            ))}
          </StatCardRow>
        </MockRowBoundary>

        <MockRowBoundary
          status={list.status}
          skeleton={<TableSkeleton />}
          onRetry={list.refetch}
          emptyMessage="멤버가 없습니다"
          emptyActionLabel="멤버 초대하기"
          onEmptyAction={() => setInviteOpen(true)}
          label="row 2 · members"
        >
          {list.data && (
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
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '16px 24px', borderBottom: '1px solid var(--divider)' }}>
                  <Input
                    placeholder="이름 또는 이메일 검색…"
                    icon={<Search size={14} strokeWidth={1.75} />}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    width={260}
                  />
                  <Select options={[{ value: 'all', label: '전체 상태' }]} value="all" onChange={() => undefined} />
                  <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-muted)' }}>
                    정렬: <span style={{ color: 'var(--ink)', fontWeight: 600 }}>최신순 ↕</span>
                  </span>
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 1.1fr 1.1fr 1.1fr 1fr 48px',
                    padding: '10px 24px',
                    borderBottom: '1px solid var(--divider)',
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    color: 'var(--text-muted)',
                  }}
                >
                  <span>멤버 정보</span>
                  <span>시스템 역할</span>
                  <span>초대 상태</span>
                  <span>계정 상태</span>
                  <span style={{ textAlign: 'right' }}>최근 접속</span>
                  <span />
                </div>
                {list.data.members
                  .filter((m) => !query || m.name.includes(query) || m.email.includes(query))
                  .map((m) => (
                    <div
                      key={m.id}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '2fr 1.1fr 1.1fr 1.1fr 1fr 48px',
                        padding: '13px 24px',
                        borderBottom: '1px solid var(--divider)',
                        fontSize: 13,
                        alignItems: 'center',
                        background: m.dimmed ? 'var(--surface-sunken)' : undefined,
                        opacity: m.dimmed ? 0.85 : 1,
                      }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            background: m.systemRole === 'MASTER' ? 'var(--secondary-100)' : 'var(--accent-soft)',
                            color: m.systemRole === 'MASTER' ? 'var(--ink)' : 'var(--accent)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 12,
                            fontWeight: 700,
                          }}
                        >
                          {m.initial}
                        </span>
                        <span style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: 600, color: 'var(--ink)' }}>{m.name}</span>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)' }}>{m.email}</span>
                        </span>
                      </span>
                      <span>{roleBadge(m.systemRole)}</span>
                      <span>{inviteBadge(m.inviteStatus)}</span>
                      <span>{accountBadge(m.accountStatus)}</span>
                      <span style={{ textAlign: 'right', color: 'var(--text-muted)' }}>{m.lastSeen}</span>
                      <span style={{ textAlign: 'right', color: 'var(--text-muted)', cursor: 'pointer', fontWeight: 700, letterSpacing: 1 }}>⋯</span>
                    </div>
                  ))}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 24px' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>총 48명 중 1–6 표시</span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <Button variant="secondary" size="sm" onClick={() => undefined}>이전</Button>
                    <Button variant="secondary" size="sm" onClick={() => undefined}>다음</Button>
                  </div>
                </div>
              </div>

              {list.data.invites.length > 0 && (
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
                  <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                    대기 중 초대
                  </span>
                  {list.data.invites.map((inv) => (
                    <InvitationRow
                      key={inv.id}
                      email={inv.email}
                      meta={inv.meta}
                      status={inv.status}
                      cooldownSec={inv.cooldownSec}
                      onResend={() => undefined}
                      onCancel={() => undefined}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </MockRowBoundary>

        <Modal
          open={inviteOpen}
          title="새 멤버 초대"
          description="이메일로 매니저를 초대하세요. 고유 토큰이 발급됩니다."
          primaryLabel="초대장 발송하기"
          secondaryLabel="취소"
          onPrimary={() => setInviteOpen(false)}
          onSecondary={() => setInviteOpen(false)}
          onClose={() => setInviteOpen(false)}
          width={520}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>이메일 주소</span>
              <Input
                placeholder="name@ssafy.com, name2@ssafy.com"
                icon={<Mail size={15} strokeWidth={1.75} />}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                width="100%"
              />
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>쉼표(,)로 구분하여 여러 명을 한꺼번에 초대할 수 있습니다.</span>
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>시스템 역할</span>
              <Select
                options={[
                  { value: 'MANAGER', label: '매니저 (MANAGER)' },
                  { value: 'STUDENT', label: '학생 (STUDENT)' },
                ]}
                value={role}
                onChange={setRole}
              />
            </label>
            <div
              style={{
                background: 'var(--accent-softer)',
                border: '1px solid var(--accent-soft)',
                borderRadius: 8,
                padding: '13px 14px',
                fontSize: 12.5,
                lineHeight: 1.6,
                color: 'var(--text-body)',
              }}
            >
              <span style={{ fontWeight: 600, color: 'var(--ink)' }}>보안 안내</span>
              <br />
              초대받은 사용자는 이메일로 전송된 링크를 통해 비밀번호를 설정합니다. 초대 링크(token)는 48시간 후 EXPIRED 처리됩니다.
            </div>
          </div>
        </Modal>
      </PageMain>
    </MasterShell>
  );
}
