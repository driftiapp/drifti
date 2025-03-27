const { HealthMonitor } = require('./healthMonitor');
const { CircuitBreaker } = require('./circuitBreaker');
const EventEmitter = require('events');

class SystemMonitor extends EventEmitter {
    constructor(config = {}) {
        super();
        this.config = {
            healthCheck: {
                heartbeatInterval: config.heartbeatInterval || 5000,
                maxMissedHeartbeats: config.maxMissedHeartbeats || 3,
                recoveryTimeout: config.recoveryTimeout || 10000,
            },
            circuitBreaker: {
                failureThreshold: config.failureThreshold || 0.5,
                windowSize: config.windowSize || 100,
                resetTimeout: config.resetTimeout || 60000,
                halfOpenTimeout: config.halfOpenTimeout || 30000,
            },
            ...config
        };

        this.healthMonitor = new HealthMonitor(this.config.healthCheck);
        this.circuitBreakers = new Map();
        this.workerStats = new Map();

        // Forward health monitor events
        this.healthMonitor.on('warning', (data) => this.emit('warning', data));
        this.healthMonitor.on('failure', (data) => this.emit('failure', data));
        this.healthMonitor.on('recovery', (data) => this.emit('recovery', data));
        this.healthMonitor.on('error', (data) => this.emit('error', data));
    }

    start() {
        this.healthMonitor.start();
    }

    stop() {
        this.healthMonitor.stop();
    }

    registerWorker(workerId, worker) {
        // Register with health monitor
        this.healthMonitor.registerWorker(workerId, worker);

        // Create circuit breaker for the worker
        const circuitBreaker = new CircuitBreaker(this.config.circuitBreaker);
        
        // Set up circuit breaker event handlers
        circuitBreaker.on('open', (stats) => {
            this.emit('circuitOpen', { workerId, stats });
            this.handleCircuitOpen(workerId, stats);
        });

        circuitBreaker.on('halfOpen', () => {
            this.emit('circuitHalfOpen', { workerId });
        });

        circuitBreaker.on('close', () => {
            this.emit('circuitClose', { workerId });
        });

        this.circuitBreakers.set(workerId, circuitBreaker);
        this.workerStats.set(workerId, {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            lastFailureTime: null
        });
    }

    unregisterWorker(workerId) {
        this.healthMonitor.unregisterWorker(workerId);
        this.circuitBreakers.delete(workerId);
        this.workerStats.delete(workerId);
    }

    updateHeartbeat(workerId) {
        this.healthMonitor.updateHeartbeat(workerId);
        
        // Record success in circuit breaker
        const circuitBreaker = this.circuitBreakers.get(workerId);
        if (circuitBreaker) {
            circuitBreaker.recordSuccess();
            this.updateWorkerStats(workerId, true);
        }
    }

    recordFailure(workerId) {
        const circuitBreaker = this.circuitBreakers.get(workerId);
        if (circuitBreaker) {
            circuitBreaker.recordFailure();
            this.updateWorkerStats(workerId, false);
        }
    }

    updateWorkerStats(workerId, success) {
        const stats = this.workerStats.get(workerId);
        if (stats) {
            stats.totalRequests++;
            if (success) {
                stats.successfulRequests++;
            } else {
                stats.failedRequests++;
                stats.lastFailureTime = Date.now();
            }
        }
    }

    async handleCircuitOpen(workerId, stats) {
        const workerInfo = this.healthMonitor.getWorkerStatus(workerId);
        if (!workerInfo) return;

        // If circuit is open and worker is active, consider it a potential issue
        if (workerInfo.status === 'active') {
            this.emit('warning', {
                workerId,
                type: 'circuit_open_with_active_worker',
                stats,
                workerStatus: workerInfo
            });
        }
    }

    getWorkerStatus(workerId) {
        const healthStatus = this.healthMonitor.getWorkerStatus(workerId);
        if (!healthStatus) return null;

        const circuitBreaker = this.circuitBreakers.get(workerId);
        const circuitState = circuitBreaker ? circuitBreaker.getState() : null;
        const stats = this.workerStats.get(workerId);

        return {
            ...healthStatus,
            circuitState,
            stats
        };
    }

    getAllWorkerStatus() {
        const status = {};
        for (const [workerId] of this.healthMonitor.workers.entries()) {
            status[workerId] = this.getWorkerStatus(workerId);
        }
        return status;
    }

    async executeWithCircuitBreaker(workerId, operation) {
        const circuitBreaker = this.circuitBreakers.get(workerId);
        if (!circuitBreaker) {
            throw new Error(`No circuit breaker found for worker ${workerId}`);
        }

        try {
            const result = await circuitBreaker.execute(operation);
            this.updateWorkerStats(workerId, true);
            return result;
        } catch (error) {
            this.updateWorkerStats(workerId, false);
            throw error;
        }
    }
}

module.exports = { SystemMonitor }; 