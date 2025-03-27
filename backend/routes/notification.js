const express = require('express');
const router = express.Router();
const NotificationController = require('../controllers/NotificationController');
const { authenticate } = require('../middleware/auth');
const rateLimit = require('express-rate-limit');

// Rate limiter: 100 requests per 15 minutes
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests from this IP, please try again after 15 minutes'
});

// Apply rate limiter to all routes
router.use(limiter);

// Apply authentication middleware to all routes
router.use(authenticate);

// Holiday greetings
router.get('/holiday/:holiday', NotificationController.getHolidayGreeting);

// Game alerts
router.get('/games', NotificationController.getGameAlerts);

// Update notification preferences
router.put('/preferences', NotificationController.updatePreferences);

// Prayer times
router.get('/prayer-times', NotificationController.getPrayerTimes);

// Halal restaurants
router.get('/halal-restaurants', NotificationController.getHalalRestaurants);

// Charity opportunities
router.get('/charities', NotificationController.getCharities);

// Verify promo code
router.post('/promo/verify', NotificationController.verifyPromoCode);

module.exports = router; 