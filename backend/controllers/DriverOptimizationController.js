const DriverOptimizationService = require('../services/DriverOptimizationService');
const { ValidationError } = require('../utils/errors');

class DriverOptimizationController {
    /**
     * Get live demand heatmap
     */
    async getHeatmap(req, res) {
        try {
            const { lat, lng, radius = 5 } = req.query;
            if (!lat || !lng) {
                throw new ValidationError('Location coordinates are required');
            }

            const heatmap = await DriverOptimizationService.generateHeatmap(
                { lat: parseFloat(lat), lng: parseFloat(lng) },
                parseFloat(radius)
            );

            res.json({
                success: true,
                data: heatmap
            });
        } catch (error) {
            res.status(error instanceof ValidationError ? 400 : 500).json({
                success: false,
                error: error.message
            });
        }
    }

    /**
     * Set daily earnings goal and get optimization plan
     */
    async setEarningsGoal(req, res) {
        try {
            const { driverId } = req.user;
            const { dailyGoal, startTime, endTime } = req.body;

            if (!dailyGoal || dailyGoal <= 0) {
                throw new ValidationError('Valid daily earnings goal is required');
            }

            const optimizationPlan = await DriverOptimizationService.generateEarningsPlan({
                driverId,
                dailyGoal,
                startTime: startTime || new Date(),
                endTime: endTime || null
            });

            res.json({
                success: true,
                data: optimizationPlan
            });
        } catch (error) {
            res.status(error instanceof ValidationError ? 400 : 500).json({
                success: false,
                error: error.message
            });
        }
    }

    /**
     * Get earnings progress and next steps
     */
    async getEarningsProgress(req, res) {
        try {
            const { driverId } = req.user;
            const progress = await DriverOptimizationService.getEarningsProgress(driverId);

            res.json({
                success: true,
                data: progress
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    /**
     * Handle idle driver optimization
     */
    async handleIdleDriver(req, res) {
        try {
            const { driverId } = req.user;
            const { lat, lng } = req.body;

            if (!lat || !lng) {
                throw new ValidationError('Location coordinates are required');
            }

            const suggestions = await DriverOptimizationService.handleIdleDriver(
                driverId,
                { lat: parseFloat(lat), lng: parseFloat(lng) }
            );

            res.json({
                success: true,
                data: suggestions
            });
        } catch (error) {
            res.status(error instanceof ValidationError ? 400 : 500).json({
                success: false,
                error: error.message
            });
        }
    }

    /**
     * Stack next ride for a driver
     */
    async stackNextRide(req, res) {
        try {
            const { driverId } = req.user;
            const { currentRideId } = req.body;

            if (!currentRideId) {
                throw new ValidationError('Current ride ID is required');
            }

            const nextRide = await DriverOptimizationService.stackNextRide(
                driverId,
                currentRideId
            );

            res.json({
                success: true,
                data: nextRide
            });
        } catch (error) {
            res.status(error instanceof ValidationError ? 400 : 500).json({
                success: false,
                error: error.message
            });
        }
    }

    /**
     * Get earnings insights and tips
     */
    async getEarningsInsights(req, res) {
        try {
            const { driverId } = req.user;
            const { lat, lng } = req.query;

            if (!lat || !lng) {
                throw new ValidationError('Location coordinates are required');
            }

            const insights = await DriverOptimizationService.getEarningsInsights({
                driverId,
                location: { lat: parseFloat(lat), lng: parseFloat(lng) }
            });

            res.json({
                success: true,
                data: insights
            });
        } catch (error) {
            res.status(error instanceof ValidationError ? 400 : 500).json({
                success: false,
                error: error.message
            });
        }
    }

    /**
     * Get surge pricing alerts
     */
    async getSurgeAlerts(req, res) {
        try {
            const { driverId } = req.user;
            const { lat, lng, radius = 10 } = req.query;

            if (!lat || !lng) {
                throw new ValidationError('Location coordinates are required');
            }

            const surgeAlerts = await DriverOptimizationService.getSurgeAlerts({
                driverId,
                location: { lat: parseFloat(lat), lng: parseFloat(lng) },
                radius: parseFloat(radius)
            });

            res.json({
                success: true,
                data: surgeAlerts
            });
        } catch (error) {
            res.status(error instanceof ValidationError ? 400 : 500).json({
                success: false,
                error: error.message
            });
        }
    }

    /**
     * Configure auto-savings
     */
    async configureAutoSavings(req, res) {
        try {
            const { driverId } = req.user;
            const { taxPercentage, vacationPercentage, goalsPercentage } = req.body;

            const total = (taxPercentage || 0) + (vacationPercentage || 0) + (goalsPercentage || 0);
            if (total > 100) {
                throw new ValidationError('Total savings percentage cannot exceed 100%');
            }

            const config = await DriverOptimizationService.updateAutoSavingsConfig(
                driverId,
                { taxPercentage, vacationPercentage, goalsPercentage }
            );

            res.json({
                success: true,
                data: config
            });
        } catch (error) {
            res.status(error instanceof ValidationError ? 400 : 500).json({
                success: false,
                error: error.message
            });
        }
    }
}

module.exports = new DriverOptimizationController(); 