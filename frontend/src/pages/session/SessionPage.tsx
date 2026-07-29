import { useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  Code,
  Download,
  FileCode,
  FileJson,
  FilePlus,
  FileText,
  Folder,
  FolderGit2,
  FolderPlus,
  GitBranch,
  GitCommitHorizontal,
  Headphones,
  Maximize2,
  Mic,
  MoreVertical,
  Paperclip,
  PhoneOff,
  Play,
  Send,
  Settings,
  Smile,
  Terminal,
  Trash2,
} from 'lucide-react';
import { Button, LiveBadge } from '../../ds';
import logoSrc from '../../ds/assets/logo.png';

type LeftTab = 'explorer' | 'materials';
type RightTab = 'community' | 'quiz';
type BottomTab = 'terminal' | 'debug' | 'output';

const CODE_LINES: { html: ReactNode; highlight?: string }[] = [
  { html: <span style={{ color: '#697098' }}>{'/**'}</span> },
  { html: <span style={{ color: '#697098' }}>&nbsp;* @description: Qurie 세션 — React Hooks 심화 실습</span> },
  { html: <span style={{ color: '#697098' }}>&nbsp;* @session: java-seoul-1/react-hooks-deep-dive</span> },
  { html: <span style={{ color: '#697098' }}>&nbsp;*/</span> },
  { html: <span>&nbsp;</span> },
  {
    html: (
      <>
        <span style={{ color: '#c792ea' }}>import</span>
        {' { useState, useEffect } '}
        <span style={{ color: '#c792ea' }}>from</span>{' '}
        <span style={{ color: '#c3e88d' }}>'react'</span>;
      </>
    ),
  },
  { html: <span>&nbsp;</span> },
  {
    html: (
      <>
        <span style={{ color: '#c792ea' }}>export function</span>{' '}
        <span style={{ color: '#82aaff' }}>useDebounce</span>
        (value, delay = <span style={{ color: '#f78c6c' }}>300</span>) {'{'}
      </>
    ),
  },
  { html: <span style={{ color: '#697098' }}>&nbsp;&nbsp;// 배열/객체 참조 변경에 주의하세요.</span> },
  {
    html: (
      <>
        &nbsp;&nbsp;<span style={{ color: '#c792ea' }}>const</span> [debounced, setDebounced] ={' '}
        <span style={{ color: '#82aaff' }}>useState</span>(value);
      </>
    ),
  },
  {
    html: (
      <>
        &nbsp;&nbsp;<span style={{ color: '#c792ea' }}>const</span> timer ={' '}
        <span style={{ color: '#82aaff' }}>setTimeout</span>(() =&gt; setDebounced(value), delay);
      </>
    ),
    highlight: '#f5a97f',
  },
  { html: <span>&nbsp;</span> },
  {
    html: (
      <>
        &nbsp;&nbsp;<span style={{ color: '#c792ea' }}>useEffect</span>(() =&gt; {'{'}
      </>
    ),
  },
  {
    html: (
      <>
        &nbsp;&nbsp;&nbsp;&nbsp;<span style={{ color: '#c792ea' }}>return</span> () =&gt;{' '}
        <span style={{ color: '#82aaff' }}>clearTimeout</span>(timer);
      </>
    ),
  },
  { html: <span>&nbsp;&nbsp;{'}, [value, delay]);'}</span> },
  { html: <span>&nbsp;</span> },
  {
    html: (
      <>
        &nbsp;&nbsp;<span style={{ color: '#c792ea' }}>return</span> debounced;
      </>
    ),
  },
  { html: <span>{'}'}</span>, highlight: '#82aaff' },
  { html: <span>&nbsp;</span> },
];

const FILES = [
  { id: 'solution.js', icon: <FileCode size={13} />, active: true },
  { id: 'test_cases.json', icon: <FileJson size={13} /> },
  { id: 'readme.md', icon: <FileText size={13} /> },
];

/**
 * Mockup 1o — Code Editor collab shell.
 * Monaco / Yjs intentionally omitted: static code pane only.
 */
export default function SessionPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const initialRight: RightTab = params.get('mode') === 'quiz' ? 'quiz' : 'community';

  const [leftTab, setLeftTab] = useState<LeftTab>('explorer');
  const [rightTab, setRightTab] = useState<RightTab>(initialRight);
  const [bottomTab, setBottomTab] = useState<BottomTab>('terminal');
  const [gitOpen, setGitOpen] = useState(false);
  const [activeFile, setActiveFile] = useState('solution.js');
  const [draft, setDraft] = useState('');

  const sessionTitle = useMemo(() => 'React Hooks 심화 실습', []);
  const sessionSlug = useMemo(() => `java-seoul-1/${id ?? 'react-hooks-deep-dive'}`, [id]);

  const tabBtn = (active: boolean): CSSProperties => ({
    flex: 1,
    textAlign: 'center',
    padding: '11px 0',
    fontSize: 12.5,
    fontWeight: active ? 600 : 400,
    color: active ? 'var(--ink)' : 'var(--text-muted)',
    borderBottom: active ? '2px solid var(--accent)' : '2px solid transparent',
    background: 'transparent',
    border: 'none',
    borderBottomWidth: 2,
    borderBottomStyle: 'solid',
    borderBottomColor: active ? 'var(--accent)' : 'transparent',
    cursor: 'pointer',
    fontFamily: 'var(--font-sans)',
  });

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg-app)',
        height: '100vh',
        fontFamily: 'var(--font-sans)',
        color: 'var(--ink)',
        overflow: 'hidden',
      }}
    >
      {/* Top chrome */}
      <header
        style={{
          height: 56,
          background: 'var(--surface-card)',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          padding: '0 20px',
          flexShrink: 0,
        }}
      >
        <Link to="/" style={{ display: 'inline-flex', textDecoration: 'none' }}>
          <img src={logoSrc} alt="Qurie" style={{ height: 28, width: 'auto', objectFit: 'contain', display: 'block' }} />
        </Link>
        <span style={{ width: 1, height: 24, background: 'var(--divider)' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>{sessionTitle}</span>
            <LiveBadge />
          </div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--text-muted)' }}>
            {sessionSlug} · 01:24:05 경과
          </span>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setGitOpen((v) => !v)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7,
                background: 'var(--surface-card)',
                color: 'var(--ink)',
                border: '1px solid var(--border-strong)',
                borderRadius: 999,
                padding: '8px 14px',
                fontSize: 13,
                fontWeight: 600,
                fontFamily: 'var(--font-sans)',
                cursor: 'pointer',
              }}
            >
              <GitBranch size={14} />
              Git
              <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>▾</span>
            </button>
            {gitOpen ? (
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  top: 42,
                  width: 230,
                  background: 'linear-gradient(155deg,rgba(255,255,255,0.82),rgba(255,255,255,0.7))',
                  backdropFilter: 'blur(22px) saturate(1.45)',
                  WebkitBackdropFilter: 'blur(22px) saturate(1.45)',
                  border: '1px solid rgba(255,255,255,0.65)',
                  borderRadius: 12,
                  boxShadow: 'var(--shadow-modal), inset 0 1px 0 rgba(255,255,255,0.75)',
                  padding: 6,
                  display: 'flex',
                  flexDirection: 'column',
                  zIndex: 7,
                }}
              >
                <GitMenuItem icon={<GitCommitHorizontal size={14} />} label="Commit" hint="⌘⏎" />
                <GitMenuItem icon={<ArrowUp size={14} />} label="Push" hint="origin/main" />
                <GitMenuItem icon={<ArrowDown size={14} />} label="Pull" />
                <span style={{ height: 1, background: 'var(--divider)', margin: '4px 6px' }} />
                <GitMenuItem icon={<Download size={14} />} label="세션 내보내기" hint=".zip" />
              </div>
            ) : null}
          </div>
          <Button variant="accent" icon={<Play size={14} />} style={{ borderRadius: 999 }}>
            실행 및 제출
          </Button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            title="나가기"
            style={{
              border: 'none',
              background: 'transparent',
              color: 'var(--text-secondary)',
              display: 'flex',
              cursor: 'pointer',
              padding: 4,
            }}
          >
            <Settings size={16} />
          </button>
        </div>
      </header>

      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        {/* Left: explorer + voice */}
        <aside
          style={{
            width: 250,
            minWidth: 250,
            background: 'var(--surface-card)',
            borderRight: '1px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
            <button type="button" style={tabBtn(leftTab === 'explorer')} onClick={() => setLeftTab('explorer')}>
              탐색기
            </button>
            <button type="button" style={tabBtn(leftTab === 'materials')} onClick={() => setLeftTab('materials')}>
              강의자료
            </button>
          </div>
          <div style={{ padding: '14px 12px', display: 'flex', flexDirection: 'column', gap: 2, flex: 1, minHeight: 0 }}>
            {leftTab === 'explorer' ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 6px 8px' }}>
                  <span style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                    Workspace
                  </span>
                  <span style={{ display: 'flex', gap: 6, color: 'var(--text-muted)' }}>
                    <FilePlus size={13} />
                    <FolderPlus size={13} />
                  </span>
                </div>
                {FILES.map((f) => {
                  const active = activeFile === f.id;
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setActiveFile(f.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '6px 8px',
                        borderRadius: 6,
                        background: active ? 'var(--accent-softer)' : 'transparent',
                        fontSize: 12.5,
                        fontWeight: active ? 600 : 400,
                        color: active ? 'var(--accent)' : 'var(--text-secondary)',
                        border: 'none',
                        cursor: 'pointer',
                        fontFamily: 'var(--font-sans)',
                        textAlign: 'left',
                        width: '100%',
                      }}
                    >
                      {f.icon}
                      {f.id}
                      {active ? (
                        <span style={{ marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)' }} />
                      ) : null}
                    </button>
                  );
                })}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '6px 8px',
                    borderRadius: 6,
                    fontSize: 12.5,
                    color: 'var(--text-secondary)',
                  }}
                >
                  <ChevronDown size={12} />
                  <Folder size={13} />
                  lib/
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '6px 8px 6px 30px',
                    borderRadius: 6,
                    fontSize: 12.5,
                    color: 'var(--text-secondary)',
                  }}
                >
                  <FileCode size={13} />
                  utils.js
                </div>
              </>
            ) : (
              <p style={{ margin: '8px 6px', fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                강의자료 패널은 추후 연결됩니다.
              </p>
            )}
          </div>
          <div
            style={{
              marginTop: 'auto',
              borderTop: '1px solid var(--divider)',
              padding: '14px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: 'var(--surface-sunken)',
                border: '1px solid var(--border)',
                borderRadius: 999,
                padding: '7px 8px 7px 14px',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, fontWeight: 600, color: 'var(--ink)' }}>
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: 'var(--status-success)',
                    animation: 'qurie-pulse 1.6s infinite',
                  }}
                />
                음성 채팅 · 4명
              </span>
              <span style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
                <RoundIcon bg="var(--accent)" color="#fff" title="마이크">
                  <Mic size={12} />
                </RoundIcon>
                <RoundIcon title="헤드셋">
                  <Headphones size={12} />
                </RoundIcon>
                <RoundIcon title="나가기" color="var(--status-error)" onClick={() => navigate(-1)}>
                  <PhoneOff size={12} />
                </RoundIcon>
              </span>
            </div>
            <span style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              접속 중 · 18명
            </span>
            <PresenceRow color="#f5a97f" name="박민수 (나)" line="L11" />
            <PresenceRow color="#82aaff" name="김지원" badge="ADMIN" line="L18" mic />
            <PresenceRow color="#7ee2a8" name="이서연" line="L7" />
          </div>
        </aside>

        {/* Center: editor + terminal */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              height: 38,
              background: 'var(--surface-card)',
              borderBottom: '1px solid var(--border)',
              padding: '0 16px',
              flexShrink: 0,
            }}
          >
            <FolderGit2 size={13} style={{ color: 'var(--text-muted)' }} />
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>workspace</span>
            <span style={{ color: 'var(--accent)', fontWeight: 800, fontSize: 10 }}>&gt;</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)' }}>{activeFile}</span>
            <span style={{ marginLeft: 'auto', color: 'var(--text-muted)' }}>
              <Maximize2 size={13} />
            </span>
          </div>

          {/* Static mock editor — Monaco later */}
          <div
            style={{
              flex: 1,
              background: 'var(--secondary-700)',
              fontFamily: 'var(--font-mono)',
              fontSize: 13,
              lineHeight: 1.85,
              overflow: 'auto',
              display: 'flex',
              padding: '16px 0',
              minHeight: 0,
            }}
          >
            <div
              style={{
                width: 48,
                textAlign: 'right',
                paddingRight: 14,
                color: 'rgba(255,255,255,0.25)',
                userSelect: 'none',
                flexShrink: 0,
              }}
            >
              {CODE_LINES.map((_, i) => (
                <div key={i}>{i + 1}</div>
              ))}
            </div>
            <div style={{ flex: 1, color: '#d6d6dd', paddingRight: 20, minWidth: 0 }}>
              {CODE_LINES.map((line, i) => (
                <div
                  key={i}
                  style={{
                    background: line.highlight ? `${line.highlight}1a` : undefined,
                    position: 'relative',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {line.html}
                  {line.highlight ? (
                    <>
                      <span
                        style={{
                          display: 'inline-block',
                          width: 2,
                          height: 15,
                          background: line.highlight,
                          verticalAlign: 'middle',
                          marginLeft: 1,
                          animation: 'qurie-pulse 1.1s infinite',
                        }}
                      />
                      <span
                        style={{
                          display: 'inline-flex',
                          verticalAlign: 'middle',
                          marginLeft: 5,
                          width: 16,
                          height: 16,
                          borderRadius: '50%',
                          background: line.highlight,
                          color: '#111',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontFamily: 'var(--font-sans)',
                          fontSize: 8,
                          fontWeight: 800,
                        }}
                      >
                        {line.highlight === '#f5a97f' ? '민' : '지'}
                      </span>
                    </>
                  ) : null}
                </div>
              ))}
              <p style={{ margin: '16px 0 0', fontSize: 11, color: 'rgba(255,255,255,0.35)', fontFamily: 'var(--font-sans)' }}>
                Monaco / Yjs 연동 전 정적 목업입니다.
              </p>
            </div>
          </div>

          <div
            style={{
              height: 200,
              background: 'var(--surface-card)',
              borderTop: '1px solid var(--border)',
              display: 'flex',
              flexDirection: 'column',
              flexShrink: 0,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 18,
                padding: '0 16px',
                height: 36,
                borderBottom: '1px solid var(--divider)',
              }}
            >
              <BottomTabButton active={bottomTab === 'terminal'} onClick={() => setBottomTab('terminal')} icon={<Terminal size={13} />}>
                터미널
              </BottomTabButton>
              <button
                type="button"
                onClick={() => setBottomTab('debug')}
                style={{ fontSize: 12, color: bottomTab === 'debug' ? 'var(--ink)' : 'var(--text-muted)', border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}
              >
                디버그 콘솔
              </button>
              <button
                type="button"
                onClick={() => setBottomTab('output')}
                style={{ fontSize: 12, color: bottomTab === 'output' ? 'var(--ink)' : 'var(--text-muted)', border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}
              >
                출력
              </button>
              <span style={{ marginLeft: 'auto', display: 'flex', gap: 12, color: 'var(--text-muted)' }}>
                <Trash2 size={13} />
                <MoreVertical size={13} />
              </span>
            </div>
            <div
              style={{
                flex: 1,
                padding: '12px 16px',
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
                lineHeight: 1.8,
                color: 'var(--text-body)',
                overflow: 'hidden',
              }}
            >
              <div>
                <span style={{ color: 'var(--text-muted)' }}>[14:18:30]</span>{' '}
                <span style={{ color: 'var(--accent)' }}>→ Node.js v20.11 환경에서 실행 중…</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>[14:18:30]</span> useDebounce 훅 테스트 3건 실행
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>[14:18:31]</span>{' '}
                <span style={{ color: 'var(--status-success)' }}>✓ 300ms 지연 후 값 반영 — 통과</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>[14:18:31]</span>{' '}
                <span style={{ color: 'var(--status-error)' }}>✗ cleanup 미호출 시 타이머 누수 — 실패 (timer가 effect 밖에 있음)</span>
              </div>
              <div>
                qrie@java-seoul-1:~/workspace${' '}
                <span
                  style={{
                    display: 'inline-block',
                    width: 7,
                    height: 13,
                    background: 'var(--ink)',
                    verticalAlign: 'middle',
                    animation: 'qurie-pulse 1.1s infinite',
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right: community / quiz */}
        <aside
          style={{
            width: 330,
            minWidth: 330,
            background: 'var(--surface-card)',
            borderLeft: '1px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
            <button type="button" style={tabBtn(rightTab === 'community')} onClick={() => setRightTab('community')}>
              커뮤니티
            </button>
            <button type="button" style={tabBtn(rightTab === 'quiz')} onClick={() => setRightTab('quiz')}>
              퀴즈
            </button>
          </div>
          {rightTab === 'community' ? (
            <>
              <div style={{ flex: 1, padding: 16, display: 'flex', flexDirection: 'column', gap: 14, overflow: 'auto', minHeight: 0 }}>
                <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 2, paddingBottom: 6, borderBottom: '1px solid var(--divider)' }}>
                  <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink)' }}>실시간 클래스 채팅</span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>현재 18명의 학생이 접속 중</span>
                </div>
                <ChatBubble
                  initial="지"
                  name="김지원"
                  role="ADMIN"
                  time="14:30"
                  text={
                    <>
                      cleanup은{' '}
                      <code style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5, background: 'var(--surface-card)', border: '1px solid var(--border)', borderRadius: 4, padding: '0 4px' }}>
                        useEffect
                      </code>{' '}
                      안에서 반환해야 합니다. 11번 줄을 다시 보세요.
                    </>
                  }
                />
                <ChatBubble initial="민" name="박민수" time="14:31" mine text="setTimeout을 effect 안으로 옮기면 되는 건가요? 의존성 배열은 그대로 두고요?" />
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ flex: 1, height: 1, background: 'var(--divider)' }} />
                  <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', color: 'var(--text-muted)' }}>새 메시지</span>
                  <span style={{ flex: 1, height: 1, background: 'var(--divider)' }} />
                </div>
                <ChatBubble
                  initial="지"
                  name="김지원"
                  role="ADMIN"
                  time="14:32"
                  text="네, 맞습니다. 이 부분은 세션 종료 후 AI 퀴즈로도 출제될 예정이에요."
                />
              </div>
              <div style={{ borderTop: '1px solid var(--border)', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    border: '1px solid var(--border-strong)',
                    borderRadius: 999,
                    padding: '9px 14px',
                  }}
                >
                  <input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder="메시지를 입력하세요…"
                    style={{
                      flex: 1,
                      border: 'none',
                      outline: 'none',
                      background: 'transparent',
                      fontSize: 13,
                      color: 'var(--ink)',
                      fontFamily: 'var(--font-sans)',
                    }}
                  />
                  <span
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 6,
                      background: 'var(--accent)',
                      color: '#fff',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                    }}
                  >
                    <Send size={13} />
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 14, color: 'var(--text-muted)' }}>
                  <Paperclip size={14} />
                  <Code size={14} />
                  <Smile size={14} />
                </div>
              </div>
            </>
          ) : (
            <div style={{ flex: 1, padding: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>AI 퀴즈</span>
              <span style={{ fontSize: 12.5, color: 'var(--text-muted)', lineHeight: 1.55 }}>
                퀴즈 모드(1p) UI는 다음 작업에서 연결합니다. 지금은 협업 모드(1o) 셸만 구현되어 있습니다.
              </span>
            </div>
          )}
        </aside>
      </div>

      <footer
        style={{
          height: 30,
          background: 'var(--surface-card)',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          padding: '0 16px',
          fontSize: 11,
          color: 'var(--text-muted)',
          flexShrink: 0,
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--status-success)' }} />
          Connected · Seoul Server
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <GitBranch size={11} />
          CRDT sync 대기 (Yjs 미연동)
        </span>
        <span style={{ marginLeft: 'auto', display: 'flex', gap: 16, fontFamily: 'var(--font-mono)', fontSize: 10.5 }}>
          <span>Ln 11, Col 58</span>
          <span>Spaces: 2</span>
          <span>UTF-8</span>
          <span style={{ color: 'var(--accent)' }}>JavaScript (ES2022)</span>
        </span>
      </footer>
    </div>
  );
}

