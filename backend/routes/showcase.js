const express = require('express');
const router = express.Router();
const BusinessShowcaseController = require('../controllers/BusinessShowcaseController');
const { authenticate, authorize } = require('../middleware/auth');
const rateLimit = require('express-rate-limit');

// Rate limiter: 100 requests per 15 minutes
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests from this IP, please try again after 15 minutes'
});

// Apply rate limiter to all routes
router.use(limiter);

// Public routes
router.get('/:businessType', BusinessShowcaseController.getShowcase);
router.get('/', BusinessShowcaseController.getAllShowcases);

// Protected routes (require authentication)
router.use(authenticate);

// Get AI recommendations
router.get('/:businessType/recommendations', BusinessShowcaseController.getAIRecommendations);

// Admin routes (require admin authorization)
router.use(authorize('admin'));

// Create showcase
router.post('/', BusinessShowcaseController.createShowcase);

// Update metrics
router.post('/:businessType/metrics', BusinessShowcaseController.updateMetrics);

// Get analytics
router.get('/:businessType/analytics', BusinessShowcaseController.getAnalytics);

module.exports = router; 