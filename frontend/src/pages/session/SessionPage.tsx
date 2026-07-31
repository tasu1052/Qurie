import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowDown,
  ArrowUp,
  Code,
  Download,
  FilePlus,
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
import { AlertBanner, Button, LiveBadge } from '../../ds';
import logoSrc from '../../ds/assets/logo.png';
import { CollabMonacoEditor } from '../../collab/CollabMonacoEditor';
import { useCollabSession } from '../../collab/useCollabSession';
import {
  getProjectFileContent,
  useMeOptional,
  useSessionSocket,
  type ProjectImportResponse,
} from '../../data';
import { ProjectImportPanel } from '../../components/session/ProjectImportPanel';
import { SessionFileExplorer } from '../../components/session/SessionFileExplorer';
import { SessionQuizPanel } from '../../components/session/SessionQuizPanel';
import { languageFromPath } from '../../components/session/readLocalProjectFiles';
import {
  loadSessionProject,
  saveSessionProject,
  type SessionProjectRef,
} from '../../components/session/sessionProjectStorage';
import type * as Y from 'yjs';

type LeftTab = 'explorer' | 'materials';
type RightTab = 'community' | 'quiz';
type BottomTab = 'terminal' | 'debug' | 'output';
type EditorLanguage = 'java' | 'javascript' | 'typescript' | 'python' | 'html' | 'cpp';

/** 서버는 타임존 없는 LocalDateTime 을 준다. 파싱이 안 되면 원문을 그대로 노출한다. */
function formatChatTime(value: string): string {
  const at = new Date(value);
  if (Number.isNaN(at.getTime())) return value;
  return `${String(at.getHours()).padStart(2, '0')}:${String(at.getMinutes()).padStart(2, '0')}`;
}

function applyContentToYText(ytext: Y.Text, content: string) {
  ytext.doc?.transact(() => {
    const len = ytext.length;
    if (len > 0) ytext.delete(0, len);
    if (content.length > 0) ytext.insert(0, content);
  });
}

/**
 * Mockup 1o — Code Editor collab shell + project import / quiz hooks.
 */
