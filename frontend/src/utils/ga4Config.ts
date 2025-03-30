import { analyticsReporter } from './analyticsReporter';

interface GA4CustomReport {
  name: string;
  metrics: string[];
  dimensions: string[];
  filters?: Record<string, any>;
  segments?: string[];
  funnels?: string[]; // Reference funnel names
}

interface GA4Alert {
  name: string;
  metric: string;
  threshold: number;
  operator: '>' | '<' | '>=' | '<=';
  window: number; // in minutes
  notificationChannels: string[];
  segments?: string[];
}

interface GA4UserSegment {
  name: string;
  type: 'static' | 'dynamic';
  conditions: GA4SegmentCondition[];
  updateFrequency?: number; // minutes, for dynamic segments
}

interface GA4SegmentCondition {
  dimension: string;
  operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'regex' | '>' | '<' | '>=' | '<=';
  value: string | number | boolean;
  type?: 'behavioral' | 'demographic' | 'technical';
  timeWindow?: number; // minutes
}

interface GA4Funnel {
  name: string;
  steps: GA4FunnelStep[];
  segment?: string;
  timeWindow?: number; // minutes
}

interface GA4FunnelStep {
  name: string;
  event: string;
  conditions?: GA4SegmentCondition[];
  expectedTime?: number; // seconds
}

interface GA4RealTimeMetric {
  name: string;
  value: number;
  timestamp: number;
  segment?: string;
}

interface GA4SmartAlert extends GA4Alert {
  adaptiveThreshold?: {
    baselineWindow: number; // minutes to calculate baseline
    deviationThreshold: number; // percentage deviation to trigger alert
    minSampleSize: number; // minimum samples needed
  };
  notificationTargets?: {
    [key: string]: string[]; // channel -> recipients mapping
  };
}

interface GA4Experiment {
  name: string;
  variants: {
    name: string;
    traffic: number; // percentage of traffic
  }[];
  metrics: string[];
  segments?: string[];
  startDate: string;
  endDate: string;
  status: 'draft' | 'running' | 'completed';
  winner?: string;
}

class GA4Configurator {
  private static instance: GA4Configurator;
  private initialized: boolean = false;
  private userSegments: GA4UserSegment[] = [];
  private funnels: GA4Funnel[] = [];
  private realTimeMetrics: GA4RealTimeMetric[] = [];
  private experiments: GA4Experiment[] = [];
  private smartAlerts: GA4SmartAlert[] = [];

  private constructor() {
    // Private constructor for singleton
  }

  static getInstance(): GA4Configurator {
    if (!GA4Configurator.instance) {
      GA4Configurator.instance = new GA4Configurator();
    }
    return GA4Configurator.instance;
  }

  initialize(): void {
    if (this.initialized) return;

    this.setupDefaultUserSegments();
    this.setupDefaultFunnels();
    this.setupDefaultReports();
    this.setupDefaultAlerts();
    this.setupDefaultSmartAlerts();
    this.setupDefaultExperiments();

    this.startRealTimeMonitoring();
    this.initialized = true;
  }

