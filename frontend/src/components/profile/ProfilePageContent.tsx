import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera } from 'lucide-react';
import { Badge, Button, RowSection, StatCard, StatCardRow } from '../../ds';
import {
  useGetUserProfile,
  useLogout,
  useMe,
  useUpdateUserProfile,
} from '../../data';

/** Shared profile body for student / master / manager my pages. */
export function ProfilePageContent() {
  const navigate = useNavigate();
  const { data: me } = useMe();
  const { data: profile } = useGetUserProfile(me.id);
  const updateProfile = useUpdateUserProfile();
  const logout = useLogout();
  const [loginAlert, setLoginAlert] = useState(true);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(profile.name);
  const [pwOpen, setPwOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [pwError, setPwError] = useState<string | null>(null);

  const initial = (profile.name || '?').slice(0, 1);

  const onLogout = () => {
    logout.mutate(undefined, {
      onSettled: () => navigate('/login', { replace: true }),
    });
  };

  const onSave = () => {
    updateProfile.mutate(
      { userId: me.id, name },
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
        userId: me.id,
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
          setPwError(err instanceof Error ? err.message : '비밀번호 변경에 실패했습니다.');
        },
      },
    );
  };

  return (
    <RowSection style={{ gap: 24 }}>
      <div
        style={{
          background: 'var(--surface-card)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          boxShadow: 'var(--shadow-card)',
          padding: 24,
          display: 'flex',
          alignItems: 'center',
          gap: 20,
        }}
      >
        <div style={{ position: 'relative' }}>
          <span
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: 'var(--tertiary-100)',
              color: 'var(--quaternary-400)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 22,
              fontWeight: 700,
            }}
          >
            {initial}
          </span>
          <span
            style={{
              position: 'absolute',
              right: -2,
              bottom: -2,
              width: 24,
              height: 24,
              borderRadius: '50%',
              background: 'var(--ink)',
              color: 'var(--text-inverse)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Camera size={12} strokeWidth={1.75} />
          </span>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>{profile.name}</h1>
            <Badge status="neutral">{profile.role}</Badge>
          </div>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
            {profile.email}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="secondary" onClick={() => setEditing((v) => !v)}>
            {editing ? '취소' : '수정'}
          </Button>
          <Button variant="ghost" onClick={onLogout} disabled={logout.isPending}>
            로그아웃
          </Button>
        </div>
      </div>

      <StatCardRow>
        <StatCard label="계정 ID" value={String(profile.userId)} caption="userId" />
        <StatCard label="기업 ID" value={String(profile.enterpriseId)} caption="enterpriseId" />
        <StatCard label="역할" value={profile.role} caption="system role" accent />
        <StatCard
          label="가입일"
          value={new Date(profile.createdAt).toLocaleDateString('ko-KR')}
          caption="createdAt"
        />
      </StatCardRow>

      <div className="qurie-master-split">
        <div
          style={{
            background: 'var(--surface-card)',
            border: '1px solid var(--border)',
            borderRadius: 16,
            boxShadow: 'var(--shadow-card)',
            padding: 24,
            display: 'flex',
            flexDirection: 'column',
            gap: 0,
            minWidth: 0,
          }}
        >
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: 'var(--text-secondary)',
              marginBottom: 12,
            }}
          >
            계정 정보
          </span>
          {[
            { label: '이름', value: editing ? undefined : profile.name },
            { label: '이메일', value: profile.email },
            { label: '시스템 역할', value: profile.role },
          ].map((rowItem) => (
            <div
              key={rowItem.label}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 0',
                borderBottom: '1px solid var(--divider)',
                fontSize: 13,
                gap: 12,
              }}
            >
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
          {editing && (
            <div style={{ marginTop: 16 }}>
              <Button
                variant="primary"
                size="sm"
                onClick={onSave}
                disabled={updateProfile.isPending || !name.trim()}
              >
                {updateProfile.isPending ? '저장 중…' : '이름 저장'}
              </Button>
            </div>
          )}
        </div>

        <div
          style={{
            background: 'var(--surface-card)',
            border: '1px solid var(--border)',
            borderRadius: 16,
            boxShadow: 'var(--shadow-card)',
            padding: 24,
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            minWidth: 0,
          }}
        >
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: 'var(--text-secondary)',
            }}
          >
            보안
          </span>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>비밀번호</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>프로필 PATCH로 변경</div>
            </div>
            <Button variant="secondary" size="sm" onClick={() => setPwOpen((v) => !v)}>
              {pwOpen ? '취소' : '변경'}
            </Button>
          </div>
          {pwOpen ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input
                type="password"
                placeholder="현재 비밀번호"
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
              {pwError ? (
                <span style={{ fontSize: 12, color: 'var(--status-error)' }}>{pwError}</span>
              ) : null}
              <Button
                variant="primary"
                size="sm"
                onClick={onSavePassword}
                disabled={updateProfile.isPending}
              >
                {updateProfile.isPending ? '저장 중…' : '비밀번호 저장'}
              </Button>
            </div>
          ) : null}
          <div
            style={{
              background: 'var(--status-warning-bg)',
              borderRadius: 12,
              padding: 12,
              fontSize: 12.5,
              color: 'var(--status-warning)',
              lineHeight: 1.55,
            }}
          >
            2FA가 아직 설정되지 않았습니다. 계정 보안을 위해 활성화를 권장합니다.
          </div>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            <span>로그인 알림</span>
            <input type="checkbox" checked={loginAlert} onChange={(e) => setLoginAlert(e.target.checked)} />
          </label>
        </div>
      </div>
    </RowSection>
  );
}