function GitMenuItem({ icon, label, hint }: { icon: ReactNode; label: string; hint?: string }) {
  return (
    <span
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 9,
        padding: '8px 10px',
        borderRadius: 8,
        fontSize: 12.5,
        fontWeight: 600,
        color: 'var(--ink)',
        cursor: 'pointer',
      }}
    >
      <span style={{ color: 'var(--text-secondary)', display: 'inline-flex' }}>{icon}</span>
      {label}
      {hint ? (
        <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)' }}>{hint}</span>
      ) : null}
    </span>
  );
}

function RoundIcon({
  children,
  bg = 'var(--surface-card)',
  color = 'var(--text-secondary)',
  title,
  onClick,
}: {
  children: ReactNode;
  bg?: string;
  color?: string;
  title?: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      style={{
        width: 26,
        height: 26,
        borderRadius: '50%',
        background: bg,
        border: bg === 'var(--accent)' ? 'none' : '1px solid var(--border-strong)',
        color,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        padding: 0,
      }}
    >
      {children}
    </button>
  );
}

function PresenceRow({
  color,
  name,
  badge,
  line,
  mic,
}: {
  color: string;
  name: string;
  badge?: string;
  line: string;
  mic?: boolean;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
      <span style={{ fontSize: 12.5, fontWeight: name.includes('(나)') ? 600 : 400, color: 'var(--ink)' }}>
        {name}{' '}
        {badge ? <span style={{ fontSize: 10, color: 'var(--accent)', fontWeight: 600 }}>{badge}</span> : null}
      </span>
      {mic ? <Mic size={11} style={{ color: 'var(--status-success)' }} /> : null}
      <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)' }}>{line}</span>
    </div>
  );
}

