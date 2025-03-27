const { performance } = require('perf_hooks');
const os = require('os');

class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.startTime = Date.now();
  }

  trackOperation(name, operation) {
    const start = performance.now();
    return operation().finally(() => {
      const duration = performance.now() - start;
      this.recordMetric(name, duration);
    });
  }

  recordMetric(name, value) {
    const metrics = this.metrics.get(name) || {
      count: 0,
      total: 0,
      min: Infinity,
      max: -Infinity,
      lastValue: null,
    };

    metrics.count++;
    metrics.total += value;
    metrics.min = Math.min(metrics.min, value);
    metrics.max = Math.max(metrics.max, value);
    metrics.lastValue = value;

    this.metrics.set(name, metrics);
  }

  getSystemMetrics() {
    return {
      uptime: process.uptime(),
      memory: {
        total: os.totalmem(),
        free: os.freemem(),
        used: os.totalmem() - os.freemem(),
      },
      cpu: {
        loadAvg: os.loadavg(),
        cpus: os.cpus(),
      },
    };
  }

  getMetrics() {
    const metrics = {};
    for (const [name, data] of this.metrics.entries()) {
      metrics[name] = {
        ...data,
        average: data.total / data.count,
      };
    }
    return metrics;
  }

  getSummary() {
    return {
      startTime: this.startTime,
      uptime: process.uptime(),
      metrics: this.getMetrics(),
      system: this.getSystemMetrics(),
    };
  }
}

module.exports = new PerformanceMonitor(); 