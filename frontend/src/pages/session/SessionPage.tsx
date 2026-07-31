import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowDown,
  ArrowUp,
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
  PhoneOff,
  Play,
  Settings,
  Terminal,
  Trash2,
} from 'lucide-react';
import { AlertBanner, Button, LiveBadge, Modal } from '../../ds';
import logoSrc from '../../ds/assets/logo.png';
import { CollabMonacoEditor } from '../../collab/CollabMonacoEditor';
import { useCollabSession } from '../../collab/useCollabSession';
import {
  getProjectFileContent,
  getProjectFiles,
  QueryAsyncBoundary,
  useDeleteSession,
  useGetSession,
  useMeOptional,
  useSessionSocket,
  useUpdateSession,
  type ProjectImportResponse,
} from '../../data';
import { queryKeys } from '../../network/core/queryKeys';
import { getSession } from '../../network/session/session-apis';
import { ConfirmDeleteOverlay } from '../../components/overlays/ConfirmDeleteOverlay';
import { ProjectImportPanel } from '../../components/session/ProjectImportPanel';
import { SessionChatPanel } from '../../components/session/SessionChatPanel';
import { SessionFileExplorer } from '../../components/session/SessionFileExplorer';
import { SessionQuizPanel } from '../../components/session/SessionQuizPanel';
import { languageFromPath } from '../../components/session/readLocalProjectFiles';
import {
  clearSessionProject,
  loadSessionProject,
  loadSessionTitle,
  saveSessionProject,
  saveSessionTitle,
  type SessionProjectRef,
} from '../../components/session/sessionProjectStorage';
import {
  resizeHandleStyle,
  sessionChromeVisibility,
  usePointerDrag,
  useSessionPanelSizes,
  useViewportWidth,
} from '../../components/session/sessionPanelLayout';
import type * as Y from 'yjs';

type LeftTab = 'explorer' | 'materials';
type RightTab = 'community' | 'quiz';
type BottomTab = 'terminal' | 'debug' | 'output';

const LANGUAGE_OPTIONS = [
  { value: 'java', label: 'Java' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
  { value: 'cpp', label: 'C++' },
  { value: 'json', label: 'JSON' },
  { value: 'markdown', label: 'Markdown' },
] as const;

function applyContentToYText(ytext: Y.Text, content: string) {
  ytext.doc?.transact(() => {
    const len = ytext.length;
    if (len > 0) ytext.delete(0, len);
    if (content.length > 0) ytext.insert(0, content);
  });
}

function SessionHeaderMeta({ sessionId, hintTitle }: { sessionId: number; hintTitle?: string | null }) {
  const cachedTitle = loadSessionTitle(sessionId) ?? hintTitle?.trim() ?? null;
  const { data: session, isPending } = useQuery({
    queryKey: queryKeys.sessions.detail(sessionId),
    queryFn: () => getSession(sessionId),
  });

  useEffect(() => {
    if (hintTitle?.trim()) {
      saveSessionTitle(sessionId, hintTitle);
    }
  }, [hintTitle, sessionId]);

  useEffect(() => {
    if (session?.title?.trim()) {
      saveSessionTitle(sessionId, session.title);
      document.title = `${session.title.trim()} · Qurie`;
    } else if (cachedTitle) {
      document.title = `${cachedTitle} · Qurie`;
    }
  }, [session, sessionId, cachedTitle]);

  const title = session?.title?.trim() || cachedTitle || (isPending ? '세션 불러오는 중…' : '세션');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: 'var(--ink)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            maxWidth: 420,
          }}
          title={title}
        >
          {title}
        </span>
        {session?.active ? <LiveBadge /> : null}
      </div>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>
        #{sessionId}
        {session?.classPublic ? ' · 수업' : ''}
        {session && !session.active ? ' · 종료됨' : ''}
      </span>
    </div>
  );
}

/**
 * Mockup 1o — Code Editor collab shell + project import / quiz / chat hooks.
 */
