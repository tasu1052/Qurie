import type { ReactNode } from 'react';
import { EmptyState, RowErrorFallback, RowSection } from '../../ds';
import type { RowStatus } from '../../mocks/fixtures';

type MockRowBoundaryProps = {
  status: RowStatus;
  skeleton: ReactNode;
  onRetry: () => void;
  emptyMessage: string;
  onEmptyAction?: () => void;
  emptyActionLabel?: string;
  children: ReactNode;
};

/**
 * Dev/mock bridge until teammate's <QueryAsyncBoundary> lands.
 * Maps {status,data,refetch} adapters onto DS RowSkeleton / RowErrorFallback / RowSection.
 */
export function MockRowBoundary({
  status,
  skeleton,
  onRetry,
  emptyMessage,
  onEmptyAction,
  emptyActionLabel = '새로고침',
  children,
}: MockRowBoundaryProps) {
  if (status === 'loading') return <>{skeleton}</>;
  if (status === 'error') return <RowErrorFallback onRetry={onRetry} />;
  if (status === 'empty') {
    return (
      <EmptyState
        message={emptyMessage}
        actionLabel={emptyActionLabel}
        onAction={onEmptyAction ?? onRetry}
      />
    );
  }
  return <RowSection>{children}</RowSection>;
}
