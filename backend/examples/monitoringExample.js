const { SystemMonitor } = require('../utils/systemMonitor');
const { PerformanceMonitor } = require('../utils/performanceMonitor');

// Simulated worker class with performance tracking
class SimulatedWorker {
    constructor(id) {
        this.id = id;
        this.isRunning = false;
        this.startTime = null;
    }

    async start() {
        this.isRunning = true;
        this.startTime = Date.now();
        console.log(`Worker ${this.id} started`);
    }

    async terminate() {
        this.isRunning = false;
        console.log(`Worker ${this.id} terminated`);
    }

    async performTask() {
        if (!this.isRunning) {
            throw new Error('Worker is not running');
        }

        // Simulate work with random duration
        const duration = Math.random() * 1000;
        await new Promise(resolve => setTimeout(resolve, duration));

        // Simulate random failures (20% chance)
        if (Math.random() < 0.2) {
            throw new Error('Task failed');
        }

        return {
            result: `Task completed by worker ${this.id}`,
            duration
        };
    }
}

async function main() {
    // Create monitors
    const systemMonitor = new SystemMonitor({
        heartbeatInterval: 2000,
        maxMissedHeartbeats: 2,
        failureThreshold: 0.3,
        windowSize: 10
    });

    const performanceMonitor = new PerformanceMonitor({
        collectionInterval: 1000,
        memoryThreshold: 0.8,
        cpuThreshold: 0.7,
        latencyThreshold: 800
    });

    // Set up event listeners for system monitor
    systemMonitor.on('warning', (data) => {
        console.log('System Warning:', data);
    });

    systemMonitor.on('failure', (data) => {
        console.log('System Failure:', data);
    });

    systemMonitor.on('circuitOpen', (data) => {
        console.log('Circuit Open:', data);
    });

    systemMonitor.on('circuitClose', (data) => {
        console.log('Circuit Close:', data);
    });

    // Set up event listeners for performance monitor
    performanceMonitor.on('warning', (data) => {
        console.log('Performance Warning:', data);
    });

    performanceMonitor.on('metrics', (metrics) => {
        console.log('Performance Metrics:', {
            cpu: metrics.cpu.usage.toFixed(2),
            memory: (metrics.memory.usagePercent * 100).toFixed(2) + '%',
            latency: metrics.latency.average.toFixed(2) + 'ms',
            requests: metrics.requests.rate.toFixed(2) + '/s'
        });
    });

    // Create and register a worker
    const worker = new SimulatedWorker('worker1');
    systemMonitor.registerWorker('worker1', worker);

    // Start both monitors
    systemMonitor.start();
    performanceMonitor.start();

    // Start the worker
    await worker.start();

    // Simulate some tasks
    for (let i = 0; i < 20; i++) {
        try {
            // Update heartbeat every 2 seconds
            if (i % 2 === 0) {
                systemMonitor.updateHeartbeat('worker1');
            }

            // Execute task with circuit breaker and performance tracking
            const startTime = Date.now();
            const result = await systemMonitor.executeWithCircuitBreaker('worker1', () => 
                worker.performTask()
            );
            const endTime = Date.now();

            // Record performance metrics
            performanceMonitor.recordLatency(endTime - startTime);
            performanceMonitor.recordRequest(true);
            systemMonitor.updateWorkerStats('worker1', true);

            console.log('Task result:', result);
        } catch (error) {
            console.log('Task error:', error.message);
            systemMonitor.recordFailure('worker1');
            performanceMonitor.recordRequest(false);
        }

        // Wait between tasks
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Get final status
    const systemStatus = systemMonitor.getWorkerStatus('worker1');
    const performanceMetrics = performanceMonitor.getMetrics();
    const healthStatus = performanceMonitor.getHealthStatus();

    console.log('\nFinal System Status:', systemStatus);
    console.log('\nFinal Performance Metrics:', {
        cpu: performanceMetrics.cpu.usage.toFixed(2),
        memory: (performanceMetrics.memory.usagePercent * 100).toFixed(2) + '%',
        latency: performanceMetrics.latency.average.toFixed(2) + 'ms',
        requests: performanceMetrics.requests.rate.toFixed(2) + '/s'
    });
    console.log('\nHealth Status:', healthStatus);

    // Cleanup
    systemMonitor.stop();
    performanceMonitor.stop();
    await worker.terminate();
}

main().catch(console.error); 