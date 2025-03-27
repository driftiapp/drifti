const EventEmitter = require('events');

class CircuitBreaker extends EventEmitter {
    constructor(config = {}) {
        super();
        this.config = {
            failureThreshold: config.failureThreshold || 0.5, // 50% failure rate threshold
            windowSize: config.windowSize || 100, // Number of requests to consider
            resetTimeout: config.resetTimeout || 60000, // 1 minute reset timeout
            halfOpenTimeout: config.halfOpenTimeout || 30000, // 30 seconds half-open timeout
            ...config
        };
        
        this.state = 'CLOSED';
        this.failures = [];
        this.successes = [];
        this.lastFailureTime = null;
        this.resetTimer = null;
        this.halfOpenTimer = null;
    }

    async execute(operation) {
        if (this.state === 'OPEN') {
            if (this.shouldAttemptReset()) {
                this.moveToHalfOpen();
            } else {
                throw new Error('Circuit breaker is OPEN');
            }
        }

        try {
            const result = await operation();
            this.recordSuccess();
            return result;
        } catch (error) {
            this.recordFailure();
            throw error;
        }
    }

    recordSuccess() {
        const now = Date.now();
        this.successes.push(now);
        this.cleanupOldRecords(now);
        
        if (this.state === 'HALF_OPEN') {
            this.close();
        }
    }

    recordFailure() {
        const now = Date.now();
        this.failures.push(now);
        this.lastFailureTime = now;
        this.cleanupOldRecords(now);

        if (this.shouldOpen()) {
            this.open();
        }
    }

    cleanupOldRecords(now) {
        const cutoff = now - (this.config.windowSize * 1000);
        
        this.failures = this.failures.filter(time => time > cutoff);
        this.successes = this.successes.filter(time => time > cutoff);
    }

    shouldOpen() {
        const totalRequests = this.failures.length + this.successes.length;
        if (totalRequests < this.config.windowSize) {
            return false;
        }

        const failureRate = this.failures.length / totalRequests;
        return failureRate >= this.config.failureThreshold;
    }

    shouldAttemptReset() {
        if (!this.lastFailureTime) return true;
        return Date.now() - this.lastFailureTime >= this.config.resetTimeout;
    }

    open() {
        if (this.state === 'OPEN') return;
        
        this.state = 'OPEN';
        this.emit('open', {
            failureCount: this.failures.length,
            successCount: this.successes.length,
            failureRate: this.failures.length / (this.failures.length + this.successes.length)
        });

        // Set timer to attempt reset
        this.resetTimer = setTimeout(() => {
            this.moveToHalfOpen();
        }, this.config.resetTimeout);
    }

    moveToHalfOpen() {
        if (this.state === 'HALF_OPEN') return;
        
        this.state = 'HALF_OPEN';
        this.emit('halfOpen');
        
        // Clear any existing timers
        if (this.resetTimer) clearTimeout(this.resetTimer);
        if (this.halfOpenTimer) clearTimeout(this.halfOpenTimer);
        
        // Set timer to close if no successful requests
        this.halfOpenTimer = setTimeout(() => {
            this.open();
        }, this.config.halfOpenTimeout);
    }

    close() {
        if (this.state === 'CLOSED') return;
        
        this.state = 'CLOSED';
        this.emit('close');
        
        // Clear any existing timers
        if (this.resetTimer) clearTimeout(this.resetTimer);
        if (this.halfOpenTimer) clearTimeout(this.halfOpenTimer);
    }

    getState() {
        return {
            state: this.state,
            failureCount: this.failures.length,
            successCount: this.successes.length,
            failureRate: this.failures.length / (this.failures.length + this.successes.length),
            lastFailureTime: this.lastFailureTime
        };
    }
}

module.exports = { CircuitBreaker }; 