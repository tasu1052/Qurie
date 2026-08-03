import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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
  MicOff,
  MoreVertical,
  PhoneOff,
  Phone,
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
  useGetSessionProject,
  useMeOptional,
  useSessionSocket,
  useSessionVoice,
  useUpdateSession,
  type ProjectImportResponse,
  type ProjectResponse,
} from '../../data';
import { queryKeys } from '../../network/core/queryKeys';
import { getGroupDetail } from '../../network/group/group-apis';
import { getSession } from '../../network/session/session-apis';
import { ConfirmDeleteOverlay } from '../../components/overlays/ConfirmDeleteOverlay';
import { ProjectImportPanel } from '../../components/session/ProjectImportPanel';
import { SessionChatPanel } from '../../components/session/SessionChatPanel';
import { SessionFileExplorer } from '../../components/session/SessionFileExplorer';
import { SessionQuizPanel } from '../../components/session/SessionQuizPanel';
import { languageFromPath } from '../../components/session/readLocalProjectFiles';
import {
  clearSessionProject,
  loadSessionActiveFile,
  loadSessionProject,
  loadSessionTitle,
  saveSessionActiveFile,
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

/** 공유 Y.Text 가 비어 있을 때만 DB 스냅샷을 넣는다. 이미 원격 편집이 있으면 덮지 않는다. */
function seedYTextIfEmpty(ytext: Y.Text, content: string): boolean {
  if (ytext.length > 0) return false;
  if (content.length === 0) return true;
  ytext.doc?.transact(() => {
    ytext.insert(0, content);
  });
  return true;
}

/** 임포트 확정 등 의도적으로 문서를 갈아끼울 때만 쓴다. */
function replaceYText(ytext: Y.Text, content: string) {
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

  const initialActiveFile = hasSessionId ? loadSessionActiveFile(sessionId) : null;
  const [leftTab, setLeftTab] = useState<LeftTab>('explorer');
  const [rightTab, setRightTab] = useState<RightTab>(initialRight);
  const [bottomTab, setBottomTab] = useState<BottomTab>('terminal');
  const [editorLanguage, setEditorLanguage] = useState<string>(() =>
    initialActiveFile ? languageFromPath(initialActiveFile) : 'typescript',
  );
  const [gitOpen, setGitOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [activeFile, setActiveFile] = useState<string | null>(initialActiveFile);
  /** 리더가 다시 가져오기 중일 때만 true — 서버 프로젝트가 있어도 ImportPanel 을 연다. */
  const [reimportMode, setReimportMode] = useState(false);
  const hydratedActiveFileRef = useRef(false);
  const [pendingImport, setPendingImport] = useState<ProjectImportResponse | null>(null);
  const [importNotice, setImportNotice] = useState<string | null>(null);
  const [endConfirmOpen, setEndConfirmOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const viewportWidth = useViewportWidth();
  const chrome = sessionChromeVisibility(viewportWidth);
  const { leftWidth, rightWidth, bottomHeight, setLeftWidth, setRightWidth, setBottomHeight } =
    useSessionPanelSizes();
  const leftDrag = usePointerDrag('x', leftWidth, setLeftWidth, 1);
  const rightDrag = usePointerDrag('x', rightWidth, setRightWidth, -1);
  const bottomDrag = usePointerDrag('y', bottomHeight, setBottomHeight, 1);

  const meQuery = useMeOptional();
  const myUserId = meQuery.data?.id ?? null;
  const collabUserName = meQuery.isSuccess && meQuery.data?.name ? meQuery.data.name : '익명 참가자';
  const collabUserId = meQuery.isSuccess ? meQuery.data?.id ?? null : null;
  const collabUser = useMemo(
    () => ({
      name: collabUserName,
      id: collabUserId,
    }),
    [collabUserName, collabUserId],
  );
  const updateSession = useUpdateSession();
  const deleteSession = useDeleteSession();
  const queryClient = useQueryClient();
  const sessionProjectQuery = useGetSessionProject(hasSessionId ? sessionId : null);
  const sessionMetaQuery = useQuery({
    queryKey: hasSessionId ? queryKeys.sessions.detail(sessionId) : ['sessions', 'detail', 'idle'],
    queryFn: () => getSession(sessionId),
    enabled: hasSessionId,
  });
  const groupId = sessionMetaQuery.data?.groupId ?? null;
  const groupDetailQuery = useQuery({
    queryKey: groupId != null ? queryKeys.groups.detailFull(groupId) : ['groups', 'detailFull', 'idle'],
    queryFn: () => getGroupDetail(groupId as number),
    enabled: groupId != null,
  });

  const canImportProject = useMemo(() => {
    const role = meQuery.data?.role;
    if (role === 'MANAGER') return true;
    if (groupId == null || myUserId == null) return false;
    return (
      groupDetailQuery.data?.members.some(
        (m) => m.userId === myUserId && m.role === 'LEADER',
      ) ?? false
    );
  }, [meQuery.data?.role, groupId, groupDetailQuery.data?.members, myUserId]);

  const importRolePending =
    meQuery.data?.role !== 'MANAGER' &&
    groupId != null &&
    !groupDetailQuery.data &&
    (groupDetailQuery.isPending || groupDetailQuery.isFetching);

  const { ytext, provider, status: collabStatus, synced: collabSynced } = useCollabSession(
    hasSessionId ? String(sessionId) : 'demo',
    collabUser,
  );

  /**
   * 트리 바인딩의 단일 소스: GET /projects/current (폴링·STOMP).
   * sessionStorage 는 첫 페치 전 깜빡임 완화용 fallback 만 쓴다.
   */
  const projectRef = useMemo<SessionProjectRef | null>(() => {
    if (reimportMode) return null;
    const remote = sessionProjectQuery.data;
    if (remote != null) {
      return {
        projectId: remote.id,
        versionHash: remote.versionHash ?? '',
      };
    }
    if (sessionProjectQuery.isFetching || sessionProjectQuery.isPending) {
      return hasSessionId ? loadSessionProject(sessionId) : null;
    }
    return null;
  }, [
    reimportMode,
    sessionProjectQuery.data,
    sessionProjectQuery.isFetching,
    sessionProjectQuery.isPending,
    hasSessionId,
    sessionId,
  ]);

  useEffect(() => {
    if (!hasSessionId) return;
    const remote = sessionProjectQuery.data;
    if (remote == null) return;
    saveSessionProject(sessionId, {
      projectId: remote.id,
      versionHash: remote.versionHash ?? '',
    });
  }, [hasSessionId, sessionId, sessionProjectQuery.data]);

  /** 채팅 · 참여자 · 퀴즈 · 프로젝트 · 음성 채널 STOMP. 세션 id 없으면 연결하지 않는다. */
  const chat = useSessionSocket(hasSessionId ? sessionId : null, {
    myUserId,
    autoJoinVoice: false,
  });
  const onlineUserIds = useMemo(
    () => chat.participants.map((p) => p.userId),
    [chat.participants],
  );
  const voiceJoined = chat.voiceJoined;
  const myVoice = chat.myVoice;

  const voiceRtc = useSessionVoice({
    enabled: voiceJoined,
    myUserId,
    peers: chat.voiceParticipants,
    micMuted: myVoice?.micMuted ?? false,
    deafened: myVoice?.deafened ?? false,
    sendSignal: chat.sendVoiceSignal,
    signalQueueRef: chat.voiceSignalQueueRef,
    signalTick: chat.voiceSignalTick,
  });

  const leaveVoice = chat.leaveVoice;

  /** 마이크 권한 거부 시 채널에서 나가 유령 참여자로 남지 않게 한다. */
  useEffect(() => {
    if (voiceRtc.status !== 'error' || !voiceJoined) return;
    leaveVoice();
  }, [voiceRtc.status, voiceJoined, leaveVoice]);

  const leaveDestination = () => {
    // 퇴장 직전 커서 awareness를 비워 다른 참가자 화면에 잔상이 남지 않게 한다.
    try {
      provider?.awareness.setLocalState(null);
    } catch {
      // ignore
    }
    // 새 탭으로 연 세션이면 탭을 닫고, 막히면 역할별 홈으로 이동한다.
    window.close();
    const role = meQuery.isSuccess ? meQuery.data?.role : undefined;
    if (role === 'MANAGER' || role === 'MASTER') {
      navigate('/manager/sessions');
    } else {
      navigate('/app');
    }
  };

  const toggleVoiceChannel = () => {
    if (voiceJoined) {
      chat.leaveVoice();
    } else {
      chat.joinVoice();
    }
  };

  const applyLanguageFromPath = (path: string) => {
    setEditorLanguage(languageFromPath(path));
  };

  const openFile = async (
    projectId: number,
    path: string,
    options?: { replaceSharedDoc?: boolean },
  ) => {
    setActiveFile(path);
    applyLanguageFromPath(path);
    if (hasSessionId) saveSessionActiveFile(sessionId, path);
    try {
      const file = await getProjectFileContent(projectId, path);
      if (options?.replaceSharedDoc) {
        replaceYText(ytext, file.content);
      } else {
        // 방에 이미 편집본이 있으면 DB 원본으로 덮지 않는다 (새로고침 hydrate 포함).
        seedYTextIfEmpty(ytext, file.content);
      }
    } catch {
      setImportNotice(`파일을 열지 못했습니다: ${path}`);
    }
  };

  /**
   * 새로고침 후 활성 파일·확장자 언어를 복구한다.
   * provider sync 이후에만 시딩해, 아직 방에 있는 사람들의 실시간 편집을 롤백하지 않는다.
   */
  useEffect(() => {
    if (!hasSessionId || !projectRef || !collabSynced || hydratedActiveFileRef.current) return;
    hydratedActiveFileRef.current = true;
    const path = activeFile ?? loadSessionActiveFile(sessionId);
    if (!path) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot restore of last active file
    void openFile(projectRef.projectId, path);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sync 완료 후 1회만
  }, [hasSessionId, sessionId, projectRef?.projectId, collabSynced]);

  const onImported = (result: ProjectImportResponse) => {
    setPendingImport(result);
    setImportNotice(null);
  };

  const confirmPendingImport = async () => {
    if (!pendingImport || !hasSessionId) return;
    const next = { projectId: pendingImport.projectId, versionHash: pendingImport.versionHash };
    const cached: ProjectResponse = {
      id: pendingImport.projectId,
      sessionId,
      path: null,
      importedBy: myUserId ?? 0,
      versionHash: pendingImport.versionHash,
      fileCount: pendingImport.fileCount,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    queryClient.setQueryData(queryKeys.projects.bySession(sessionId), cached);
    void queryClient.invalidateQueries({ queryKey: queryKeys.projects.files(next.projectId) });
    saveSessionProject(sessionId, next);
    setReimportMode(false);
    setPendingImport(null);
    setImportNotice(`${pendingImport.fileCount}개 파일을 세션에 적용했습니다.`);
    try {
      const files = await getProjectFiles(next.projectId);
      const first = [...files].map((f) => f.path).sort((a, b) => a.localeCompare(b))[0];
      if (first) await openFile(next.projectId, first, { replaceSharedDoc: true });
    } catch {
      // 목록 실패해도 확정은 유지
    }
  };

  const rejectPendingImport = () => {
    setPendingImport(null);
    setImportNotice('임포트를 취소했습니다. 다시 가져와 주세요.');
  };

  const startReimport = () => {
    if (!canImportProject) return;
    setPendingImport(null);
    setReimportMode(true);
    setActiveFile(null);
    hydratedActiveFileRef.current = false;
    if (hasSessionId) clearSessionProject(sessionId);
    setImportNotice(null);
    setLeftTab('explorer');
  };

  const cancelReimport = () => {
    setReimportMode(false);
    setPendingImport(null);
    setImportNotice(null);
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

  const toggleBrowserFullscreen = () => {
    if (!document.fullscreenElement) {
      void document.documentElement.requestFullscreen?.();
    } else {
      void document.exitFullscreen?.();
    }
  };

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
      {voiceRtc.error ? (
        <AlertBanner
          tone="error"
          title="음성 채널"
          description={voiceRtc.error}
          actionLabel="닫기"
          onAction={() => voiceRtc.dismissError()}
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
                        {canImportProject ? (
                          <>
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
                          </>
                        ) : null}
                      </span>
                    </div>
                    {!hasSessionId ? (
                      <p style={{ margin: '8px 6px', fontSize: 13, color: 'var(--text-muted)' }}>
                        유효한 세션 ID가 없습니다.
                      </p>
                    ) : pendingImport != null ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minHeight: 0 }}>
                        <p style={{ margin: '0 6px', fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                          미리보기 — 적용 여부는 확인 창에서 선택하세요.
                        </p>
                        <SessionFileExplorer
                          projectId={pendingImport.projectId}
                          activePath={null}
                          onSelect={() => undefined}
                        />
                      </div>
                    ) : projectRef == null ? (
                      !sessionProjectQuery.isFetched || importRolePending ? (
                        <p style={{ margin: '8px 6px', fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                          프로젝트 정보를 불러오는 중…
                        </p>
                      ) : canImportProject ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minHeight: 0 }}>
                          {reimportMode && sessionProjectQuery.data != null ? (
                            <div style={{ padding: '0 6px', display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                              <p style={{ margin: 0, fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                                새 프로젝트를 가져오면 세션 작업 대상이 바뀝니다.
                              </p>
                              <button
                                type="button"
                                onClick={cancelReimport}
                                style={{
                                  border: 'none',
                                  background: 'transparent',
                                  color: 'var(--text-muted)',
                                  fontSize: 12,
                                  cursor: 'pointer',
                                  whiteSpace: 'nowrap',
                                  padding: 0,
                                }}
                              >
                                취소
                              </button>
                            </div>
                          ) : null}
                          <ProjectImportPanel sessionId={sessionId} onImported={onImported} />
                        </div>
                      ) : (
                        <p style={{ margin: '8px 6px', fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                          그룹 리더가 프로젝트를 가져올 때까지 기다려 주세요.
                        </p>
                      )
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
                        background: voiceJoined ? 'var(--status-success)' : 'var(--text-muted)',
                        animation: voiceJoined ? 'qurie-pulse 1.6s infinite' : 'none',
                        flexShrink: 0,
                      }}
                    />
                    음성
                    {voiceJoined
                      ? voiceRtc.status === 'starting'
                        ? ' · 연결 중'
                        : voiceRtc.status === 'live'
                          ? ` · ${chat.voiceParticipants.length}명`
                          : ` · ${chat.voiceParticipants.length}명`
                      : ' · 나감'}
                  </span>
                  <span style={{ marginLeft: 'auto', display: 'flex', gap: 4, flexShrink: 0 }}>
                    <RoundIcon
                      bg={
                        voiceJoined && !myVoice?.micMuted
                          ? 'var(--accent)'
                          : 'var(--surface-card)'
                      }
                      color={
                        voiceJoined && !myVoice?.micMuted
                          ? 'var(--text-inverse)'
                          : myVoice?.micMuted
                            ? 'var(--status-error)'
                            : 'var(--text-secondary)'
                      }
                      title={
                        !voiceJoined
                          ? '음성 채널 참여 후 마이크를 사용할 수 있습니다'
                          : myVoice?.micMuted
                            ? '마이크 켜기'
                            : '마이크 끄기'
                      }
                      onClick={() => {
                        if (voiceJoined) chat.toggleMic();
                      }}
                    >
                      {myVoice?.micMuted ? <MicOff size={12} /> : <Mic size={12} />}
                    </RoundIcon>
                    <RoundIcon
                      bg={
                        voiceJoined && myVoice?.deafened
                          ? 'var(--status-error)'
                          : 'var(--surface-card)'
                      }
                      color={
                        voiceJoined && myVoice?.deafened
                          ? 'var(--text-inverse)'
                          : 'var(--text-secondary)'
                      }
                      title={
                        !voiceJoined
                          ? '음성 채널 참여 후 헤드셋을 사용할 수 있습니다'
                          : myVoice?.deafened
                            ? '헤드셋 켜기'
                            : '헤드셋 끄기(청취 차단)'
                      }
                      onClick={() => {
                        if (voiceJoined) chat.toggleDeafened();
                      }}
                    >
                      <Headphones size={12} />
                    </RoundIcon>
                    <RoundIcon
                      title={voiceJoined ? '음성 채널 나가기' : '음성 채널 참여'}
                      color={voiceJoined ? 'var(--status-error)' : 'var(--status-success)'}
                      onClick={toggleVoiceChannel}
                    >
                      {voiceJoined ? <PhoneOff size={12} /> : <Phone size={12} />}
                    </RoundIcon>
                  </span>
                </div>
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
                  음성 채널 · {chat.voiceParticipants.length}명
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 100, overflow: 'auto' }}>
                  {chat.voiceParticipants.length === 0 ? (
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      음성 채널에 아무도 없습니다.
                    </span>
                  ) : (
                    chat.voiceParticipants.map((p) => (
                      <PresenceRow
                        key={`voice-${p.userId}`}
                        color={p.userId === myUserId ? 'var(--status-warning)' : 'var(--accent)'}
                        name={p.userId === myUserId ? `${p.name} (나)` : p.name}
                        badge={[
                          p.micMuted ? '음소거' : null,
                          p.deafened ? '청취차단' : null,
                          p.role !== 'STUDENT' ? p.role : null,
                        ]
                          .filter(Boolean)
                          .join(' · ') || undefined}
                      />
                    ))
                  )}
                </div>
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
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  fontFamily: 'var(--font-mono)',
                }}
                title="파일 확장자로 감지한 언어"
              >
                {editorLanguage}
              </span>
              <button
                type="button"
                title="전체화면"
                aria-label="브라우저 전체화면"
                onClick={toggleBrowserFullscreen}
                style={{
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  padding: 4,
                }}
              >
                <Maximize2 size={13} />
              </button>
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
              <CollabMonacoEditor
                ytext={ytext}
                provider={provider}
                language={editorLanguage}
                onlineUserIds={onlineUserIds}
              />
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
                  sessionId={sessionId}
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

      <Modal
        open={pendingImport != null}
        title="프로젝트 적용"
        description={
          pendingImport
            ? pendingImport.skippedFiles.length > 0
              ? `${pendingImport.fileCount}개 파일을 이 세션에 적용할까요? (스킵 ${pendingImport.skippedFiles.length}개)`
              : `${pendingImport.fileCount}개 파일을 이 세션에 적용할까요?`
            : undefined
        }
        primaryLabel="적용"
        secondaryLabel="취소"
        onPrimary={() => void confirmPendingImport()}
        onSecondary={rejectPendingImport}
        onClose={rejectPendingImport}
        width={520}
      >
        {pendingImport ? (
          <div
            style={{
              maxHeight: 280,
              overflow: 'auto',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              background: 'var(--surface-sunken)',
              minHeight: 120,
            }}
          >
            <SessionFileExplorer
              projectId={pendingImport.projectId}
              activePath={null}
              onSelect={() => undefined}
            />
          </div>
        ) : null}
      </Modal>

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
