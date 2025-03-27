const NotificationService = require('../services/NotificationService');
const { ValidationError } = require('../utils/errors');

class NotificationController {
    /**
     * Get holiday greetings
     */
    async getHolidayGreeting(req, res) {
        try {
            const { userId } = req.user;
            const { holiday } = req.params;

            const greeting = await NotificationService.generateHolidayGreeting(
                userId,
                holiday
            );

            res.json({
                success: true,
                data: greeting
            });
        } catch (error) {
            res.status(error instanceof ValidationError ? 400 : 500).json({
                success: false,
                error: error.message
            });
        }
    }

    /**
     * Get game night alerts
     */
    async getGameAlerts(req, res) {
        try {
            const { userId } = req.user;
            const alerts = await NotificationService.generateGameAlert(userId);

            res.json({
                success: true,
                data: alerts
            });
        } catch (error) {
            res.status(error instanceof ValidationError ? 400 : 500).json({
                success: false,
                error: error.message
            });
        }
    }

    /**
     * Update notification preferences
     */
    async updatePreferences(req, res) {
        try {
            const { userId } = req.user;
            const { preferences } = req.body;

            if (!preferences) {
                throw new ValidationError('Preferences are required');
            }

            const updatedPrefs = await NotificationService.updateNotificationPreferences(
                userId,
                preferences
            );

            res.json({
                success: true,
                data: updatedPrefs
            });
        } catch (error) {
            res.status(error instanceof ValidationError ? 400 : 500).json({
                success: false,
                error: error.message
            });
        }
    }

    /**
     * Get prayer times
     */
    async getPrayerTimes(req, res) {
        try {
            const { lat, lng } = req.query;

            if (!lat || !lng) {
                throw new ValidationError('Location coordinates are required');
            }

            const prayerTimes = await NotificationService.getPrayerTimes({
                lat: parseFloat(lat),
                lng: parseFloat(lng)
            });

            res.json({
                success: true,
                data: prayerTimes
            });
        } catch (error) {
            res.status(error instanceof ValidationError ? 400 : 500).json({
                success: false,
                error: error.message
            });
        }
    }

    /**
     * Get nearby halal restaurants
     */
    async getHalalRestaurants(req, res) {
        try {
            const { lat, lng } = req.query;

            if (!lat || !lng) {
                throw new ValidationError('Location coordinates are required');
            }

            const restaurants = await NotificationService.getNearbyHalalRestaurants({
                lat: parseFloat(lat),
                lng: parseFloat(lng)
            });

            res.json({
                success: true,
                data: restaurants
            });
        } catch (error) {
            res.status(error instanceof ValidationError ? 400 : 500).json({
                success: false,
                error: error.message
            });
        }
    }

    /**
     * Get charity opportunities
     */
    async getCharities(req, res) {
        try {
            const charities = await NotificationService.getCharityOpportunities();

            res.json({
                success: true,
                data: charities
            });
        } catch (error) {
            res.status(error instanceof ValidationError ? 400 : 500).json({
                success: false,
                error: error.message
            });
        }
    }

    /**
     * Verify and apply promo code
     */
    async verifyPromoCode(req, res) {
        try {
            const { userId } = req.user;
            const { code } = req.body;

            if (!code) {
                throw new ValidationError('Promo code is required');
            }

            const result = await NotificationService.verifyPromoCode(userId, code);

            res.json({
                success: true,
                data: result
            });
        } catch (error) {
            res.status(error instanceof ValidationError ? 400 : 500).json({
                success: false,
                error: error.message
            });
        }
    }
}

module.exports = new NotificationController(); 