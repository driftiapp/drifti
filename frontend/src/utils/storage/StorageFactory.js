import LocalStorage from './LocalStorage';
import RedisStorage from './RedisStorage';
import MongoStorage from './MongoStorage';

class StorageFactory {
    static async createStorage(type, options = {}) {
        let storage;

        switch (type.toLowerCase()) {
            case 'local':
                storage = new LocalStorage(options);
                break;
            case 'redis':
                storage = new RedisStorage(options);
                break;
            case 'mongo':
                storage = new MongoStorage(options);
                break;
            default:
                throw new Error(`Unsupported storage type: ${type}`);
        }

        await storage.initialize();
        return storage;
    }

    static async createMultiStorage(options = {}) {
        const storages = [];
        const types = options.types || ['local'];

        for (const type of types) {
            try {
                const storage = await this.createStorage(type, options[type] || {});
                storages.push(storage);
            } catch (error) {
                console.error(`Failed to initialize ${type} storage:`, error);
                if (options.failFast) {
                    throw error;
                }
            }
        }

        return new MultiStorage(storages);
    }
}

class MultiStorage {
    constructor(storages) {
        this.storages = storages;
    }

    async get(key) {
        for (const storage of this.storages) {
            try {
                const value = await storage.get(key);
                if (value !== null) {
                    return value;
                }
            } catch (error) {
                console.error(`Failed to get from ${storage.constructor.name}:`, error);
            }
        }
        return null;
    }

    async set(key, value) {
        const promises = this.storages.map(storage =>
            storage.set(key, value).catch(error => {
                console.error(`Failed to set in ${storage.constructor.name}:`, error);
                return null;
            })
        );
        await Promise.all(promises);
    }

    async delete(key) {
        const promises = this.storages.map(storage =>
            storage.delete(key).catch(error => {
                console.error(`Failed to delete from ${storage.constructor.name}:`, error);
                return null;
            })
        );
        await Promise.all(promises);
    }

    async list() {
        for (const storage of this.storages) {
            try {
                const keys = await storage.list();
                if (keys.length > 0) {
                    return keys;
                }
            } catch (error) {
                console.error(`Failed to list from ${storage.constructor.name}:`, error);
            }
        }
        return [];
    }

    async clear() {
        const promises = this.storages.map(storage =>
            storage.clear().catch(error => {
                console.error(`Failed to clear ${storage.constructor.name}:`, error);
                return null;
            })
        );
        await Promise.all(promises);
    }

    async close() {
        const promises = this.storages.map(storage =>
            storage.close().catch(error => {
                console.error(`Failed to close ${storage.constructor.name}:`, error);
                return null;
            })
        );
        await Promise.all(promises);
    }
}

export default StorageFactory; 