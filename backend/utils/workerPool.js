const { Worker } = require('worker_threads');
const path = require('path');

class WorkerPool {
    constructor(config = {}) {
        this.config = {
            maxWorkers: config.maxWorkers || Math.max(1, require('os').cpus().length - 1),
            workerPath: config.workerPath || path.join(__dirname, 'worker.js'),
            ...config
        };
        this.workers = [];
        this.queue = [];
        this.activeWorkers = new Set();
    }

    async initialize() {
        // Create worker pool
        for (let i = 0; i < this.config.maxWorkers; i++) {
            const worker = new Worker(this.config.workerPath);
            this.workers.push({
                worker,
                busy: false
            });
        }
    }

    async executeTask(task) {
        return new Promise((resolve, reject) => {
            const worker = this.getAvailableWorker();
            if (!worker) {
                this.queue.push({ task, resolve, reject });
                this.processQueue();
                return;
            }

            this.runTask(worker, task, resolve, reject);
        });
    }

    getAvailableWorker() {
        return this.workers.find(w => !w.busy);
    }

    async runTask(workerInfo, task, resolve, reject) {
        workerInfo.busy = true;
        this.activeWorkers.add(workerInfo);

        const messageHandler = (result) => {
            if (result.success) {
                resolve(result.result);
            } else {
                reject(new Error(result.error));
            }
            this.cleanup(workerInfo);
        };

        const errorHandler = (error) => {
            reject(error);
            this.cleanup(workerInfo);
        };

        workerInfo.worker.once('message', messageHandler);
        workerInfo.worker.once('error', errorHandler);

        try {
            workerInfo.worker.postMessage(task);
        } catch (error) {
            this.cleanup(workerInfo);
            reject(error);
        }
    }

    cleanup(workerInfo) {
        workerInfo.busy = false;
        this.activeWorkers.delete(workerInfo);
        this.processQueue();
    }

    async processQueue() {
        if (this.queue.length === 0) return;

        const worker = this.getAvailableWorker();
        if (!worker) return;

        const { task, resolve, reject } = this.queue.shift();
        await this.runTask(worker, task, resolve, reject);
    }

    async terminate() {
        // Terminate all workers
        await Promise.all(
            this.workers.map(workerInfo => workerInfo.worker.terminate())
        );
        this.workers = [];
        this.activeWorkers.clear();
        this.queue = [];
    }

    getStatus() {
        return {
            totalWorkers: this.workers.length,
            activeWorkers: this.activeWorkers.size,
            queueLength: this.queue.length
        };
    }
}

module.exports = { WorkerPool }; 