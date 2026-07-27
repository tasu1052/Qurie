/**
 * Row shell + the two fallbacks the data layer's <QueryAsyncBoundary> takes.
 * The UI layer never writes the boundary itself.
 */
export interface RowSectionProps {
  /** Optional mono row label used in specs/debug views ("row 1 · kpi"). */
  label?: React.ReactNode;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}
export declare function RowSection(props: RowSectionProps): JSX.Element;

export interface RowSkeletonProps {
  /** Must equal the loaded row's height so nothing shifts. */
  height?: number;
  columns?: number;
  gap?: number;
  radius?: number;
  style?: React.CSSProperties;
}
export declare function RowSkeleton(props: RowSkeletonProps): JSX.Element;

export interface RowErrorFallbackProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  /** From the error envelope; rendered in mono. */
  requestId?: string | null;
  /** Wire to the boundary's reset (resetErrorBoundary) — the data layer decides refetch policy. */
  onRetry?: () => void;
  style?: React.CSSProperties;
}
export declare function RowErrorFallback(props: RowErrorFallbackProps): JSX.Element;