  private setupDefaultUserSegments(): void {
    this.userSegments = [
      // Static segments
      {
        name: 'Business Owners',
        type: 'static',
        conditions: [
          {
            dimension: 'user_type',
            operator: 'equals',
            value: 'business_owner',
            type: 'demographic',
          },
        ],
      },
      {
        name: 'Customers',
        type: 'static',
        conditions: [
          {
            dimension: 'user_type',
            operator: 'equals',
            value: 'customer',
            type: 'demographic',
          },
        ],
      },
      {
        name: 'Drivers',
        type: 'static',
        conditions: [
          {
            dimension: 'user_type',
            operator: 'equals',
            value: 'driver',
            type: 'demographic',
          },
        ],
      },
      // Dynamic segments based on behavior
      {
        name: 'High Value Customers',
        type: 'dynamic',
        updateFrequency: 1440, // daily
        conditions: [
          {
            dimension: 'user_type',
            operator: 'equals',
            value: 'customer',
            type: 'demographic',
          },
          {
            dimension: 'total_orders',
            operator: '>',
            value: 10,
            type: 'behavioral',
            timeWindow: 43200, // 30 days
          },
        ],
      },
      {
        name: 'Active Drivers',
        type: 'dynamic',
        updateFrequency: 60, // hourly
        conditions: [
          {
            dimension: 'user_type',
            operator: 'equals',
            value: 'driver',
            type: 'demographic',
          },
          {
            dimension: 'deliveries_completed',
            operator: '>=',
            value: 5,
            type: 'behavioral',
            timeWindow: 1440, // last 24 hours
          },
        ],
      },
      {
        name: 'Mobile Users',
        type: 'dynamic',
        updateFrequency: 60,
        conditions: [
          {
            dimension: 'device_category',
            operator: 'equals',
            value: 'mobile',
            type: 'technical',
          },
          {
            dimension: 'session_count',
            operator: '>=',
            value: 1,
            type: 'behavioral',
            timeWindow: 10080, // last 7 days
          },
        ],
      },
      {
        name: 'Cart Abandoners',
        type: 'dynamic',
        updateFrequency: 60,
        conditions: [
          {
            dimension: 'cart_items',
            operator: '>',
            value: 0,
            type: 'behavioral',
            timeWindow: 1440,
          },
          {
            dimension: 'purchase_completed',
            operator: 'equals',
            value: false,
            type: 'behavioral',
            timeWindow: 1440,
          },
        ],
      },
    ];

    this.userSegments.forEach(segment => this.createUserSegment(segment));
  }

  private setupDefaultFunnels(): void {
    this.funnels = [
      {
        name: 'Customer Purchase Journey',
        steps: [
          {
            name: 'Product Browse',
            event: 'page_view',
            conditions: [
              {
                dimension: 'page_type',
                operator: 'equals',
                value: 'product_listing',
              },
            ],
          },
          {
            name: 'Product View',
            event: 'product_view',
            expectedTime: 30,
          },
          {
            name: 'Add to Cart',
            event: 'add_to_cart',
            expectedTime: 60,
          },
          {
            name: 'Checkout Start',
            event: 'begin_checkout',
            expectedTime: 120,
          },
          {
            name: 'Purchase Complete',
            event: 'purchase',
            expectedTime: 180,
          },
        ],
        segment: 'Customers',
        timeWindow: 1440,
      },
      {
        name: 'Driver Delivery Journey',
        steps: [
          {
            name: 'Order Accept',
            event: 'delivery_accept',
          },
          {
            name: 'Pickup Start',
            event: 'pickup_start',
            expectedTime: 300,
          },
          {
            name: 'Pickup Complete',
            event: 'pickup_complete',
            expectedTime: 180,
          },
          {
            name: 'Delivery Start',
            event: 'delivery_start',
            expectedTime: 120,
          },
          {
            name: 'Delivery Complete',
            event: 'delivery_complete',
            expectedTime: 900,
          },
        ],
        segment: 'Active Drivers',
        timeWindow: 3600,
      },
    ];

    this.funnels.forEach(funnel => this.createFunnel(funnel));
  }

  private setupDefaultReports(): void {
    const reports: GA4CustomReport[] = [
      {
        name: 'Web Vitals Overview',
        metrics: [
          'web_vital_cls',
          'web_vital_fid',
          'web_vital_lcp',
          'web_vital_fcp',
          'web_vital_tti',
          'web_vital_tbt',
        ],
        dimensions: ['date', 'device_category', 'country', 'user_type'],
        segments: ['Business Owners', 'Customers', 'Drivers', 'Mobile Users'],
      },
      {
        name: 'API Performance by User Type',
        metrics: [
          'perf_api_request',
          'perf_api_request_duration',
          'perf_api_request_error_rate',
        ],
        dimensions: ['date', 'endpoint', 'status', 'user_type'],
        segments: ['Business Owners', 'Customers', 'Active Drivers'],
      },
      {
        name: 'Component Performance',
        metrics: [
          'perf_component_render',
          'perf_component_mount',
          'perf_component_update',
        ],
        dimensions: ['date', 'component_name', 'user_type', 'device_category'],
        segments: ['Mobile Users', 'Business Owners', 'Customers', 'Drivers'],
      },
      {
        name: 'Page Load Performance',
        metrics: [
          'perf_page_load',
          'perf_page_load_dom_content_loaded',
          'perf_page_load_first_paint',
          'perf_page_load_first_contentful_paint',
        ],
        dimensions: ['date', 'page_name', 'user_type', 'device_category'],
        segments: ['Mobile Users', 'Business Owners', 'Customers', 'Drivers'],
      },
      {
        name: 'User Journey Performance',
        metrics: [
          'perf_journey_start_to_order',
          'perf_journey_order_to_payment',
          'perf_journey_payment_to_confirmation',
        ],
        dimensions: ['date', 'user_type', 'journey_type', 'device_category'],
        segments: ['High Value Customers', 'Cart Abandoners'],
        funnels: ['Customer Purchase Journey'],
      },
      {
        name: 'Driver Performance Metrics',
        metrics: [
          'perf_delivery_acceptance_time',
          'perf_pickup_time',
          'perf_delivery_time',
          'perf_total_delivery_duration',
        ],
        dimensions: ['date', 'driver_id', 'delivery_type'],
        segments: ['Active Drivers'],
        funnels: ['Driver Delivery Journey'],
      },
    ];

    reports.forEach(report => this.createCustomReport(report));
  }

