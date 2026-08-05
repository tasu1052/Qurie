import * as Y from 'yjs';

/** 세션 협업: 파일 경로별 Y.Text — 한 사용자가 다른 파일을 열어도 다른 참가자 에디터는 유지된다. */
export function getOrCreateFileYText(ydoc: Y.Doc, path: string): Y.Text {
  const yfiles = ydoc.getMap<Y.Text>('files');
  const existing = yfiles.get(path);
  if (existing) return existing;

  let created: Y.Text | null = null;
  ydoc.transact(() => {
    const again = yfiles.get(path);
    if (again) {
      created = again;
      return;
    }
    const ytext = new Y.Text();
    yfiles.set(path, ytext);
    created = ytext;
  });
  return created ?? yfiles.get(path)!;
}
