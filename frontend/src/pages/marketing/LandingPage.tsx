import { Link, useNavigate } from 'react-router-dom';
import { BarChart3, Brain, Check, Users } from 'lucide-react';
import { Button, DonutChart } from '../../ds';
import logoSrc from '../../ds/assets/logo.png';
import { QurieHeroAnimation } from './hero/HeroAnimation';
import { useMeOptional } from '../../data';
import { homePathForRole } from '../../components/auth/roleRoutes';
import { useMarketingLightTheme } from '../../hooks/useMarketingLightTheme';
import './LandingPage.css';

export default function LandingPage() {
  const navigate = useNavigate();
  const meQuery = useMeOptional();
  const user = meQuery.isSuccess ? meQuery.data : null;

  /** 엔터프라이즈 랜딩은 항상 라이트 모드로 보여 줘요. */
  useMarketingLightTheme();

  return (
    <div className="landing-page">
      {/* Topbar — mockup 1a */}
      <header className="landing-header">
        <Link to="/" style={{ textDecoration: 'none', display: 'inline-flex' }}>
          <img
            src={logoSrc}
            alt="Qurie"
            style={{ height: 28, width: 'auto', objectFit: 'contain', display: 'block' }}
          />
        </Link>
        <div className="landing-header-actions">
          {user ? (
            <Button
              variant="ghost"
              onClick={() => navigate(homePathForRole(user.role))}
            >
              내 대시보드
            </Button>
          ) : (
            <Link to="/login" style={{ textDecoration: 'none' }}>
              <Button variant="ghost">로그인</Button>
            </Link>
          )}
          <Link to="/demo" style={{ textDecoration: 'none' }}>
            <Button variant="primary">
              <span className="landing-header-demo-full">데모 요청하기</span>
              <span className="landing-header-demo-short">데모</span>
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero — centered copy + animated product mock */}
      <section className="landing-hero">
        <h1 className="landing-hero-title">
          AI 시대, 부트캠프를 위한
          <br />
          최적의 코드 교육 솔루션
        </h1>
        <p className="landing-hero-lead">
          Qurie는 기업·기관을 위한 실시간 협업 코드 학습 플랫폼이에요. 클래스와 세션 단위로 학습을 운영하고,
          AI가 만든 퀴즈와 세션 리포트로 구성원의 성장을 숫자로 살펴볼 수 있어요.
        </p>
        <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
          <Link to="/demo" style={{ textDecoration: 'none' }}>
            <Button variant="primary" style={{ padding: '13px 24px', fontSize: 15 }}>
              데모 요청하기 <span style={{ color: 'var(--primary-300)', fontWeight: 800 }}>&gt;</span>
            </Button>
          </Link>
        </div>

        <div className="landing-hero-mock">
          <QurieHeroAnimation />
        </div>
      </section>

      {/* Features */}
      <section id="features" className="landing-features">
        <div className="landing-features-heading" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: 'var(--accent)',
            }}
          >
            Core features
          </span>
          <h2 style={{ fontWeight: 700, color: 'var(--ink)', margin: 0 }}>
            학습 관리부터 트랙 운영까지, 하나의 흐름으로
          </h2>
        </div>

        {/* Feature 1 — realtime session */}
        <div className="landing-feature-row">
          <div className="landing-feature-copy" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <span
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: 'var(--accent-softer)',
                color: 'var(--accent)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Users size={20} strokeWidth={1.75} />
            </span>
            <h3 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>실시간 협업 세션</h3>
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: 'var(--text-secondary)' }}>
              클래스 안에서 세션을 열고, 프로젝트 코드를 불러와 여러 명이 동시에 편집해요.
              변경 내용이 바로바로 맞춰져서 충돌 없이 함께 작업할 수 있어요.
            </p>
            {[
              '동시 편집 · 원격 커서 · 접속자 표시',
              '세션 안 실시간 채팅과 터미널 공유',
              '그룹 리더와 참가자 단위로 학습을 운영',
            ].map((item) => (
              <span key={item} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-body)' }}>
                <Check size={14} style={{ color: 'var(--status-success)' }} />
                {item}
              </span>
            ))}
          </div>
          <div
            className="landing-feature-visual"
            style={{
              background: 'var(--secondary-700)',
              borderRadius: 12,
              padding: 20,
              fontFamily: 'var(--font-mono)',
              fontSize: 12.5,
              lineHeight: 1.8,
              color: 'var(--grey-200)',
              boxShadow: 'var(--shadow-modal)',
            }}
          >
            <div className="landing-session-header" style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center' }}>
              <span style={{ fontSize: 10, letterSpacing: '0.06em', color: 'var(--grey-300)', textTransform: 'uppercase' }}>
                session
              </span>
              <span style={{ color: 'var(--primary-300)' }}>java-seoul-1/react-hooks</span>
              <span
                className="landing-session-live"
                style={{
                  marginLeft: 'auto',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  fontFamily: 'var(--font-sans)',
                  fontSize: 10,
                  fontWeight: 600,
                  color: '#7ee2a8',
                }}
              >
                <span className="qurie-live-dot" style={{ width: 6, height: 6, background: '#7ee2a8' }} />
                LIVE · 4명 접속
              </span>
            </div>
            <div>
              <span style={{ color: '#c792ea' }}>function</span> <span style={{ color: '#82aaff' }}>useDebounce</span>
              (value, delay) {'{'}
            </div>
            <div>
              &nbsp;&nbsp;<span style={{ color: '#c792ea' }}>const</span> [v, setV] ={' '}
              <span style={{ color: '#82aaff' }}>useState</span>(value);
              <span
                style={{
                  display: 'inline-block',
                  width: 2,
                  height: 14,
                  background: '#f5a97f',
                  verticalAlign: 'middle',
                  marginLeft: 1,
                  animation: 'qurie-live-ping 1.1s infinite',
                }}
              />
              <span
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: 9,
                  fontWeight: 600,
                  background: '#f5a97f',
                  color: '#111',
                  borderRadius: 3,
                  padding: '1px 5px',
                  marginLeft: 2,
                  verticalAlign: 'middle',
                }}
              >
                박민수
              </span>
            </div>
            <div>
              &nbsp;&nbsp;<span style={{ color: '#c792ea' }}>useEffect</span>(() =&gt; {'{'}
            </div>
            <div>
              &nbsp;&nbsp;&nbsp;&nbsp;<span style={{ color: '#697098' }}>// 300ms 이후 반영</span>
              <span
                style={{
                  display: 'inline-block',
                  width: 2,
                  height: 14,
                  background: '#82aaff',
                  verticalAlign: 'middle',
                  marginLeft: 1,
                  animation: 'qurie-live-ping 1.4s infinite',
                }}
              />
              <span
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: 9,
                  fontWeight: 600,
                  background: '#82aaff',
                  color: '#111',
                  borderRadius: 3,
                  padding: '1px 5px',
                  marginLeft: 2,
                  verticalAlign: 'middle',
                }}
              >
                김지원
              </span>
            </div>
            <div>&nbsp;&nbsp;{'}, [value, delay]);'}</div>
            <div>{'}'}</div>
          </div>
        </div>

        {/* Feature 2 — AI quiz */}
        <div id="process" className="landing-feature-row landing-feature-row--reverse">
          <div
            className="landing-feature-visual"
            style={{
              background: 'var(--surface-sunken)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              padding: 24,
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            <div className="landing-quiz-pipeline">
              {['AI 난이도 산정', '문제 생성', '재검증 · 조정'].map((label, i) => (
                <span key={label} style={{ display: 'contents' }}>
                  <span
                    style={{
                      flex: 1,
                      background: 'var(--surface-card)',
                      border: '1px solid var(--border)',
                      borderRadius: 8,
                      padding: '12px 14px',
                      fontSize: 13,
                      color: 'var(--text-body)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <span
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 6,
                        background: 'var(--accent-softer)',
                        color: 'var(--accent)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 11,
                        fontWeight: 700,
                      }}
                    >
                      {i + 1}
                    </span>
                    {label}
                  </span>
                  {i < 2 && <span className="landing-quiz-pipeline-arrow">&gt;</span>}
                </span>
              ))}
            </div>
            <div
              style={{
                background: 'var(--surface-card)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                padding: 16,
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
              }}
            >
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <span style={{ background: 'var(--status-neutral-bg)', color: 'var(--status-neutral)', borderRadius: 999, padding: '3px 10px', fontSize: 10.5, fontWeight: 600 }}>
                  MULTIPLE_CHOICE
                </span>
                <span style={{ background: 'var(--accent-softer)', color: 'var(--accent)', borderRadius: 999, padding: '3px 10px', fontSize: 10.5, fontWeight: 600 }}>
                  CONCEPTUAL
                </span>
                <span style={{ background: 'var(--status-warning-bg)', color: 'var(--status-warning)', borderRadius: 999, padding: '3px 10px', fontSize: 10.5, fontWeight: 600 }}>
                  NORMAL
                </span>
                <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>
                  time_limit 90s
                </span>
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>
                useEffect의 cleanup 함수가 실행되는 시점은 언제인가요?
              </div>
              <div style={{ border: '1px solid var(--accent)', background: 'var(--accent-softer)', borderRadius: 999, padding: '9px 14px', fontSize: 13, color: 'var(--ink)' }}>
                다음 effect 실행 직전과 언마운트 시점
              </div>
              <div style={{ border: '1px solid var(--border-strong)', borderRadius: 999, padding: '9px 14px', fontSize: 13, color: 'var(--text-secondary)' }}>
                컴포넌트가 처음 마운트될 때 한 번
              </div>
            </div>
          </div>
          <div className="landing-feature-copy" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <span
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: 'var(--accent-softer)',
                color: 'var(--accent)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Brain size={20} strokeWidth={1.75} />
            </span>
            <h3 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>AI 퀴즈 자동 생성</h3>
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: 'var(--text-secondary)' }}>
              세션에 연결된 프로젝트 코드를 바탕으로 AI가 퀴즈를 만들어요. 난이도를 먼저 살펴보고, 만든 문제를
              다시 점검해 쉬움 · 보통 · 어려움으로 맞춰 줘요.
            </p>
            {[
              '개념형 · 코드형 목적에 맞춰 문제 구성',
              '문제별 제한 시간으로 부정행위를 줄여 줘요',
              '정답 해설까지 AI가 함께 작성해 줘요',
            ].map((item) => (
              <span key={item} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-body)' }}>
                <Check size={14} style={{ color: 'var(--status-success)' }} />
                {item}
              </span>
            ))}
          </div>
        </div>

        {/* Feature 3 — report */}
        <div className="landing-feature-row">
          <div className="landing-feature-copy" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <span
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: 'var(--accent-softer)',
                color: 'var(--accent)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <BarChart3 size={20} strokeWidth={1.75} />
            </span>
            <h3 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>세션 리포트 & 인사 데이터 연계</h3>
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: 'var(--text-secondary)' }}>
              세션이 끝나면 구성원별 퀴즈 완료율·정답률·난이도 비율·평점이 리포트로 나와요. Master는 이 데이터를
              바탕으로 매니저 평가와 인사 관리에 활용할 수 있어요.
            </p>
            {[
              '세션 단위 자동 집계 · 발급 이력 관리',
              '매니저 코멘트와 첨부 파일 등록',
              '불성실 계정 비활성화 등 인사 조치 근거',
            ].map((item) => (
              <span key={item} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-body)' }}>
                <Check size={14} style={{ color: 'var(--status-success)' }} />
                {item}
              </span>
            ))}
          </div>
          <div
            className="landing-feature-visual"
            style={{
              background: 'var(--surface-card)',
              border: '1px solid var(--border)',
              borderRadius: 16,
              boxShadow: 'var(--shadow-modal)',
              padding: 24,
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                Session report
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>SR-20260722-JW</span>
            </div>
            <div className="landing-report-stats">
              {[
                { v: '100%', l: '퀴즈 완료율' },
                { v: '92%', l: '정답률', accent: true },
                { v: '4.8', l: '평점' },
              ].map((m) => (
                <div key={m.l} style={{ background: 'var(--surface-sunken)', borderRadius: 8, padding: '14px 8px' }}>
                  <div style={{ fontSize: 24, fontWeight: 700, color: m.accent ? 'var(--accent)' : 'var(--ink)' }}>{m.v}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{m.l}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <DonutChart
                size={110}
                thickness={14}
                centerValue="H 40%"
                centerLabel="난이도 비율"
                segments={[
                  { label: 'EASY', value: 20 },
                  { label: 'NORMAL', value: 40, accent: true },
                  { label: 'HARD', value: 40 },
                ]}
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="cta" className="landing-cta">
        <h2 className="landing-cta-title">지금 Qurie로 팀의 학습을 시작해 보세요</h2>
        <p style={{ margin: 0, fontSize: 14, color: 'var(--grey-300)', maxWidth: 480 }}>
          기업 등록부터 매니저 초대, 첫 세션 개설까지 하루면 충분해요. 도입 상담을 통해 조직에 맞는 운영 방식을
          함께 찾아 드려요.
        </p>
        <div style={{ display: 'flex', gap: 12, marginTop: 6 }}>
          <Link to="/demo" style={{ textDecoration: 'none' }}>
            <Button variant="accent" style={{ padding: '13px 24px', fontSize: 15 }}>
              데모 요청하기
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <img
          src={logoSrc}
          alt="Qurie"
          style={{ height: 24, width: 'auto', objectFit: 'contain', objectPosition: 'left', display: 'block' }}
        />
        <p style={{ margin: 0, fontSize: 12, lineHeight: 1.6, color: 'var(--text-muted)' }}>
          기업을 위한 실시간 협업 코드 학습 & AI 퀴즈 플랫폼.
        </p>
        <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)' }}>© 2026 Qurie · 현재 데모 버전</p>
      </footer>
    </div>
  );
}
