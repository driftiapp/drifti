const path = require('path');
require('dotenv').config({ path: '.env.production' });

module.exports = {
    // Server configuration
    server: {
        port: process.env.PORT || 3000,
        env: 'production',
        cors: {
            origin: process.env.CORS_ORIGIN || 'https://app.drifti.com',
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization'],
            credentials: true
        }
    },

    // Database configuration
    database: {
        uri: process.env.MONGODB_URI,
        options: {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            useCreateIndex: true,
            useFindAndModify: false,
            poolSize: 10,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000
        }
    },

    // Redis configuration
    redis: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT,
        password: process.env.REDIS_PASSWORD,
        tls: true
    },

    // JWT configuration
    jwt: {
        secret: process.env.JWT_SECRET,
        expiresIn: '24h',
        refreshTokenExpiresIn: '7d'
    },

    // Stripe configuration
    stripe: {
        secretKey: process.env.STRIPE_SECRET_KEY,
        webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
        currency: 'usd'
    },

    // Email configuration
    email: {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: true,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        },
        from: process.env.EMAIL_FROM || 'noreply@drifti.com'
    },

    // Security configuration
    security: {
        rateLimit: {
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 100 // limit each IP to 100 requests per windowMs
        },
        whitelistedIPs: process.env.WHITELISTED_IPS ? process.env.WHITELISTED_IPS.split(',') : [],
        helmet: {
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
                    styleSrc: ["'self'", "'unsafe-inline'"],
                    imgSrc: ["'self'", 'data:', 'https:'],
                    connectSrc: ["'self'", 'https://api.stripe.com'],
                    fontSrc: ["'self'", 'https://fonts.gstatic.com'],
                    objectSrc: ["'none'"],
                    mediaSrc: ["'self'"],
                    frameSrc: ["'none'"]
                }
            }
        }
    },

    // Monitoring configuration
    monitoring: {
        sentry: {
            dsn: process.env.SENTRY_DSN,
            environment: 'production',
            tracesSampleRate: 1.0
        },
        newRelic: {
            licenseKey: process.env.NEW_RELIC_LICENSE_KEY,
            appName: 'Drifti Backend'
        }
    },

    // Logging configuration
    logging: {
        level: 'info',
        format: 'json',
        transports: ['console', 'file'],
        filename: path.join(__dirname, '../logs/production.log'),
        maxsize: 5242880, // 5MB
        maxFiles: 5
    },

    // Feature flags
    features: {
        enableNFTTickets: process.env.ENABLE_NFT_TICKETS === 'true',
        enableLiveStreaming: process.env.ENABLE_LIVE_STREAMING === 'true',
        enableSurpriseEvents: process.env.ENABLE_SURPRISE_EVENTS === 'true',
        enableGroupBookings: process.env.ENABLE_GROUP_BOOKINGS === 'true',
        enableRideShare: process.env.ENABLE_RIDE_SHARE === 'true'
    }
}; 