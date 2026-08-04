import { useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Button, Input } from '../../ds';
import logoSrc from '../../ds/assets/logo.png';
import { useConfirmPasswordReset, useRequestPasswordReset } from '../../data';

export default function ResetPage() {
  const [params] = useSearchParams();
  const token = params.get('token')?.trim() || '';
  const requestReset = useRequestPasswordReset();
  const confirmReset = useConfirmPasswordReset();

  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [sent, setSent] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onRequest = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    requestReset.mutate(
      { email: email.trim() },
      {
        onSuccess: () => setSent(true),
        onError: () => setError('요청에 실패했습니다. 잠시 후 다시 시도해 주세요.'),
      },
    );
  };

  const onConfirm = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (newPassword.trim().length < 8) {
      setError('비밀번호는 8자 이상이어야 합니다.');
      return;
    }
    confirmReset.mutate(
      { token, newPassword: newPassword.trim() },
      {
        onSuccess: () => setDone(true),
        onError: () => setError('비밀번호 변경에 실패했습니다. 링크가 만료됐을 수 있어요.'),
      },
    );
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
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>비밀번호 찾기</h1>
          <p style={{ margin: '8px 0 0', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            {token
              ? '새 비밀번호를 입력하면 변경이 완료돼요.'
              : '가입 이메일을 입력하면 찾기 링크를 보내 드려요.'}
          </p>
        </div>

        {error ? (
          <div
            style={{
              fontSize: 13,
              color: 'var(--status-error)',
              background: 'var(--status-error-bg)',
              borderRadius: 10,
              padding: 14,
              lineHeight: 1.55,
            }}
          >
            {error}
          </div>
        ) : null}

        {token ? (
          done ? (
            <div
              style={{
                fontSize: 13,
                color: 'var(--accent)',
                background: 'var(--accent-softer)',
                borderRadius: 10,
                padding: 14,
                lineHeight: 1.55,
              }}
            >
              비밀번호를 바꿨어요. 새 비밀번호로 로그인해 주세요.
            </div>
          ) : (
            <form autoComplete="on" onSubmit={onConfirm} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>새 비밀번호</span>
                <Input
                  type="password"
                  name="new-password"
                  autoComplete="new-password"
                  placeholder="8자 이상"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  width="100%"
                />
              </label>
              <Button
                variant="primary"
                disabled={!newPassword || confirmReset.isPending}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                {confirmReset.isPending ? '변경 중…' : '비밀번호 변경'}
              </Button>
            </form>
          )
        ) : sent ? (
          <div
            style={{
              fontSize: 13,
              color: 'var(--accent)',
              background: 'var(--accent-softer)',
              borderRadius: 10,
              padding: 14,
              lineHeight: 1.55,
            }}
          >
            요청을 접수했어요. 가입된 이메일이면 찾기 링크가 담긴 메일이 도착해요.
          </div>
        ) : (
          <form autoComplete="on" onSubmit={onRequest} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>이메일 주소</span>
              <Input
                type="email"
                name="email"
                autoComplete="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                width="100%"
              />
            </label>
            <Button
              variant="primary"
              disabled={!email || requestReset.isPending}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              {requestReset.isPending ? '요청 중…' : '찾기 링크 받기'}
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
