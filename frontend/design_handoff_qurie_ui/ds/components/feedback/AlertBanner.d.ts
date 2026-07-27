/** Inline page-level notice. One line of title + one line of description, optional single action. */
export interface AlertBannerProps {
  tone?: 'error' | 'warning' | 'info' | 'success';
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Lucide node, 15px, tone-colored by the component. */
  icon?: React.ReactNode;
  actionLabel?: string | null;
  onAction?: () => void;
  style?: React.CSSProperties;
}
export declare function AlertBanner(props: AlertBannerProps): JSX.Element;
