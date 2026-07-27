/** Ink pill, bottom-right. One line of text + at most one action. */
export interface ToastProps {
  tone?: 'neutral' | 'error';
  message: React.ReactNode;
  icon?: React.ReactNode;
  actionLabel?: string | null;
  onAction?: () => void;
  /** Mono progress hint, e.g. "3/8". */
  hint?: React.ReactNode;
  style?: React.CSSProperties;
}
export declare function Toast(props: ToastProps): JSX.Element;
export declare function ToastStack(props: { children?: React.ReactNode; style?: React.CSSProperties }): JSX.Element;
