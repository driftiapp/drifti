const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const admin = require('firebase-admin');
const { runChecks } = require('../monitoring/healthCheck');
const { trackError } = require('../monitoring/errorMonitor');

// Health check endpoint
router.get('/', async (req, res) => {
  try {
    // Check MongoDB connection
    const mongoStatus = mongoose.connection.readyState === 1 ? 'healthy' : 'unhealthy';
    
    // Check Firebase connection
    let firebaseStatus = 'healthy';
    try {
      await admin.firestore().collection('health').doc('check').get();
    } catch (error) {
      firebaseStatus = 'unhealthy';
    }
    
    // Get system uptime
    const uptime = process.uptime();
    
    // Get memory usage
    const memoryUsage = process.memoryUsage();
    
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        mongodb: mongoStatus,
        firebase: firebaseStatus
      },
      system: {
        uptime: `${Math.floor(uptime)} seconds`,
        memory: {
          heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
          heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
          external: `${Math.round(memoryUsage.external / 1024 / 1024)}MB`
        }
      }
    });
  } catch (error) {
    trackError(error, { route: 'GET /api/health' });
    res.status(500).json({
      status: 'error',
      message: 'Health check failed',
      error: error.message
    });
  }
});

// Detailed health check endpoint
router.get('/detailed', async (req, res) => {
  try {
    const checks = await runChecks();
    res.json({
      status: checks.mongodb && checks.firebase ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      checks
    });
  } catch (error) {
    trackError(error, { route: 'GET /api/health/detailed' });
    res.status(500).json({
      status: 'error',
      message: 'Detailed health check failed',
      error: error.message
    });
  }
});

// System metrics
router.get('/metrics', async (req, res) => {
  try {
    const metrics = {
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    };
    res.status(200).json(metrics);
  } catch (error) {
    trackError(error, { route: 'GET /api/health/metrics' });
    res.status(500).json({ message: 'Failed to get system metrics' });
  }
});

// Basic health check
router.get('/basic', healthController.basicHealth);

// Database health check
router.get('/db', healthController.dbHealth);

// Cache health check
router.get('/cache', healthController.cacheHealth);

// Stripe health check
router.get('/stripe', healthController.stripeHealth);

// Email service health check
router.get('/email', healthController.emailHealth);

// Comprehensive health check
router.get('/comprehensive', healthController.comprehensiveHealth);

module.exports = router; 