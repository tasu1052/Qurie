import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera } from 'lucide-react';
import { StudentShell, PageMain } from '../../components/layout/StudentShell';
import { Badge, Button, RowErrorFallback, RowSection, Skeleton, StatCard, StatCardRow } from '../../ds';
import {
  QueryAsyncBoundary,
  useGetUserProfile,
  useLogout,
  useMe,
  useUpdateUserProfile,
} from '../../data';

function ProfileSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Skeleton width="100%" height={120} radius={16} />
      <StatCardRow>
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              background: 'var(--surface-card-solid)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--card-radius)',
              padding: 'var(--stat-card-padding)',
            }}
          >
            <Skeleton width="50%" height={14} delay={i * 0.08} />
          </div>
        ))}
      </StatCardRow>
    </div>
  );
}

function MyPageContent() {
  const navigate = useNavigate();
  const { data: me } = useMe();
  const { data: profile } = useGetUserProfile(me.id);
  const updateProfile = useUpdateUserProfile();
  const logout = useLogout();
  const [loginAlert, setLoginAlert] = useState(true);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(profile.name);

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
              <Button variant="primary" size="sm" onClick={onSave} disabled={updateProfile.isPending || !name.trim()}>
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
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>프로필 PATCH로 변경 가능</div>
            </div>
            <Button variant="secondary" size="sm" onClick={() => undefined}>
              변경
            </Button>
          </div>
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

export default function MyPage() {
  const [rowKey, setRowKey] = useState(0);

  return (
    <StudentShell activeKey="me" breadcrumbs={['마이페이지']}>
      <PageMain>
        <QueryAsyncBoundary
          key={rowKey}
          suspenseFallback={<ProfileSkeleton />}
          errorFallback={
            <RowErrorFallback
              onRetry={() => setRowKey((k) => k + 1)}
              title="프로필을 불러오지 못했습니다"
              description="이 행만 실패했습니다. 나머지 영역은 정상적으로 표시됩니다."
            />
          }
        >
          <MyPageContent />
        </QueryAsyncBoundary>
      </PageMain>
    </StudentShell>
  );
}
