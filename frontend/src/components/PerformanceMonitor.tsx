'use client';

import { useEffect, useRef } from 'react';
import { usePerformanceMonitoring } from '@/utils/performance';

export default function PerformanceMonitor() {
  const metrics = usePerformanceMonitoring();

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black bg-opacity-75 text-white p-4 rounded-lg text-sm font-mono">
      <h3 className="font-bold mb-2">Performance Metrics</h3>
      <div className="space-y-1">
        <div>FCP: {metrics.fcp?.toFixed(2)}ms</div>
        <div>LCP: {metrics.lcp?.toFixed(2)}ms</div>
        <div>FID: {metrics.fid?.toFixed(2)}ms</div>
        <div>CLS: {metrics.cls?.toFixed(3)}</div>
        <div>TTI: {metrics.ttiPolyfill?.toFixed(2)}ms</div>
        <div>TBT: {metrics.tbt?.toFixed(2)}ms</div>
      </div>
    </div>
  );
} 