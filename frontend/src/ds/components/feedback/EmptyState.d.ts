/** Illustration-free empty state: short message + one clear CTA. */
export interface EmptyStateProps {
  message: React.ReactNode;
  description?: React.ReactNode;
  actionLabel?: string | null;
  onAction?: () => void;
  style?: React.CSSProperties;
}
export declare function EmptyState(props: EmptyStateProps): JSX.Element;