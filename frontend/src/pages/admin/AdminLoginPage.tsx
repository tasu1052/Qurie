import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { ApiIntegrationPanel } from '../../components/feedback/ApiIntegrationPanel';
import { Button, Input } from '../../ds';
import logoSrc from '../../ds/assets/logo.png';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const submitLogin = () => {
    setFormError('어드민 인증 API(POST /admin/auth/login)가 아직 연동되지 않았습니다.');
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    submitLogin();
  };

  return (
    <div
      style={{
        background: 'var(--bg-app)',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 28,
        padding: '56px 24px',
        fontFamily: 'var(--font-sans)',
        boxSizing: 'border-box',
      }}
    >
      <Link to="/" style={{ display: 'inline-flex', textDecoration: 'none' }}>
        <img
          src={logoSrc}
          alt="Qurie"
          style={{ height: 36, width: 'auto', objectFit: 'contain', display: 'block' }}
        />
      </Link>

      <div
        style={{
          width: 480,
          maxWidth: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
        }}
      >
        <div
          style={{
            width: '100%',
            background: 'var(--surface-card)',
            border: '1px solid var(--border)',
            borderRadius: 16,
            boxShadow: 'var(--shadow-card)',
            padding: 32,
            display: 'flex',
            flexDirection: 'column',
            gap: 18,
            boxSizing: 'border-box',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--ink)', margin: 0 }}>어드민 로그인</h1>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              큐리 직원 계정으로 부트캠프를 생성·관리합니다.
            </span>
          </div>

          <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>이메일</span>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="staff@qurie.com"
                icon={<Mail size={15} strokeWidth={1.75} />}
                width="100%"
              />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>비밀번호</span>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  icon={<Lock size={15} strokeWidth={1.75} />}
                  width="100%"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
                  style={{
                    border: '1px solid var(--border-strong)',
                    borderRadius: 10,
                    background: 'var(--surface-card)',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    padding: 10,
                    flexShrink: 0,
                  }}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </label>
            {formError ? (
              <span style={{ fontSize: 13, color: 'var(--status-error)' }}>{formError}</span>
            ) : null}
            <Button variant="primary" onClick={submitLogin}>
              로그인
            </Button>
          </form>
        </div>

        <ApiIntegrationPanel groupId="adminConsole" variant="compact" title="어드민 API" />
      </div>
    </div>
  );
}
