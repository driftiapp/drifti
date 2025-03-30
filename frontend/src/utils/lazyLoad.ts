import dynamic from 'next/dynamic';
import { ComponentType, ReactNode } from 'react';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorBoundary from '@/components/ErrorBoundary';

interface LazyLoadOptions {
  loadingMessage?: string;
  ssr?: boolean;
  fallback?: ReactNode;
}

export function lazyLoadComponent<P extends object>(
  importFunc: () => Promise<{ default: ComponentType<P> }>,
  options: LazyLoadOptions = {}
): ComponentType<P> {
  const {
    loadingMessage = 'Loading...',
    ssr = true,
    fallback = <LoadingSpinner message={loadingMessage} />,
  } = options;

  const LazyComponent = dynamic(importFunc, {
    loading: () => fallback,
    ssr,
  });

  return function LazyLoadWrapper(props: P) {
    return (
      <ErrorBoundary>
        <LazyComponent {...props} />
      </ErrorBoundary>
    );
  };
}

// Example usage:
// const LazyComponent = lazyLoadComponent(() => import('@/components/HeavyComponent'), {
//   loadingMessage: 'Loading component...',
//   ssr: false,
// }); 