export default function SessionPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const initialRight: RightTab = params.get('mode') === 'quiz' ? 'quiz' : 'community';
  const sessionId = Number(id);
  const hasSessionId = Number.isFinite(sessionId) && sessionId > 0;

  const [leftTab, setLeftTab] = useState<LeftTab>('explorer');
  const [rightTab, setRightTab] = useState<RightTab>(initialRight);
  const [bottomTab, setBottomTab] = useState<BottomTab>('terminal');
  const [editorLanguage, setEditorLanguage] = useState<EditorLanguage>('typescript');
  const [gitOpen, setGitOpen] = useState(false);
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [projectRef, setProjectRef] = useState<SessionProjectRef | null>(() =>
    hasSessionId ? loadSessionProject(sessionId) : null,
  );
  const [importNotice, setImportNotice] = useState<string | null>(null);
  const meQuery = useMeOptional();
  const collabUserName = meQuery.isSuccess && meQuery.data?.name ? meQuery.data.name : '익명 참가자';
  const collabUser = useMemo(
    () => ({
      name: collabUserName,
    }),
    [collabUserName],
  );

  const sessionTitle = useMemo(
    () => (hasSessionId ? `세션 #${sessionId}` : '세션'),
    [hasSessionId, sessionId],
  );
  const sessionSlug = useMemo(
    () => (hasSessionId ? `session/${sessionId}` : 'session/demo'),
    [hasSessionId, sessionId],
  );

  const { ytext, provider, status: collabStatus } = useCollabSession(
    hasSessionId ? String(sessionId) : 'demo',
    collabUser,
  );

  /** 채팅 · 참여자 명단 · 퀴즈 생성 알림을 받는 STOMP 연결. 세션 id 가 없으면 붙지 않는다. */
  const chat = useSessionSocket(hasSessionId ? sessionId : null);
  const myUserId = meQuery.data?.id ?? null;
  const chatScrollRef = useRef<HTMLDivElement | null>(null);
  const roleByUserId = useMemo(
    () => new Map(chat.participants.map((p) => [p.userId, p.role])),
    [chat.participants],
  );

  // 새 메시지가 붙으면 항상 마지막 메시지가 보이도록 맨 아래로 내린다.
  useEffect(() => {
    const el = chatScrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [chat.messages.length]);

  const onSendChat = () => {
    if (!chat.sendMessage(draft)) return;
    setDraft('');
  };

  const chatPresenceLabel = useMemo(() => {
    if (!hasSessionId) return '세션 주소가 올바르지 않습니다';
    if (chat.status === 'connected') return `현재 ${chat.participants.length}명 접속 중`;
    if (chat.status === 'connecting') return '실시간 연결을 준비하는 중';
    return '연결이 끊어졌습니다 · 자동으로 재연결합니다';
  }, [chat.participants.length, chat.status, hasSessionId]);

  const onImported = (result: ProjectImportResponse) => {
    const next = { projectId: result.projectId, versionHash: result.versionHash };
    setProjectRef(next);
    if (hasSessionId) saveSessionProject(sessionId, next);
    if (result.skippedFiles.length > 0) {
      setImportNotice(
        `${result.fileCount}개 파일 반영 · 스킵 ${result.skippedFiles.length}개 (${result.skippedFiles
          .slice(0, 3)
          .map((s) => s.path)
          .join(', ')}${result.skippedFiles.length > 3 ? '…' : ''})`,
      );
    } else {
      setImportNotice(`${result.fileCount}개 파일을 가져왔습니다.`);
    }
  };

  const onSelectFile = async (path: string) => {
    if (!projectRef) return;
    setActiveFile(path);
    const lang = languageFromPath(path);
    if (['java', 'javascript', 'typescript', 'python', 'html', 'cpp'].includes(lang)) {
      setEditorLanguage(lang as EditorLanguage);
    }
    try {
      const file = await getProjectFileContent(projectRef.projectId, path);
      applyContentToYText(ytext, file.content);
    } catch {
      setImportNotice(`파일을 열지 못했습니다: ${path}`);
    }
  };

  const tabBtn = (active: boolean): CSSProperties => ({
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '11px 0',
    fontSize: 12.5,
    fontWeight: active ? 600 : 400,
    color: active ? 'var(--ink)' : 'var(--text-muted)',
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
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>
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
                  background: 'var(--surface-modal)',
                  border: '1px solid var(--border-strong)',
                  borderRadius: 12,
                  boxShadow: 'var(--shadow-modal)',
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
          <div style={{ padding: '14px 12px', display: 'flex', flexDirection: 'column', gap: 2, flex: 1, minHeight: 0, overflow: 'auto' }}>
            {leftTab === 'explorer' ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 6px 8px' }}>
                  <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                    Workspace
                  </span>
                  <span style={{ display: 'flex', gap: 6, color: 'var(--text-muted)' }}>
                    <FilePlus size={13} />
                    <FolderPlus size={13} />
                  </span>
                </div>
                {!hasSessionId ? (
                  <p style={{ margin: '8px 6px', fontSize: 13, color: 'var(--text-muted)' }}>
                    유효한 세션 ID가 없습니다.
                  </p>
                ) : projectRef == null ? (
                  <ProjectImportPanel sessionId={sessionId} onImported={onImported} />
                ) : (
                  <SessionFileExplorer
                    projectId={projectRef.projectId}
                    activePath={activeFile}
                    onSelect={(path) => {
                      void onSelectFile(path);
                    }}
                  />
                )}
              </>
            ) : (
              <p style={{ margin: '8px 6px', fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                API 미구현: 강의자료 패널 연동 전입니다.
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
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: 'var(--ink)' }}>
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
                <RoundIcon bg="var(--accent)" color="var(--text-inverse)" title="마이크">
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
            <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              접속 중 · 18명
            </span>
            <PresenceRow color="var(--status-warning)" name="박민수 (나)" line="L11" />
            <PresenceRow color="var(--accent)" name="김지원" badge="ADMIN" line="L18" mic />
            <PresenceRow color="var(--status-success)" name="이서연" line="L7" />
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
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)' }}>
              {activeFile ?? (projectRef ? '파일을 선택하세요' : '프로젝트 미연결')}
            </span>
            <span style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <select
                value={editorLanguage}
                onChange={(e) => setEditorLanguage(e.target.value as EditorLanguage)}
                aria-label="코드 언어 선택"
                style={{
                  height: 26,
                  borderRadius: 7,
                  border: '1px solid var(--border-strong)',
                  background: 'var(--surface-card)',
                  color: 'var(--ink)',
                  fontFamily: 'var(--font-sans)',
                  fontSize: 11.5,
                  fontWeight: 600,
                  padding: '0 8px',
                  cursor: 'pointer',
                }}
              >
                <option value="java">Java</option>
                <option value="javascript">JavaScript</option>
                <option value="typescript">TypeScript</option>
                <option value="python">Python</option>
                <option value="html">HTML/CSS</option>
                <option value="cpp">C++</option>
              </select>
              <span style={{ color: 'var(--text-muted)', display: 'inline-flex' }}>
                <Maximize2 size={13} />
              </span>
            </span>
          </div>

          {/* Collab editor — Yjs(Y.Text) ↔ Monaco 바인딩, 원격 커서는 awareness 기반 */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              minHeight: 0,
              background: 'var(--secondary-700)',
            }}
          >
            {importNotice ? (
              <AlertBanner
                tone="info"
                title="프로젝트"
                description={importNotice}
                actionLabel="확인"
                onAction={() => setImportNotice(null)}
              />
            ) : null}
            {collabStatus !== 'connected' ? (
              <div
                style={{
                  padding: '6px 16px',
                  fontSize: 11,
                  fontFamily: 'var(--font-sans)',
                  color: 'var(--text-inverse)',
                  background: collabStatus === 'connecting' ? 'var(--status-warning)' : 'var(--status-error)',
                }}
              >
                {collabStatus === 'connecting' ? '동기화 서버에 연결 중…' : '연결 끊김 — 변경 사항은 로컬에 보관되며 재연결 시 동기화됩니다.'}
              </div>
            ) : null}
            {provider ? (
              <CollabMonacoEditor ytext={ytext} provider={provider} language={editorLanguage} />
            ) : (
              <div style={{ flex: 1 }} />
            )}
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
                <span style={{ color: 'var(--status-success)' }}>통과 · 300ms 지연 후 값 반영</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>[14:18:31]</span>{' '}
                <span style={{ color: 'var(--status-error)' }}>실패 · cleanup 미호출 시 타이머 누수 (timer가 effect 밖에 있음)</span>
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
              <div
                ref={chatScrollRef}
                style={{ flex: 1, padding: 16, display: 'flex', flexDirection: 'column', gap: 14, overflow: 'auto', minHeight: 0 }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, paddingBottom: 6, borderBottom: '1px solid var(--divider)' }}>
                  <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink)' }}>실시간 클래스 채팅</span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{chatPresenceLabel}</span>
                </div>
                {chat.error ? (
                  <AlertBanner
                    tone="error"
                    title="채팅 오류"
                    description={chat.error}
                    actionLabel="닫기"
                    onAction={chat.dismissError}
                  />
                ) : null}
                {chat.messages.length === 0 ? (
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', alignSelf: 'center', lineHeight: 1.6 }}>
                    아직 메시지가 없습니다.
                  </span>
                ) : (
                  chat.messages.map((message) => {
                    const senderRole = roleByUserId.get(message.senderId);
                    return (
                      <ChatBubble
                        key={message.id}
                        initial={message.senderName.trim().charAt(0) || '?'}
                        name={message.senderName}
                        role={senderRole && senderRole !== 'STUDENT' ? senderRole : undefined}
                        time={formatChatTime(message.createdAt)}
                        mine={myUserId != null && message.senderId === myUserId}
                        text={message.content}
                      />
                    );
                  })
                )}
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
                    onKeyDown={(e) => {
                      if (e.key !== 'Enter' || e.shiftKey || e.nativeEvent.isComposing) return;
                      e.preventDefault();
                      onSendChat();
                    }}
                    maxLength={1000}
                    disabled={chat.status !== 'connected'}
                    placeholder={chat.status === 'connected' ? '메시지를 입력하세요…' : '연결을 기다리는 중…'}
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
                  <button
                    type="button"
                    onClick={onSendChat}
                    disabled={chat.status !== 'connected' || draft.trim().length === 0}
                    aria-label="메시지 보내기"
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 6,
                      border: 'none',
                      background: 'var(--accent)',
                      color: 'var(--text-inverse)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      opacity: chat.status === 'connected' && draft.trim().length > 0 ? 1 : 0.5,
                    }}
                  >
                    <Send size={13} />
                  </button>
                </div>
                <div style={{ display: 'flex', gap: 14, color: 'var(--text-muted)' }}>
                  <Paperclip size={14} />
                  <Code size={14} />
                  <Smile size={14} />
                </div>
              </div>
            </>
          ) : (
            <SessionQuizPanel
              projectId={projectRef?.projectId ?? null}
              versionHash={projectRef?.versionHash ?? null}
              pushedQuizSetId={chat.lastQuizNotification?.quizSetId ?? null}
            />
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
          CRDT sync · {projectRef ? `project #${projectRef.projectId}` : '프로젝트 없음'}
        </span>
        <span style={{ marginLeft: 'auto', display: 'flex', gap: 16, fontFamily: 'var(--font-mono)', fontSize: 11 }}>
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
