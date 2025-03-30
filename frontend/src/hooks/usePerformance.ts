import { useEffect, useRef } from 'react';
import performanceMonitor from '../utils/performance';

interface UsePerformanceOptions {
  componentName: string;
  trackRenders?: boolean;
  trackEffects?: boolean;
}

export function usePerformance({ componentName, trackRenders = true, trackEffects = true }: UsePerformanceOptions) {
  const renderCount = useRef(0);
  const effectCount = useRef(0);

  // Track component renders
  useEffect(() => {
    if (trackRenders) {
      renderCount.current += 1;
      const endMeasure = performanceMonitor.monitorComponentRender(componentName);
      return () => {
        endMeasure();
        performanceMonitor.addMetric(`component_render_count_${componentName}`, renderCount.current);
      };
    }
  }, [componentName, trackRenders]);

  // Track effect runs
  useEffect(() => {
    if (trackEffects) {
      effectCount.current += 1;
      performanceMonitor.addMetric(`component_effect_count_${componentName}`, effectCount.current);
    }
  }, [componentName, trackEffects]);

  // Return performance monitoring utilities
  return {
    // Mark a point in time
    mark: (name: string) => performanceMonitor.mark(name),

    // Measure time between two marks
    measure: (name: string, startMark: string, endMark: string) =>
      performanceMonitor.measure(name, startMark, endMark),

    // Add a custom metric
    addMetric: (name: string, value: number, metadata?: Record<string, any>) =>
      performanceMonitor.addMetric(name, value, metadata),

    // Get component-specific metrics
    getMetrics: () => performanceMonitor.getMetricsByName(componentName),

    // Get render and effect counts
    getCounts: () => ({
      renders: renderCount.current,
      effects: effectCount.current,
    }),
  };
} 