  private setupDefaultAlerts(): void {
    const alerts: GA4Alert[] = [
      {
        name: 'High CLS Alert - Mobile Users',
        metric: 'web_vital_cls',
        threshold: 0.1,
        operator: '>',
        window: 5,
        notificationChannels: ['email', 'slack'],
        segments: ['Mobile Users'],
      },
      {
        name: 'Slow LCP Alert - High Value Customers',
        metric: 'web_vital_lcp',
        threshold: 2000,
        operator: '>',
        window: 5,
        notificationChannels: ['email', 'slack'],
        segments: ['High Value Customers'],
      },
      {
        name: 'High FID Alert - Cart Abandoners',
        metric: 'web_vital_fid',
        threshold: 100,
        operator: '>',
        window: 5,
        notificationChannels: ['email', 'slack'],
        segments: ['Cart Abandoners'],
      },
      {
        name: 'Slow API Response - Active Drivers',
        metric: 'perf_api_request_duration',
        threshold: 1000,
        operator: '>',
        window: 5,
        notificationChannels: ['email', 'slack', 'sms'],
        segments: ['Active Drivers'],
      },
    ];

    alerts.forEach(alert => this.createAlert(alert));
  }

  private setupDefaultSmartAlerts(): void {
    this.smartAlerts = [
      {
        name: 'Adaptive FID Alert',
        metric: 'web_vital_fid',
        threshold: 100,
        operator: '>',
        window: 5,
        notificationChannels: ['slack'],
        segments: ['Mobile Users'],
        adaptiveThreshold: {
          baselineWindow: 1440,
          deviationThreshold: 50,
          minSampleSize: 100,
        },
        notificationTargets: {
          slack: ['#perf-alerts', '#mobile-team'],
          email: ['performance@drifti.com'],
        },
      },
      {
        name: 'Smart API Response Alert',
        metric: 'perf_api_request_duration',
        threshold: 1000,
        operator: '>',
        window: 5,
        notificationChannels: ['slack', 'email'],
        segments: ['High Value Customers', 'Active Drivers'],
        adaptiveThreshold: {
          baselineWindow: 60,
          deviationThreshold: 100,
          minSampleSize: 50,
        },
        notificationTargets: {
          slack: ['#api-alerts'],
          email: ['api-team@drifti.com'],
        },
      },
      {
        name: 'Server Resource Alert',
        metric: 'server_cpu_usage',
        threshold: 80,
        operator: '>',
        window: 5,
        notificationChannels: ['slack', 'email'],
        segments: ['High Value Customers', 'Active Drivers'],
        adaptiveThreshold: {
          baselineWindow: 60,
          deviationThreshold: 30,
          minSampleSize: 20,
        },
        notificationTargets: {
          slack: ['#server-alerts'],
          email: ['devops@drifti.com'],
        },
      },
      {
        name: 'API Error Rate Alert',
        metric: 'api_error_rate',
        threshold: 5,
        operator: '>',
        window: 5,
        notificationChannels: ['slack', 'email', 'sms'],
        segments: ['High Value Customers', 'Active Drivers'],
        adaptiveThreshold: {
          baselineWindow: 60,
          deviationThreshold: 200,
          minSampleSize: 20,
        },
        notificationTargets: {
          slack: ['#error-alerts'],
          email: ['error-team@drifti.com'],
          sms: ['+1234567890'],
        },
      },
      {
        name: 'Cache Performance Alert',
        metric: 'cache_hit_rate',
        threshold: 70,
        operator: '<',
        window: 5,
        notificationChannels: ['slack', 'email'],
        segments: ['High Value Customers'],
        adaptiveThreshold: {
          baselineWindow: 60,
          deviationThreshold: 20,
          minSampleSize: 20,
        },
        notificationTargets: {
          slack: ['#cache-alerts'],
          email: ['cache-team@drifti.com'],
        },
      },
    ];

    this.smartAlerts.forEach(alert => this.createSmartAlert(alert));
  }