export default function SessionPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const initialRight: RightTab = params.get('mode') === 'quiz' ? 'quiz' : 'community';
  const titleHint = params.get('title');
  const sessionId = Number(id);
  const hasSessionId = Number.isFinite(sessionId) && sessionId > 0;

  const [leftTab, setLeftTab] = useState<LeftTab>('explorer');
  const [rightTab, setRightTab] = useState<RightTab>(initialRight);
  const [bottomTab, setBottomTab] = useState<BottomTab>('terminal');
  const [editorLanguage, setEditorLanguage] = useState<string>('typescript');
  const [gitOpen, setGitOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [projectRef, setProjectRef] = useState<SessionProjectRef | null>(() =>
    hasSessionId ? loadSessionProject(sessionId) : null,
  );
  const [pendingImport, setPendingImport] = useState<ProjectImportResponse | null>(null);
  const [importNotice, setImportNotice] = useState<string | null>(null);
  const [endConfirmOpen, setEndConfirmOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [voiceJoined, setVoiceJoined] = useState(true);
  const [voiceNotice, setVoiceNotice] = useState<string | null>(null);

  const viewportWidth = useViewportWidth();
  const chrome = sessionChromeVisibility(viewportWidth);
  const { leftWidth, rightWidth, bottomHeight, setLeftWidth, setRightWidth, setBottomHeight } =
    useSessionPanelSizes();
  const leftDrag = usePointerDrag('x', leftWidth, setLeftWidth, 1);
  const rightDrag = usePointerDrag('x', rightWidth, setRightWidth, -1);
  const bottomDrag = usePointerDrag('y', bottomHeight, setBottomHeight, 1);

  const meQuery = useMeOptional();
  const collabUserName = meQuery.isSuccess && meQuery.data?.name ? meQuery.data.name : '익명 참가자';
  const collabUser = useMemo(
    () => ({
      name: collabUserName,
    }),
    [collabUserName],
  );
  const updateSession = useUpdateSession();
  const deleteSession = useDeleteSession();

  const { ytext, provider, status: collabStatus } = useCollabSession(
    hasSessionId ? String(sessionId) : 'demo',
    collabUser,
  );

  /** 채팅 · 참여자 · 퀴즈 알림 STOMP. 세션 id 없으면 연결하지 않는다. */
  const chat = useSessionSocket(hasSessionId ? sessionId : null);
  const myUserId = meQuery.data?.id ?? null;

  const leaveDestination = () => {
    // 새 탭으로 연 세션이면 탭을 닫고, 막히면 역할별 홈으로 이동한다.
    window.close();
    const role = meQuery.isSuccess ? meQuery.data?.role : undefined;
    if (role === 'MANAGER' || role === 'MASTER') {
      navigate('/manager/sessions');
    } else {
      navigate('/app');
    }
  };

  const leaveVoiceChannel = () => {
    if (!voiceJoined) {
      setVoiceJoined(true);
      setVoiceNotice('음성 채널에 다시 참여했습니다. (음성 API 연동 전 로컬 상태)');
      return;
    }
    setVoiceJoined(false);
    setVoiceNotice('음성 채널에서 나갔습니다. 세션은 유지됩니다.');
  };

  const applyLanguageFromPath = (path: string) => {
    setEditorLanguage(languageFromPath(path));
  };

  const openFile = async (projectId: number, path: string) => {
    setActiveFile(path);
    applyLanguageFromPath(path);
    try {
      const file = await getProjectFileContent(projectId, path);
      applyContentToYText(ytext, file.content);
    } catch {
      setImportNotice(`파일을 열지 못했습니다: ${path}`);
    }
  };

  const onImported = (result: ProjectImportResponse) => {
    setPendingImport(result);
    setImportNotice(
      result.skippedFiles.length > 0
        ? `${result.fileCount}개 파일 미리보기 · 스킵 ${result.skippedFiles.length}개`
        : `${result.fileCount}개 파일 미리보기 — 적용할지 선택하세요.`,
    );
  };

  const confirmPendingImport = async () => {
    if (!pendingImport || !hasSessionId) return;
    const next = { projectId: pendingImport.projectId, versionHash: pendingImport.versionHash };
    setProjectRef(next);
    saveSessionProject(sessionId, next);
    setPendingImport(null);
    setImportNotice(`${pendingImport.fileCount}개 파일을 세션에 적용했습니다.`);
    try {
      const files = await getProjectFiles(next.projectId);
      const first = [...files].map((f) => f.path).sort((a, b) => a.localeCompare(b))[0];
      if (first) await openFile(next.projectId, first);
    } catch {
      // 목록 실패해도 확정은 유지
    }
  };

  const rejectPendingImport = () => {
    setPendingImport(null);
    setImportNotice('임포트를 취소했습니다. 다시 가져와 주세요.');
  };

  const startReimport = () => {
    setPendingImport(null);
    setProjectRef(null);
    setActiveFile(null);
    if (hasSessionId) clearSessionProject(sessionId);
    setImportNotice(null);
    setLeftTab('explorer');
  };

  const onSelectFile = (path: string) => {
    if (!projectRef) return;
    void openFile(projectRef.projectId, path);
  };

  const onEndSession = () => {
    if (!hasSessionId) return;
    setActionError(null);
    updateSession.mutate(
      { id: sessionId, active: false },
      {
        onSuccess: () => {
          setEndConfirmOpen(false);
          leaveDestination();
        },
        onError: (err) => {
          setActionError(err instanceof Error ? err.message : '세션 종료에 실패했습니다.');
        },
      },
    );
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
    whiteSpace: 'nowrap',
    minWidth: 0,
  });

  const explorerProjectId = pendingImport?.projectId ?? projectRef?.projectId ?? null;
  const languageInOptions = LANGUAGE_OPTIONS.some((o) => o.value === editorLanguage);

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
      <header
        style={{
          height: 56,
          background: 'var(--surface-card)',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          gap: chrome.narrowHeader ? 8 : 14,
          padding: chrome.narrowHeader ? '0 12px' : '0 20px',
          flexShrink: 0,
          minWidth: 0,
        }}
      >
        <Link to="/" style={{ display: 'inline-flex', textDecoration: 'none', flexShrink: 0 }}>
          <img src={logoSrc} alt="Qurie" style={{ height: 28, width: 'auto', objectFit: 'contain', display: 'block' }} />
        </Link>
        <span style={{ width: 1, height: 24, background: 'var(--divider)', flexShrink: 0 }} />
        <div style={{ minWidth: 0, flex: '1 1 auto', overflow: 'hidden' }}>
          {hasSessionId ? (
            <SessionHeaderMeta sessionId={sessionId} hintTitle={titleHint} />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 0 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>세션</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>demo</span>
            </div>
          )}
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {!chrome.narrowHeader ? (
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => {
                  setGitOpen((v) => !v);
                  setSettingsOpen(false);
                }}
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
                  whiteSpace: 'nowrap',
                  lineHeight: 1,
                }}
              >
                <GitBranch size={14} />
                {chrome.compactHeader ? null : 'Git'}
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
          ) : null}
          {!chrome.compactHeader ? (
            <Button variant="accent" icon={<Play size={14} />} style={{ borderRadius: 999 }}>
              실행 및 제출
            </Button>
          ) : !chrome.narrowHeader ? (
            <Button variant="accent" icon={<Play size={14} />} style={{ borderRadius: 999 }}>
              실행
            </Button>
          ) : null}
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => {
                setSettingsOpen((v) => !v);
                setGitOpen(false);
              }}
              title="세션 메뉴"
              style={{
                border: 'none',
                background: 'transparent',
                color: 'var(--text-secondary)',
                display: 'flex',
                cursor: 'pointer',
                padding: 4,
                whiteSpace: 'nowrap',
                lineHeight: 1,
              }}
            >
              <Settings size={16} />
            </button>
            {settingsOpen ? (
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  top: 36,
                  width: 200,
                  background: 'var(--surface-modal)',
                  border: '1px solid var(--border-strong)',
                  borderRadius: 12,
                  boxShadow: 'var(--shadow-modal)',
                  padding: 6,
                  display: 'flex',
                  flexDirection: 'column',
                  zIndex: 8,
                }}
              >
                <MenuAction
                  label="세션 종료"
                  disabled={!hasSessionId || updateSession.isPending}
                  onClick={() => {
                    setSettingsOpen(false);
                    setEndConfirmOpen(true);
                  }}
                />
                <MenuAction
                  label="세션 삭제"
                  danger
                  disabled={!hasSessionId || deleteSession.isPending}
                  onClick={() => {
                    setSettingsOpen(false);
                    setDeleteConfirmOpen(true);
                  }}
                />
                <span style={{ height: 1, background: 'var(--divider)', margin: '4px 6px' }} />
                <MenuAction
                  label="나가기"
                  onClick={() => {
                    setSettingsOpen(false);
                    leaveDestination();
                  }}
                />
              </div>
            ) : null}
          </div>
        </div>
      </header>

      {actionError ? (
        <AlertBanner
          tone="error"
          title="세션 작업 실패"
          description={actionError}
          actionLabel="닫기"
          onAction={() => setActionError(null)}
        />
      ) : null}

      <div style={{ flex: 1, display: 'flex', minHeight: 0, minWidth: 0 }}>
        {chrome.showLeft ? (
          <>
            <aside
              style={{
                width: leftWidth,
                minWidth: leftWidth,
                maxWidth: leftWidth,
                background: 'var(--surface-card)',
                display: 'flex',
                flexDirection: 'column',
                flexShrink: 0,
                minHeight: 0,
                overflow: 'hidden',
              }}
            >
              <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
                <button type="button" style={tabBtn(leftTab === 'explorer')} onClick={() => setLeftTab('explorer')}>
                  탐색기
                </button>
                <button type="button" style={tabBtn(leftTab === 'materials')} onClick={() => setLeftTab('materials')}>
                  강의자료
                </button>
              </div>
              <div
                style={{
                  padding: '14px 12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                  flex: 1,
                  minHeight: 0,
                  overflow: 'auto',
                }}
              >
                {leftTab === 'explorer' ? (
                  <>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0 6px 8px',
                        gap: 8,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          letterSpacing: '0.06em',
                          textTransform: 'uppercase',
                          color: 'var(--text-muted)',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        Workspace
                      </span>
                      <span style={{ display: 'flex', gap: 6, color: 'var(--text-muted)', flexShrink: 0 }}>
                        <button
                          type="button"
                          title="다시 가져오기"
                          onClick={startReimport}
                          disabled={!hasSessionId}
                          style={{
                            border: 'none',
                            background: 'transparent',
                            color: 'var(--text-muted)',
                            padding: 0,
                            cursor: hasSessionId ? 'pointer' : 'not-allowed',
                            display: 'inline-flex',
                            whiteSpace: 'nowrap',
                            lineHeight: 1,
                          }}
                        >
                          <FilePlus size={13} />
                        </button>
                        <button
                          type="button"
                          title="폴더 다시 선택"
                          onClick={startReimport}
                          disabled={!hasSessionId}
                          style={{
                            border: 'none',
                            background: 'transparent',
                            color: 'var(--text-muted)',
                            padding: 0,
                            cursor: hasSessionId ? 'pointer' : 'not-allowed',
                            display: 'inline-flex',
                            whiteSpace: 'nowrap',
                            lineHeight: 1,
                          }}
                        >
                          <FolderPlus size={13} />
                        </button>
                      </span>
                    </div>
                    {!hasSessionId ? (
                      <p style={{ margin: '8px 6px', fontSize: 13, color: 'var(--text-muted)' }}>
                        유효한 세션 ID가 없습니다.
                      </p>
                    ) : pendingImport != null ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minHeight: 0 }}>
                        <p style={{ margin: '0 6px', fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                          이 프로젝트를 세션에 적용할까요?
                        </p>
                        <div style={{ display: 'flex', gap: 8, padding: '0 6px', flexWrap: 'wrap' }}>
                          <Button variant="accent" size="sm" onClick={() => void confirmPendingImport()}>
                            예
                          </Button>
                          <Button variant="secondary" size="sm" onClick={rejectPendingImport}>
                            아니오
                          </Button>
                        </div>
                        <SessionFileExplorer
                          projectId={pendingImport.projectId}
                          activePath={null}
                          onSelect={() => undefined}
                        />
                      </div>
                    ) : projectRef == null ? (
                      <ProjectImportPanel sessionId={sessionId} onImported={onImported} />
                    ) : (
                      <SessionFileExplorer
                        projectId={projectRef.projectId}
                        activePath={activeFile}
                        onSelect={onSelectFile}
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
                  padding: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                  flexShrink: 0,
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
                    padding: '7px 8px 7px 12px',
                    minWidth: 0,
                  }}
                >
                  <span
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      fontSize: 12,
                      fontWeight: 600,
                      color: 'var(--ink)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      minWidth: 0,
                    }}
                  >
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        background: 'var(--status-success)',
                        animation: 'qurie-pulse 1.6s infinite',
                        flexShrink: 0,
                      }}
                    />
                    음성{voiceJoined ? '' : ' · 나감'}
                  </span>
                  <span style={{ marginLeft: 'auto', display: 'flex', gap: 4, flexShrink: 0 }}>
                    <RoundIcon bg="var(--accent)" color="var(--text-inverse)" title="마이크">
                      <Mic size={12} />
                    </RoundIcon>
                    <RoundIcon title="헤드셋">
                      <Headphones size={12} />
                    </RoundIcon>
                    <RoundIcon
                      title={voiceJoined ? '음성 채널 나가기' : '음성 채널 다시 참여'}
                      color="var(--status-error)"
                      onClick={leaveVoiceChannel}
                    >
                      <PhoneOff size={12} />
                    </RoundIcon>
                  </span>
                </div>
                {voiceNotice ? (
                  <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.4 }}>
                    {voiceNotice}
                  </p>
                ) : null}
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    color: 'var(--text-muted)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  접속 중 · {chat.participants.length}명
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 120, overflow: 'auto' }}>
                  {chat.participants.length === 0 ? (
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>아직 접속자가 없습니다.</span>
                  ) : (
                    chat.participants.slice(0, 8).map((p) => (
                      <PresenceRow
                        key={p.userId}
                        color={p.userId === myUserId ? 'var(--status-warning)' : 'var(--accent)'}
                        name={p.userId === myUserId ? `${p.name} (나)` : p.name}
                        badge={p.role !== 'STUDENT' ? p.role : undefined}
                      />
                    ))
                  )}
                </div>
              </div>
            </aside>
            <div
              role="separator"
              aria-orientation="vertical"
              aria-label="탐색기 너비 조절"
              onPointerDown={leftDrag.onPointerDown}
              onPointerMove={leftDrag.onPointerMove}
              onPointerUp={leftDrag.onPointerUp}
              onPointerCancel={leftDrag.onPointerUp}
              style={resizeHandleStyle('vertical', leftDrag.dragging)}
            />
          </>
        ) : null}

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: 0 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              height: 38,
              background: 'var(--surface-card)',
              borderBottom: '1px solid var(--border)',
              padding: '0 12px',
              flexShrink: 0,
              minWidth: 0,
            }}
          >
            <FolderGit2 size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            {!chrome.narrowHeader ? (
              <span style={{ fontSize: 12, color: 'var(--text-secondary)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                workspace
              </span>
            ) : null}
            {!chrome.narrowHeader ? (
              <span style={{ color: 'var(--accent)', fontWeight: 800, fontSize: 10, flexShrink: 0 }}>&gt;</span>
            ) : null}
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--ink)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                minWidth: 0,
              }}
            >
              {activeFile ?? (projectRef ? '파일을 선택하세요' : pendingImport ? '미리보기 중' : '프로젝트 미연결')}
            </span>
            <span style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              <select
                value={editorLanguage}
                onChange={(e) => setEditorLanguage(e.target.value)}
                aria-label="코드 언어 선택"
                style={{
                  height: 26,
                  borderRadius: 6,
                  border: '1px solid var(--border-strong)',
                  background: 'var(--surface-card)',
                  color: 'var(--ink)',
                  fontFamily: 'var(--font-sans)',
                  fontSize: 12,
                  fontWeight: 600,
                  padding: '0 8px',
                  cursor: 'pointer',
                  maxWidth: chrome.narrowHeader ? 110 : 160,
                }}
              >
                {!languageInOptions ? <option value={editorLanguage}>{editorLanguage}</option> : null}
                {LANGUAGE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              {!chrome.narrowHeader ? (
                <span style={{ color: 'var(--text-muted)', display: 'inline-flex' }}>
                  <Maximize2 size={13} />
                </span>
              ) : null}
            </span>
          </div>

          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              minHeight: 0,
              minWidth: 0,
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
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {collabStatus === 'connecting'
                  ? '동기화 서버에 연결 중…'
                  : '연결 끊김 — 변경 사항은 로컬에 보관되며 재연결 시 동기화됩니다.'}
              </div>
            ) : null}
            {provider ? (
              <CollabMonacoEditor ytext={ytext} provider={provider} language={editorLanguage} />
            ) : (
              <div style={{ flex: 1 }} />
            )}
          </div>

          {chrome.showBottom ? (
            <>
              <div
                role="separator"
                aria-orientation="horizontal"
                aria-label="터미널 높이 조절"
                onPointerDown={bottomDrag.onPointerDown}
                onPointerMove={bottomDrag.onPointerMove}
                onPointerUp={bottomDrag.onPointerUp}
                onPointerCancel={bottomDrag.onPointerUp}
                style={resizeHandleStyle('horizontal', bottomDrag.dragging)}
              />
              <div
                style={{
                  height: bottomHeight,
                  minHeight: bottomHeight,
                  maxHeight: bottomHeight,
                  background: 'var(--surface-card)',
                  display: 'flex',
                  flexDirection: 'column',
                  flexShrink: 0,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '0 12px',
                    height: 36,
                    borderBottom: '1px solid var(--divider)',
                    overflow: 'auto',
                    flexShrink: 0,
                  }}
                >
                  <BottomTabButton
                    active={bottomTab === 'terminal'}
                    onClick={() => setBottomTab('terminal')}
                    icon={<Terminal size={13} />}
                  >
                    터미널
                  </BottomTabButton>
                  <button
                    type="button"
                    onClick={() => setBottomTab('debug')}
                    style={{
                      fontSize: 12,
                      color: bottomTab === 'debug' ? 'var(--ink)' : 'var(--text-muted)',
                      border: 'none',
                      background: 'none',
                      cursor: 'pointer',
                      fontFamily: 'var(--font-sans)',
                      whiteSpace: 'nowrap',
                      lineHeight: 1,
                    }}
                  >
                    디버그
                  </button>
                  <button
                    type="button"
                    onClick={() => setBottomTab('output')}
                    style={{
                      fontSize: 12,
                      color: bottomTab === 'output' ? 'var(--ink)' : 'var(--text-muted)',
                      border: 'none',
                      background: 'none',
                      cursor: 'pointer',
                      fontFamily: 'var(--font-sans)',
                      whiteSpace: 'nowrap',
                      lineHeight: 1,
                    }}
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
                    overflow: 'auto',
                    minHeight: 0,
                  }}
                >
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>ready</span> · project{' '}
                    {explorerProjectId != null ? `#${explorerProjectId}` : '—'}
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </div>

        {chrome.showRight ? (
          <>
            <div
              role="separator"
              aria-orientation="vertical"
              aria-label="사이드 패널 너비 조절"
              onPointerDown={rightDrag.onPointerDown}
              onPointerMove={rightDrag.onPointerMove}
              onPointerUp={rightDrag.onPointerUp}
              onPointerCancel={rightDrag.onPointerUp}
              style={resizeHandleStyle('vertical', rightDrag.dragging)}
            />
            <aside
              style={{
                width: rightWidth,
                minWidth: rightWidth,
                maxWidth: rightWidth,
                background: 'var(--surface-card)',
                display: 'flex',
                flexDirection: 'column',
                flexShrink: 0,
                minHeight: 0,
                overflow: 'hidden',
              }}
            >
              <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
                <button
                  type="button"
                  style={tabBtn(rightTab === 'community')}
                  onClick={() => setRightTab('community')}
                >
                  커뮤니티
                </button>
                <button type="button" style={tabBtn(rightTab === 'quiz')} onClick={() => setRightTab('quiz')}>
                  퀴즈
                </button>
              </div>
              {rightTab === 'community' ? (
                <SessionChatPanel chat={chat} hasSessionId={hasSessionId} />
              ) : (
                <SessionQuizPanel
                  projectId={projectRef?.projectId ?? null}
                  versionHash={projectRef?.versionHash ?? null}
                  pushedQuizSetId={chat.lastQuizNotification?.quizSetId ?? null}
                />
              )}
            </aside>
          </>
        ) : null}
      </div>

      <footer
        style={{
          height: 30,
          background: 'var(--surface-card)',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '0 12px',
          fontSize: 11,
          color: 'var(--text-muted)',
          flexShrink: 0,
          minWidth: 0,
          overflow: 'hidden',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap', flexShrink: 0 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--status-success)' }} />
          Connected
        </span>
        {!chrome.narrowHeader ? (
          <span style={{ display: 'flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }}>
            <GitBranch size={11} />
            CRDT · {projectRef ? `#${projectRef.projectId}` : '—'}
          </span>
        ) : null}
        <span style={{ marginLeft: 'auto', display: 'flex', gap: 12, fontFamily: 'var(--font-mono)', fontSize: 11, flexShrink: 0 }}>
          <span style={{ color: 'var(--accent)', whiteSpace: 'nowrap' }}>{editorLanguage}</span>
        </span>
      </footer>

      <Modal
        open={endConfirmOpen}
        title="세션 종료"
        description="세션을 종료하면 참가자가 더 이상 입장할 수 없습니다. 종료할까요?"
        primaryLabel={updateSession.isPending ? '종료 중…' : '종료'}
        secondaryLabel="취소"
        onPrimary={onEndSession}
        onSecondary={() => setEndConfirmOpen(false)}
        onClose={() => setEndConfirmOpen(false)}
        width={420}
      />

      {hasSessionId ? (
        <SessionDeleteGate
          sessionId={sessionId}
          open={deleteConfirmOpen}
          onClose={() => setDeleteConfirmOpen(false)}
          onError={setActionError}
          onDeleted={leaveDestination}
        />
      ) : null}
    </div>
  );
}

