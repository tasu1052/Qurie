import { Suspense } from 'react';

interface QuerySuspenseBoundaryProps {
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

export const QuerySuspenseBoundary = ({children, fallback = null,}: QuerySuspenseBoundaryProps) => {
    return (
        <Suspense fallback={fallback}>
            {children}
        </Suspense>
    );
};