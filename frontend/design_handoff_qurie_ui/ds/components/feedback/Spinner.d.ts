/** Indeterminate ring. Actions and short waits only — first paint uses <Skeleton>. */
export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  /** accent on light surfaces, inverse on ink surfaces/toasts, warning inside a reconnect bar. */
  tone?: 'accent' | 'inverse' | 'warning';
  label?: React.ReactNode;
  style?: React.CSSProperties;
}
export declare function Spinner(props: SpinnerProps): JSX.Element;
