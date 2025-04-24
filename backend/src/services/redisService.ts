import Redis from 'ioredis';
import { logger } from '../utils/logger';

export class RedisService {
    private _client: Redis;
    private subscriber: Redis;
    private publisher: Redis;
    private isConnected: boolean = false;

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

        this._client = new Redis(config);
        this.subscriber = new Redis(config);
        this.publisher = new Redis(config);

        this.setupEventListeners();
    }

    // Expose client for testing purposes
    get client(): Redis {
        return this._client;
    }

    private setupEventListeners() {
        const handleError = (type: string) => (error: Error) => {
            this.isConnected = false;
            logger.error(`Redis ${type} error:`, error);
        };

        const handleConnect = (type: string) => () => {
            this.isConnected = true;
            logger.info(`Redis ${type} connected successfully`);
        };

        this._client.on('error', handleError('client'));
        this._client.on('connect', handleConnect('client'));
        this._client.on('close', () => {
            this.isConnected = false;
            logger.info('Redis client connection closed');
        });

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

    private async ensureConnection(): Promise<void> {
        if (!this.isConnected) {
            throw new Error('Redis is not connected');
        }
    }

    // Basic operations
    async set(key: string, value: any, ttl?: number): Promise<void> {
        try {
            await this.ensureConnection();
            const stringValue = JSON.stringify(value);
            if (ttl) {
                await this._client.setex(key, ttl, stringValue);
            } else {
                await this._client.set(key, stringValue);
            }
        } catch (error) {
            logger.error('Error setting value:', error);
            throw error;
        }
    }

    async get<T>(key: string): Promise<T | null> {
        try {
            await this.ensureConnection();
            const value = await this._client.get(key);
            return this.parseJSON<T>(value);
        } catch (error) {
            logger.error('Error getting value:', error);
            throw error;
        }
    }

    async delete(key: string): Promise<void> {
        try {
            await this.ensureConnection();
            await this._client.del(key);
        } catch (error) {
            logger.error('Error deleting value:', error);
            throw error;
        }
    }

    // Pub/Sub operations
    async publish(channel: string, message: any): Promise<void> {
        try {
            await this.ensureConnection();
            const stringMessage = JSON.stringify(message);
            await this.publisher.publish(channel, stringMessage);
        } catch (error) {
            logger.error('Error publishing message:', error);
            throw error;
        }
    }

    async subscribe(channel: string, callback: (message: any) => void): Promise<void> {
        try {
            await this.ensureConnection();
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

    // List operations
    async lpush(key: string, value: any): Promise<void> {
        try {
            const stringValue = JSON.stringify(value);
            await this._client.lpush(key, stringValue);
        } catch (error) {
            logger.error('Error pushing to list:', error);
            throw error;
        }
    }

    async rpop<T>(key: string): Promise<T | null> {
        try {
            const value = await this._client.rpop(key);
            return value ? JSON.parse(value) : null;
        } catch (error) {
            logger.error('Error popping from list:', error);
            throw error;
        }
    }

    // Set operations
    async sadd(key: string, value: any): Promise<void> {
        try {
            const stringValue = JSON.stringify(value);
            await this._client.sadd(key, stringValue);
        } catch (error) {
            logger.error('Error adding to set:', error);
            throw error;
        }
    }

    async smembers<T>(key: string): Promise<T[]> {
        try {
            const values = await this._client.smembers(key);
            return values.map(value => JSON.parse(value));
        } catch (error) {
            logger.error('Error getting set members:', error);
            throw error;
        }
    }

    // Hash operations
    async hset(key: string, field: string, value: any): Promise<void> {
        try {
            const stringValue = JSON.stringify(value);
            await this._client.hset(key, field, stringValue);
        } catch (error) {
            logger.error('Error setting hash field:', error);
            throw error;
        }
    }

    async hget<T>(key: string, field: string): Promise<T | null> {
        try {
            const value = await this._client.hget(key, field);
            return value ? JSON.parse(value) : null;
        } catch (error) {
            logger.error('Error getting hash field:', error);
            throw error;
        }
    }

    // Cleanup
    async quit(): Promise<void> {
        try {
            const quitPromises = [
                this._client.quit().catch(() => { }),
                this.subscriber.quit().catch(() => { }),
                this.publisher.quit().catch(() => { }),
            ];
            await Promise.all(quitPromises);
            this.isConnected = false;
        } catch (error) {
            logger.error('Error quitting Redis connections:', error);
            throw error;
        }
    }

    async ping(): Promise<boolean> {
        try {
            const result = await this._client.ping();
            return result === 'PONG';
        } catch (error) {
            logger.error('Redis ping failed:', error);
            return false;
        }
    }

    async flushall(): Promise<void> {
        try {
            await this.ensureConnection();
            await this._client.flushall();
        } catch (error) {
            logger.error('Error flushing Redis:', error);
            throw error;
        }
    }

    async disconnect(): Promise<void> {
        try {
            await this._client.disconnect();
            await this.subscriber.disconnect();
            await this.publisher.disconnect();
            this.isConnected = false;
        } catch (error) {
            logger.error('Error disconnecting Redis:', error);
            throw error;
        }
    }

    async connect(): Promise<void> {
        try {
            await this._client.connect();
            await this.subscriber.connect();
            await this.publisher.connect();
            this.isConnected = true;
        } catch (error) {
            logger.error('Error connecting Redis:', error);
            throw error;
        }
    }
}

export const redisService = new RedisService();
export default redisService; 