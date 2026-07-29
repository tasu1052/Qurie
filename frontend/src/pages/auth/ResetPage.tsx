import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Button, Input } from '../../ds';
import logoSrc from '../../ds/assets/logo.png';

export default function ResetPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    // Backend password-reset API is not available yet — UI stub for handoff parity.
    setSent(true);
  };

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
          maxWidth: 420,
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
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>비밀번호 재설정</h1>
          <p style={{ margin: '8px 0 0', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            가입 이메일을 입력하면 재설정 링크를 보내 드립니다. (API 연동 준비 중)
          </p>
        </div>
        {sent ? (
          <div style={{ fontSize: 13, color: 'var(--accent)', background: 'var(--accent-softer)', borderRadius: 10, padding: 14, lineHeight: 1.55 }}>
            요청이 접수되었습니다. 실제 메일 발송은 백엔드 연동 후 동작합니다.
          </div>
        ) : (
          <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>이메일 주소</span>
              <Input
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                width="100%"
              />
            </label>
            <Button variant="primary" disabled={!email} style={{ width: '100%', justifyContent: 'center' }}>
              재설정 링크 받기
            </Button>
          </form>
        )}
        <Link to="/login" style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>
          로그인으로 돌아가기
        </Link>
      </div>
    </div>
  );
}