/** 삭제에 classId가 필요해 세션 detail을 읽은 뒤 ConfirmDeleteOverlay를 연다. */
function SessionDeleteGate({
  sessionId,
  open,
  onClose,
  onError,
  onDeleted,
}: {
  sessionId: number;
  open: boolean;
  onClose: () => void;
  onError: (msg: string) => void;
  onDeleted: () => void;
}) {
  if (!open) return null;
  return (
    <QueryAsyncBoundary
      suspenseFallback={null}
      errorFallback={
        <ConfirmDeleteOverlay
          open
          title="세션 삭제"
          description="세션 정보를 불러오지 못했습니다. 그래도 삭제할까요?"
          confirmText="삭제"
          onClose={onClose}
          onConfirm={() => onError('세션 정보를 불러올 수 없어 삭제할 수 없습니다.')}
        />
      }
    >
      <SessionDeleteConfirm sessionId={sessionId} onClose={onClose} onError={onError} onDeleted={onDeleted} />
    </QueryAsyncBoundary>
  );
}

function SessionDeleteConfirm({
  sessionId,
  onClose,
  onError,
  onDeleted,
}: {
  sessionId: number;
  onClose: () => void;
  onError: (msg: string) => void;
  onDeleted: () => void;
}) {
  const { data: session } = useGetSession(sessionId);
  const deleteSession = useDeleteSession();

  return (
    <ConfirmDeleteOverlay
      open
      title="세션 삭제"
      description={
        <>
          이 작업은 되돌릴 수 없습니다.
          <br />
          세션 `<code>{session.title}</code>` 을(를) 삭제합니다.
        </>
      }
      confirmText={session.title}
      onClose={onClose}
      onConfirm={() => {
        deleteSession.mutate(
          { id: session.id, classId: session.classId },
          {
            onSuccess: () => {
              clearSessionProject(sessionId);
              onDeleted();
            },
            onError: (err) => {
              onError(err instanceof Error ? err.message : '세션 삭제에 실패했습니다.');
            },
          },
        );
      }}
    />
  );
}

