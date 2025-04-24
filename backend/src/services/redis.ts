import Redis from 'ioredis';
import { logger } from '../utils/logger';

class RedisService {
    private client: Redis;
    private subscriber: Redis;
    private publisher: Redis;

    constructor() {
        const config = {
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT || '6379', 10),
            retryStrategy: (times: number) => {
                const delay = Math.min(times * 50, 2000);
                return delay;
            },
            maxRetriesPerRequest: 3,
        };

        this.client = new Redis(config);
        this.subscriber = new Redis(config);
        this.publisher = new Redis(config);

        this.setupEventListeners();
    }

    private setupEventListeners() {
        const handleError = (type: string) => (error: Error) => {
            logger.error(`Redis ${type} error:`, error);
        };

        const handleConnect = (type: string) => () => {
            logger.info(`Redis ${type} connected successfully`);
        };

        this.client.on('error', handleError('client'));
        this.client.on('connect', handleConnect('client'));
        this.subscriber.on('error', handleError('subscriber'));
        this.subscriber.on('connect', handleConnect('subscriber'));
        this.publisher.on('error', handleError('publisher'));
        this.publisher.on('connect', handleConnect('publisher'));
    }

    private parseJSON<T>(value: string | null): T | null {
        if (!value) return null;
        try {
            return JSON.parse(value) as T;
        } catch (error) {
            logger.error('Error parsing JSON:', error);
            return null;
        }
    }

    async set(key: string, value: any, ttl?: number): Promise<void> {
        try {
            const stringValue = JSON.stringify(value);
            if (ttl) {
                await this.client.setex(key, ttl, stringValue);
            } else {
                await this.client.set(key, stringValue);
            }
        } catch (error) {
            logger.error('Error setting value:', error);
            throw error;
        }
    }

    async get<T>(key: string): Promise<T | null> {
        try {
            const value = await this.client.get(key);
            return this.parseJSON<T>(value);
        } catch (error) {
            logger.error('Error getting value:', error);
            throw error;
        }
    }

    async delete(key: string): Promise<void> {
        try {
            await this.client.del(key);
        } catch (error) {
            logger.error('Error deleting value:', error);
            throw error;
        }
    }

    async publish(channel: string, message: any): Promise<void> {
        try {
            const stringMessage = JSON.stringify(message);
            await this.publisher.publish(channel, stringMessage);
        } catch (error) {
            logger.error('Error publishing message:', error);
            throw error;
        }
    }

    async subscribe(channel: string, callback: (message: any) => void): Promise<void> {
        try {
            await this.subscriber.subscribe(channel);
            this.subscriber.on('message', (ch, message) => {
                if (ch === channel) {
                    const parsedMessage = this.parseJSON(message);
                    if (parsedMessage !== null) {
                        callback(parsedMessage);
                    }
                }
            });
        } catch (error) {
            logger.error('Error subscribing to channel:', error);
            throw error;
        }
    }

    async quit(): Promise<void> {
        try {
            await Promise.all([
                this.client.quit(),
                this.subscriber.quit(),
                this.publisher.quit(),
            ]);
        } catch (error) {
            logger.error('Error quitting Redis connections:', error);
            throw error;
        }
    }

    async ping(): Promise<boolean> {
        try {
            const result = await this.client.ping();
            return result === 'PONG';
        } catch (error) {
            logger.error('Redis ping failed:', error);
            return false;
        }
    }
}

export const redisService = new RedisService();
export default redisService; 