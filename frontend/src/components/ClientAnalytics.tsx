'use client';

import dynamic from 'next/dynamic';

const PerformanceMonitor = dynamic(() => import('@/components/PerformanceMonitor'), {
  ssr: false,
});

const GA4Reports = dynamic(() => import('@/components/GA4Reports'), {
  ssr: false,
});

const GA4RealTime = dynamic(() => import('@/components/GA4RealTime'), {
  ssr: false,
});

export default function ClientAnalytics() {
  return (
    <>
      <PerformanceMonitor />
      <GA4Reports />
      <GA4RealTime />
    </>
  );
} 