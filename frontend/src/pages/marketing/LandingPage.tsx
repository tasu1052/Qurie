import { Link } from 'react-router-dom';
import { Button } from '../../ds';
import logoSrc from '../../ds/assets/logo.png';

const features = [
  {
    title: '실시간 세션',
    body: '클래스 단위로 라이브 코딩 세션을 열고, 참여·퀴즈·리포트를 한곳에서 관리합니다.',
  },
  {
    title: 'AI 퀴즈·리포트',
    body: '세션 내용을 바탕으로 퀴즈를 생성하고, 참여도와 정답률을 정량적으로 추적합니다.',
  },
  {
    title: '역할 기반 운영',
    body: 'Master·Manager·Student 역할로 트랙·클래스·멤버 초대를 분리해 운영합니다.',
  },
];

const kpis = [
  { value: '실시간', label: '세션 협업' },
  { value: '역할별', label: '콘솔 UX' },
  { value: 'AI', label: '퀴즈·리포트' },
];

export default function LandingPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-app)', fontFamily: 'var(--font-sans)', color: 'var(--ink)' }}>
      <header
        style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          gap: 28,
          padding: '0 40px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--surface-card)',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        <Link to="/" style={{ display: 'inline-flex', textDecoration: 'none' }}>
          <img
            src={logoSrc}
            alt="Qurie"
            style={{ height: 28, width: 'auto', objectFit: 'contain', display: 'block' }}
          />
        </Link>
        <nav style={{ display: 'flex', gap: 20, fontSize: 13, color: 'var(--text-secondary)' }}>
          <a href="#features" style={{ color: 'inherit', textDecoration: 'none' }}>주요 기능</a>
          <a href="#process" style={{ color: 'inherit', textDecoration: 'none' }}>도입 프로세스</a>
          <a href="#cta" style={{ color: 'inherit', textDecoration: 'none' }}>요금·문의</a>
        </nav>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 10, alignItems: 'center' }}>
          <Link to="/login" style={{ textDecoration: 'none' }}>
            <Button variant="ghost">로그인</Button>
          </Link>
          <a href="mailto:contact@qurie.app?subject=Qurie%20도입%20문의" style={{ textDecoration: 'none' }}>
            <Button variant="primary">도입 문의</Button>
          </a>
        </div>
      </header>

      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.1fr) minmax(0, 0.9fr)',
          gap: 48,
          alignItems: 'center',
          padding: '72px 40px 64px',
          maxWidth: 1120,
          margin: '0 auto',
        }}
      >
        <div>
          <p style={{ margin: '0 0 12px', fontSize: 12, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--accent)' }}>
            Enterprise learning
          </p>
          <h1 style={{ margin: 0, fontSize: 42, fontWeight: 700, lineHeight: 1.2, letterSpacing: '-0.03em' }}>
            팀의 코딩 학습을<br />실시간으로 운영하세요
          </h1>
          <p style={{ margin: '18px 0 28px', fontSize: 16, lineHeight: 1.65, color: 'var(--text-secondary)', maxWidth: 480 }}>
            Qurie는 기업·기관을 위한 실시간 협업 코드 학습 플랫폼입니다. 클래스와 세션 단위로 학습을 운영하고,
            AI 퀴즈와 리포트로 성장을 정량적으로 관리하세요.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <a href="mailto:contact@qurie.app?subject=Qurie%20데모%20요청" style={{ textDecoration: 'none' }}>
              <Button variant="accent">데모 요청</Button>
            </a>
            <a href="mailto:contact@qurie.app?subject=Qurie%20도입%20문의" style={{ textDecoration: 'none' }}>
              <Button variant="secondary">도입 문의</Button>
            </a>
          </div>
        </div>
        <div
          style={{
            minHeight: 320,
            borderRadius: 20,
            border: '1px solid var(--border)',
            background: 'var(--ink)',
            color: 'var(--text-inverse)',
            padding: 28,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <div>
            <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', opacity: 0.7 }}>
              Live session
            </span>
            <div style={{ marginTop: 10, fontFamily: 'var(--font-mono)', fontSize: 15, fontWeight: 600 }}>
              react-hooks-deep-dive
            </div>
            <div style={{ marginTop: 8, fontSize: 13, opacity: 0.72 }}>참여 24 · 퀴즈 진행 중</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {['정답률 86%', '액티비티 74%', 'LIVE', '리포트 준비'].map((label) => (
              <div
                key={label}
                style={{
                  borderRadius: 12,
                  border: '1px solid rgba(255,255,255,0.12)',
                  padding: '14px 16px',
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                {label}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ background: 'var(--ink)', color: 'var(--text-inverse)', padding: '36px 40px' }}>
        <div
          style={{
            maxWidth: 1120,
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            gap: 24,
          }}
        >
          {kpis.map((kpi) => (
            <div key={kpi.label}>
              <div style={{ fontSize: 28, fontWeight: 700 }}>{kpi.value}</div>
              <div style={{ marginTop: 6, fontSize: 13, opacity: 0.72 }}>{kpi.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section id="features" style={{ padding: '72px 40px', maxWidth: 1120, margin: '0 auto' }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 28, fontWeight: 700 }}>주요 기능</h2>
        <p style={{ margin: '0 0 32px', color: 'var(--text-secondary)', fontSize: 15 }}>
          운영·학습·측정이 한 흐름으로 이어집니다.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 20 }}>
          {features.map((f) => (
            <div
              key={f.title}
              style={{
                background: 'var(--surface-card)',
                border: '1px solid var(--border)',
                borderRadius: 16,
                padding: 24,
                boxShadow: 'var(--shadow-card)',
              }}
            >
              <h3 style={{ margin: '0 0 10px', fontSize: 17, fontWeight: 700 }}>{f.title}</h3>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: 'var(--text-secondary)' }}>{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="process" style={{ padding: '0 40px 72px', maxWidth: 1120, margin: '0 auto' }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 28, fontWeight: 700 }}>도입 프로세스</h2>
        <p style={{ margin: '0 0 24px', color: 'var(--text-secondary)', fontSize: 15 }}>
          초대 링크로 계정을 만들고, 역할별 콘솔에서 바로 운영을 시작합니다.
        </p>
        <ol style={{ margin: 0, paddingLeft: 20, color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: 14 }}>
          <li>기업 Master가 멤버를 초대합니다.</li>
          <li>초대 메일의 링크로 이름·비밀번호를 설정해 가입합니다.</li>
          <li>역할에 맞는 콘솔(Master / Manager / Student)로 이동합니다.</li>
        </ol>
      </section>

      <section
        id="cta"
        style={{
          margin: '0 40px 64px',
          maxWidth: 1120,
          marginInline: 'auto',
          borderRadius: 20,
          background: 'var(--ink)',
          color: 'var(--text-inverse)',
          padding: '48px 40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 24,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: 28, fontWeight: 700 }}>지금 Qurie로 팀의 학습을 시작하세요</h2>
          <p style={{ margin: '10px 0 0', opacity: 0.72, fontSize: 14 }}>이미 초대받으셨다면 로그인하거나 초대 링크로 가입하세요.</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link to="/login" style={{ textDecoration: 'none' }}>
            <Button variant="accent">로그인</Button>
          </Link>
          <a href="mailto:contact@qurie.app?subject=Qurie%20도입%20문의" style={{ textDecoration: 'none' }}>
            <Button variant="secondary" style={{ background: 'transparent', color: 'var(--text-inverse)', borderColor: 'rgba(255,255,255,0.28)' }}>
              도입 문의
            </Button>
          </a>
        </div>
      </section>

      <footer
        style={{
          borderTop: '1px solid var(--divider)',
          padding: '20px 40px',
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 11,
          color: 'var(--text-muted)',
          background: 'var(--surface-card)',
        }}
      >
        <span>© 2026 Qurie Education. All rights reserved.</span>
        <span style={{ display: 'flex', gap: 16 }}>
          <span>이용약관</span>
          <span>개인정보처리방침</span>
          <a href="mailto:contact@qurie.app" style={{ color: 'inherit', textDecoration: 'none' }}>문의하기</a>
        </span>
      </footer>
    </div>
  );
}
