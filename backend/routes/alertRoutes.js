const express = require('express');
const router = express.Router();
const AlertController = require('../controllers/AlertController');
const auth = require('../middleware/auth');
const rateLimit = require('express-rate-limit');

// Rate limiting for alert endpoints
const alertLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});

// Apply authentication and rate limiting to all routes
router.use(auth);
router.use(alertLimiter);

// Get recent alerts
router.get('/recent', AlertController.getRecentAlerts);

// Get alerts for a specific component
router.get('/component/:component', AlertController.getComponentAlerts);

// Get alerts by type (failure/recovery/warning)
router.get('/type/:type', AlertController.getAlertsByType);

// Get alerts within a time range
router.get('/time-range', AlertController.getAlertsByTimeRange);

// Get alert statistics
router.get('/stats', AlertController.getAlertStats);

module.exports = router; 