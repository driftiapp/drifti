import { logger } from './logger';

interface AnalyticsEvent {
  name: string;
  value: number;
  category?: string;
  label?: string;
  nonInteraction?: boolean;
  metadata?: Record<string, any> | undefined;
}

export interface WebVitalsReport {
  name: 'CLS' | 'FID' | 'LCP' | 'FCP' | 'TTFB' | 'TTI';
  value: number;
  id: string;
  delta: number;
  navigationType: string;
}

class AnalyticsReporter {
  private static instance: AnalyticsReporter;
  private initialized: boolean = false;
  private queue: AnalyticsEvent[] = [];
  private readonly MAX_RETRY_ATTEMPTS = 3;
  private readonly RETRY_DELAY = 1000; // 1 second

  private constructor() {
    // Private constructor for singleton
  }

  static getInstance(): AnalyticsReporter {
    if (!AnalyticsReporter.instance) {
      AnalyticsReporter.instance = new AnalyticsReporter();
    }
    return AnalyticsReporter.instance;
  }

  initialize(): void {
    if (this.initialized) return;

    // Load Google Analytics script
    if (typeof window !== 'undefined' && !window.gtag) {
      const gaId = process.env['NEXT_PUBLIC_GA_ID'];
      if (!gaId) {
        logger.warn('Google Analytics ID not found');
        return;
      }

      const script = document.createElement('script');
      script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
      script.async = true;
      document.head.appendChild(script);

      window.dataLayer = window.dataLayer || [];
      window.gtag = function() {
        window.dataLayer.push(arguments);
      };
      window.gtag('js', new Date());
      window.gtag('config', gaId, {
        send_page_view: false, // We'll handle page views separately
      });
    }

    this.initialized = true;
    this.processQueue();
  }

  private async processQueue(): Promise<void> {
    while (this.queue.length > 0) {
      const event = this.queue.shift();
      if (event) {
        await this.sendEvent(event);
      }
    }
  }

  private async sendEvent(event: AnalyticsEvent, attempt: number = 1): Promise<void> {
    if (!this.initialized) {
      this.queue.push(event);
      return;
    }

    try {
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', event.name, {
          event_category: event.category || 'Performance',
          event_label: event.label,
          value: Math.round(event.value), // GA only accepts integers
          non_interaction: event.nonInteraction ?? true,
          ...(event.metadata || {}),
        });
      }
    } catch (error) {
      logger.error('Failed to send analytics event', {
        event,
        error,
        attempt,
      });

      if (attempt < this.MAX_RETRY_ATTEMPTS) {
        setTimeout(() => {
          this.sendEvent(event, attempt + 1);
        }, this.RETRY_DELAY * attempt);
      }
    }
  }

  reportWebVital(metric: WebVitalsReport): void {
    this.sendEvent({
      name: `web_vital_${metric.name.toLowerCase()}`,
      value: metric.value,
      label: metric.id,
      metadata: {
        delta: metric.delta,
        navigationType: metric.navigationType,
      },
    });
  }

  reportPerformanceMetric(name: string, value: number, metadata?: Record<string, any>): void {
    this.sendEvent({
      name: `perf_${name.toLowerCase()}`,
      value,
      metadata: metadata || undefined,
    });
  }

  reportApiTiming(endpoint: string, duration: number, status: number): void {
    this.sendEvent({
      name: 'api_request',
      value: duration,
      category: 'API',
      label: endpoint,
      metadata: {
        status,
        endpoint,
      },
    });
  }

  reportError(error: Error, componentName?: string): void {
    this.sendEvent({
      name: 'error',
      value: 1,
      category: 'Error',
      label: error.message,
      metadata: {
        componentName,
        stack: error.stack,
        timestamp: new Date().toISOString(),
      },
    });
  }
}

// Add type definitions for window object
declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}

export const analyticsReporter = AnalyticsReporter.getInstance(); 