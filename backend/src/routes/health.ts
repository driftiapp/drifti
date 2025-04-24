import { Router } from 'express';
import { checkRedisHealth } from '../services/redis';
import { logger } from '../utils/logger';

const router = Router();

router.get('/health', async (req, res) => {
    try {
        const redisHealth = await checkRedisHealth();

        const healthStatus = {
            status: 'ok',
            timestamp: new Date().toISOString(),
            services: {
                redis: redisHealth ? 'healthy' : 'unhealthy',
            },
        };

        const statusCode = redisHealth ? 200 : 503;
        res.status(statusCode).json(healthStatus);
    } catch (error) {
        logger.error('Health check failed:', error);
        res.status(500).json({
            status: 'error',
            message: 'Health check failed',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});

export default router; 