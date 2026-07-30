import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { Button, Input } from '../../ds';
import logoSrc from '../../ds/assets/logo.png';
import { ADMIN_SAMPLE, getAdminSession, loginAdmin } from '../../data';

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const existing = getAdminSession();
  const [email, setEmail] = useState(ADMIN_SAMPLE.email);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  if (existing) {
    return <Navigate to="/admin" replace />;
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const session = loginAdmin(email, password);
    if (!session) {
      setFormError('이메일 또는 비밀번호가 올바르지 않습니다.');
      return;
    }
    navigate('/admin', { replace: true });
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
          width: 400,
          maxWidth: '100%',
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
              onChange={(e) => setEmail(e.target.value as typeof ADMIN_SAMPLE.email)}
              placeholder="admin@qurie.app"
              icon={<Mail size={15} strokeWidth={1.75} />}
              width="100%"
            />
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>비밀번호</span>
            <div style={{ position: 'relative', width: '100%' }}>
              <Input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                icon={<Lock size={15} strokeWidth={1.75} />}
                width="100%"
                style={{ paddingRight: 42 }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
                style={{
                  position: 'absolute',
                  right: 14,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  padding: 0,
                }}
              >
                {showPassword ? <EyeOff size={15} strokeWidth={1.75} /> : <Eye size={15} strokeWidth={1.75} />}
              </button>
            </div>
          </label>

          {formError ? (
            <div
              style={{
                fontSize: 13,
                color: 'var(--status-error)',
                background: 'var(--status-error-bg)',
                borderRadius: 10,
                padding: '10px 12px',
              }}
            >
              {formError}
            </div>
          ) : null}

          <Button variant="primary" style={{ width: '100%', justifyContent: 'center' }}>
            로그인
          </Button>
        </form>

        <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
          샘플 계정 (DB 시드): {ADMIN_SAMPLE.email} / {ADMIN_SAMPLE.password}
        </p>
      </div>
    </div>
  );
}
