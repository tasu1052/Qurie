import { type ReactNode } from 'react';
import { QueryErrorBoundary } from './QueryErrorBoundary';
import { QuerySuspenseBoundary } from './QuerySuspenseBoundary';

/**
 * @example UI 개발자가 fallback 지정
 * ```tsx
 * <QueryAsyncBoundary
 *   suspenseFallback={<UserProfileSkeleton />}
 *   errorFallback={<UserProfileError />}
 * >
 *   <UserProfile />
 * </QueryAsyncBoundary>
 * ```
 *
 * @example Suspense / Error만 따로 쓰고 싶을 때
 * ```tsx
 * <QuerySuspenseBoundary fallback={<Skeleton />}>
 *   <UserProfile />
 * </QuerySuspenseBoundary>
 *
 * <QueryErrorBoundary fallback={<ErrorMessage />}>
 *   <UserProfile />
 * </QueryErrorBoundary>
 * ```
 **/

interface QueryAsyncBoundaryProps {
    children: ReactNode;
    suspenseFallback?: ReactNode;
    errorFallback?: ReactNode;
}

export const QueryAsyncBoundary = ({children, suspenseFallback, errorFallback}: QueryAsyncBoundaryProps) => {
    return (
        <QueryErrorBoundary fallback={errorFallback}>
            <QuerySuspenseBoundary fallback={suspenseFallback}>
                {children}
            </QuerySuspenseBoundary>
        </QueryErrorBoundary>
    );
};