import { Component, type ErrorInfo, type ReactNode } from 'react';

interface ErrorBoundaryClassProps {
    children: ReactNode;
    fallback?: ReactNode;
}

class ErrorBoundaryClass extends Component<ErrorBoundaryClassProps, { hasError: boolean }> {
    state = { hasError: false };

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidCatch(error: Error, info: ErrorInfo) {
        console.error(error, info);
    }

    render() {
        if (this.state.hasError) {
            return this.props.fallback ?? null;
        }

        return this.props.children;
    }
}

interface QueryErrorBoundaryProps {
    children: ReactNode;
    fallback?: ReactNode;
}

export const QueryErrorBoundary = ({children, fallback}: QueryErrorBoundaryProps) => {
    return (
        <ErrorBoundaryClass fallback={fallback}>
            {children}
        </ErrorBoundaryClass>
    );
};