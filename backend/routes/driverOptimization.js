const express = require('express');
const router = express.Router();
const DriverOptimizationController = require('../controllers/DriverOptimizationController');
const { authenticate } = require('../middleware/auth');
const { rateLimiter } = require('../middleware/rateLimiter');

// Apply authentication to all routes
router.use(authenticate);

// Apply rate limiting to prevent abuse
const apiLimiter = rateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});

// Get live demand heatmap
router.get('/heatmap', apiLimiter, DriverOptimizationController.getHeatmap);

// Set daily earnings goal and get optimization plan
router.post('/earnings/goal', apiLimiter, DriverOptimizationController.setEarningsGoal);

// Get earnings progress and next steps
router.get('/earnings/progress', apiLimiter, DriverOptimizationController.getEarningsProgress);

// Handle idle driver optimization
router.post('/idle', apiLimiter, DriverOptimizationController.handleIdleDriver);

// Stack next ride for a driver
router.post('/stack-ride', apiLimiter, DriverOptimizationController.stackNextRide);

// Get earnings insights and tips
router.get('/earnings/insights', apiLimiter, DriverOptimizationController.getEarningsInsights);

// Get surge pricing alerts
router.get('/surge-alerts', apiLimiter, DriverOptimizationController.getSurgeAlerts);

// Configure auto-savings
router.post('/auto-savings', apiLimiter, DriverOptimizationController.configureAutoSavings);

module.exports = router; 