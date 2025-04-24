module.exports = {
    // Secret definitions
    secrets: {
        JWT_SECRET: { length: 32 },
        ADMIN_PASSWORD: { length: 16 },
        DB_PASSWORD: { length: 16 },
        REDIS_PASSWORD: { length: 16 }
    },

    // Deployment platform configuration
    deployment: {
        platform: 'none', // Options: 'none', 'firebase', 'render', 'railway'
        // Add platform-specific configuration here if needed
    },

    // Notification settings
    notifications: {
        enabled: true,
        slack: {
            webhookUrl: process.env.SLACK_WEBHOOK_URL,
            channel: '#secrets-rotation'
        },
        email: {
            smtpHost: process.env.SMTP_HOST,
            smtpPort: process.env.SMTP_PORT,
            smtpUser: process.env.SMTP_USER,
            smtpPass: process.env.SMTP_PASS,
            fromEmail: 'secrets@yourdomain.com',
            toEmail: 'admin@yourdomain.com'
        }
    },

    // Rollback configuration
    rollback: {
        enabled: true,
        backupPath: './backups/secrets'
    },

    // Application restart configuration
    restart: {
        enabled: true,
        delay: 5000, // Delay in milliseconds before restart
        command: 'npm run start' // Command to restart the application
    },

    backupDir: './backups',
    keyDir: './.backup-keys',
    envFile: './.env',
    masterKeyFile: './.backup-keys/master.key',
    backupPattern: 'backup-*.env',
    keyPattern: 'key-*.json',
    encryptionAlgorithm: 'aes-256-gcm',
    keyLength: 32,
    ivLength: 16,
    saltLength: 16,
    iterations: 100000,
    digest: 'sha256'
}; 