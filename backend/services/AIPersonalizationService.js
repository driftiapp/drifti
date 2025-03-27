const mongoose = require('mongoose');
const Redis = require('ioredis');
const { Configuration, OpenAIApi } = require('openai');

class AIPersonalizationService {
    constructor() {
        this.redis = new Redis(process.env.REDIS_URL);
        this.openai = new OpenAIApi(
            new Configuration({
                apiKey: process.env.OPENAI_API_KEY
            })
        );
        this.cacheTTL = 3600; // 1 hour
    }

    async generatePersonalizedRecommendations(userId, businessType) {
        try {
            // Check cache first
            const cacheKey = `recommendations:${userId}:${businessType}`;
            const cachedRecommendations = await this.redis.get(cacheKey);
            if (cachedRecommendations) {
                return JSON.parse(cachedRecommendations);
            }

            // Get user preferences and history
            const userPreferences = await this.getUserPreferences(userId);
            const userHistory = await this.getUserHistory(userId, businessType);
            const businessContext = await this.getBusinessContext(businessType);

            // Generate personalized recommendations using OpenAI
            const recommendations = await this.generateRecommendationsWithAI(
                userPreferences,
                userHistory,
                businessContext
            );

            // Cache the results
            await this.redis.setex(
                cacheKey,
                this.cacheTTL,
                JSON.stringify(recommendations)
            );

            return recommendations;
        } catch (error) {
            console.error('Error generating personalized recommendations:', error);
            throw error;
        }
    }

    async getUserPreferences(userId) {
        const User = mongoose.model('User');
        const user = await User.findById(userId);
        
        if (!user) {
            throw new Error('User not found');
        }

        return {
            preferences: user.preferences || {},
            favoriteCategories: user.favoriteCategories || [],
            priceRange: user.priceRange || { min: 0, max: 1000 },
            location: user.location || null
        };
    }

    async getUserHistory(userId, businessType) {
        const Interaction = mongoose.model('Interaction');
        const interactions = await Interaction.find({
            userId,
            businessType,
            timestamp: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
        }).sort({ timestamp: -1 });

        return interactions.map(interaction => ({
            type: interaction.type,
            businessId: interaction.businessId,
            timestamp: interaction.timestamp,
            rating: interaction.rating,
            duration: interaction.duration
        }));
    }

    async getBusinessContext(businessType) {
        const BusinessShowcase = mongoose.model('BusinessShowcase');
        const showcases = await BusinessShowcase.find({ businessType })
            .sort({ 'metrics.views': -1 })
            .limit(10);

        return showcases.map(showcase => ({
            id: showcase._id,
            name: showcase.name,
            features: showcase.features,
            metrics: showcase.metrics,
            aiFeatures: showcase.aiFeatures
        }));
    }

    async generateRecommendationsWithAI(userPreferences, userHistory, businessContext) {
        try {
            const prompt = this.buildAIPrompt(userPreferences, userHistory, businessContext);
            
            const completion = await this.openai.createCompletion({
                model: "gpt-4",
                prompt: prompt,
                max_tokens: 500,
                temperature: 0.7,
                top_p: 0.9,
                frequency_penalty: 0.5,
                presence_penalty: 0.5
            });

            const recommendations = this.parseAIResponse(completion.data.choices[0].text);
            return this.enrichRecommendations(recommendations, businessContext);
        } catch (error) {
            console.error('Error generating AI recommendations:', error);
            return this.generateFallbackRecommendations(userHistory, businessContext);
        }
    }

    buildAIPrompt(userPreferences, userHistory, businessContext) {
        return `Based on the following user preferences and history, generate personalized recommendations:

User Preferences:
${JSON.stringify(userPreferences, null, 2)}

Recent History:
${JSON.stringify(userHistory, null, 2)}

Available Businesses:
${JSON.stringify(businessContext, null, 2)}

Generate recommendations that:
1. Match user preferences and price range
2. Consider past interactions and ratings
3. Include both popular and personalized options
4. Highlight unique features and AI capabilities
5. Provide reasoning for each recommendation

Format the response as a JSON array of recommendations with the following structure:
{
    "recommendations": [
        {
            "businessId": "string",
            "reason": "string",
            "features": ["string"],
            "aiFeatures": ["string"],
            "confidence": number
        }
    ]
}`;
    }

    parseAIResponse(response) {
        try {
            const parsed = JSON.parse(response);
            return parsed.recommendations || [];
        } catch (error) {
            console.error('Error parsing AI response:', error);
            return [];
        }
    }

    enrichRecommendations(recommendations, businessContext) {
        return recommendations.map(rec => {
            const business = businessContext.find(b => b.id === rec.businessId);
            if (business) {
                return {
                    ...rec,
                    name: business.name,
                    features: business.features,
                    aiFeatures: business.aiFeatures,
                    metrics: business.metrics
                };
            }
            return rec;
        });
    }

    generateFallbackRecommendations(userHistory, businessContext) {
        // Sort businesses by popularity and user history
        const scoredBusinesses = businessContext.map(business => {
            let score = business.metrics.views * 0.3 + 
                       business.metrics.conversions * 0.4 + 
                       business.metrics.averageRating * 0.3;

            // Boost score for businesses user has interacted with
            const userInteraction = userHistory.find(h => h.businessId === business.id);
            if (userInteraction) {
                score *= 1.2;
            }

            return { ...business, score };
        });

        return scoredBusinesses
            .sort((a, b) => b.score - a.score)
            .slice(0, 5)
            .map(business => ({
                businessId: business.id,
                name: business.name,
                features: business.features,
                aiFeatures: business.aiFeatures,
                metrics: business.metrics,
                reason: 'Based on popularity and your preferences',
                confidence: 0.8
            }));
    }

    async updateUserPreferences(userId, interaction) {
        try {
            const User = mongoose.model('User');
            const user = await User.findById(userId);

            if (!user) {
                throw new Error('User not found');
            }

            // Update preferences based on interaction
            if (interaction.rating) {
                user.preferences = {
                    ...user.preferences,
                    preferredPriceRange: this.calculatePriceRange(user.preferences, interaction),
                    favoriteFeatures: this.updateFavoriteFeatures(user.preferences, interaction)
                };
            }

            // Update favorite categories
            if (interaction.businessType) {
                user.favoriteCategories = this.updateFavoriteCategories(
                    user.favoriteCategories,
                    interaction.businessType
                );
            }

            await user.save();
        } catch (error) {
            console.error('Error updating user preferences:', error);
            throw error;
        }
    }

    calculatePriceRange(currentPreferences, interaction) {
        const currentRange = currentPreferences.preferredPriceRange || { min: 0, max: 1000 };
        const price = interaction.price || 0;

        return {
            min: Math.min(currentRange.min, price),
            max: Math.max(currentRange.max, price)
        };
    }

    updateFavoriteFeatures(currentPreferences, interaction) {
        const currentFeatures = currentPreferences.favoriteFeatures || [];
        const newFeatures = interaction.features || [];

        // Add new features and update counts
        const featureCounts = new Map();
        [...currentFeatures, ...newFeatures].forEach(feature => {
            featureCounts.set(feature, (featureCounts.get(feature) || 0) + 1);
        });

        // Sort by frequency and take top 10
        return Array.from(featureCounts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([feature]) => feature);
    }

    updateFavoriteCategories(currentCategories, businessType) {
        const categories = new Set(currentCategories);
        categories.add(businessType);

        // Keep only top 5 categories
        return Array.from(categories).slice(0, 5);
    }
}

module.exports = new AIPersonalizationService(); 