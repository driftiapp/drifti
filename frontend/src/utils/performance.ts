import { useEffect, useRef } from 'react';
import { logger } from './logger';
import { analyticsReporter } from './analyticsReporter';
import type { WebVitalsReport } from './analyticsReporter';

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  metadata?: Record<string, any> | undefined;
}

interface NavigationTiming extends PerformanceEntry {
  loadEventEnd: number;
  navigationStart: number;
  domContentLoadedEventEnd: number;
}

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

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private marks: Map<string, number> = new Map();
  private measures: Map<string, number> = new Map();
  private webVitals: Partial<PerformanceMetrics> = {};
  private readonly ALERT_THRESHOLDS = {
    FCP: 2000, // 2 seconds
    LCP: 2500, // 2.5 seconds
    FID: 100,  // 100ms
    CLS: 0.1,  // 0.1
    TTI: 3500, // 3.5 seconds
    TBT: 300,  // 300ms
  };

  // Mark a point in time
  mark(name: string): void {
    const timestamp = performance.now();
    this.marks.set(name, timestamp);
    
    if (process.env.NODE_ENV === 'production') {
      analyticsReporter.reportPerformanceMetric(`mark_${name}`, timestamp);
    }
  }

  // Measure time between two marks
  measure(name: string, startMark: string, endMark: string): void {
    const start = this.marks.get(startMark);
    const end = this.marks.get(endMark);

    if (start === undefined || end === undefined) {
      logger.warn('Performance measure failed: marks not found', {
        name,
        startMark,
        endMark,
      });
      return;
    }

    const duration = end - start;
    this.measures.set(name, duration);
    this.addMetric(name, duration);

    if (process.env.NODE_ENV === 'production') {
      analyticsReporter.reportPerformanceMetric(`measure_${name}`, duration, {
        startMark,
        endMark,
      });
    }
  }

  // Add a custom metric
  addMetric(name: string, value: number, metadata?: Record<string, any>): void {
    this.metrics.push({
      name,
      value,
      timestamp: Date.now(),
      metadata,
    });

    if (process.env.NODE_ENV === 'production') {
      analyticsReporter.reportPerformanceMetric(name, value, metadata);
    }
  }

  // Get all metrics
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  // Get metrics by name
  getMetricsByName(name: string): PerformanceMetric[] {
    return this.metrics.filter(metric => metric.name === name);
  }

  // Clear all metrics
  clearMetrics(): void {
    this.metrics = [];
    this.marks.clear();
    this.measures.clear();
    this.webVitals = {};
  }

  // Get performance report
  getReport(): Record<string, any> {
    const report: Record<string, any> = {
      metrics: this.metrics,
      measures: Object.fromEntries(this.measures),
      webVitals: this.webVitals,
      summary: this.getSummary(),
    };

    return report;
  }

  // Get performance summary
  private getSummary(): Record<string, any> {
    const summary: Record<string, any> = {};

    // Group metrics by name
    const groupedMetrics = this.metrics.reduce((acc, metric) => {
      if (!acc[metric.name]) {
        acc[metric.name] = [];
      }
      acc[metric.name].push(metric.value);
      return acc;
    }, {} as Record<string, number[]>);

    // Calculate statistics for each metric
    Object.entries(groupedMetrics).forEach(([name, values]) => {
      const sortedValues = [...values].sort((a, b) => a - b);
      const count = values.length;
      const sum = values.reduce((a, b) => a + b, 0);
      const mean = sum / count;
      const median = sortedValues[Math.floor(count / 2)];
      const min = sortedValues[0];
      const max = sortedValues[count - 1];

      summary[name] = {
        count,
        mean,
        median,
        min,
        max,
      };
    });

    return summary;
  }

  // Monitor component render time
  monitorComponentRender(componentName: string): () => void {
    const startTime = performance.now();
    return () => {
      const duration = performance.now() - startTime;
      this.addMetric(`component_render_${componentName}`, duration);

      if (process.env.NODE_ENV === 'production') {
        analyticsReporter.reportPerformanceMetric(`component_render_${componentName}`, duration);
      }
    };
  }

  // Monitor API request time
  monitorApiRequest(endpoint: string): () => void {
    const startTime = performance.now();
    return () => {
      const duration = performance.now() - startTime;
      this.addMetric(`api_request_${endpoint}`, duration);

      if (process.env.NODE_ENV === 'production') {
        analyticsReporter.reportApiTiming(endpoint, duration, 200); // Assuming success status
      }
    };
  }

  // Monitor page load time
  monitorPageLoad(pageName: string): void {
    if (typeof window !== 'undefined') {
      const navigation = performance.getEntriesByType('navigation')[0] as NavigationTiming;
      if (navigation) {
        const loadTime = navigation.loadEventEnd - navigation.navigationStart;
        const domContentLoaded = navigation.domContentLoadedEventEnd - navigation.navigationStart;
        const firstPaint = performance.getEntriesByName('first-paint')[0]?.startTime;
        const firstContentfulPaint = performance.getEntriesByName('first-contentful-paint')[0]?.startTime;

        const metadata = {
          domContentLoaded,
          firstPaint,
          firstContentfulPaint,
        };

        this.addMetric(`page_load_${pageName}`, loadTime, metadata);

        if (process.env.NODE_ENV === 'production') {
          analyticsReporter.reportPerformanceMetric(`page_load_${pageName}`, loadTime, metadata);
        }
      }
    }
  }

  // Update Web Vitals
  updateWebVitals(metrics: Partial<PerformanceMetrics>): void {
    this.webVitals = { ...this.webVitals, ...metrics };

    if (process.env.NODE_ENV === 'production') {
      // Check for performance issues and report them
      Object.entries(metrics).forEach(([name, value]) => {
        const threshold = this.ALERT_THRESHOLDS[name as keyof typeof this.ALERT_THRESHOLDS];
        if (threshold && value > threshold) {
          logger.warn(`Performance threshold exceeded for ${name}`, {
            metric: name,
            value,
            threshold,
          });
        }

        analyticsReporter.reportWebVital({
          name: name.toUpperCase() as WebVitalsReport['name'],
          value,
          id: crypto.randomUUID(),
          delta: value,
          navigationType: 'navigate',
        });
      });
    }
  }

  // Get Web Vitals
  getWebVitals(): Partial<PerformanceMetrics> {
    return { ...this.webVitals };
  }
}

// Create a singleton instance
const performanceMonitor = new PerformanceMonitor();

// Initialize analytics reporter in production
if (process.env.NODE_ENV === 'production') {
  analyticsReporter.initialize();
}

// React hook for performance monitoring
export function usePerformanceMonitoring() {
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

export default performanceMonitor; 