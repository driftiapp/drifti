const express = require('express');
const router = express.Router();
const AIPersonalizationController = require('../controllers/AIPersonalizationController');
const { authenticate } = require('../middleware/auth');
const rateLimit = require('express-rate-limit');

// Rate limiting configuration
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});

// Apply rate limiting to all routes
router.use(limiter);

// Get personalized recommendations for a user and business type
router.get(
    '/recommendations/:userId/:businessType',
    authenticate,
    AIPersonalizationController.getPersonalizedRecommendations
);

// Update user preferences based on interaction
router.post(
    '/preferences/:userId',
    authenticate,
    AIPersonalizationController.updateUserPreferences
);

// Get user preferences
router.get(
    '/preferences/:userId',
    authenticate,
    AIPersonalizationController.getUserPreferences
);

// Get user interaction history
router.get(
    '/history/:userId/:businessType',
    authenticate,
    AIPersonalizationController.getUserHistory
);

module.exports = router; 