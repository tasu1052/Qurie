import { useEffect, useMemo, useRef, useState, useCallback, type CSSProperties, type ReactNode } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  FileCode,
  FilePlus,
  FolderPlus,
  HandHelping,
  Headphones,
  Maximize2,
  Mic,
  MicOff,
  PhoneOff,
  Phone,
  Settings,
} from 'lucide-react';
import { AlertBanner, Button, LiveBadge, Modal } from '../../ds';
import logoSrc from '../../ds/assets/logo.png';
import { CollabMonacoEditor } from '../../collab/CollabMonacoEditor';
import { useCollabSession } from '../../collab/useCollabSession';
import { getOrCreateFileYText } from '../../collab/fileYText';
import {
  getProjectFileContent,
  getProjectFiles,
  useAskSessionHelp,
  useCreateSessionReport,
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
import { getSession, getSessionReport } from '../../network/session/session-apis';
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
  type SessionMobileView,
} from '../../components/session/sessionPanelLayout';
import { SessionBottomNav } from '../../components/session/SessionBottomNav';
import type * as Y from 'yjs';

type LeftTab = 'explorer';
type RightTab = 'community' | 'quiz';

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
  const [editorLanguage, setEditorLanguage] = useState<string>(() =>
    initialActiveFile ? languageFromPath(initialActiveFile) : 'plaintext',
  );
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [mobileView, setMobileView] = useState<SessionMobileView>('editor');
  const [activeFile, setActiveFile] = useState<string | null>(initialActiveFile);
  /** 리더가 다시 가져오기 중일 때만 true — 서버 프로젝트가 있어도 ImportPanel 을 연다. */
  const [reimportMode, setReimportMode] = useState(false);
  const [importAutoOpen, setImportAutoOpen] = useState<'file' | 'folder' | null>(null);
  const [activeFileReady, setActiveFileReady] = useState(false);
  const hydratedActiveFileRef = useRef(false);
  const [pendingImport, setPendingImport] = useState<ProjectImportResponse | null>(null);
  const [importNotice, setImportNotice] = useState<string | null>(null);
  const [endConfirmOpen, setEndConfirmOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [helpNotice, setHelpNotice] = useState<string | null>(null);

  const viewportWidth = useViewportWidth();
  const chrome = sessionChromeVisibility(viewportWidth);
  const { leftWidth, rightWidth, setLeftWidth, setRightWidth } = useSessionPanelSizes();
  const leftDrag = usePointerDrag('x', leftWidth, setLeftWidth, 1);
  const rightDrag = usePointerDrag('x', rightWidth, setRightWidth, -1);

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
  const askHelp = useAskSessionHelp();
  const createReport = useCreateSessionReport();
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

  const isGroupLeader = useMemo(() => {
    if (meQuery.data?.role === 'MANAGER' || meQuery.data?.role === 'MASTER') return false;
    if (groupId == null || myUserId == null) return false;
    return (
      groupDetailQuery.data?.members.some(
        (m) => m.userId === myUserId && m.role === 'LEADER',
      ) ?? false
    );
  }, [meQuery.data?.role, groupId, groupDetailQuery.data?.members, myUserId]);

  const isSessionManager =
    meQuery.data?.role === 'MANAGER' || meQuery.data?.role === 'MASTER';

  const canGenerateQuiz = isSessionManager || isGroupLeader;

  const onAskHelp = () => {
    if (!hasSessionId) return;
    askHelp.mutate(sessionId, {
      onSuccess: () => {
        setHelpNotice('강사님께 질문을 보냈어요. 곧 세션으로 오실 거예요.');
      },
      onError: () => {
        setActionError('질문 요청에 실패했습니다. 잠시 후 다시 시도해 주세요.');
      },
    });
  };

  const importRolePending =
    meQuery.data?.role !== 'MANAGER' &&
    groupId != null &&
    !groupDetailQuery.data &&
    (groupDetailQuery.isPending || groupDetailQuery.isFetching);

  const { ydoc, provider, status: collabStatus, synced: collabSynced } = useCollabSession(
    hasSessionId ? String(sessionId) : 'demo',
    collabUser,
  );

  const editorYText = useMemo(() => {
    if (!activeFile) return null;
    return getOrCreateFileYText(ydoc, activeFile);
  }, [ydoc, activeFile]);

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

  useEffect(() => {
    if (!importNotice) return;
    const timer = window.setTimeout(() => setImportNotice(null), 6000);
    return () => window.clearTimeout(timer);
  }, [importNotice]);

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
    setActiveFileReady(false);
    setActiveFile(path);
    applyLanguageFromPath(path);
    if (hasSessionId) saveSessionActiveFile(sessionId, path);
    try {
      const file = await getProjectFileContent(projectId, path);
      const fileYText = getOrCreateFileYText(ydoc, path);
      if (options?.replaceSharedDoc) {
        replaceYText(fileYText, file.content);
      } else {
        seedYTextIfEmpty(fileYText, file.content);
      }
      setActiveFileReady(true);
    } catch {
      setImportNotice(`파일을 열지 못했습니다: ${path}`);
      const fileYText = getOrCreateFileYText(ydoc, path);
      setActiveFileReady(fileYText.length > 0);
    }
  };

  /**
   * 새로고침·첫 입장 후 활성 파일·확장자 언어를 복구한다.
   * provider sync 이후에만 시딩해, 아직 방에 있는 사람들의 실시간 편집을 롤백하지 않는다.
   * 저장된 파일이 없으면 목록의 첫 파일을 열고 확장자로 언어를 맞춘다.
   */
  useEffect(() => {
    if (!hasSessionId || !projectRef || !collabSynced || hydratedActiveFileRef.current) return;
    hydratedActiveFileRef.current = true;
    const path = activeFile ?? loadSessionActiveFile(sessionId);
    const projectId = projectRef.projectId;
    // openFile 의 setState 가 effect 본문에서 동기 실행되지 않도록 microtask 로 미룬다.
    void (async () => {
      if (path) {
        await openFile(projectId, path);
        return;
      }
      try {
        const files = await getProjectFiles(projectId);
        const first = [...files].map((f) => f.path).sort((a, b) => a.localeCompare(b))[0];
        if (first) await openFile(projectId, first);
      } catch {
        // 목록 실패해도 세션은 유지
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sync 완료 후 1회만
  }, [hasSessionId, sessionId, projectRef?.projectId, collabSynced]);

  const clearImportAutoOpen = useCallback(() => setImportAutoOpen(null), []);

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

  const startReimport = (picker?: 'file' | 'folder') => {
    if (!canImportProject) return;
    setPendingImport(null);
    setReimportMode(true);
    setActiveFile(null);
    setActiveFileReady(false);
    hydratedActiveFileRef.current = false;
    if (hasSessionId) clearSessionProject(sessionId);
    setImportNotice(null);
    setImportAutoOpen(picker ?? null);
    setLeftTab('explorer');
    if (chrome.stacked) setMobileView('explorer');
  };

  const cancelReimport = () => {
    setReimportMode(false);
    setPendingImport(null);
    setImportNotice(null);
    setImportAutoOpen(null);
  };

  const onSelectFile = (path: string) => {
    if (!projectRef) return;
    void openFile(projectRef.projectId, path);
    if (chrome.stacked) setMobileView('editor');
  };

  const showExplorerPanel =
    (!chrome.stacked && chrome.showLeft) || (chrome.stacked && mobileView === 'explorer');
  const editorVisible = !chrome.stacked || mobileView === 'editor';
  const showRightPanel =
    (!chrome.stacked && chrome.showRight) ||
    (chrome.stacked && (mobileView === 'community' || mobileView === 'quiz'));

  const onEndSession = () => {
    if (!hasSessionId) return;
    setActionError(null);
    updateSession.mutate(
      { id: sessionId, active: false },
      {
        onSuccess: () => {
          setEndConfirmOpen(false);
          queryClient.invalidateQueries({ queryKey: queryKeys.sessions.all });
          if (sessionMetaQuery.data?.classId != null) {
            queryClient.invalidateQueries({
              queryKey: queryKeys.sessions.list(sessionMetaQuery.data.classId),
            });
          }
          leaveDestination();
        },
        onError: (err) => {
          setActionError(err instanceof Error ? err.message : '세션 종료에 실패했습니다.');
        },
      },
    );
  };

  const onCreateReport = () => {
    if (!hasSessionId) return;
    setActionError(null);
    void (async () => {
      try {
        await getSessionReport(sessionId);
        navigate(`/session/${sessionId}/report`);
        return;
      } catch {
        // 리포트 없음 — 생성 후 이동
      }
      const students = chat.participants.filter((p) => p.role === 'STUDENT');
      if (students.length === 0) {
        setActionError('리포트를 생성할 학생이 없습니다.');
        return;
      }
      const target = students[0];
      createReport.mutate(
        { sessionId, ordinaryUserId: target.userId },
        {
          onSuccess: () => {
            navigate(`/session/${sessionId}/report?userId=${target.userId}`);
          },
          onError: (err) => {
            setActionError(err instanceof Error ? err.message : '리포트 생성에 실패했습니다.');
          },
        },
      );
    })();
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
        height: chrome.stacked ? '100dvh' : '100vh',
        maxHeight: chrome.stacked ? '100dvh' : '100vh',
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
          {isSessionManager && hasSessionId && !chrome.narrowHeader ? (
            <Button
              variant="secondary"
              style={{ borderRadius: 999 }}
              disabled={createReport.isPending}
              onClick={onCreateReport}
            >
              {createReport.isPending ? '생성 중…' : chrome.compactHeader ? '리포트' : '리포트 생성'}
            </Button>
          ) : null}
          {!chrome.narrowHeader ? (
            <span title="강사님을 호출하는 기능이에요." style={{ display: 'inline-flex' }}>
              <Button
                variant="accent"
                icon={<HandHelping size={14} />}
                style={{ borderRadius: 999 }}
                disabled={!hasSessionId || askHelp.isPending}
                onClick={onAskHelp}
              >
                {chrome.compactHeader ? '질문' : '질문하기'}
              </Button>
            </span>
          ) : null}
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => {
                setSettingsOpen((v) => !v);
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
                {isSessionManager ? (
                  <>
                    <MenuAction
                      label="세션 종료"
                      disabled={!hasSessionId || updateSession.isPending}
                      onClick={() => {
                        setSettingsOpen(false);
                        setEndConfirmOpen(true);
                      }}
                    />
                    <span style={{ height: 1, background: 'var(--divider)', margin: '4px 6px' }} />
                  </>
                ) : null}
                {chrome.narrowHeader && hasSessionId ? (
                  <>
                    <MenuAction
                      label="질문하기"
                      disabled={askHelp.isPending}
                      onClick={() => {
                        setSettingsOpen(false);
                        onAskHelp();
                      }}
                    />
                    {isSessionManager ? (
                      <MenuAction
                        label={createReport.isPending ? '리포트 생성 중…' : '리포트 생성'}
                        disabled={createReport.isPending}
                        onClick={() => {
                          setSettingsOpen(false);
                          onCreateReport();
                        }}
                      />
                    ) : null}
                    <span style={{ height: 1, background: 'var(--divider)', margin: '4px 6px' }} />
                  </>
                ) : null}
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
      {helpNotice ? (
        <AlertBanner
          tone="success"
          title="질문 요청"
          description={helpNotice}
          actionLabel="닫기"
          onAction={() => setHelpNotice(null)}
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

      <div style={{ flex: 1, display: 'flex', minHeight: 0, minWidth: 0, overflow: 'hidden' }}>
        {showExplorerPanel ? (
          <>
            <aside
              style={{
                ...(chrome.stacked
                  ? { flex: 1, width: '100%', minWidth: 0, maxWidth: 'none' }
                  : {
                      width: leftWidth,
                      minWidth: leftWidth,
                      maxWidth: leftWidth,
                    }),
                background: 'var(--surface-card)',
                display: 'flex',
                flexDirection: 'column',
                flexShrink: chrome.stacked ? 1 : 0,
                minHeight: 0,
                overflow: 'hidden',
              }}
            >
              <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
                <button type="button" style={tabBtn(true)} onClick={() => setLeftTab('explorer')}>
                  탐색기
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
                              title="파일 다시 선택"
                              onClick={() => startReimport('file')}
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
                              onClick={() => startReimport('folder')}
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
                          <ProjectImportPanel
                            sessionId={sessionId}
                            onImported={onImported}
                            autoOpenPicker={importAutoOpen}
                            onAutoOpenHandled={clearImportAutoOpen}
                          />
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
                ) : null}
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
                  maxHeight: 280,
                  overflow: 'auto',
                  minHeight: 0,
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
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {chat.voiceParticipants.length === 0 ? (
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      음성 채널에 아무도 없습니다.
                    </span>
                  ) : (
                    chat.voiceParticipants.map((p) => {
                      const isMe = p.userId === myUserId;
                      const volume = voiceRtc.peerVolumes[p.userId] ?? 1;
                      return (
                        <div
                          key={`voice-${p.userId}`}
                          style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}
                        >
                          <PresenceRow
                            color={isMe ? 'var(--status-warning)' : 'var(--accent)'}
                            name={isMe ? `${p.name} (나)` : p.name}
                            badge={[
                              p.micMuted ? '음소거' : null,
                              p.deafened ? '청취차단' : null,
                              p.role !== 'STUDENT' ? p.role : null,
                            ]
                              .filter(Boolean)
                              .join(' · ') || undefined}
                          />
                          {!isMe ? (
                            <label
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                paddingLeft: 16,
                                minWidth: 0,
                              }}
                              title={`${p.name} 음량`}
                            >
                              <span
                                style={{
                                  fontSize: 10,
                                  color: 'var(--text-muted)',
                                  flexShrink: 0,
                                  width: 28,
                                }}
                              >
                                {Math.round(volume * 100)}%
                              </span>
                              <input
                                type="range"
                                min={0}
                                max={100}
                                step={1}
                                value={Math.round(volume * 100)}
                                disabled={!voiceJoined || voiceRtc.status !== 'live'}
                                onChange={(e) => {
                                  voiceRtc.setPeerVolume(p.userId, Number(e.target.value) / 100);
                                }}
                                style={{
                                  flex: 1,
                                  minWidth: 0,
                                  accentColor: 'var(--accent)',
                                  cursor: voiceJoined ? 'pointer' : 'not-allowed',
                                }}
                                aria-label={`${p.name} 수신 음량`}
                              />
                            </label>
                          ) : null}
                        </div>
                      );
                    })
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
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {chat.participants.length === 0 ? (
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>아직 접속자가 없습니다.</span>
                  ) : (
                    chat.participants.map((p) => (
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
            {!chrome.stacked ? (
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
            ) : null}
          </>
        ) : null}

        <div
          style={{
            flex: 1,
            display: editorVisible ? 'flex' : 'none',
            flexDirection: 'column',
            minWidth: 0,
            minHeight: 0,
          }}
        >
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
            <FileCode size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
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
            {provider && editorYText && activeFile && collabSynced && activeFileReady ? (
              <CollabMonacoEditor
                key={activeFile}
                ytext={editorYText}
                provider={provider}
                language={editorLanguage}
                onlineUserIds={onlineUserIds}
                compact={chrome.isMobile}
                visible={editorVisible}
              />
            ) : (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
                <span style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.55 }}>
                  {!collabSynced
                    ? '동기화 연결 중…'
                    : activeFile && !activeFileReady
                      ? '파일을 불러오는 중…'
                      : projectRef
                        ? '탐색기에서 파일을 선택하세요.'
                        : pendingImport
                          ? '프로젝트 미리보기 중입니다.'
                          : '프로젝트를 연결한 뒤 파일을 열어 주세요.'}
                </span>
              </div>
            )}
          </div>
        </div>

        {showRightPanel ? (
          <>
            {!chrome.stacked ? (
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
            ) : null}
            <aside
              style={{
                ...(chrome.stacked
                  ? { flex: 1, width: '100%', minWidth: 0, maxWidth: 'none' }
                  : {
                      width: rightWidth,
                      minWidth: rightWidth,
                      maxWidth: rightWidth,
                    }),
                background: 'var(--surface-card)',
                display: 'flex',
                flexDirection: 'column',
                flexShrink: chrome.stacked ? 1 : 0,
                minHeight: 0,
                overflow: 'hidden',
              }}
            >
              {!chrome.stacked ? (
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
              ) : null}
              {chrome.stacked ? (
                mobileView === 'community' ? (
                  <SessionChatPanel chat={chat} hasSessionId={hasSessionId} />
                ) : (
                  <SessionQuizPanel
                    sessionId={sessionId}
                    projectId={projectRef?.projectId ?? null}
                    versionHash={projectRef?.versionHash ?? null}
                    pushedQuizSetId={chat.lastQuizNotification?.quizSetId ?? null}
                    canGenerateQuiz={canGenerateQuiz}
                  />
                )
              ) : rightTab === 'community' ? (
                <SessionChatPanel chat={chat} hasSessionId={hasSessionId} />
              ) : (
                <SessionQuizPanel
                  sessionId={sessionId}
                  projectId={projectRef?.projectId ?? null}
                  versionHash={projectRef?.versionHash ?? null}
                  pushedQuizSetId={chat.lastQuizNotification?.quizSetId ?? null}
                  canGenerateQuiz={canGenerateQuiz}
                />
              )}
            </aside>
          </>
        ) : null}
      </div>

      {chrome.stacked ? (
        <SessionBottomNav
          active={mobileView}
          onChange={(view) => {
            setMobileView(view);
            if (view === 'community') setRightTab('community');
            if (view === 'quiz') setRightTab('quiz');
          }}
        />
      ) : (
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
            CRDT · {projectRef ? `#${projectRef.projectId}` : '—'}
          </span>
        ) : null}
        <span style={{ marginLeft: 'auto', display: 'flex', gap: 12, fontFamily: 'var(--font-mono)', fontSize: 11, flexShrink: 0 }}>
          <span style={{ color: 'var(--accent)', whiteSpace: 'nowrap' }}>{editorLanguage}</span>
        </span>
      </footer>
      )}

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
    </div>
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
