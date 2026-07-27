/** Failure state for a card, widget, or whole page. Always offers a way forward. */
export interface ErrorStateProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  /** Mono technical detail: request_id, status + service name. */
  code?: React.ReactNode;
  /** Primary action — required; pass null only when the page itself is the recovery (session expired → 다시 로그인). */
  actionLabel?: string | null;
  onRetry?: () => void;
  secondaryLabel?: string | null;
  onSecondary?: () => void;
  style?: React.CSSProperties;
}
export declare function ErrorState(props: ErrorStateProps): JSX.Element;
