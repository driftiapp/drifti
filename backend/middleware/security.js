const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');
const { body, validationResult } = require('express-validator');

// IP whitelist configuration
const whitelistedIPs = process.env.WHITELISTED_IPS ? process.env.WHITELISTED_IPS.split(',') : [];
const whitelistMiddleware = (req, res, next) => {
    const clientIP = req.ip || req.connection.remoteAddress;
    if (whitelistedIPs.length > 0 && !whitelistedIPs.includes(clientIP)) {
        return res.status(403).json({ error: 'Access denied. IP not whitelisted.' });
    }
    next();
};

// Rate limiting configuration
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false
});

// Stricter rate limit for authentication endpoints
const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // limit each IP to 5 failed requests per hour
    message: 'Too many failed attempts, please try again later.',
    standardHeaders: true,
    legacyHeaders: false
});

// CORS configuration
const corsOptions = {
    origin: process.env.FRONTEND_URL,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 86400 // 24 hours
};

// Security middleware setup
const setupSecurity = (app) => {
    // Basic security headers
    app.use(helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                imgSrc: ["'self'", "data:", "https:"],
                connectSrc: ["'self'", process.env.FRONTEND_URL],
                fontSrc: ["'self'", "https:", "data:"],
                objectSrc: ["'none'"],
                mediaSrc: ["'self'"],
                frameSrc: ["'none'"],
                sandbox: ['allow-forms', 'allow-scripts', 'allow-same-origin']
            }
        },
        crossOriginEmbedderPolicy: false,
        crossOriginResourcePolicy: { policy: "cross-origin" }
    }));
    
    // IP whitelist
    app.use(whitelistMiddleware);
    
    // CORS
    app.use(cors(corsOptions));
    
    // Rate limiting
    app.use('/api/', apiLimiter);
    app.use('/api/auth/', authLimiter);
    
    // Request validation middleware
    app.use((req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    });
};

// Input validation rules
const validationRules = {
    login: [
        body('email').isEmail().normalizeEmail(),
        body('password').isLength({ min: 8 })
    ],
    register: [
        body('email').isEmail().normalizeEmail(),
        body('password').isLength({ min: 8 }),
        body('name').trim().isLength({ min: 2 })
    ],
    payment: [
        body('amount').isFloat({ min: 0 }),
        body('currency').isIn(['USD', 'EUR', 'GBP']),
        body('paymentMethodId').notEmpty()
    ]
};

module.exports = {
    setupSecurity,
    validationRules,
    apiLimiter,
    authLimiter
}; 