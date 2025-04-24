import React from 'react';
import { Button } from '@/components/ui/button';

interface ErrorInfo {
    componentStack?: string;
}

interface ErrorDisplayProps {
    error: Error | null;
    errorInfo?: ErrorInfo;
    onRetry?: () => void;
    onClose?: () => void;
    className?: string;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
    error,
    errorInfo,
    onRetry,
    onClose,
    className
}) => (
    <div className={`text-center p-8 max-w-md ${className || ''}`}>
        <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
        <p className="text-muted-foreground mb-6">
            We apologize for the inconvenience. Please try refreshing the page.
        </p>
        {error && (
            <details className="mb-6 text-left">
                <summary className="text-sm text-muted-foreground cursor-pointer mb-2">
                    Error Details
                </summary>
                <div className="bg-muted p-4 rounded-md text-sm font-mono">
                    <p className="text-destructive mb-2">{error.toString()}</p>
                    {errorInfo?.componentStack && (
                        <pre className="text-xs overflow-auto">
                            {errorInfo.componentStack}
                        </pre>
                    )}
                </div>
            </details>
        )}
        <div className="flex gap-4 justify-center">
            {onRetry && (
                <Button onClick={onRetry} variant="default">
                    Try Again
                </Button>
            )}
            {onClose && (
                <Button onClick={onClose} variant="secondary">
                    Close
                </Button>
            )}
        </div>
    </div>
); 