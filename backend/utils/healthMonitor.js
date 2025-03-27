const EventEmitter = require('events');

class HealthMonitor extends EventEmitter {
    constructor(config = {}) {
        super();
        this.config = {
            heartbeatInterval: config.heartbeatInterval || 5000, // 5 seconds
            maxMissedHeartbeats: config.maxMissedHeartbeats || 3,
            recoveryTimeout: config.recoveryTimeout || 10000, // 10 seconds
            ...config
        };
        this.workers = new Map();
        this.heartbeatInterval = null;
    }

    start() {
        this.heartbeatInterval = setInterval(() => {
            this.checkWorkers();
        }, this.config.heartbeatInterval);
    }

    stop() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    }

    registerWorker(workerId, worker) {
        this.workers.set(workerId, {
            worker,
            lastHeartbeat: Date.now(),
            missedHeartbeats: 0,
            status: 'active'
        });
    }

    unregisterWorker(workerId) {
        this.workers.delete(workerId);
    }

    updateHeartbeat(workerId) {
        const workerInfo = this.workers.get(workerId);
        if (workerInfo) {
            workerInfo.lastHeartbeat = Date.now();
            workerInfo.missedHeartbeats = 0;
            workerInfo.status = 'active';
        }
    }

    async checkWorkers() {
        const now = Date.now();
        
        for (const [workerId, workerInfo] of this.workers.entries()) {
            const timeSinceLastHeartbeat = now - workerInfo.lastHeartbeat;
            
            if (timeSinceLastHeartbeat > this.config.heartbeatInterval) {
                workerInfo.missedHeartbeats++;
                
                if (workerInfo.missedHeartbeats >= this.config.maxMissedHeartbeats) {
                    this.handleWorkerFailure(workerId, workerInfo);
                } else {
                    this.emit('warning', {
                        workerId,
                        missedHeartbeats: workerInfo.missedHeartbeats,
                        timeSinceLastHeartbeat
                    });
                }
            }
        }
    }

    async handleWorkerFailure(workerId, workerInfo) {
        workerInfo.status = 'failed';
        this.emit('failure', { workerId, lastHeartbeat: workerInfo.lastHeartbeat });

        try {
            // Attempt to terminate the failed worker
            await workerInfo.worker.terminate();
            
            // Wait for recovery timeout
            await new Promise(resolve => setTimeout(resolve, this.config.recoveryTimeout));
            
            // Emit recovery event
            this.emit('recovery', { workerId });
        } catch (error) {
            this.emit('error', {
                workerId,
                error: error.message,
                type: 'recovery_failed'
            });
        }
    }

    getWorkerStatus(workerId) {
        const workerInfo = this.workers.get(workerId);
        if (!workerInfo) return null;

        return {
            status: workerInfo.status,
            lastHeartbeat: workerInfo.lastHeartbeat,
            missedHeartbeats: workerInfo.missedHeartbeats,
            uptime: Date.now() - workerInfo.lastHeartbeat
        };
    }

    getAllWorkerStatus() {
        const status = {};
        for (const [workerId, workerInfo] of this.workers.entries()) {
            status[workerId] = this.getWorkerStatus(workerId);
        }
        return status;
    }
}

module.exports = { HealthMonitor }; 