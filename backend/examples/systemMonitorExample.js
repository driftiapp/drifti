const { SystemMonitor } = require('../utils/systemMonitor');

// Simulated worker class
class SimulatedWorker {
    constructor(id) {
        this.id = id;
        this.isRunning = false;
    }

    async start() {
        this.isRunning = true;
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
        // Simulate random failures (20% chance)
        if (Math.random() < 0.2) {
            throw new Error('Task failed');
        }
        return `Task completed by worker ${this.id}`;
    }
}

async function main() {
    // Create system monitor
    const monitor = new SystemMonitor({
        heartbeatInterval: 2000,
        maxMissedHeartbeats: 2,
        failureThreshold: 0.3, // 30% failure rate threshold
        windowSize: 10
    });

    // Set up event listeners
    monitor.on('warning', (data) => {
        console.log('Warning:', data);
    });

    monitor.on('failure', (data) => {
        console.log('Failure:', data);
    });

    monitor.on('circuitOpen', (data) => {
        console.log('Circuit Open:', data);
    });

    monitor.on('circuitClose', (data) => {
        console.log('Circuit Close:', data);
    });

    // Create and register a worker
    const worker = new SimulatedWorker('worker1');
    monitor.registerWorker('worker1', worker);

    // Start the monitor
    monitor.start();

    // Start the worker
    await worker.start();

    // Simulate some tasks
    for (let i = 0; i < 20; i++) {
        try {
            // Update heartbeat every 2 seconds
            if (i % 2 === 0) {
                monitor.updateHeartbeat('worker1');
            }

            // Execute task with circuit breaker
            const result = await monitor.executeWithCircuitBreaker('worker1', () => 
                worker.performTask()
            );
            console.log('Task result:', result);
        } catch (error) {
            console.log('Task error:', error.message);
            monitor.recordFailure('worker1');
        }

        // Wait between tasks
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Get final status
    const status = monitor.getWorkerStatus('worker1');
    console.log('Final worker status:', status);

    // Cleanup
    monitor.stop();
    await worker.terminate();
}

main().catch(console.error); 