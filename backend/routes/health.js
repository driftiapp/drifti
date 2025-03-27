const express = require('express');
const router = express.Router();
const HealthCheckController = require('../controllers/HealthCheckController');
const auth = require('../middleware/auth');
const rateLimit = require('express-rate-limit');
const { getHealthStatus } = require('../monitoring/healthCheck');
const Redis = require('ioredis');
const config = require('../config');

const redis = new Redis(config.redis.url);

// Rate limiting for health check endpoints
const healthCheckLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});

// Public health check endpoint (no auth required)
router.get('/', async (req, res) => {
  try {
    // Try to get cached status first
    const cachedStatus = await redis.get('health_status');
    if (cachedStatus) {
      return res.json(JSON.parse(cachedStatus));
    }

    // If no cache, get fresh status
    const status = await getHealthStatus();
    res.json(status);
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to get health status',
      error: config.env === 'development' ? error.message : undefined
    });
  }
});

// Protected routes require authentication
router.use(auth);

// Admin-only routes with rate limiting
router.use(healthCheckLimiter);

// Get detailed system metrics
router.get('/metrics', HealthCheckController.getMetrics);

// Get database migration status
router.get('/migrations', HealthCheckController.getMigrationStatus);

// Get load balancing status
router.get('/load-balancing', HealthCheckController.getLoadBalancingStatus);

// Start system monitoring
router.post('/monitoring/start', HealthCheckController.startMonitoring);

// Get detailed health status
router.get('/detailed', async (req, res) => {
  try {
    const status = await getHealthStatus();
    
    // Add additional system info
    const detailedStatus = {
      ...status,
      system: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        nodeVersion: process.version,
        platform: process.platform
      }
    };

    res.json(detailedStatus);
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to get detailed health status',
      error: config.env === 'development' ? error.message : undefined
    });
  }
});

module.exports = router; 