/** Panel for a 202-accepted background job (quiz generation, report generation). */
export interface AsyncJobPanelProps {
  /** Small uppercase group label, e.g. "AI 퀴즈". */
  label: React.ReactNode;
  /** Server status verbatim — rendered in the mono badge. */
  status?: 'PENDING' | 'GENERATING' | 'RUNNING' | 'FAILED' | 'DONE';
  title: React.ReactNode;
  description?: React.ReactNode;
  done?: number | null;
  total?: number | null;
  /** The job's own error_message; never paraphrased into the description. */
  errorMessage?: React.ReactNode;
  /** Mono footnote: "polling GET /quiz-sets/8f21 · 2s". */
  meta?: React.ReactNode;
  primaryLabel?: string;
  onPrimary?: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}
export declare function AsyncJobPanel(props: AsyncJobPanelProps): JSX.Element;
