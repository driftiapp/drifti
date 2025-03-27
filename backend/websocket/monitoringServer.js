const WebSocket = require('ws');
const { SystemMonitor } = require('../utils/systemMonitor');
const { PerformanceMonitor } = require('../utils/performanceMonitor');

class MonitoringWebSocketServer {
    constructor(server) {
        this.wss = new WebSocket.Server({ server });
        this.clients = new Set();

        // Initialize monitors with default config
        this.config = {
            thresholds: {
                cpu: 0.8,
                memory: 0.85,
                latency: 1000
            },
            alerts: {
                email: true,
                slack: false,
                browser: true
            },
            autoScaling: {
                enabled: false,
                minInstances: 1,
                maxInstances: 5,
                scaleUpThreshold: 0.8,
                scaleDownThreshold: 0.3
            },
            display: {
                showP95: true,
                showP99: true,
                historicalDataPoints: 50
            }
        };

        this.systemMonitor = new SystemMonitor({
            heartbeatInterval: 5000,
            failureThreshold: 0.5,
            windowSize: 100
        });

        this.performanceMonitor = new PerformanceMonitor({
            collectionInterval: 1000,
            memoryThreshold: this.config.thresholds.memory,
            cpuThreshold: this.config.thresholds.cpu,
            latencyThreshold: this.config.thresholds.latency
        });

        // Set up event handlers
        this.setupEventHandlers();
    }

    setupEventHandlers() {
        // Handle WebSocket connections
        this.wss.on('connection', (ws) => {
            this.clients.add(ws);
            console.log('New client connected');

            // Send initial metrics and config
            this.sendMetrics(ws);
            this.sendConfig(ws);

            // Handle incoming messages
            ws.on('message', (message) => {
                try {
                    const data = JSON.parse(message);
                    if (data.type === 'config_update') {
                        this.handleConfigUpdate(data.config);
                    }
                } catch (error) {
                    console.error('Error handling message:', error);
                }
            });

            ws.on('close', () => {
                this.clients.delete(ws);
                console.log('Client disconnected');
            });
        });

        // Forward system monitor events
        this.systemMonitor.on('warning', (data) => {
            this.broadcast({
                type: 'warning',
                warning: {
                    type: 'system_warning',
                    value: data.missedHeartbeats,
                    threshold: this.systemMonitor.config.maxMissedHeartbeats
                }
            });
        });

        this.systemMonitor.on('failure', (data) => {
            this.broadcast({
                type: 'warning',
                warning: {
                    type: 'system_failure',
                    value: 1,
                    threshold: 1
                }
            });
        });

        // Forward performance monitor events
        this.performanceMonitor.on('warning', (data) => {
            this.broadcast({
                type: 'warning',
                warning: data
            });
        });

        this.performanceMonitor.on('metrics', (metrics) => {
            this.broadcast({
                type: 'metrics',
                metrics: {
                    cpu: metrics.cpu,
                    memory: metrics.memory,
                    latency: metrics.latency,
                    requests: metrics.requests
                }
            });

            // Check auto-scaling conditions if enabled
            if (this.config.autoScaling.enabled) {
                this.checkAutoScaling(metrics);
            }
        });
    }

    handleConfigUpdate(newConfig) {
        this.config = { ...this.config, ...newConfig };
        
        // Update monitor configurations
        this.performanceMonitor.config = {
            ...this.performanceMonitor.config,
            memoryThreshold: this.config.thresholds.memory,
            cpuThreshold: this.config.thresholds.cpu,
            latencyThreshold: this.config.thresholds.latency
        };

        // Broadcast config update to all clients
        this.broadcast({
            type: 'config_update',
            config: this.config
        });

        console.log('Configuration updated:', this.config);
    }

    checkAutoScaling(metrics) {
        const { cpu } = metrics;
        const { scaleUpThreshold, scaleDownThreshold, minInstances, maxInstances } = this.config.autoScaling;

        if (cpu.usage > scaleUpThreshold) {
            this.broadcast({
                type: 'auto_scaling',
                action: 'scale_up',
                reason: 'High CPU usage',
                currentUsage: cpu.usage,
                threshold: scaleUpThreshold
            });
        } else if (cpu.usage < scaleDownThreshold) {
            this.broadcast({
                type: 'auto_scaling',
                action: 'scale_down',
                reason: 'Low CPU usage',
                currentUsage: cpu.usage,
                threshold: scaleDownThreshold
            });
        }
    }

    sendMetrics(client) {
        const metrics = {
            type: 'metrics',
            metrics: {
                cpu: this.performanceMonitor.metrics.cpu,
                memory: this.performanceMonitor.metrics.memory,
                latency: this.performanceMonitor.metrics.latency,
                requests: this.performanceMonitor.metrics.requests
            }
        };

        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(metrics));
        }
    }

    sendConfig(client) {
        const config = {
            type: 'config',
            config: this.config
        };

        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(config));
        }
    }

    broadcast(data) {
        const message = JSON.stringify(data);
        this.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    }

    start() {
        this.systemMonitor.start();
        this.performanceMonitor.start();
        console.log('Monitoring WebSocket server started');
    }

    stop() {
        this.systemMonitor.stop();
        this.performanceMonitor.stop();
        this.wss.close();
        console.log('Monitoring WebSocket server stopped');
    }
}

module.exports = { MonitoringWebSocketServer }; 