function BottomTabButton({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        fontSize: 12,
        fontWeight: active ? 600 : 400,
        color: active ? 'var(--ink)' : 'var(--text-muted)',
        border: 'none',
        background: 'none',
        borderBottom: active ? '2px solid var(--accent)' : '2px solid transparent',
        height: '100%',
        paddingTop: 2,
        cursor: 'pointer',
        fontFamily: 'var(--font-sans)',
      }}
    >
      {icon}
      {children}
    </button>
  );
}

function ChatBubble({
  initial,
  name,
  role,
  time,
  text,
  mine,
}: {
  initial: string;
  name: string;
  role?: string;
  time: string;
  text: ReactNode;
  mine?: boolean;
}) {
  return (
    <div style={{ display: 'flex', gap: 8, flexDirection: mine ? 'row-reverse' : 'row' }}>
      <span
        style={{
          width: 28,
          height: 28,
          borderRadius: '50%',
          background: mine ? 'var(--tertiary-100)' : 'var(--accent-soft)',
          color: mine ? 'var(--quaternary-400)' : 'var(--accent)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 10,
          fontWeight: 700,
          flexShrink: 0,
        }}
      >
        {initial}
      </span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3, alignItems: mine ? 'flex-end' : 'flex-start' }}>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          {mine ? (
            <>
              {name} · {time}
            </>
          ) : (
            <>
              <span style={{ fontWeight: 600, color: 'var(--ink)' }}>{name}</span>{' '}
              {role ? <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{role}</span> : null} · {time}
            </>
          )}
        </span>
        <div
          style={{
            background: mine ? 'var(--accent-softer)' : 'var(--surface-sunken)',
            border: mine ? '1px solid var(--accent-soft)' : undefined,
            borderRadius: mine ? '10px 0 10px 10px' : '0 10px 10px 10px',
            padding: '9px 12px',
            fontSize: 12.5,
            lineHeight: 1.55,
            color: 'var(--text-body)',
            maxWidth: 240,
          }}
        >
          {text}
        </div>
      </div>
    </div>
  );
}
