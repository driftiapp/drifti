const AIPersonalizationService = require('../services/AIPersonalizationService');
const { ValidationError } = require('../utils/errors');

class AIPersonalizationController {
    async getPersonalizedRecommendations(req, res, next) {
        try {
            const { userId, businessType } = req.params;
            
            if (!userId || !businessType) {
                throw new ValidationError('User ID and business type are required');
            }

            const recommendations = await AIPersonalizationService.generatePersonalizedRecommendations(
                userId,
                businessType
            );

            res.json({
                success: true,
                data: recommendations
            });
        } catch (error) {
            next(error);
        }
    }

    async updateUserPreferences(req, res, next) {
        try {
            const { userId } = req.params;
            const interaction = req.body;

            if (!userId) {
                throw new ValidationError('User ID is required');
            }

            if (!interaction || !interaction.type) {
                throw new ValidationError('Interaction data is required');
            }

            await AIPersonalizationService.updateUserPreferences(userId, interaction);

            res.json({
                success: true,
                message: 'User preferences updated successfully'
            });
        } catch (error) {
            next(error);
        }
    }

    async getUserPreferences(req, res, next) {
        try {
            const { userId } = req.params;

            if (!userId) {
                throw new ValidationError('User ID is required');
            }

            const preferences = await AIPersonalizationService.getUserPreferences(userId);

            res.json({
                success: true,
                data: preferences
            });
        } catch (error) {
            next(error);
        }
    }

    async getUserHistory(req, res, next) {
        try {
            const { userId, businessType } = req.params;

            if (!userId || !businessType) {
                throw new ValidationError('User ID and business type are required');
            }

            const history = await AIPersonalizationService.getUserHistory(userId, businessType);

            res.json({
                success: true,
                data: history
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new AIPersonalizationController(); 