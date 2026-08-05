import { useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Button, Input } from '../../ds';
import logoSrc from '../../ds/assets/logo.png';
import { ApiIntegrationPanel } from '../../components/feedback/ApiIntegrationPanel';
import { useMarketingLightTheme } from '../../hooks/useMarketingLightTheme';

const USE_CASES = [
  { id: 'bootcamp', label: '부트캠프·교육 과정 운영' },
  { id: 'onboarding', label: '사내 개발자 온보딩' },
  { id: 'assessment', label: '코딩 평가·이해도 측정' },
  { id: 'collab', label: '실시간 페어 프로그래밍 수업' },
  { id: 'other', label: '기타' },
] as const;

type UseCaseId = (typeof USE_CASES)[number]['id'];

type FormState = {
  lastName: string;
  firstName: string;
  workEmail: string;
  company: string;
  title: string;
  phone: string;
  useCases: UseCaseId[];
  otherDetail: string;
};

const emptyForm: FormState = {
  lastName: '',
  firstName: '',
  workEmail: '',
  company: '',
  title: '',
  phone: '',
  useCases: [],
  otherDetail: '',
};

function fieldLabel(text: string, required?: boolean) {
  return (
    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>
      {text}
      {required ? <span style={{ color: 'var(--status-error)', marginLeft: 2 }}>*</span> : null}
    </span>
  );
}

export default function DemoRequestPage() {
  useMarketingLightTheme();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const otherSelected = form.useCases.includes('other');

  const canSubmit = useMemo(() => {
    if (!form.lastName.trim() || !form.firstName.trim()) return false;
    if (!form.workEmail.trim() || !form.company.trim()) return false;
    if (!form.title.trim() || !form.phone.trim()) return false;
    if (form.useCases.length === 0) return false;
    if (otherSelected && !form.otherDetail.trim()) return false;
    return true;
  }, [form, otherSelected]);

  const toggleUseCase = (id: UseCaseId) => {
    setForm((prev) => {
      const has = prev.useCases.includes(id);
      const useCases = has ? prev.useCases.filter((x) => x !== id) : [...prev.useCases, id];
      return {
        ...prev,
        useCases,
        otherDetail: id === 'other' && has ? '' : prev.otherDetail,
      };
    });
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!canSubmit) {
      setError('필수 항목을 모두 입력해 주세요.');
      return;
    }
    // 백엔드 미연동 — UI만 제출 완료 처리
    setSubmitted(true);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg-app)',
        fontFamily: 'var(--font-sans)',
        color: 'var(--ink)',
      }}
    >
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '0 48px',
          height: 64,
          borderBottom: '1px solid var(--divider)',
          background: 'var(--surface-card)',
        }}
      >
        <Link to="/" style={{ textDecoration: 'none', display: 'inline-flex' }}>
          <img
            src={logoSrc}
            alt="Qurie"
            style={{ height: 28, width: 'auto', objectFit: 'contain', display: 'block' }}
          />
        </Link>
        <Link
          to="/"
          style={{
            marginLeft: 'auto',
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--text-secondary)',
            textDecoration: 'none',
          }}
        >
          랜딩으로 돌아가기
        </Link>
      </header>

      <main
        style={{
          maxWidth: 560,
          margin: '0 auto',
          padding: '48px 24px 80px',
          display: 'flex',
          flexDirection: 'column',
          gap: 24,
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700, letterSpacing: '-0.4px' }}>도입 문의</h1>
          <p style={{ margin: '10px 0 0', fontSize: 14, lineHeight: 1.55, color: 'var(--text-secondary)' }}>
            업무 정보를 남겨 주시면 도입 안내를 도와드려요. 아래 API 연동 후 제출 내용이 서버로 전송됩니다.
          </p>
        </div>

        <ApiIntegrationPanel groupId="demoRequest" variant="compact" title="도입 문의 API" />

        {submitted ? (
          <div
            style={{
              background: 'var(--surface-card)',
              border: '1px solid var(--border)',
              borderRadius: 16,
              boxShadow: 'var(--shadow-card)',
              padding: 28,
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
            }}
          >
            <span style={{ fontSize: 16, fontWeight: 700 }}>요청이 접수되었습니다</span>
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, color: 'var(--text-secondary)' }}>
              {form.firstName}님, 남겨 주신 정보는 POST /marketing/leads API 연동 후 전달됩니다. 지금은 이 화면에서만
              확인됩니다.
            </p>
            <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
              <Link to="/" style={{ textDecoration: 'none' }}>
                <Button variant="primary">랜딩으로</Button>
              </Link>
              <Button
                variant="ghost"
                onClick={() => {
                  setForm(emptyForm);
                  setSubmitted(false);
                }}
              >
                다시 작성
              </Button>
            </div>
          </div>
        ) : (
          <form
            onSubmit={onSubmit}
            style={{
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
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {fieldLabel('성', true)}
                <Input
                  value={form.lastName}
                  onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))}
                  placeholder="홍"
                  width="100%"
                 
                />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {fieldLabel('이름', true)}
                <Input
                  value={form.firstName}
                  onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))}
                  placeholder="길동"
                  width="100%"
                 
                />
              </label>
            </div>

            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {fieldLabel('업무용 이메일', true)}
              <Input
                type="email"
                value={form.workEmail}
                onChange={(e) => setForm((p) => ({ ...p, workEmail: e.target.value }))}
                placeholder="name@company.com"
                width="100%"
               
              />
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {fieldLabel('회사', true)}
              <Input
                value={form.company}
                onChange={(e) => setForm((p) => ({ ...p, company: e.target.value }))}
                placeholder="회사명"
                width="100%"
               
              />
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {fieldLabel('직위', true)}
              <Input
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                placeholder="예: 교육 담당 / 팀장"
                width="100%"
               
              />
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {fieldLabel('전화번호', true)}
              <Input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                placeholder="010-0000-0000"
                width="100%"
               
              />
            </label>

            <fieldset style={{ margin: 0, padding: 0, border: 'none' }}>
              <legend style={{ padding: 0, marginBottom: 10 }}>{fieldLabel('어떻게 사용할 예정인가요?', true)}</legend>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {USE_CASES.map((item) => {
                  const checked = form.useCases.includes(item.id);
                  return (
                    <label
                      key={item.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        fontSize: 13.5,
                        color: 'var(--ink)',
                        cursor: 'pointer',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleUseCase(item.id)}
                        style={{ width: 16, height: 16, accentColor: 'var(--accent)' }}
                      />
                      {item.label}
                    </label>
                  );
                })}
              </div>
            </fieldset>

            {otherSelected ? (
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {fieldLabel('기타 — 자세히 기술', true)}
                <textarea
                  value={form.otherDetail}
                  onChange={(e) => setForm((p) => ({ ...p, otherDetail: e.target.value }))}
                  placeholder="사용 목적이나 궁금한 점을 적어 주세요."
                  rows={4}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    border: '1px solid var(--border-strong)',
                    borderRadius: 'var(--radius-control)',
                    padding: '10px 14px',
                    fontFamily: 'var(--font-sans)',
                    fontSize: 14,
                    color: 'var(--ink)',
                    background: 'var(--surface-card)',
                    resize: 'vertical',
                    lineHeight: 1.5,
                  }}
                />
              </label>
            ) : null}

            {error ? (
              <p style={{ margin: 0, fontSize: 13, color: 'var(--status-error)' }}>{error}</p>
            ) : null}

            <Button variant="primary" style={{ alignSelf: 'flex-start' }}>
              제출하기
            </Button>
          </form>
        )}
      </main>
    </div>
  );
}
