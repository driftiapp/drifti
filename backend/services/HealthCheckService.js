const mongoose = require('mongoose');
const axios = require('axios');
const { MongoClient } = require('mongodb');
const admin = require('firebase-admin');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Redis = require('ioredis');
const AlertService = require('./AlertService');

class HealthCheckService {
    constructor() {
        this.redis = new Redis(process.env.REDIS_URL);
        this.checkInterval = 60000; // 1 minute
        this.healthStatus = {
            mongodb: false,
            firebase: false,
            stripe: false,
            redis: false,
            api: false,
            email: false,
            cdn: false,
            thirdParty: false,
            backups: false
        };
        this.previousStatus = { ...this.healthStatus };
    }

    async startMonitoring() {
        // Initial check
        await this.runHealthCheck();

        // Set up periodic checks
        setInterval(async () => {
            await this.runHealthCheck();
        }, this.checkInterval);
    }

    async runHealthCheck() {
        const results = await Promise.allSettled([
            this.checkMongoDB(),
            this.checkFirebase(),
            this.checkStripe(),
            this.checkRedis(),
            this.checkAPIEndpoints(),
            this.checkEmailService(),
            this.checkCDN(),
            this.checkThirdPartyServices(),
            this.checkDatabaseBackups()
        ]);

        // Update health status
        this.healthStatus = {
            mongodb: results[0].status === 'fulfilled' && results[0].value,
            firebase: results[1].status === 'fulfilled' && results[1].value,
            stripe: results[2].status === 'fulfilled' && results[2].value,
            redis: results[3].status === 'fulfilled' && results[3].value,
            api: results[4].status === 'fulfilled' && results[4].value,
            email: results[5].status === 'fulfilled' && results[5].value,
            cdn: results[6].status === 'fulfilled' && results[6].value,
            thirdParty: results[7].status === 'fulfilled' && results[7].value,
            backups: results[8].status === 'fulfilled' && results[8].value
        };

        // Check for status changes and send alerts
        Object.entries(this.healthStatus).forEach(([component, status]) => {
            const previousStatus = this.previousStatus[component];
            
            if (status !== previousStatus) {
                if (!status) {
                    // Component failed
                    const error = results[this.getComponentIndex(component)].reason?.message || 'Unknown error';
                    AlertService.sendSlackAlert(component, error, 'Failed');
                } else if (!previousStatus) {
                    // Component recovered
                    AlertService.sendRecoveryAlert(component);
                }
            }
        });

        // Update previous status
        this.previousStatus = { ...this.healthStatus };

        return this.healthStatus;
    }

    getComponentIndex(component) {
        const indexMap = {
            mongodb: 0,
            firebase: 1,
            stripe: 2,
            redis: 3,
            api: 4,
            email: 5,
            cdn: 6,
            thirdParty: 7,
            backups: 8
        };
        return indexMap[component];
    }

    async checkMongoDB() {
        try {
            // Check primary connection
            const primaryState = mongoose.connection.readyState;
            if (primaryState !== 1) {
                throw new Error('Primary MongoDB connection is not ready');
            }

            // Check replica set status if using replicas
            if (process.env.MONGODB_REPLICA_SET) {
                const client = await MongoClient.connect(process.env.MONGODB_URI);
                const admin = client.db().admin();
                const replStatus = await admin.replSetGetStatus();
                
                // Check if majority of nodes are healthy
                const healthyNodes = replStatus.members.filter(
                    member => member.health === 1
                ).length;
                
                if (healthyNodes < Math.ceil(replStatus.members.length / 2)) {
                    throw new Error('Insufficient healthy MongoDB replica nodes');
                }
            }

            // Check write operations
            const healthCheck = mongoose.model('HealthCheck');
            await healthCheck.create({ timestamp: new Date() });
            
            return true;
        } catch (error) {
            console.error('MongoDB health check failed:', error);
            return false;
        }
    }