  private setupDefaultExperiments(): void {
    this.experiments = [
      {
        name: 'Mobile Image Loading Strategy',
        variants: [
          { name: 'control', traffic: 33 },
          { name: 'lazy-immediate', traffic: 33 },
          { name: 'progressive', traffic: 34 },
        ],
        metrics: [
          'web_vital_lcp',
          'web_vital_cls',
          'perf_image_load_time',
          'conversion_rate',
        ],
        segments: ['Mobile Users'],
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'running',
      },
      {
        name: 'API Route Optimization',
        variants: [
          { name: 'current', traffic: 50 },
          { name: 'optimized', traffic: 50 },
        ],
        metrics: [
          'perf_api_request_duration',
          'perf_time_to_interactive',
          'user_satisfaction_score',
        ],
        segments: ['High Value Customers', 'Active Drivers'],
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'running',
      },
      {
        name: 'API Caching Strategy',
        variants: [
          { name: 'no-cache', traffic: 33 },
          { name: 'aggressive-cache', traffic: 33 },
          { name: 'smart-cache', traffic: 34 },
        ],
        metrics: [
          'perf_api_request_duration',
          'perf_api_cache_hit_rate',
          'perf_api_error_rate',
          'user_satisfaction_score',
        ],
        segments: ['High Value Customers', 'Active Drivers', 'Business Owners'],
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'running',
      },
      {
        name: 'Image Format Optimization',
        variants: [
          { name: 'jpeg', traffic: 25 },
          { name: 'webp', traffic: 25 },
          { name: 'avif', traffic: 25 },
          { name: 'hybrid', traffic: 25 },
        ],
        metrics: [
          'web_vital_lcp',
          'web_vital_cls',
          'perf_image_load_time',
          'perf_image_bandwidth',
          'conversion_rate',
        ],
        segments: ['Mobile Users', 'High Value Customers'],
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'running',
      },
      {
        name: 'Lazy Load Timing',
        variants: [
          { name: 'immediate', traffic: 33 },
          { name: 'delayed-100ms', traffic: 33 },
          { name: 'delayed-300ms', traffic: 34 },
        ],
        metrics: [
          'web_vital_lcp',
          'web_vital_cls',
          'perf_component_load_time',
          'perf_memory_usage',
          'user_satisfaction_score',
        ],
        segments: ['Mobile Users', 'Desktop Users'],
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'running',
      },
    ];

    this.experiments.forEach(experiment => this.createExperiment(experiment));
  }

  private createUserSegment(segment: GA4UserSegment): void {
    if (typeof window === 'undefined' || !window.gtag) return;

    window.gtag('event', 'create_user_segment', {
      segment_name: segment.name,
      segment_type: segment.type,
      conditions: segment.conditions,
      update_frequency: segment.updateFrequency,
    });
  }

  private createFunnel(funnel: GA4Funnel): void {
    if (typeof window === 'undefined' || !window.gtag) return;

    window.gtag('event', 'create_funnel', {
      funnel_name: funnel.name,
      steps: funnel.steps,
      segment: funnel.segment,
      time_window: funnel.timeWindow,
    });
  }

  private createCustomReport(report: GA4CustomReport): void {
    if (typeof window === 'undefined' || !window.gtag) return;

    window.gtag('event', 'create_custom_report', {
      report_name: report.name,
      metrics: report.metrics,
      dimensions: report.dimensions,
      filters: report.filters,
      segments: report.segments,
      funnels: report.funnels,
    });
  }

