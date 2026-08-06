import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Badge, Button, EmptyState, Input, RowErrorFallback, Select, Skeleton } from '../../ds';
import { BrandLogo } from '../../components/brand/BrandLogo';
import { QueryAsyncBoundary, useGetInvitationPreview, useSignUp } from '../../data';
import { REGION_OPTIONS, setUserProfileExtras } from '../../utils/userProfileExtras';

function FormSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Skeleton width="100%" height={64} radius={12} />
      <Skeleton width="100%" height={44} radius={12} />
      <Skeleton width="100%" height={44} radius={12} delay={0.06} />
      <Skeleton width="100%" height={44} radius={12} delay={0.12} />
    </div>
  );
}

const regionFieldOptions = REGION_OPTIONS.filter((r) => r.value !== 'all').map((r) => ({
  value: r.value,
  label: r.label,
}));

function SignupFields({ token }: { token: string }) {
  const navigate = useNavigate();
  const { data: preview } = useGetInvitationPreview(token);
  const signUp = useSignUp();
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [phone, setPhone] = useState('');
  const [region, setRegion] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

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

    // 임시 UI 토큰(어드민 목업 링크) — 실초대 API가 아닌 경우
    if (token.startsWith('dev-')) {
      navigate('/login', { replace: true });
      return;
    }

    signUp.mutate(
      { token, password, name },
      {
        onSuccess: () => {
          setUserProfileExtras(preview.email, {
            phone: phone.trim() || undefined,
            region: region || undefined,
          });
          navigate('/login', { replace: true });
        },
        onError: () => setFormError('회원가입에 실패했습니다. 초대 토큰과 입력을 확인해 주세요.'),
      },
    );
  };

  return (
    <form autoComplete="on" onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
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
          <Badge status="accent">{preview.role}</Badge>
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>이메일 · </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--ink)' }}>
              {preview.email}
            </span>
          </div>
          <div style={{ marginTop: 4 }}>
            <span style={{ color: 'var(--text-muted)' }}>클래스 · </span>
            {preview.className}
          </div>
          <div style={{ marginTop: 4, fontSize: 12, color: 'var(--text-muted)' }}>
            만료 · {new Date(preview.expiresAt).toLocaleString('ko-KR')}
          </div>
        </div>
      </div>

      <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 600 }}>이름</span>
        <Input
          name="name"
          autoComplete="name"
          placeholder="홍길동"
          value={name}
          onChange={(e) => setName(e.target.value)}
          width="100%"
        />
      </label>
      <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 600 }}>전화번호</span>
        <Input
          type="tel"
          name="tel"
          autoComplete="tel"
          placeholder="010-0000-0000"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          width="100%"
        />
      </label>
      <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 600 }}>지역</span>
        <Select
          options={regionFieldOptions}
          value={region}
          onChange={setRegion}
        />
      </label>
      <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 600 }}>비밀번호</span>
        <Input
          type="password"
          name="new-password"
          autoComplete="new-password"
          placeholder="8자 이상"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          width="100%"
        />
      </label>
      <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 600 }}>비밀번호 확인</span>
        <Input
          type="password"
          name="new-password-confirm"
          autoComplete="new-password"
          placeholder="다시 입력"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          width="100%"
        />
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
      <Button
        variant="primary"
        disabled={signUp.isPending || !name || !password || !confirm}
        style={{ width: '100%', justifyContent: 'center' }}
      >
        {signUp.isPending ? '가입 중…' : '초대 수락하고 시작하기'}
      </Button>
    </form>
  );
}

function SignupForm({ token }: { token: string }) {
  const navigate = useNavigate();
  const [rowKey, setRowKey] = useState(0);

  // 어드민 목업 토큰은 백엔드에 없으므로 미리보기 API를 치지 않는다.
  if (token.startsWith('dev-')) {
    return (
      <EmptyState
        message="테스트용 초대 링크입니다"
        description="어드민 목업 초대는 실메일을 보내지 않습니다. 마스터/매니저 회원 관리에서 초대한 링크로 가입해 주세요."
        actionLabel="로그인"
        onAction={() => navigate('/login')}
      />
    );
  }

  return (
    <QueryAsyncBoundary
      key={rowKey}
      suspenseFallback={<FormSkeleton />}
      errorFallback={
        <RowErrorFallback
          onRetry={() => setRowKey((k) => k + 1)}
          title="초대를 불러오지 못했습니다"
          description="링크가 만료됐거나 유효하지 않습니다. 초대 메일의 링크로 다시 접속해 주세요."
        />
      }
    >
      <SignupFields token={token} />
    </QueryAsyncBoundary>
  );
}

export default function SignupPage() {
  const navigate = useNavigate();
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
      <Link to="/" style={{ display: 'inline-flex', textDecoration: 'none', marginBottom: 28 }}>
        <BrandLogo height={36} />
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
            초대에 고정된 이메일·역할·클래스로 가입합니다. 이름과 비밀번호만 입력하세요.
          </p>
        </div>

        {!token ? (
          <EmptyState
            message="초대 토큰이 없습니다"
            description="메일로 받은 링크(/signup?token=…)로 다시 접속해 주세요."
            actionLabel="로그인"
            onAction={() => navigate('/login')}
          />
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
