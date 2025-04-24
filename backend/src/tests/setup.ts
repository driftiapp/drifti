import dotenv from 'dotenv';
import type { Config } from '@jest/types';

// Load environment variables from .env file
dotenv.config();

// Set test environment variables
process.env.REDIS_HOST = process.env.REDIS_HOST || 'localhost';
process.env.REDIS_PORT = process.env.REDIS_PORT || '6379';

// Global test timeout
const config: Config.InitialOptions = {
    testTimeout: 10000,
};

export default config; 