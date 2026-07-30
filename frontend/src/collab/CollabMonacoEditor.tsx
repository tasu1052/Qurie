import { useEffect, useRef } from 'react';
import * as monaco from 'monaco-editor';
// monaco 0.5x exports 맵("./*.js" → "./esm/vs/*.js") 기준 워커 경로
import editorWorker from 'monaco-editor/editor/editor.worker.js?worker';
import tsWorker from 'monaco-editor/language/typescript/ts.worker.js?worker';
import { MonacoBinding } from 'y-monaco';
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
}

/**
 * Yjs(Y.Text)와 양방향 바인딩된 Monaco 에디터.
 * 원격 참가자 커서/선택은 awareness 상태 기반으로 클라이언트별 CSS를 주입해 색을 입힌다.
 */
export function CollabMonacoEditor({ ytext, provider, language = 'typescript' }: CollabMonacoEditorProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const editor = monaco.editor.create(container, {
      value: '',
      language,
      theme: 'vs-dark',
      automaticLayout: true,
      fontSize: 13,
      fontFamily: 'var(--font-mono)',
      lineHeight: 24,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      padding: { top: 16, bottom: 16 },
    });

    const model = editor.getModel();
    if (!model) return () => editor.dispose();

    const binding = new MonacoBinding(ytext, model, new Set([editor]), provider.awareness);

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
      provider.awareness.off('change', renderCursorStyles);
      styleEl.remove();
      binding.destroy();
      editor.dispose();
    };
  }, [ytext, provider, language]);

  return <div ref={containerRef} style={{ flex: 1, minHeight: 0, minWidth: 0 }} />;
}
