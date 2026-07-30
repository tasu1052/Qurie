import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Copy, Mail } from 'lucide-react';
import { AdminShell, PageMain } from '../../components/layout/AdminShell';
import { Badge, Button, EmptyState, Input } from '../../ds';
import {
  getBootcamp,
  inviteMaster,
  signupInviteUrl,
  type AdminBootcamp,
} from '../../data';

function formatDateTime(iso: string) {
  try {
    return new Date(iso).toLocaleString('ko-KR');
  } catch {
    return iso;
  }
}

function inviteStatusBadge(status: NonNullable<AdminBootcamp['masterInvite']>['status']) {
  if (status === 'PENDING') return <Badge status="warning">PENDING</Badge>;
  if (status === 'ACCEPTED') return <Badge status="success">ACCEPTED</Badge>;
  return <Badge status="error">EXPIRED</Badge>;
}

export default function AdminBootcampDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const bootcampId = Number(id);
  const [tick, setTick] = useState(0);
  const bootcamp = useMemo(() => {
    void tick;
    return getBootcamp(bootcampId);
  }, [bootcampId, tick]);
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!Number.isFinite(bootcampId) || !bootcamp) {
    return (
      <AdminShell activeKey="bootcamps" breadcrumbs={['어드민', '부트캠프']}>
        <PageMain>
          <EmptyState
            message="부트캠프를 찾을 수 없습니다"
            description="목록에서 다시 선택해 주세요."
            actionLabel="목록으로"
            onAction={() => navigate('/admin')}
          />
        </PageMain>
      </AdminShell>
    );
  }

  const onInvite = () => {
    setError(null);
    setCopied(false);
    if (!email.trim()) {
      setError('마스터 이메일을 입력해 주세요.');
      return;
    }
    const updated = inviteMaster(bootcamp.id, email);
    if (!updated) {
      setError('초대에 실패했습니다.');
      return;
    }
    setEmail('');
    setTick((t) => t + 1);
  };

  const invite = bootcamp.masterInvite;
  const inviteLink = invite ? signupInviteUrl(invite.token) : null;

  const onCopy = async () => {
    if (!inviteLink) return;
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <AdminShell activeKey="bootcamps" breadcrumbs={['어드민', '부트캠프', bootcamp.name]}>
      <PageMain>
        <div>
          <Link to="/admin" style={{ fontSize: 13, color: 'var(--accent)', textDecoration: 'none' }}>
            ← 부트캠프 목록
          </Link>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: '8px 0 0' }}>{bootcamp.name}</h1>
          <p style={{ margin: '6px 0 0', fontSize: 14, color: 'var(--text-secondary)' }}>
            엔터프라이즈 ID <strong style={{ color: 'var(--ink)' }}>{bootcamp.id}</strong>
            <span style={{ margin: '0 8px', color: 'var(--divider)' }}>·</span>
            생성 {formatDateTime(bootcamp.createdAt)}
          </p>
        </div>

        <section
          style={{
            background: 'var(--surface-card)',
            border: '1px solid var(--border)',
            borderRadius: 16,
            padding: 24,
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          <div>
            <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>마스터 초대</h2>
            <p style={{ margin: '6px 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>
              API 미구현: 현재 어드민 초대는 로컬 목업입니다. 메일은 발송되지 않으며, 아래 링크를 복사해 전달하세요.
              실초대 메일은 마스터/매니저 회원 관리(POST /invitations)를 사용합니다.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: '1 1 240px' }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>마스터 이메일</span>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="master@example.com"
                icon={<Mail size={15} strokeWidth={1.75} />}
                width="100%"
              />
            </label>
            <Button variant="primary" onClick={onInvite}>
              {invite ? '재발급' : '초대 링크 생성'}
            </Button>
          </div>
          {error ? <p style={{ margin: 0, fontSize: 13, color: 'var(--status-error)' }}>{error}</p> : null}

          {invite ? (
            <div
              style={{
                borderTop: '1px solid var(--divider)',
                paddingTop: 16,
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>상태</span>
                {inviteStatusBadge(invite.status)}
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                  {invite.email} · {formatDateTime(invite.invitedAt)}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>초대 링크 (임시)</span>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <code
                    style={{
                      flex: 1,
                      fontSize: 12,
                      padding: '10px 12px',
                      background: 'var(--bg-app)',
                      border: '1px solid var(--border)',
                      borderRadius: 10,
                      color: 'var(--ink)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {inviteLink}
                  </code>
                  <Button variant="ghost" size="sm" icon={<Copy size={14} />} onClick={onCopy}>
                    {copied ? '복사됨' : '복사'}
                  </Button>
                </div>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  토큰: {invite.token} · API 미구현(UI 전용 링크) 상태입니다.
                </span>
              </div>
            </div>
          ) : (
            <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>아직 초대한 마스터가 없습니다.</p>
          )}
        </section>
      </PageMain>
    </AdminShell>
  );
}
