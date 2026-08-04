import { useEffect, useState } from 'react';
import { isAxiosError } from 'axios';
import { useNavigate } from 'react-router-dom';
import { Badge, Button } from '../../ds';
import { useLogout, useUpdateUserProfile } from '../../data';
import { useAccountIdentity } from '../../hooks/useAccountIdentity';

function passwordChangeError(error: unknown): string {
  if (isAxiosError(error)) {
    const status = error.response?.status;
    const data = error.response?.data;
    const message =
      typeof data === 'object' && data !== null && 'message' in data
        ? String((data as { message?: unknown }).message ?? '')
        : '';
    const lower = message.toLowerCase();
    if (
      status === 401 ||
      lower.includes('current password') ||
      lower.includes('현재 비밀번호') ||
      lower.includes('incorrect password') ||
      lower.includes('wrong password')
    ) {
      return '현재 비밀번호가 올바르지 않습니다.';
    }
    if (status === 400) {
      if (lower.includes('password') || lower.includes('비밀번호')) {
        return message.trim() || '비밀번호 형식을 확인해 주세요.';
      }
      return message.trim() || '입력값을 확인해 주세요.';
    }
    if (message.trim()) return message;
  }
  return '비밀번호 변경에 실패했습니다.';
}

const rowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '12px 0',
  borderBottom: '1px solid var(--divider)',
  fontSize: 13,
  gap: 12,
} as const;

/** Shared profile body for student / master / manager my pages. */
export function ProfilePageContent() {
  const navigate = useNavigate();
  const account = useAccountIdentity();
  const updateProfile = useUpdateUserProfile();
  const logout = useLogout();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(account.name);
  const [pwOpen, setPwOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [pwError, setPwError] = useState<string | null>(null);

  useEffect(() => {
    setName(account.name);
  }, [account.name]);

  const onLogout = () => {
    logout.mutate(undefined, {
      onSettled: () => navigate('/login', { replace: true }),
    });
  };

  const onSave = () => {
    updateProfile.mutate(
      { userId: account.id, name },
      {
        onSuccess: () => setEditing(false),
      },
    );
  };

  const onSavePassword = () => {
    setPwError(null);
    if (!newPassword.trim() || newPassword.length < 8) {
      setPwError('새 비밀번호는 8자 이상이어야 합니다.');
      return;
    }
    updateProfile.mutate(
      {
        userId: account.id,
        currentPassword: currentPassword || undefined,
        newPassword,
      },
      {
        onSuccess: () => {
          setPwOpen(false);
          setCurrentPassword('');
          setNewPassword('');
        },
        onError: (err) => {
          setPwError(passwordChangeError(err));
        },
      },
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28, maxWidth: 720 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <span
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: 'var(--tertiary-100)',
            color: 'var(--quaternary-400)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 20,
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          {account.initial}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>{account.name}</h1>
            <Badge status="neutral">{account.role}</Badge>
          </div>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
            {account.email}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Button variant="secondary" onClick={() => setEditing((v) => !v)}>
            {editing ? '취소' : '수정'}
          </Button>
          <Button variant="ghost" onClick={onLogout} disabled={logout.isPending}>
            로그아웃
          </Button>
        </div>
      </div>

      <section>
        <h2 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>계정 정보</h2>
        <div>
          {[
            { label: '이름', value: editing ? undefined : account.name },
            { label: '이메일', value: account.email },
            { label: '시스템 역할', value: account.role },
          ].map((rowItem) => (
            <div key={rowItem.label} style={rowStyle}>
              <span style={{ color: 'var(--text-muted)' }}>{rowItem.label}</span>
              {rowItem.label === '이름' && editing ? (
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{
                    border: '1px solid var(--border-strong)',
                    borderRadius: 8,
                    padding: '6px 10px',
                    fontFamily: 'var(--font-sans)',
                    fontSize: 13,
                    minWidth: 160,
                  }}
                />
              ) : (
                <span
                  style={{
                    fontWeight: 600,
                    color: 'var(--ink)',
                    fontFamily: rowItem.label === '이메일' ? 'var(--font-mono)' : undefined,
                  }}
                >
                  {rowItem.value}
                </span>
              )}
            </div>
          ))}
        </div>
        {editing ? (
          <div style={{ marginTop: 12 }}>
            <Button
              variant="primary"
              size="sm"
              onClick={onSave}
              disabled={updateProfile.isPending || !name.trim()}
            >
              {updateProfile.isPending ? '저장 중…' : '이름 저장'}
            </Button>
          </div>
        ) : null}
      </section>

      <section>
        <h2 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>보안</h2>
        <div style={rowStyle}>
          <div>
            <div style={{ fontWeight: 600 }}>비밀번호</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>현재 비밀번호 확인 후 변경</div>
          </div>
          <Button variant="secondary" size="sm" onClick={() => setPwOpen((v) => !v)}>
            {pwOpen ? '취소' : '변경'}
          </Button>
        </div>
        {pwOpen ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 12 }}>
            <input
              type="password"
              placeholder="현재 비밀번호"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              style={{
                border: '1px solid var(--border-strong)',
                borderRadius: 8,
                padding: '8px 10px',
                fontFamily: 'var(--font-sans)',
                fontSize: 13,
              }}
            />
            <input
              type="password"
              placeholder="새 비밀번호 (8자 이상)"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              style={{
                border: '1px solid var(--border-strong)',
                borderRadius: 8,
                padding: '8px 10px',
                fontFamily: 'var(--font-sans)',
                fontSize: 13,
              }}
            />
            {pwError ? <span style={{ fontSize: 12, color: 'var(--status-error)' }}>{pwError}</span> : null}
            <Button variant="primary" size="sm" onClick={onSavePassword} disabled={updateProfile.isPending}>
              {updateProfile.isPending ? '저장 중…' : '비밀번호 저장'}
            </Button>
          </div>
        ) : null}
      </section>
    </div>
  );
}
