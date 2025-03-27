import StorageInterface from './StorageInterface';
import Redis from 'ioredis';

class RedisStorage extends StorageInterface {
    constructor(options = {}) {
        super();
        this.options = {
            host: options.host || 'localhost',
            port: options.port || 6379,
            password: options.password,
            db: options.db || 0,
            keyPrefix: options.keyPrefix || 'monitoring:',
            ...options
        };
        this.client = null;
    }

    async initialize() {
        try {
            this.client = new Redis(this.options);
            await this.client.ping();
            console.log('Redis storage initialized successfully');
        } catch (error) {
            console.error('Failed to initialize Redis storage:', error);
            throw error;
        }
    }

    async get(key) {
        try {
            const value = await this.client.get(this.options.keyPrefix + key);
            return value ? JSON.parse(value) : null;
        } catch (error) {
            console.error(`Failed to get key ${key} from Redis:`, error);
            throw error;
        }
    }

    async set(key, value) {
        try {
            await this.client.set(
                this.options.keyPrefix + key,
                JSON.stringify(value)
            );
        } catch (error) {
            console.error(`Failed to set key ${key} in Redis:`, error);
            throw error;
        }
    }

    async delete(key) {
        try {
            await this.client.del(this.options.keyPrefix + key);
        } catch (error) {
            console.error(`Failed to delete key ${key} from Redis:`, error);
            throw error;
        }
    }

    async list() {
        try {
            const keys = await this.client.keys(this.options.keyPrefix + '*');
            return keys.map(key => key.slice(this.options.keyPrefix.length));
        } catch (error) {
            console.error('Failed to list keys from Redis:', error);
            throw error;
        }
    }

    async clear() {
        try {
            const keys = await this.client.keys(this.options.keyPrefix + '*');
            if (keys.length > 0) {
                await this.client.del(keys);
            }
        } catch (error) {
            console.error('Failed to clear Redis storage:', error);
            throw error;
        }
    }

    async close() {
        if (this.client) {
            await this.client.quit();
        }
    }
}

export default RedisStorage; 