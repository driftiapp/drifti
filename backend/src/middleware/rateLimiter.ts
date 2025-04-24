import { Request, Response, NextFunction } from 'express';
import { redisService } from '../services/redisService';
import { logger } from '../utils/logger';

interface RateLimitConfig {
    windowMs: number;
    max: number;
    keyPrefix: string;
}

export const createRateLimiter = (config: RateLimitConfig) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        const key = `${config.keyPrefix}:${req.ip}`;

        try {
            const current = await redisService.client.incr(key);

            if (current === 1) {
                await redisService.client.expire(key, config.windowMs / 1000);
            }

            if (current > config.max) {
                logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
                return res.status(429).json({
                    error: 'Too many requests',
                    retryAfter: config.windowMs / 1000
                });
            }

            next();
        } catch (error) {
            logger.error('Rate limiter error:', error);
            next(); // Fail open - allow the request to proceed
        }
    };
};

// Default rate limiter configuration
export const defaultRateLimiter = createRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    max: 100, // 100 requests per minute
    keyPrefix: 'rate_limit'
}); 