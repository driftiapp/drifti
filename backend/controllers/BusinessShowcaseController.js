const BusinessShowcaseService = require('../services/BusinessShowcaseService');
const { ValidationError } = require('../utils/errors');

class BusinessShowcaseController {
    /**
     * Get showcase by business type
     */
    async getShowcase(req, res) {
        try {
            const { businessType } = req.params;
            const showcase = await BusinessShowcaseService.getShowcaseByType(businessType);
            
            res.json({
                success: true,
                data: showcase
            });
        } catch (error) {
            res.status(error instanceof ValidationError ? 400 : 500).json({
                success: false,
                error: error.message
            });
        }
    }

    /**
     * Get all showcases
     */
    async getAllShowcases(req, res) {
        try {
            const showcases = await BusinessShowcaseService.getAllShowcases();
            
            res.json({
                success: true,
                data: showcases
            });
        } catch (error) {
            res.status(error instanceof ValidationError ? 400 : 500).json({
                success: false,
                error: error.message
            });
        }
    }

    /**
     * Create new showcase
     */
    async createShowcase(req, res) {
        try {
            const showcaseData = req.body;
            const showcase = await BusinessShowcaseService.createShowcase(showcaseData);
            
            res.status(201).json({
                success: true,
                data: showcase
            });
        } catch (error) {
            res.status(error instanceof ValidationError ? 400 : 500).json({
                success: false,
                error: error.message
            });
        }
    }

    /**
     * Update showcase metrics
     */
    async updateMetrics(req, res) {
        try {
            const { businessType } = req.params;
            const { metricType, value } = req.body;

            if (!metricType) {
                throw new ValidationError('Metric type is required');
            }

            const showcase = await BusinessShowcaseService.updateMetrics(
                businessType,
                metricType,
                value
            );
            
            res.json({
                success: true,
                data: showcase
            });
        } catch (error) {
            res.status(error instanceof ValidationError ? 400 : 500).json({
                success: false,
                error: error.message
            });
        }
    }

    /**
     * Get AI recommendations for a showcase
     */
    async getAIRecommendations(req, res) {
        try {
            const { businessType } = req.params;
            const { userId } = req.user;

            if (!userId) {
                throw new ValidationError('User ID is required');
            }

            const recommendations = await BusinessShowcaseService.getAIRecommendations(
                userId,
                businessType
            );
            
            res.json({
                success: true,
                data: recommendations
            });
        } catch (error) {
            res.status(error instanceof ValidationError ? 400 : 500).json({
                success: false,
                error: error.message
            });
        }
    }

    /**
     * Get showcase analytics
     */
    async getAnalytics(req, res) {
        try {
            const { businessType } = req.params;
            const showcase = await BusinessShowcaseService.getShowcaseByType(businessType);
            
            if (!showcase) {
                throw new ValidationError('Showcase not found');
            }

            const analytics = {
                views: showcase.metrics.views,
                conversions: showcase.metrics.conversions,
                averageRating: showcase.metrics.averageRating,
                conversionRate: showcase.metrics.views > 0 
                    ? (showcase.metrics.conversions / showcase.metrics.views) * 100 
                    : 0
            };
            
            res.json({
                success: true,
                data: analytics
            });
        } catch (error) {
            res.status(error instanceof ValidationError ? 400 : 500).json({
                success: false,
                error: error.message
            });
        }
    }
}

module.exports = new BusinessShowcaseController(); 