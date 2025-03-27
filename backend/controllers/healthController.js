const mongoose = require('mongoose');
const Redis = require('ioredis');
const Stripe = require('stripe');
const nodemailer = require('nodemailer');
const config = require('../config/production');

const redis = new Redis({
    host: config.redis.host,
    port: config.redis.port,
    password: config.redis.password,
    tls: config.redis.tls
});

const stripe = new Stripe(config.stripe.secretKey);
const emailTransporter = nodemailer.createTransport({
    host: config.email.host,
    port: config.email.port,
    secure: config.email.secure,
    auth: {
        user: config.email.auth.user,
        pass: config.email.auth.pass
    }
});

const healthController = {
    // Basic health check
    async basicHealth(req, res) {
        try {
            res.status(200).json({
                status: 'healthy',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                memory: process.memoryUsage()
            });
        } catch (error) {
            res.status(500).json({
                status: 'unhealthy',
                error: error.message
            });
        }
    },

    // Database health check
    async dbHealth(req, res) {
        try {
            const dbState = mongoose.connection.readyState;
            const dbStatus = {
                0: 'disconnected',
                1: 'connected',
                2: 'connecting',
                3: 'disconnecting'
            }[dbState];

            const collections = await mongoose.connection.db.listCollections().toArray();
            const collectionNames = collections.map(col => col.name);

            res.status(200).json({
                status: dbState === 1 ? 'healthy' : 'unhealthy',
                database: {
                    state: dbStatus,
                    collections: collectionNames,
                    connectionString: mongoose.connection.host
                }
            });
        } catch (error) {
            res.status(500).json({
                status: 'unhealthy',
                error: error.message
            });
        }
    },

    // Cache health check
    async cacheHealth(req, res) {
        try {
            const ping = await redis.ping();
            const info = await redis.info();
            const memory = await redis.info('memory');

            res.status(200).json({
                status: ping === 'PONG' ? 'healthy' : 'unhealthy',
                cache: {
                    ping,
                    info,
                    memory
                }
            });
        } catch (error) {
            res.status(500).json({
                status: 'unhealthy',
                error: error.message
            });
        }
    },

    // Stripe health check
    async stripeHealth(req, res) {
        try {
            const balance = await stripe.balance.retrieve();
            const webhookEndpoints = await stripe.webhookEndpoints.list();
            
            res.status(200).json({
                status: 'healthy',
                stripe: {
                    balance: balance.available[0].amount,
                    currency: balance.available[0].currency,
                    webhookEndpoints: webhookEndpoints.data.length
                }
            });
        } catch (error) {
            res.status(500).json({
                status: 'unhealthy',
                error: error.message
            });
        }
    },

    // Email service health check
    async emailHealth(req, res) {
        try {
            await emailTransporter.verify();
            
            res.status(200).json({
                status: 'healthy',
                email: {
                    host: config.email.host,
                    port: config.email.port,
                    secure: config.email.secure
                }
            });
        } catch (error) {
            res.status(500).json({
                status: 'unhealthy',
                error: error.message
            });
        }
    },

    // Comprehensive health check
    async comprehensiveHealth(req, res) {
        try {
            const [basic, db, cache, stripe, email] = await Promise.all([
                this.basicHealth(req, res),
                this.dbHealth(req, res),
                this.cacheHealth(req, res),
                this.stripeHealth(req, res),
                this.emailHealth(req, res)
            ]);

            const isHealthy = basic.status === 'healthy' && 
                            db.status === 'healthy' && 
                            cache.status === 'healthy' &&
                            stripe.status === 'healthy' &&
                            email.status === 'healthy';

            res.status(isHealthy ? 200 : 503).json({
                status: isHealthy ? 'healthy' : 'unhealthy',
                timestamp: new Date().toISOString(),
                checks: {
                    basic,
                    database: db,
                    cache,
                    stripe,
                    email
                }
            });
        } catch (error) {
            res.status(500).json({
                status: 'unhealthy',
                error: error.message
            });
        }
    }
};

module.exports = healthController; 