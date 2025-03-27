const BusinessShowcase = require('../models/BusinessShowcase');
const { ValidationError } = require('../utils/errors');
const redis = require('../utils/redis');
const axios = require('axios');
const axiosRetry = require('axios-retry');

class BusinessShowcaseService {
    constructor() {
        this.redis = redis.createClient();
        this.CACHE_TTL = 3600; // 1 hour
        this.MAX_RETRIES = 3;
        this.RETRY_DELAY = 1000; // 1 second

        // Configure axios retry
        axiosRetry(axios, {
            retries: this.MAX_RETRIES,
            retryDelay: axiosRetry.exponentialDelay,
            retryCondition: (error) => {
                return axiosRetry.isNetworkOrIdempotentRequestError(error) || error.code === 'ECONNABORTED';
            }
        });
    }

    /**
     * Create a new showcase item
     */
    async createShowcase(showcaseData) {
        try {
            // Validate required fields
            const requiredFields = ['businessType', 'name', 'price', 'description'];
            const missingFields = requiredFields.filter(field => !showcaseData[field]);
            
            if (missingFields.length > 0) {
                throw new ValidationError(`Missing required fields: ${missingFields.join(', ')}`);
            }

            // Validate business type
            const validTypes = ['hotel', 'restaurant', 'liquor_store', 'cannabis_dispensary', 
                              'smoke_shop', 'pharmacy', 'rideshare', 'courier'];
            if (!validTypes.includes(showcaseData.businessType)) {
                throw new ValidationError(`Invalid business type. Must be one of: ${validTypes.join(', ')}`);
            }

            const showcase = new BusinessShowcase(showcaseData);
            await showcase.save();
            
            // Invalidate cache
            await this.invalidateCache();
            
            return showcase;
        } catch (error) {
            if (error instanceof ValidationError) {
                throw error;
            }
            console.error('Failed to create showcase:', error);
            throw new ValidationError('Failed to create showcase: ' + error.message);
        }
    }

    /**
     * Get showcase by business type with retry logic
     */
    async getShowcaseByType(businessType) {
        try {
            // Try to get from cache first
            const cacheKey = `showcase:${businessType}`;
            const cachedShowcase = await this.redis.get(cacheKey);
            
            if (cachedShowcase) {
                return JSON.parse(cachedShowcase);
            }

            // If not in cache, get from database with retry
            const showcase = await this.retryOperation(
                () => BusinessShowcase.getShowcaseByType(businessType),
                'Failed to get showcase from database'
            );
            
            if (!showcase) {
                throw new ValidationError(`Showcase not found for business type: ${businessType}`);
            }

            // Cache the result
            await this.redis.setex(
                cacheKey,
                this.CACHE_TTL,
                JSON.stringify(showcase)
            );

            return showcase;
        } catch (error) {
            if (error instanceof ValidationError) {
                throw error;
            }
            console.error('Failed to get showcase:', error);
            throw new ValidationError('Failed to get showcase: ' + error.message);
        }
    }

