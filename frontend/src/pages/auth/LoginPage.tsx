import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Input } from '../../ds';
import logoSrc from '../../ds/assets/logo.png';
import { useLogin, type AuthUserResponse } from '../../data';
import { homePathForRole } from '../../components/auth/roleRoutes';

const EMAIL_STORAGE_KEY = 'qurie:login-email';

function AuthCardShell({ children, title, subtitle }: { children: React.ReactNode; title: string; subtitle?: string }) {
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
      <Link to="/" style={{ display: 'inline-flex', textDecoration: 'none', marginBottom: 28 }}>
        <img
          src={logoSrc}
          alt="Qurie"
          style={{ height: 36, width: 'auto', objectFit: 'contain', display: 'block' }}
        />
      </Link>
      <div
        style={{
          width: '100%',
          maxWidth: 400,
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
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>{title}</h1>
          {subtitle && (
            <p style={{ margin: '8px 0 0', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{subtitle}</p>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}

function readSavedEmail(): string {
  try {
    return localStorage.getItem(EMAIL_STORAGE_KEY) ?? '';
  } catch {
    return '';
  }
}

export default function LoginPage() {
  const navigate = useNavigate();
  const login = useLogin();
  const [email, setEmail] = useState(() => readSavedEmail());
  const [password, setPassword] = useState('');
  const [saveEmail, setSaveEmail] = useState(() => Boolean(readSavedEmail()));
  const [formError, setFormError] = useState<string | null>(null);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    login.mutate(
      { email, password },
      {
        onSuccess: (user: AuthUserResponse) => {
          try {
            if (saveEmail) localStorage.setItem(EMAIL_STORAGE_KEY, email.trim());
            else localStorage.removeItem(EMAIL_STORAGE_KEY);
          } catch {
            /* ignore */
          }
          navigate(homePathForRole(user.role), { replace: true });
        },
        onError: () => {
          setFormError('이메일 또는 비밀번호가 올바르지 않습니다.');
        },
      },
    );
  };

  return (
    <AuthCardShell title="로그인" subtitle="기업 계정으로 Qurie 콘솔에 접속해요.">
      <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
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
          <span style={{ fontSize: 13, fontWeight: 600 }}>비밀번호</span>
          <Input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            width="100%"
          />
        </label>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12.5 }}>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer', color: 'var(--text-secondary)' }}>
            <input type="checkbox" checked={saveEmail} onChange={(e) => setSaveEmail(e.target.checked)} />
            이메일 저장하기
          </label>
          <Link to="/reset" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>
            비밀번호 재설정
          </Link>
        </div>
        {formError && (
          <div style={{ fontSize: 13, color: 'var(--status-error)', background: 'var(--status-error-bg)', borderRadius: 10, padding: '10px 12px' }}>
            {formError}
          </div>
        )}
        <Button variant="primary" disabled={login.isPending || !email || !password} style={{ width: '100%', justifyContent: 'center' }}>
          {login.isPending ? '로그인 중…' : '로그인'}
        </Button>
      </form>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>기능 테스트 계정 (비번: test1234)</span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {(
            [
              { label: '마스터', email: 'master@ssafy.com' },
              { label: '매니저', email: 'manager@ssafy.com' },
              { label: '학생', email: 'student@ssafy.com' },
            ] as const
          ).map((account) => (
            <button
              key={account.email}
              type="button"
              onClick={() => {
                setEmail(account.email);
                setPassword('test1234');
                setFormError(null);
              }}
              style={{
                border: '1px solid var(--border-strong)',
                background: 'var(--surface-sunken)',
                color: 'var(--text-secondary)',
                borderRadius: 999,
                padding: '6px 12px',
                fontSize: 12,
                fontWeight: 600,
                fontFamily: 'var(--font-sans)',
                cursor: 'pointer',
              }}
            >
              {account.label}
            </button>
          ))}
        </div>
      </div>

      <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>
        Qurie 계정은 기업 관리자(Master)의 초대로 만들 수 있어요.
        <br />
        초대 메일의 링크로 가입을 이어가면 돼요.
      </p>
    </AuthCardShell>
  );
}
