import StorageInterface from './StorageInterface';
import { MongoClient } from 'mongodb';

class MongoStorage extends StorageInterface {
    constructor(options = {}) {
        super();
        this.options = {
            url: options.url || 'mongodb://localhost:27017',
            dbName: options.dbName || 'monitoring',
            collectionName: options.collectionName || 'configurations',
            ...options
        };
        this.client = null;
        this.db = null;
        this.collection = null;
    }

    async initialize() {
        try {
            this.client = await MongoClient.connect(this.options.url);
            this.db = this.client.db(this.options.dbName);
            this.collection = this.db.collection(this.options.collectionName);
            
            // Create indexes for better query performance
            await this.collection.createIndex({ key: 1 }, { unique: true });
            await this.collection.createIndex({ 'metadata.timestamp': -1 });
            await this.collection.createIndex({ 'metadata.status': 1 });
            
            console.log('MongoDB storage initialized successfully');
        } catch (error) {
            console.error('Failed to initialize MongoDB storage:', error);
            throw error;
        }
    }

    async get(key) {
        try {
            const doc = await this.collection.findOne({ key });
            return doc ? doc.value : null;
        } catch (error) {
            console.error(`Failed to get key ${key} from MongoDB:`, error);
            throw error;
        }
    }

    async set(key, value) {
        try {
            const metadata = {
                timestamp: new Date(),
                ...(value.metadata || {})
            };

            await this.collection.updateOne(
                { key },
                {
                    $set: {
                        key,
                        value,
                        metadata
                    }
                },
                { upsert: true }
            );
        } catch (error) {
            console.error(`Failed to set key ${key} in MongoDB:`, error);
            throw error;
        }
    }

    async delete(key) {
        try {
            await this.collection.deleteOne({ key });
        } catch (error) {
            console.error(`Failed to delete key ${key} from MongoDB:`, error);
            throw error;
        }
    }

    async list() {
        try {
            const docs = await this.collection.find({}, { projection: { key: 1 } }).toArray();
            return docs.map(doc => doc.key);
        } catch (error) {
            console.error('Failed to list keys from MongoDB:', error);
            throw error;
        }
    }

    async clear() {
        try {
            await this.collection.deleteMany({});
        } catch (error) {
            console.error('Failed to clear MongoDB storage:', error);
            throw error;
        }
    }

    async queryHistory(options = {}) {
        try {
            const {
                status,
                startDate,
                endDate,
                tags,
                author,
                limit = 50,
                skip = 0
            } = options;

            const query = {};
            if (status) query['metadata.status'] = status;
            if (startDate || endDate) {
                query['metadata.timestamp'] = {};
                if (startDate) query['metadata.timestamp'].$gte = new Date(startDate);
                if (endDate) query['metadata.timestamp'].$lte = new Date(endDate);
            }
            if (tags && tags.length > 0) {
                query['metadata.tags'] = { $all: tags };
            }
            if (author) query['metadata.author'] = author;

            return await this.collection
                .find(query)
                .sort({ 'metadata.timestamp': -1 })
                .skip(skip)
                .limit(limit)
                .toArray();
        } catch (error) {
            console.error('Failed to query history from MongoDB:', error);
            throw error;
        }
    }

    async close() {
        if (this.client) {
            await this.client.close();
        }
    }
}

export default MongoStorage; 