    async checkFirebase() {
        try {
            // Verify Firebase Admin SDK initialization
            if (!admin.apps.length) {
                throw new Error('Firebase Admin SDK not initialized');
            }

            // Test authentication
            const testToken = await admin.auth().createCustomToken('health-check-user');
            if (!testToken) {
                throw new Error('Failed to create Firebase test token');
            }

            // Test Firestore if used
            if (process.env.USE_FIRESTORE === 'true') {
                const db = admin.firestore();
                const testDoc = db.collection('health_checks').doc('test');
                await testDoc.set({ timestamp: admin.firestore.FieldValue.serverTimestamp() });
                await testDoc.delete();
            }

            return true;
        } catch (error) {
            console.error('Firebase health check failed:', error);
            return false;
        }
    }

    async checkStripe() {
        try {
            // Verify Stripe API key
            const balance = await stripe.balance.retrieve();
            if (!balance) {
                throw new Error('Failed to retrieve Stripe balance');
            }

            // Check webhook endpoints
            const webhooks = await stripe.webhookEndpoints.list();
            const activeWebhooks = webhooks.data.filter(webhook => webhook.status === 'enabled');
            
            if (activeWebhooks.length === 0) {
                throw new Error('No active Stripe webhooks found');
            }

            return true;
        } catch (error) {
            console.error('Stripe health check failed:', error);
            return false;
        }
    }

    async checkRedis() {
        try {
            // Test Redis connection
            const ping = await this.redis.ping();
            if (ping !== 'PONG') {
                throw new Error('Redis ping failed');
            }

            // Test Redis operations
            await this.redis.set('health_check', 'ok');
            const value = await this.redis.get('health_check');
            if (value !== 'ok') {
                throw new Error('Redis read/write test failed');
            }

            // Check Redis memory usage
            const info = await this.redis.info('memory');
            const usedMemory = parseInt(info.match(/used_memory:(\d+)/)[1]);
            const maxMemory = parseInt(info.match(/maxmemory:(\d+)/)[1]);
            
            if (usedMemory > maxMemory * 0.9) {
                throw new Error('Redis memory usage above 90%');
            }

            return true;
        } catch (error) {
            console.error('Redis health check failed:', error);
            return false;
        }
    }

    async checkAPIEndpoints() {
        try {
            const endpoints = [
                '/api/health',
                '/api/business/stats',
                '/api/orders',
                '/api/inventory'
            ];

            const baseURL = process.env.API_BASE_URL;
            const results = await Promise.all(
                endpoints.map(endpoint => 
                    axios.get(`${baseURL}${endpoint}`, {
                        timeout: 5000,
                        headers: {
                            'X-Health-Check': 'true'
                        }
                    })
                )
            );

            // Check if all endpoints returned 2xx status codes
            const allHealthy = results.every(res => res.status >= 200 && res.status < 300);
            if (!allHealthy) {
                throw new Error('One or more API endpoints are unhealthy');
            }

            // Check response times
            const slowEndpoints = results.filter(res => res.config.responseTime > 1000);
            if (slowEndpoints.length > 0) {
                console.warn('Slow API endpoints detected:', 
                    slowEndpoints.map(res => res.config.url));
            }

            return true;
        } catch (error) {
            console.error('API health check failed:', error);
            return false;
        }
    }

