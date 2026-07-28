import type { ReactNode } from 'react';
import { EmptyState, RowErrorFallback, RowSection, RowSkeleton } from '../../ds';
import { QueryAsyncBoundary } from '../../network/boundaries/QueryAsyncBoundary';
import type { RowStatus } from '../../data';

type MockRowBoundaryProps = {
  status: RowStatus;
  /** Layout-matched skeleton. Falls back to RowSkeleton when omitted. */
  skeleton?: ReactNode;
  onRetry: () => void;
  emptyMessage: string;
  onEmptyAction?: () => void;
  emptyActionLabel?: string;
  /** Shown in mono under the error title (States 6c/6g). */
  requestId?: string | null;
  /** Optional row label for RowSection debug/spec strip. */
  label?: ReactNode;
  /** RowSkeleton height when no custom skeleton is passed. */
  skeletonHeight?: number;
  children: ReactNode;
};

/**
 * UI seam for row loading / error / empty / ready.
 * Wraps teammate's <QueryAsyncBoundary> (Suspense + error boundary) and maps
 * mock `{ status, refetch }` onto DS RowSkeleton / RowErrorFallback / EmptyState /
 * RowSection until real query hooks land.
 */
export function MockRowBoundary({
  status,
  skeleton,
  onRetry,
  emptyMessage,
  onEmptyAction,
  emptyActionLabel = '새로고침',
  requestId = 'req_mock_7f3a2c91',
  label,
  skeletonHeight = 132,
  children,
}: MockRowBoundaryProps) {
  const suspenseFallback = skeleton ?? <RowSkeleton height={skeletonHeight} />;
  const errorFallback = (
    <RowErrorFallback
      onRetry={onRetry}
      requestId={requestId}
      title="이 영역을 불러오지 못했습니다"
      description="이 행만 실패했습니다. 나머지 영역은 정상적으로 표시됩니다."
    />
  );

  let body: ReactNode;
  if (status === 'loading') {
    body = suspenseFallback;
  } else if (status === 'error') {
    body = errorFallback;
  } else if (status === 'empty') {
    body = (
      <EmptyState
        message={emptyMessage}
        actionLabel={emptyActionLabel}
        onAction={onEmptyAction ?? onRetry}
      />
    );
  } else {
    // gap 24 matches the PageMain gutter: pages that render several sections
    // inside one boundary keep the same rhythm as separate rows.
    body = (
      <RowSection label={label} style={{ gap: 24 }}>
        {children}
      </RowSection>
    );
  }

  return (
    <QueryAsyncBoundary suspenseFallback={suspenseFallback} errorFallback={errorFallback}>
      {body}
    </QueryAsyncBoundary>
  );
}
