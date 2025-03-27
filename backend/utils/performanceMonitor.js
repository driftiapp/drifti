const EventEmitter = require('events');
const os = require('os');

class PerformanceMonitor extends EventEmitter {
    constructor(config = {}) {
        super();
        this.config = {
            collectionInterval: config.collectionInterval || 5000, // 5 seconds
            memoryThreshold: config.memoryThreshold || 0.85, // 85% memory usage threshold
            cpuThreshold: config.cpuThreshold || 0.8, // 80% CPU usage threshold
            latencyThreshold: config.latencyThreshold || 1000, // 1 second latency threshold
            ...config
        };

        this.metrics = {
            cpu: {
                usage: 0,
                cores: os.cpus().length,
                loadAverage: [0, 0, 0]
            },
            memory: {
                total: os.totalmem(),
                free: os.freemem(),
                used: 0,
                usagePercent: 0
            },
            latency: {
                average: 0,
                p95: 0,
                p99: 0,
                max: 0,
                samples: []
            },
            requests: {
                total: 0,
                successful: 0,
                failed: 0,
                rate: 0
            }
        };

        this.collectionInterval = null;
        this.lastCollectionTime = Date.now();
    }

    start() {
        this.collectionInterval = setInterval(() => {
            this.collectMetrics();
        }, this.config.collectionInterval);
    }

    stop() {
        if (this.collectionInterval) {
            clearInterval(this.collectionInterval);
            this.collectionInterval = null;
        }
    }

    collectMetrics() {
        const now = Date.now();
        const timeDiff = now - this.lastCollectionTime;

        // Collect CPU metrics
        const cpus = os.cpus();
        const totalIdle = cpus.reduce((acc, cpu) => acc + cpu.times.idle, 0);
        const totalTick = cpus.reduce((acc, cpu) => 
            acc + cpu.times.user + cpu.times.nice + cpu.times.sys + cpu.times.idle + cpu.times.irq, 0);
        this.metrics.cpu.usage = 1 - (totalIdle / totalTick);
        this.metrics.cpu.loadAverage = os.loadavg();

        // Collect memory metrics
        this.metrics.memory.free = os.freemem();
        this.metrics.memory.used = this.metrics.memory.total - this.metrics.memory.free;
        this.metrics.memory.usagePercent = this.metrics.memory.used / this.metrics.memory.total;

        // Check thresholds and emit warnings
        this.checkThresholds();

        // Calculate request rate
        this.metrics.requests.rate = this.metrics.requests.total / (timeDiff / 1000);

        this.lastCollectionTime = now;
        this.emit('metrics', this.metrics);
    }

    checkThresholds() {
        if (this.metrics.memory.usagePercent > this.config.memoryThreshold) {
            this.emit('warning', {
                type: 'high_memory_usage',
                value: this.metrics.memory.usagePercent,
                threshold: this.config.memoryThreshold
            });
        }

        if (this.metrics.cpu.usage > this.config.cpuThreshold) {
            this.emit('warning', {
                type: 'high_cpu_usage',
                value: this.metrics.cpu.usage,
                threshold: this.config.cpuThreshold
            });
        }

        if (this.metrics.latency.average > this.config.latencyThreshold) {
            this.emit('warning', {
                type: 'high_latency',
                value: this.metrics.latency.average,
                threshold: this.config.latencyThreshold
            });
        }
    }

    recordLatency(latency) {
        this.metrics.latency.samples.push(latency);
        
        // Keep only last 1000 samples
        if (this.metrics.latency.samples.length > 1000) {
            this.metrics.latency.samples.shift();
        }

        // Calculate statistics
        const sorted = [...this.metrics.latency.samples].sort((a, b) => a - b);
        this.metrics.latency.average = sorted.reduce((a, b) => a + b, 0) / sorted.length;
        this.metrics.latency.p95 = sorted[Math.floor(sorted.length * 0.95)];
        this.metrics.latency.p99 = sorted[Math.floor(sorted.length * 0.99)];
        this.metrics.latency.max = Math.max(...sorted);
    }

    recordRequest(success) {
        this.metrics.requests.total++;
        if (success) {
            this.metrics.requests.successful++;
        } else {
            this.metrics.requests.failed++;
        }
    }

    getMetrics() {
        return { ...this.metrics };
    }

    getHealthStatus() {
        const status = {
            healthy: true,
            warnings: []
        };

        if (this.metrics.memory.usagePercent > this.config.memoryThreshold) {
            status.healthy = false;
            status.warnings.push('High memory usage');
        }

        if (this.metrics.cpu.usage > this.config.cpuThreshold) {
            status.healthy = false;
            status.warnings.push('High CPU usage');
        }

        if (this.metrics.latency.average > this.config.latencyThreshold) {
            status.healthy = false;
            status.warnings.push('High latency');
        }

        return status;
    }
}

module.exports = { PerformanceMonitor }; 