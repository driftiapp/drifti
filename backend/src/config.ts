import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export const config = {
    // Server Configuration
    port: parseInt(process.env.PORT || '3000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',

    // WebSocket Configuration
    wsPort: parseInt(process.env.WS_PORT || '8080', 10),
    wsPath: process.env.WS_PATH || '/ws',
    wsPingInterval: parseInt(process.env.WS_PING_INTERVAL || '30000', 10),
    wsPingTimeout: parseInt(process.env.WS_PING_TIMEOUT || '10000', 10),

    // JWT Configuration
    jwtSecret: process.env.JWT_SECRET || '',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1h',

    // Admin Dashboard
    adminUsername: process.env.ADMIN_USERNAME || 'admin',
    adminPassword: process.env.ADMIN_PASSWORD || '',

    // Redis Configuration
    redisHost: process.env.REDIS_HOST || 'localhost',
    redisPort: parseInt(process.env.REDIS_PORT || '6379', 10),
    redisPassword: process.env.REDIS_PASSWORD || '',
    redisDb: parseInt(process.env.REDIS_DB || '0', 10),

    // Metrics Configuration
    metricsEnabled: process.env.METRICS_ENABLED === 'true',
    metricsPort: parseInt(process.env.METRICS_PORT || '9100', 10),
    metricsPath: process.env.METRICS_PATH || '/metrics',

    // Frontend Configuration
    reactAppApiUrl: process.env.REACT_APP_API_URL || 'http://localhost:3000/api',
    reactAppWsUrl: process.env.REACT_APP_WS_URL || 'ws://localhost:8080/ws',
    reactAppEnv: process.env.REACT_APP_ENV || 'development',

    // Presence System Configuration
    presenceActivityTimeout: parseInt(process.env.PRESENCE_ACTIVITY_TIMEOUT || '300000', 10),
    presenceCleanupInterval: parseInt(process.env.PRESENCE_CLEANUP_INTERVAL || '30000', 10),
    presenceMaxRoomsPerUser: parseInt(process.env.PRESENCE_MAX_ROOMS_PER_USER || '5', 10),
    presenceMaxUsersPerRoom: parseInt(process.env.PRESENCE_MAX_USERS_PER_ROOM || '100', 10),

    // Logging Configuration
    logLevel: process.env.LOG_LEVEL || 'info',
    logFormat: process.env.LOG_FORMAT || 'json',
    logFile: process.env.LOG_FILE || 'logs/app.log',

    // Security Configuration
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW || '15', 10),
    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),

    // Database Configuration
    dbHost: process.env.DB_HOST || 'localhost',
    dbPort: parseInt(process.env.DB_PORT || '5432', 10),
    dbName: process.env.DB_NAME || 'driftix',
    dbUser: process.env.DB_USER || 'postgres',
    dbPassword: process.env.DB_PASSWORD || '',
}; 