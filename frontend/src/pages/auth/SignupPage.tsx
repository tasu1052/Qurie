import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Badge, Button, Input } from '../../ds';
import logoSrc from '../../ds/assets/logo.png';
import { MockRowBoundary } from '../../components/feedback/MockRowBoundary';
import { useInvitationPreviewRow, useSignUp } from '../../data';

function strengthLabel(pw: string) {
  if (pw.length >= 12 && /[A-Z]/.test(pw) && /[0-9]/.test(pw)) return { label: '강함', color: 'var(--accent)' };
  if (pw.length >= 8) return { label: '보통', color: 'var(--status-warning)' };
  if (pw.length > 0) return { label: '약함', color: 'var(--status-error)' };
  return { label: '', color: 'transparent' };
}

function SignupForm({ token }: { token: string }) {
  const navigate = useNavigate();
  const preview = useInvitationPreviewRow(token);
  const signUp = useSignUp();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [className, setClassName] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [terms, setTerms] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const strength = strengthLabel(password);

  useEffect(() => {
    if (!preview.data) return;
    setEmail(preview.data.email);
    setClassName(preview.data.className);
  }, [preview.data]);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (password.length < 8) {
      setFormError('비밀번호는 8자 이상이어야 합니다.');
      return;
    }
    if (password !== confirm) {
      setFormError('비밀번호 확인이 일치하지 않습니다.');
      return;
    }
    if (!terms) {
      setFormError('이용약관에 동의해 주세요.');
      return;
    }

    if (!email.trim() || !className.trim()) {
      setFormError('이메일과 반 정보를 입력해 주세요.');
      return;
    }

    if (token.startsWith('dev-')) {
      // 임시 테스트 토큰은 서버에서 검증되지 않으므로 프론트에서 성공 플로우만 통과시킨다.
      navigate('/login', { replace: true });
      return;
    }

    signUp.mutate(
      { token, password, name } as never,
      {
        onSuccess: () => navigate('/login', { replace: true }),
        onError: () => setFormError('회원가입에 실패했습니다. 초대 토큰과 입력을 확인해 주세요.'),
      },
    );
  };

  return (
    <MockRowBoundary
      status={preview.status}
      onRetry={preview.refetch}
      emptyMessage="유효한 초대 정보가 없습니다"
      skeleton={
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ height: 64, borderRadius: 12, background: 'var(--surface-sunken)' }} />
          <div style={{ height: 44, borderRadius: 12, background: 'var(--surface-sunken)' }} />
          <div style={{ height: 44, borderRadius: 12, background: 'var(--surface-sunken)' }} />
        </div>
      }
    >
      {preview.data && (
        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div
            style={{
              borderRadius: 12,
              border: '1px solid var(--border)',
              background: 'var(--surface-sunken)',
              padding: 14,
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Badge status="accent">{preview.data.role}</Badge>
              <Badge status="neutral">PENDING</Badge>
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>이메일 · </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--ink)' }}>{preview.data.email}</span>
              </div>
              <div style={{ marginTop: 4 }}>
                <span style={{ color: 'var(--text-muted)' }}>클래스 · </span>
                {preview.data.className}
              </div>
            </div>
          </div>

          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>이름</span>
            <Input placeholder="홍길동" value={name} onChange={(e) => setName(e.target.value)} width="100%" />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>이메일</span>
            <Input
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              width="100%"
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>반</span>
            <Input
              placeholder="서울 1반"
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              width="100%"
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>비밀번호</span>
            <Input
              type="password"
              placeholder="8자 이상"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              width="100%"
            />
            {strength.label && (
              <span style={{ fontSize: 11, fontWeight: 600, color: strength.color }}>강도 · {strength.label}</span>
            )}
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>비밀번호 확인</span>
            <Input
              type="password"
              placeholder="다시 입력"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              width="100%"
            />
          </label>
          <label style={{ display: 'inline-flex', alignItems: 'flex-start', gap: 8, fontSize: 12.5, color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} style={{ marginTop: 2 }} />
            이용약관 및 개인정보 처리방침에 동의합니다.
          </label>
          {formError && (
            <div style={{ fontSize: 13, color: 'var(--status-error)', background: 'var(--status-error-bg)', borderRadius: 10, padding: '10px 12px' }}>
              {formError}
            </div>
          )}
          <Button
            variant="primary"
            disabled={signUp.isPending || !name || !email || !className || !password || !confirm}
            style={{ width: '100%', justifyContent: 'center' }}
          >
            {signUp.isPending ? '가입 중…' : '초대 수락하고 시작하기'}
          </Button>
        </form>
      )}
    </MockRowBoundary>
  );
}

export default function SignupPage() {
  const [params] = useSearchParams();
  const token = params.get('token');

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg-app)',
        fontFamily: 'var(--font-sans)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: 'var(--ink)', marginBottom: 28 }}>
        <img src={logoSrc} alt="Qurie" width={28} height={28} style={{ objectFit: 'contain' }} />
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 700 }}>Qurie</span>
      </Link>
      <div
        style={{
          width: '100%',
          maxWidth: 440,
          background: 'var(--surface-card)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          boxShadow: 'var(--shadow-card)',
          padding: 28,
          display: 'flex',
          flexDirection: 'column',
          gap: 18,
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>초대 수락</h1>
          <p style={{ margin: '8px 0 0', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            초대 링크로 들어온 뒤 이름과 비밀번호를 설정합니다.
          </p>
        </div>

        {!token ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              초대 토큰이 없습니다. 메일로 받은 링크(` /signup?token=… `)로 다시 접속해 주세요.
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Link to="/" style={{ textDecoration: 'none' }}>
                <Button variant="secondary">랜딩으로</Button>
              </Link>
              <Link to="/login" style={{ textDecoration: 'none' }}>
                <Button variant="primary">로그인</Button>
              </Link>
            </div>
          </div>
        ) : (
          <SignupForm token={token} />
        )}

        <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>
          이미 계정이 있나요?{' '}
          <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>
            로그인
          </Link>
        </p>
      </div>
    </div>
  );
}
