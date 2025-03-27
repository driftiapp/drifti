const express = require('express');
const router = express.Router();
const BusinessStatsController = require('../controllers/BusinessStatsController');
const auth = require('../middleware/auth');
const rateLimit = require('express-rate-limit');

// Rate limiting for stats endpoints
const statsLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});

// Apply rate limiting to all routes
router.use(statsLimiter);

// Apply authentication to all routes
router.use(auth);

// Get general business statistics
router.get('/:businessId/stats', BusinessStatsController.getStats);

// Get sales data for charts
router.get('/:businessId/sales', BusinessStatsController.getSalesData);

// Get business performance metrics
router.get('/:businessId/metrics', BusinessStatsController.getBusinessMetrics);

// Get inventory statistics
router.get('/:businessId/inventory', BusinessStatsController.getInventoryStats);

// Export statistics
router.get('/:businessId/export', BusinessStatsController.exportStats);

module.exports = router; 