    async checkEmailService() {
        try {
            const nodemailer = require('nodemailer');
            const transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST,
                port: process.env.SMTP_PORT,
                secure: process.env.SMTP_SECURE === 'true',
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS
                }
            });

            // Test email connection
            await transporter.verify();
            
            // Test sending a health check email
            await transporter.sendMail({
                from: process.env.SMTP_FROM,
                to: process.env.HEALTH_CHECK_EMAIL,
                subject: 'Health Check Test',
                text: 'This is a health check test email.'
            });

            return true;
        } catch (error) {
            console.error('Email service health check failed:', error);
            return false;
        }
    }

    async checkCDN() {
        try {
            const cdnUrl = process.env.CDN_BASE_URL;
            if (!cdnUrl) return true; // Skip if CDN is not configured

            // Check CDN availability
            const response = await axios.get(`${cdnUrl}/health-check.txt`, {
                timeout: 5000,
                headers: {
                    'Cache-Control': 'no-cache'
                }
            });

            // Check CDN response time
            if (response.config.responseTime > 1000) {
                console.warn('CDN response time is slow:', response.config.responseTime);
            }

            return response.status === 200;
        } catch (error) {
            console.error('CDN health check failed:', error);
            return false;
        }
    }

    async checkThirdPartyServices() {
        try {
            const services = [
                {
                    name: 'maps',
                    url: process.env.MAPS_API_URL,
                    required: true
                },
                {
                    name: 'weather',
                    url: process.env.WEATHER_API_URL,
                    required: false
                },
                {
                    name: 'analytics',
                    url: process.env.ANALYTICS_API_URL,
                    required: false
                }
            ];

            const results = await Promise.allSettled(
                services.map(service => 
                    axios.get(service.url, {
                        timeout: 5000,
                        headers: {
                            'X-Health-Check': 'true'
                        }
                    })
                )
            );

            // Check results
            const failures = results.filter((result, index) => 
                result.status === 'rejected' && services[index].required
            );

            if (failures.length > 0) {
                throw new Error('Required third-party services are unavailable');
            }

            return true;
        } catch (error) {
            console.error('Third-party services health check failed:', error);
            return false;
        }
    }

    async checkDatabaseBackups() {
        try {
            // Check if backup service is configured
            if (!process.env.BACKUP_SERVICE_URL) return true;

            const response = await axios.get(process.env.BACKUP_SERVICE_URL, {
                timeout: 5000,
                headers: {
                    'Authorization': `Bearer ${process.env.BACKUP_SERVICE_TOKEN}`
                }
            });

            const backupStatus = response.data;
            
            // Check if latest backup is recent (within last 24 hours)
            const lastBackupTime = new Date(backupStatus.lastBackupTime);
            const hoursSinceLastBackup = (Date.now() - lastBackupTime.getTime()) / (1000 * 60 * 60);
            
            if (hoursSinceLastBackup > 24) {
                console.warn('Database backup is older than 24 hours');
            }

            // Check backup size and storage
            if (backupStatus.storageUsed > backupStatus.storageLimit * 0.9) {
                console.warn('Backup storage usage is above 90%');
            }

            return true;
        } catch (error) {
            console.error('Database backup health check failed:', error);
            return false;
        }
    }

    async getSystemMetrics() {
        return {
            uptime: process.uptime(),
            memoryUsage: process.memoryUsage(),
            cpuUsage: process.cpuUsage(),
            healthStatus: this.healthStatus,
            lastCheck: new Date(),
            environment: process.env.NODE_ENV,
            version: process.env.APP_VERSION
        };
    }

    async checkDatabaseMigrations() {
        try {
            const Migration = mongoose.model('Migration');
            const pendingMigrations = await Migration.find({ status: 'pending' });
            
            if (pendingMigrations.length > 0) {
                console.warn(`${pendingMigrations.length} pending migrations found`);
                return {
                    status: 'warning',
                    pendingCount: pendingMigrations.length,
                    migrations: pendingMigrations.map(m => m.name)
                };
            }

            return { status: 'ok', pendingCount: 0 };
        } catch (error) {
            console.error('Migration check failed:', error);
            return { status: 'error', error: error.message };
        }
    }

    async checkLoadBalancing() {
        try {
            const servers = process.env.BACKEND_SERVERS.split(',');
            const results = await Promise.all(
                servers.map(server => 
                    axios.get(`${server}/api/health`, {
                        timeout: 5000,
                        headers: { 'X-Health-Check': 'true' }
                    })
                )
            );

            const serverHealth = results.map((res, index) => ({
                server: servers[index],
                status: res.status === 200 ? 'healthy' : 'unhealthy',
                responseTime: res.config.responseTime,
                load: res.data.load
            }));

            return {
                status: serverHealth.every(s => s.status === 'healthy') ? 'ok' : 'warning',
                servers: serverHealth
            };
        } catch (error) {
            console.error('Load balancing check failed:', error);
            return { status: 'error', error: error.message };
        }
    }
}

module.exports = new HealthCheckService(); 