import { redisService } from './redisService';
import { logger } from '../utils/logger';

interface SystemMetrics {
    onlineUsers: number;
    websocketConnections: number;
    redisMemoryUsage: number;
    uptime: number;
    lastCleanup: number;
}

class MetricsService {
    private static instance: MetricsService;
    private metrics: SystemMetrics = {
        onlineUsers: 0,
        websocketConnections: 0,
        redisMemoryUsage: 0,
        uptime: 0,
        lastCleanup: 0
    };
    private startTime: number = Date.now();
    private updateInterval: NodeJS.Timeout | null = null;

    private constructor() {
        this.startMetricsCollection();
    }

    public static getInstance(): MetricsService {
        if (!MetricsService.instance) {
            MetricsService.instance = new MetricsService();
        }
        return MetricsService.instance;
    }

    private async startMetricsCollection() {
        this.updateInterval = setInterval(async () => {
            try {
                await this.updateMetrics();
            } catch (error) {
                logger.error('Failed to update metrics:', error);
            }
        }, 60000); // Update every minute
    }

    private async updateMetrics() {
        try {
            // Get online users count
            const onlineUsers = await redisService.client.hlen('online_users');

            // Get Redis memory usage
            const memoryInfo = await redisService.client.info('memory');
            const memoryUsage = parseInt(memoryInfo.split('\r\n')
                .find(line => line.startsWith('used_memory:'))
                ?.split(':')[1] || '0');

            // Update metrics
            this.metrics = {
                onlineUsers,
                websocketConnections: this.metrics.websocketConnections, // Updated by WebSocket service
                redisMemoryUsage: memoryUsage,
                uptime: Date.now() - this.startTime,
                lastCleanup: Date.now()
            };

            // Log metrics
            logger.info('System metrics updated:', this.metrics);
        } catch (error) {
            logger.error('Failed to update metrics:', error);
        }
    }

    public getMetrics(): SystemMetrics {
        return { ...this.metrics };
    }

    public updateWebSocketConnections(count: number) {
        this.metrics.websocketConnections = count;
    }

    public async shutdown(): Promise<void> {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }
}

export const metricsService = MetricsService.getInstance(); 