/** Per-row load boundary: skeleton, scoped error, or content. Shell chrome stays outside it. */
export interface RowSectionProps {
  status?: 'loading' | 'error' | 'empty' | 'ready';
  /** Same-height placeholder for this row — required whenever status can be 'loading'. */
  skeleton?: React.ReactNode;
  errorTitle?: React.ReactNode;
  errorDescription?: React.ReactNode;
  onRetry?: () => void;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}
export declare function RowSection(props: RowSectionProps): JSX.Element;
