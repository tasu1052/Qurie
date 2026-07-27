/** Drag-and-drop upload target + its in-progress / failed row. */
export interface FileDropzoneProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Mono constraint line: ".zip · 최대 50MB". */
  hint?: React.ReactNode;
  actionLabel?: string;
  /** Extra button (e.g. a disabled "Git 연동 (준비 중)"). */
  secondary?: React.ReactNode;
  onSelect?: () => void;
  style?: React.CSSProperties;
}
export declare function FileDropzone(props: FileDropzoneProps): JSX.Element;
export interface UploadRowProps { name?: string; percent?: number | null; error?: React.ReactNode; onCancel?: () => void; onRetry?: () => void }
export declare function UploadRow(props: UploadRowProps): JSX.Element;
