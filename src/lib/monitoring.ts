type MetricType = 'counter' | 'gauge' | 'histogram'

interface Metric {
    name: string
    type: MetricType
    value: number
    labels: Record<string, string>
    timestamp: number
}

class MetricsCollector {
    private static instance: MetricsCollector
    private metrics: Metric[]
    private readonly maxMetrics: number

    private constructor(maxMetrics = 1000) {
        this.metrics = []
        this.maxMetrics = maxMetrics
    }

    public static getInstance(): MetricsCollector {
        if (!MetricsCollector.instance) {
            MetricsCollector.instance = new MetricsCollector()
        }
        return MetricsCollector.instance
    }

    public recordMetric(
        name: string,
        value: number,
        type: MetricType = 'counter',
        labels: Record<string, string> = {}
    ): void {
        const metric: Metric = {
            name,
            type,
            value,
            labels,
            timestamp: Date.now(),
        }

        this.metrics.push(metric)

        if (this.metrics.length > this.maxMetrics) {
            this.metrics = this.metrics.slice(-this.maxMetrics)
        }
    }

    public getMetrics(): Metric[] {
        return [...this.metrics]
    }

    public clearMetrics(): void {
        this.metrics = []
    }

    public getMetricsByType(type: MetricType): Metric[] {
        return this.metrics.filter((m) => m.type === type)
    }

    public getMetricsByName(name: string): Metric[] {
        return this.metrics.filter((m) => m.name === name)
    }
}

export const metrics = MetricsCollector.getInstance()

// Performance monitoring decorator
export function monitorPerformance(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value

    descriptor.value = async function (...args: any[]) {
        const start = performance.now()
        try {
            const result = await originalMethod.apply(this, args)
            const duration = performance.now() - start
            metrics.recordMetric(`${target.constructor.name}.${propertyKey}.duration`, duration, 'histogram')
            metrics.recordMetric(`${target.constructor.name}.${propertyKey}.success`, 1, 'counter')
            return result
        } catch (error) {
            const duration = performance.now() - start
            metrics.recordMetric(`${target.constructor.name}.${propertyKey}.duration`, duration, 'histogram')
            metrics.recordMetric(`${target.constructor.name}.${propertyKey}.error`, 1, 'counter')
            throw error
        }
    }

    return descriptor
}

// Performance monitoring hook
export function usePerformanceMonitoring(name: string) {
    const start = performance.now()

    return {
        end: (labels: Record<string, string> = {}) => {
            const duration = performance.now() - start
            metrics.recordMetric(name, duration, 'histogram', labels)
        },
    }
}

// Error tracking
export function trackError(error: Error, context: Record<string, any> = {}) {
    metrics.recordMetric('error.count', 1, 'counter', {
        name: error.name,
        message: error.message,
        ...context,
    })
}

// Resource usage tracking
export function trackResourceUsage() {
    if (typeof performance !== 'undefined' && performance.memory) {
        const memory = performance.memory
        metrics.recordMetric('memory.used', memory.usedJSHeapSize, 'gauge')
        metrics.recordMetric('memory.total', memory.totalJSHeapSize, 'gauge')
        metrics.recordMetric('memory.limit', memory.jsHeapSizeLimit, 'gauge')
    }
} 