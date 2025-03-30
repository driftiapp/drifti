import React, { useEffect, useRef } from 'react';
import performanceMonitor from './performance';

// Performance metrics interface
interface PerformanceMetrics {
  fcp: number; // First Contentful Paint
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
  tti: number; // Time to Interactive
  tbt: number; // Total Blocking Time
  ttiPolyfill: number; // Time to Interactive (Polyfill)
}

// Performance observer options
const observerOptions = {
  entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift', 'paint'],
  buffered: true,
};

// Performance entry types
interface FirstInputEntry extends PerformanceEntry {
  processingStart: number;
}

interface LayoutShiftEntry extends PerformanceEntry {
  hadRecentInput: boolean;
  value: number;
}

interface NavigationEntry extends PerformanceEntry {
  domContentLoadedEventEnd: number;
  loadEventEnd: number;
}

// React hook for performance monitoring
function usePerformanceMonitoring() {
  const metrics = useRef<Partial<PerformanceMetrics>>({});
  const observer = useRef<PerformanceObserver | null>(null);

  useEffect(() => {
    // Initialize performance observer
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      observer.current = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          switch (entry.entryType) {
            case 'largest-contentful-paint':
              metrics.current.lcp = entry.startTime;
              performanceMonitor.updateWebVitals({ lcp: entry.startTime });
              break;
            case 'first-input':
              const firstInputEntry = entry as FirstInputEntry;
              metrics.current.fid = firstInputEntry.processingStart - firstInputEntry.startTime;
              performanceMonitor.updateWebVitals({ fid: firstInputEntry.processingStart - firstInputEntry.startTime });
              break;
            case 'layout-shift':
              const layoutShiftEntry = entry as LayoutShiftEntry;
              if (!layoutShiftEntry.hadRecentInput) {
                metrics.current.cls = (metrics.current.cls || 0) + layoutShiftEntry.value;
                performanceMonitor.updateWebVitals({ cls: metrics.current.cls });
              }
              break;
            case 'paint':
              if (entry.name === 'first-contentful-paint') {
                metrics.current.fcp = entry.startTime;
                performanceMonitor.updateWebVitals({ fcp: entry.startTime });
              }
              break;
          }
        }
      });

      observer.current.observe(observerOptions);
    }

    // Calculate Time to Interactive (Polyfill)
    const calculateTTI = () => {
      const navigation = performance.getEntriesByType('navigation')[0] as NavigationEntry;
      if (navigation) {
        const domContentLoaded = navigation.domContentLoadedEventEnd;
        const load = navigation.loadEventEnd;
        metrics.current.ttiPolyfill = load - domContentLoaded;
        performanceMonitor.updateWebVitals({ ttiPolyfill: load - domContentLoaded });
      }
    };

    // Calculate Total Blocking Time
    const calculateTBT = () => {
      const longTasks = performance.getEntriesByType('longtask');
      if (longTasks.length > 0) {
        metrics.current.tbt = longTasks.reduce((acc, task) => {
          return acc + (task.duration - 50);
        }, 0);
        performanceMonitor.updateWebVitals({ tbt: metrics.current.tbt });
      }
    };

    // Listen for load event
    window.addEventListener('load', () => {
      calculateTTI();
      calculateTBT();
    });

    // Cleanup
    return () => {
      if (observer.current) {
        observer.current.disconnect();
      }
      window.removeEventListener('load', calculateTTI);
      window.removeEventListener('load', calculateTBT);
    };
  }, []);

  return metrics.current;
}

// Performance monitoring component
const PerformanceMonitorComponent = () => {
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
};

export { usePerformanceMonitoring };
export default PerformanceMonitorComponent; 