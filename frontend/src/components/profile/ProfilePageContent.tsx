import { useState, type CSSProperties, type ReactNode } from 'react';
import { isAxiosError } from 'axios';
import { useNavigate } from 'react-router-dom';
import { Badge, Button, RowSection, Select, StatCard, StatCardRow } from '../../ds';
import {
  humanizeApiError,
  useGetUserProfile,
  useLogout,
  useMe,
  useUpdateUserProfile,
} from '../../data';

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

const editInputStyle: CSSProperties = {
  border: '1px solid var(--border-strong)',
  borderRadius: 8,
  padding: '6px 10px',
  fontFamily: 'var(--font-sans)',
  fontSize: 13,
  minWidth: 160,
};

function genderLabel(gender?: string | null): string {
  if (gender === 'MALE') return '남';
  if (gender === 'FEMALE') return '여';
  return '—';
}

/** Shared profile body for student / master / manager my pages. */
export function ProfilePageContent() {
  const navigate = useNavigate();
  const { data: me } = useMe();
  const { data: profile } = useGetUserProfile(me.id);
  const updateProfile = useUpdateUserProfile();
  const logout = useLogout();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(profile.name);
  const [phone, setPhone] = useState(profile.phone ?? '');
  const [region, setRegion] = useState(profile.region ?? '');
  const [gender, setGender] = useState(profile.gender ?? '');
  const [saveError, setSaveError] = useState<string | null>(null);
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

  const onToggleEdit = () => {
    if (!editing) {
      // 취소 후 다시 열 때 이전 편집 값이 남지 않도록 서버 값으로 되돌린다.
      setName(profile.name);
      setPhone(profile.phone ?? '');
      setRegion(profile.region ?? '');
      setGender(profile.gender ?? '');
    }
    setSaveError(null);
    setEditing((v) => !v);
  };

  const onSave = () => {
    setSaveError(null);
    updateProfile.mutate(
      // 빈 문자열은 "값 지우기" — PATCH 에서 보내지 않은 항목만 유지되므로 세 항목은 항상 보낸다.
      { userId: me.id, name, phone: phone.trim(), region: region.trim(), gender },
      {
        onSuccess: () => setEditing(false),
        onError: (err) => setSaveError(humanizeApiError(err, '프로필 저장에 실패했습니다.')),
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
          setPwError(passwordChangeError(err));
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
            flexShrink: 0,
          }}
        >
          {initial}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>{profile.name}</h1>
            <Badge status="neutral">{profile.role}</Badge>
          </div>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
            {profile.email}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Button variant="secondary" onClick={onToggleEdit}>
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

      <div className="qurie-app-split">
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
          {(
            [
              {
                label: '이름',
                value: profile.name,
                editor: <input value={name} onChange={(e) => setName(e.target.value)} style={editInputStyle} />,
              },
              { label: '이메일', value: profile.email, mono: true },
              { label: '시스템 역할', value: profile.role },
              {
                label: '전화번호',
                value: profile.phone || '—',
                editor: (
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="010-0000-0000"
                    style={editInputStyle}
                  />
                ),
              },
              {
                label: '지역',
                value: profile.region || '—',
                editor: (
                  <input
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    placeholder="예: 서울"
                    style={editInputStyle}
                  />
                ),
              },
              {
                label: '성별',
                value: genderLabel(profile.gender),
                editor: (
                  <Select
                    size="sm"
                    options={[
                      { value: '', label: '선택 안 함' },
                      { value: 'MALE', label: '남' },
                      { value: 'FEMALE', label: '여' },
                    ]}
                    value={gender}
                    onChange={setGender}
                  />
                ),
              },
            ] as { label: string; value: string; mono?: boolean; editor?: ReactNode }[]
          ).map((rowItem) => (
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
              {editing && rowItem.editor ? (
                rowItem.editor
              ) : (
                <span
                  style={{
                    fontWeight: 600,
                    color: 'var(--ink)',
                    fontFamily: rowItem.mono ? 'var(--font-mono)' : undefined,
                  }}
                >
                  {rowItem.value}
                </span>
              )}
            </div>
          ))}
          {editing && (
            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {saveError ? (
                <span style={{ fontSize: 12, color: 'var(--status-error)' }}>{saveError}</span>
              ) : null}
              <div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={onSave}
                  disabled={updateProfile.isPending || !name.trim()}
                >
                  {updateProfile.isPending ? '저장 중…' : '저장'}
                </Button>
              </div>
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
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>현재 비밀번호 확인 후 변경</div>
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
        </div>
      </div>
    </RowSection>
  );
}
