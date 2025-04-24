import { Redis } from '@upstash/redis'
import { AuthError } from './auth-errors'

interface RateLimitConfig {
    maxAttempts: number
    windowMs: number
    blockDurationMs: number
}

const defaultConfig: RateLimitConfig = {
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
    blockDurationMs: 30 * 60 * 1000, // 30 minutes
}

export class RateLimiter {
    private redis: Redis
    private config: RateLimitConfig

    constructor(redis: Redis, config: Partial<RateLimitConfig> = {}) {
        this.redis = redis
        this.config = { ...defaultConfig, ...config }
    }

    private getKey(identifier: string): string {
        return `rate-limit:${identifier}`
    }

    private getBlockKey(identifier: string): string {
        return `rate-limit-block:${identifier}`
    }

    async check(identifier: string): Promise<void> {
        const blockKey = this.getBlockKey(identifier)
        const isBlocked = await this.redis.get(blockKey)

        if (isBlocked) {
            throw new AuthError(
                'Too many attempts. Please try again later.',
                'RATE_LIMIT_EXCEEDED',
                429
            )
        }

        const key = this.getKey(identifier)
        const attempts = await this.redis.incr(key)

        if (attempts === 1) {
            await this.redis.expire(key, this.config.windowMs / 1000)
        }

        if (attempts > this.config.maxAttempts) {
            await this.redis.setex(
                blockKey,
                this.config.blockDurationMs / 1000,
                '1'
            )
            throw new AuthError(
                'Too many attempts. Please try again later.',
                'RATE_LIMIT_EXCEEDED',
                429
            )
        }
    }

    async reset(identifier: string): Promise<void> {
        const key = this.getKey(identifier)
        const blockKey = this.getBlockKey(identifier)
        await Promise.all([
            this.redis.del(key),
            this.redis.del(blockKey)
        ])
    }
} 