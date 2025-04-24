declare namespace NodeJS {
    interface ProcessEnv {
        // Environment
        NODE_ENV: 'development' | 'production' | 'test'

        // Server Configuration
        PORT?: string
        HOST?: string

        // API Configuration
        API_URL: string
        PROD_API_URL?: string
        PROD_API_VERSION?: string
        PROD_API_TIMEOUT?: string

        // Database Configuration
        DB_HOST: string
        DB_PORT: string
        DB_NAME: string
        DB_USER: string
        DB_PASSWORD: string

        // Production Database
        PROD_DB_HOST?: string
        PROD_DB_PORT?: string
        PROD_DB_NAME?: string
        PROD_DB_USER?: string
        PROD_DB_PASSWORD?: string

        // Security & Authentication
        PROD_JWT_SECRET: string
        JWT_EXPIRES_IN: string
        MASTER_BACKUP_KEY: string
        BACKUP_ENCRYPTION_KEY: string

        // Logging & Monitoring
        LOG_LEVEL?: 'debug' | 'info' | 'warn' | 'error'
        ENABLE_METRICS?: string

        // Rate Limiting
        RATE_LIMIT_WINDOW?: string
        RATE_LIMIT_MAX?: string
    }
} 