    /**
     * Retry operation with exponential backoff
     */
    async retryOperation(operation, errorMessage) {
        let lastError;
        for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
            try {
                return await operation();
            } catch (error) {
                lastError = error;
                if (attempt === this.MAX_RETRIES) {
                    break;
                }
                await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY * Math.pow(2, attempt - 1)));
            }
        }
        throw new ValidationError(`${errorMessage}: ${lastError.message}`);
    }

    /**
     * Get all active showcases
     */
    async getAllShowcases() {
        try {
            // Try to get from cache first
            const cacheKey = 'showcases:all';
            const cachedShowcases = await this.redis.get(cacheKey);
            
            if (cachedShowcases) {
                return JSON.parse(cachedShowcases);
            }

            // If not in cache, get from database
            const showcases = await BusinessShowcase.getAllActiveShowcases();
            
            // Cache the result
            await this.redis.setex(
                cacheKey,
                this.CACHE_TTL,
                JSON.stringify(showcases)
            );

            return showcases;
        } catch (error) {
            console.error('Failed to get showcases:', error);
            throw new ValidationError('Failed to get showcases');
        }
    }

    /**
     * Update showcase metrics with validation
     */
    async updateMetrics(businessType, metricType, value) {
        try {
            const validMetrics = ['view', 'conversion', 'rating'];
            if (!validMetrics.includes(metricType)) {
                throw new ValidationError(`Invalid metric type. Must be one of: ${validMetrics.join(', ')}`);
            }

            if (metricType === 'rating' && (value < 0 || value > 5)) {
                throw new ValidationError('Rating must be between 0 and 5');
            }

            const showcase = await this.retryOperation(
                () => BusinessShowcase.getShowcaseByType(businessType),
                'Failed to get showcase for metrics update'
            );
            
            if (!showcase) {
                throw new ValidationError(`Showcase not found for business type: ${businessType}`);
            }

            switch (metricType) {
                case 'view':
                    await showcase.incrementViews();
                    break;
                case 'conversion':
                    await showcase.recordConversion();
                    break;
                case 'rating':
                    await showcase.updateRating(value);
                    break;
            }

            // Invalidate cache
            await this.invalidateCache();
            
            return showcase;
        } catch (error) {
            if (error instanceof ValidationError) {
                throw error;
            }
            console.error('Failed to update metrics:', error);
            throw new ValidationError('Failed to update metrics: ' + error.message);
        }
    }

    /**
     * Get AI-powered recommendations
     */
    async getAIRecommendations(userId, businessType) {
        try {
            const showcase = await this.getShowcaseByType(businessType);
            
            if (!showcase) {
                throw new ValidationError('Showcase not found');
            }

            // Get user preferences and history
            const userData = await this.getUserData(userId);
            
            // Generate personalized recommendations
            const recommendations = this.generateRecommendations(showcase, userData);
            
            return recommendations;
        } catch (error) {
            console.error('Failed to get AI recommendations:', error);
            throw new ValidationError('Failed to get AI recommendations');
        }
    }

    /**
     * Generate personalized recommendations
     */
    generateRecommendations(showcase, userData) {
        const recommendations = {
            features: [],
            rewards: [],
            aiSuggestions: []
        };

        // Add relevant features based on user preferences
        showcase.features.forEach(feature => {
            if (this.isFeatureRelevant(feature, userData)) {
                recommendations.features.push(feature);
            }
        });

        // Add relevant rewards based on user spending
        if (showcase.rewards && userData.totalSpent >= showcase.rewards.threshold) {
            recommendations.rewards.push(showcase.rewards);
        }

        // Generate AI suggestions based on user behavior
        showcase.aiFeatures.forEach(feature => {
            if (this.isAIFeatureRelevant(feature, userData)) {
                recommendations.aiSuggestions.push(feature);
            }
        });

        return recommendations;
    }

    /**
     * Check if a feature is relevant to the user
     */
    isFeatureRelevant(feature, userData) {
        // Implement feature relevance logic based on user data
        return true; // Placeholder
    }

    /**
     * Check if an AI feature is relevant to the user
     */
    isAIFeatureRelevant(feature, userData) {
        // Implement AI feature relevance logic based on user data
        return true; // Placeholder
    }

    /**
     * Get user data for recommendations
     */
    async getUserData(userId) {
        // Implement user data retrieval logic
        return {
            totalSpent: 0,
            preferences: {},
            history: []
        };
    }

    /**
     * Invalidate showcase cache
     */
    async invalidateCache() {
        try {
            const keys = await this.redis.keys('showcase:*');
            if (keys.length > 0) {
                await this.redis.del(keys);
            }
            await this.redis.del('showcases:all');
        } catch (error) {
            console.error('Failed to invalidate cache:', error);
        }
    }
}

module.exports = new BusinessShowcaseService(); 