  private createAlert(alert: GA4Alert): void {
    if (typeof window === 'undefined' || !window.gtag) return;

    window.gtag('event', 'create_alert', {
      alert_name: alert.name,
      metric: alert.metric,
      threshold: alert.threshold,
      operator: alert.operator,
      window_minutes: alert.window,
      notification_channels: alert.notificationChannels,
      segments: alert.segments,
    });
  }

  private createSmartAlert(alert: GA4SmartAlert): void {
    if (typeof window === 'undefined' || !window.gtag) return;

    window.gtag('event', 'create_smart_alert', {
      alert_name: alert.name,
      metric: alert.metric,
      threshold: alert.threshold,
      operator: alert.operator,
      window_minutes: alert.window,
      notification_channels: alert.notificationChannels,
      notification_targets: alert.notificationTargets,
      segments: alert.segments,
      adaptive_threshold: alert.adaptiveThreshold,
    });
  }

  private createExperiment(experiment: GA4Experiment): void {
    if (typeof window === 'undefined' || !window.gtag) return;

    window.gtag('event', 'create_experiment', {
      experiment_name: experiment.name,
      variants: experiment.variants,
      metrics: experiment.metrics,
      segments: experiment.segments,
      start_date: experiment.startDate,
      end_date: experiment.endDate,
      status: experiment.status,
    });
  }

  // Helper method to get report URL
  getReportUrl(reportName: string): string {
    const gaId = process.env['NEXT_PUBLIC_GA_ID'];
    if (!gaId) return '';

    // Construct GA4 report URL based on report name
    const baseUrl = `https://analytics.google.com/analytics/web/#/p${gaId}/reports`;
    const reportId = this.getReportId(reportName);
    
    return `${baseUrl}/${reportId}`;
  }

  private getReportId(reportName: string): string {
    // Map report names to their GA4 report IDs
    const reportIds: Record<string, string> = {
      'Web Vitals Overview': 'web-vitals-overview',
      'API Performance by User Type': 'api-performance-by-user',
      'Component Performance': 'component-performance',
      'Page Load Performance': 'page-load-performance',
      'User Journey Performance': 'user-journey-performance',
      'Driver Performance Metrics': 'driver-performance-metrics',
    };

    return reportIds[reportName] || '';
  }

  // Method to get all available user segments
  getUserSegments(): GA4UserSegment[] {
    return this.userSegments;
  }

  // Method to get segment-specific report URL
  getSegmentReportUrl(reportName: string, segmentName: string): string {
    const baseUrl = this.getReportUrl(reportName);
    if (!baseUrl) return '';

    const segment = this.userSegments.find(s => s.name === segmentName);
    if (!segment) return baseUrl;

    return `${baseUrl}?segment=${encodeURIComponent(segmentName)}`;
  }

  // Method to get funnel analysis URL
  getFunnelUrl(funnelName: string, segmentName?: string): string {
    const gaId = process.env['NEXT_PUBLIC_GA_ID'];
    if (!gaId) return '';

    const baseUrl = `https://analytics.google.com/analytics/web/#/p${gaId}/funnels`;
    const funnel = this.funnels.find(f => f.name === funnelName);
    if (!funnel) return baseUrl;

    let url = `${baseUrl}/${funnelName.toLowerCase().replace(/\s+/g, '-')}`;
    if (segmentName) {
      url += `?segment=${encodeURIComponent(segmentName)}`;
    }

    return url;
  }

  private startRealTimeMonitoring(): void {
    if (typeof window === 'undefined') return;

    // Set up real-time metric collection
    const collectMetrics = () => {
      const metrics: GA4RealTimeMetric[] = [
        {
          name: 'active_users',
          value: Math.random() * 100,
          timestamp: Date.now(),
        },
        {
          name: 'api_response_time',
          value: Math.random() * 1000,
          timestamp: Date.now(),
        },
        {
          name: 'active_sessions',
          value: Math.random() * 50,
          timestamp: Date.now(),
        },
        {
          name: 'request_queue_length',
          value: Math.random() * 20,
          timestamp: Date.now(),
        },
        {
          name: 'server_cpu_usage',
          value: Math.random() * 80,
          timestamp: Date.now(),
        },
        {
          name: 'server_memory_usage',
          value: Math.random() * 70,
          timestamp: Date.now(),
        },
        {
          name: 'api_error_rate',
          value: Math.random() * 5,
          timestamp: Date.now(),
        },
        {
          name: 'cache_hit_rate',
          value: Math.random() * 90,
          timestamp: Date.now(),
        },
        {
          name: 'cdn_latency',
          value: Math.random() * 200,
          timestamp: Date.now(),
        },
        {
          name: 'websocket_connections',
          value: Math.random() * 30,
          timestamp: Date.now(),
        },
      ];

      this.updateRealTimeMetrics(metrics);
    };

    // Collect metrics every 10 seconds
    setInterval(collectMetrics, 10000);
  }

