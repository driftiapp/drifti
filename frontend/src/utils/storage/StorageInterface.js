/**
 * Interface for storage implementations
 */
class StorageInterface {
    /**
     * Initialize the storage
     * @returns {Promise<void>}
     */
    async initialize() {
        throw new Error('Method not implemented');
    }

    /**
     * Get configuration by key
     * @param {string} key - The key to retrieve
     * @returns {Promise<any>} The stored value
     */
    async get(key) {
        throw new Error('Method not implemented');
    }

    /**
     * Set configuration by key
     * @param {string} key - The key to store
     * @param {any} value - The value to store
     * @returns {Promise<void>}
     */
    async set(key, value) {
        throw new Error('Method not implemented');
    }

    /**
     * Delete configuration by key
     * @param {string} key - The key to delete
     * @returns {Promise<void>}
     */
    async delete(key) {
        throw new Error('Method not implemented');
    }

    /**
     * List all keys
     * @returns {Promise<string[]>} Array of keys
     */
    async list() {
        throw new Error('Method not implemented');
    }

    /**
     * Clear all data
     * @returns {Promise<void>}
     */
    async clear() {
        throw new Error('Method not implemented');
    }
}

export default StorageInterface; 