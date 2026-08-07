import { useEffect, useRef } from 'react';
import * as monaco from 'monaco-editor';
// monaco 0.5x exports 맵("./*.js" → "./esm/vs/*.js") 기준 워커 경로
import editorWorker from 'monaco-editor/editor/editor.worker.js?worker';
import tsWorker from 'monaco-editor/language/typescript/ts.worker.js?worker';
import { MonacoBinding } from 'y-monaco';
import { removeAwarenessStates } from 'y-protocols/awareness';
import type * as Y from 'yjs';
import type { WebsocketProvider } from 'y-websocket';
import type { CollabUser } from './useCollabSession';

// Vite 환경에서 Monaco 웹워커 로딩 설정 (최초 1회)
self.MonacoEnvironment = {
  getWorker(_workerId: string, label: string) {
    if (label === 'typescript' || label === 'javascript') return new tsWorker();
    return new editorWorker();
  },
};

interface CollabMonacoEditorProps {
  ytext: Y.Text;
  provider: WebsocketProvider;
  language?: string;
  /** STOMP 참가자 userId — 세션 퇴장 시 해당 유저 원격 커서 즉시 제거 */
  onlineUserIds?: number[];
  /** 좁은 화면(모바일)에서 가독성·터치를 위해 글자 크기를 키운다. */
  compact?: boolean;
  /** display:none 토글 후 레이아웃을 다시 잡기 위해 사용한다. */
  visible?: boolean;
}

/**
 * Yjs(Y.Text)와 양방향 바인딩된 Monaco 에디터.
 * 원격 참가자 커서/선택은 awareness 상태 기반으로 클라이언트별 CSS를 주입해 색을 입힌다.
 */
export function CollabMonacoEditor({
  ytext,
  provider,
  language = 'typescript',
  onlineUserIds,
  compact = false,
  visible = true,
}: CollabMonacoEditorProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const prevOnlineRef = useRef<Set<number> | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const editor = monaco.editor.create(container, {
      value: '',
      language,
      theme: 'vs-dark',
      automaticLayout: true,
      fontSize: compact ? 15 : 13,
      fontFamily: 'var(--font-mono)',
      lineHeight: compact ? 22 : 24,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      padding: { top: compact ? 12 : 16, bottom: compact ? 12 : 16 },
      wordWrap: compact ? 'on' : 'off',
    });
    editorRef.current = editor;

    const model = editor.getModel();
    if (!model) return () => editor.dispose();

    const binding = new MonacoBinding(ytext, model, new Set([editor]), provider.awareness);

    // MonacoBinding 이 증분 동기화를 담당하고, 이 함수는 늦게 로드된 문서(LevelDB
    // hydrate)처럼 모델과 문자열이 통째로 어긋난 경우의 복구용이다. setValue 는
    // 커서·선택·undo 를 전부 날리므로 전체 범위 교체 편집으로 상태를 보존한다.
    const ensureModelFromYText = () => {
      const fromY = ytext.toString();
      if (fromY.length === 0 || model.getValue() === fromY) {
        return;
      }
      const selections = editor.getSelections();
      model.pushEditOperations(
        selections ?? [],
        [{ range: model.getFullModelRange(), text: fromY }],
        () => selections,
      );
    };
    ensureModelFromYText();
    const onYTextChange = () => {
      ensureModelFromYText();
      requestAnimationFrame(() => editor.layout());
    };
    ytext.observe(onYTextChange);

    // 원격 커서 색상: awareness의 user.color를 클라이언트별 CSS 규칙으로 주입
    const styleEl = document.createElement('style');
    document.head.appendChild(styleEl);
    const renderCursorStyles = () => {
      const rules: string[] = [];
      provider.awareness.getStates().forEach((state, clientId) => {
        const user = state.user as CollabUser | undefined;
        if (!user || clientId === provider.awareness.clientID) return;
        rules.push(
          `.yRemoteSelection-${clientId} { background-color: ${user.color}; opacity: .16; }`,
          `.yRemoteSelectionHead-${clientId} { position: relative; border-left: 2px solid ${user.color}; margin-left: -1px; }`,
          `.yRemoteSelectionHead-${clientId}::after { content: '${user.name.replace(/['\\]/g, '')}'; position: absolute; top: -1.45em; left: -2px; transform: translateX(-2px); padding: 0 4px; font-size: 10px; line-height: 1.45; font-family: var(--font-sans); color: var(--text-inverse); background-color: ${user.color}; border-radius: 3px; white-space: nowrap; z-index: 12; pointer-events: none; }`,
        );
      });
      styleEl.textContent = rules.join('\n');
    };
    renderCursorStyles();
    provider.awareness.on('change', renderCursorStyles);

    return () => {
      ytext.unobserve(onYTextChange);
      provider.awareness.off('change', renderCursorStyles);
      styleEl.remove();
      binding.destroy();
      editor.dispose();
      editorRef.current = null;
    };
  }, [ytext, provider, language, compact]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const ro = new ResizeObserver(() => {
      editorRef.current?.layout();
    });
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return;
    const frame = requestAnimationFrame(() => {
      editorRef.current?.layout();
    });
    return () => cancelAnimationFrame(frame);
  }, [visible, ytext, language, compact]);

  // 참가자 목록에서 빠진 userId → 그 유저의 awareness(커서)를 로컬에서도 즉시 제거·브로드캐스트
  const onlineKey = onlineUserIds?.slice().sort((a, b) => a - b).join(',') ?? '';
  useEffect(() => {
    if (!onlineUserIds) return;
    const next = new Set(onlineUserIds);
    const prev = prevOnlineRef.current;
    prevOnlineRef.current = next;
    // 첫 스냅샷이거나 전원 비움(재연결 플리커)은 무시 — 오탐으로 커서를 지우지 않는다.
    if (!prev || prev.size === 0 || next.size === 0) return;

    const leftUserIds = [...prev].filter((id) => !next.has(id));
    if (leftUserIds.length === 0) return;
    const left = new Set(leftUserIds);

    const clientIds: number[] = [];
    provider.awareness.getStates().forEach((state, clientId) => {
      if (clientId === provider.awareness.clientID) return;
      const user = state.user as CollabUser | undefined;
      if (user?.id != null && left.has(user.id)) clientIds.push(clientId);
    });
    if (clientIds.length === 0) return;
    removeAwarenessStates(provider.awareness, clientIds, 'participant-left');
  }, [provider, onlineKey, onlineUserIds]);

  return <div ref={containerRef} style={{ flex: 1, minHeight: 0, minWidth: 0 }} />;
}