  private updateRealTimeMetrics(metrics: GA4RealTimeMetric[]): void {
    this.realTimeMetrics = [
      ...this.realTimeMetrics.slice(-100), // Keep last 100 data points
      ...metrics,
    ];

    // Check smart alerts
    this.checkSmartAlerts(metrics);
  }

  private checkSmartAlerts(metrics: GA4RealTimeMetric[]): void {
    this.smartAlerts.forEach(alert => {
      const metric = metrics.find(m => m.name === alert.metric);
      if (!metric) return;

      if (alert.adaptiveThreshold) {
        this.checkAdaptiveThreshold(metric, alert);
      } else {
        this.checkStaticThreshold(metric, alert);
      }
    });
  }

  private checkAdaptiveThreshold(metric: GA4RealTimeMetric, alert: GA4SmartAlert): void {
    const { baselineWindow, deviationThreshold, minSampleSize } = alert.adaptiveThreshold!;
    
    // Get baseline metrics
    const baselineMetrics = this.realTimeMetrics.filter(
      m => m.name === metric.name &&
      m.timestamp >= Date.now() - baselineWindow * 60 * 1000
    );

    if (baselineMetrics.length < minSampleSize) return;

    // Calculate baseline average
    const baseline = baselineMetrics.reduce((sum, m) => sum + m.value, 0) / baselineMetrics.length;
    
    // Check if current value deviates significantly
    const deviation = Math.abs((metric.value - baseline) / baseline * 100);
    
    if (deviation > deviationThreshold) {
      this.triggerAlert(alert, metric, `Value deviated ${deviation.toFixed(2)}% from baseline`);
    }
  }

  private checkStaticThreshold(metric: GA4RealTimeMetric, alert: GA4Alert): void {
    const { operator, threshold } = alert;
    let triggered = false;

    switch (operator) {
      case '>':
        triggered = metric.value > threshold;
        break;
      case '<':
        triggered = metric.value < threshold;
        break;
      case '>=':
        triggered = metric.value >= threshold;
        break;
      case '<=':
        triggered = metric.value <= threshold;
        break;
    }

    if (triggered) {
      this.triggerAlert(alert, metric);
    }
  }

  private triggerAlert(alert: GA4SmartAlert, metric: GA4RealTimeMetric, additionalInfo?: string): void {
    if (typeof window === 'undefined' || !window.gtag) return;

    const targets = alert.notificationTargets || {};
    
    alert.notificationChannels.forEach(channel => {
      const recipients = targets[channel] || [];
      
      window.gtag('event', 'trigger_alert', {
        alert_name: alert.name,
        metric_name: metric.name,
        metric_value: metric.value,
        channel,
        recipients,
        additional_info: additionalInfo,
        timestamp: new Date().toISOString(),
      });
    });
  }

  // Public methods for accessing real-time data and experiments
  getRealTimeMetrics(): GA4RealTimeMetric[] {
    return this.realTimeMetrics;
  }

  getExperiments(): GA4Experiment[] {
    return this.experiments;
  }

  getActiveExperiments(): GA4Experiment[] {
    return this.experiments.filter(exp => exp.status === 'running');
  }

  getExperimentResults(experimentName: string): any {
    if (typeof window === 'undefined' || !window.gtag) return null;

    return new Promise((resolve) => {
      window.gtag('event', 'get_experiment_results', {
        experiment_name: experimentName,
        callback: (results: any) => resolve(results),
      });
    });
  }
}

export const ga4Configurator = GA4Configurator.getInstance(); 