function MenuAction({
  label,
  onClick,
  danger,
  disabled,
}: {
  label: string;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '8px 10px',
        borderRadius: 8,
        fontSize: 12.5,
        fontWeight: 600,
        color: danger ? 'var(--status-error)' : 'var(--ink)',
        background: 'transparent',
        border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontFamily: 'var(--font-sans)',
        textAlign: 'left',
        opacity: disabled ? 0.5 : 1,
        whiteSpace: 'nowrap',
        lineHeight: 1,
      }}
    >
      {label}
    </button>
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
        <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)' }}>
          {hint}
        </span>
      ) : null}
    </span>
  );
}

function PresenceRow({
  color,
  name,
  badge,
}: {
  color: string;
  name: string;
  badge?: string;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
      <span
        style={{
          fontSize: 12.5,
          fontWeight: name.includes('(나)') ? 600 : 400,
          color: 'var(--ink)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          minWidth: 0,
        }}
      >
        {name}{' '}
        {badge ? <span style={{ fontSize: 10, color: 'var(--accent)', fontWeight: 600 }}>{badge}</span> : null}
      </span>
    </div>
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
        whiteSpace: 'nowrap',
        lineHeight: 1,
        flexShrink: 0,
      }}
    >
      {icon}
      {children}
    </button>
  );
}
