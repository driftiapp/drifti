const { Configuration, OpenAIApi } = require('openai');
const Redis = require('ioredis');
const { Configuration: CohereConfig, CohereClient } = require('cohere-ai');
const { Configuration: HuggingFaceConfig, HuggingFaceClient } = require('huggingface');

class MultiModelAIService {
    constructor() {
        this.redis = new Redis(process.env.REDIS_URL);
        this.openai = new OpenAIApi(
            new Configuration({
                apiKey: process.env.OPENAI_API_KEY
            })
        );
        this.cohere = new CohereClient(
            new CohereConfig({
                apiKey: process.env.COHERE_API_KEY
            })
        );
        this.huggingface = new HuggingFaceClient(
            new HuggingFaceConfig({
                apiKey: process.env.HUGGINGFACE_API_KEY
            })
        );
        this.cacheTTL = 1800; // 30 minutes
    }

    async generateMultiModelRecommendations(userPreferences, businessContext) {
        try {
            const cacheKey = `multi_model:${JSON.stringify(userPreferences)}:${JSON.stringify(businessContext)}`;
            const cached = await this.redis.get(cacheKey);
            if (cached) {
                return JSON.parse(cached);
            }

            // Generate recommendations from different models
            const [gpt4Recs, cohereRecs, hfRecs] = await Promise.all([
                this.generateGPT4Recommendations(userPreferences, businessContext),
                this.generateCohereRecommendations(userPreferences, businessContext),
                this.generateHuggingFaceRecommendations(userPreferences, businessContext)
            ]);

            // Combine and rank recommendations
            const combinedRecs = this.combineRecommendations(gpt4Recs, cohereRecs, hfRecs);

            // Cache results
            await this.redis.setex(cacheKey, this.cacheTTL, JSON.stringify(combinedRecs));

            return combinedRecs;
        } catch (error) {
            console.error('Error generating multi-model recommendations:', error);
            throw error;
        }
    }

    async generateGPT4Recommendations(preferences, context) {
        const prompt = this.buildGPT4Prompt(preferences, context);
        const completion = await this.openai.createCompletion({
            model: "gpt-4",
            prompt: prompt,
            max_tokens: 500,
            temperature: 0.7
        });
        return this.parseGPT4Response(completion.data.choices[0].text);
    }

    async generateCohereRecommendations(preferences, context) {
        const response = await this.cohere.generate({
            prompt: this.buildCoherePrompt(preferences, context),
            max_tokens: 300,
            temperature: 0.7,
            k: 0,
            stop_sequences: ["\n"],
            return_likelihoods: "ALL"
        });
        return this.parseCohereResponse(response.body.generations[0].text);
    }

    async generateHuggingFaceRecommendations(preferences, context) {
        const response = await this.huggingface.textGeneration({
            model: "gpt2-large",
            inputs: this.buildHuggingFacePrompt(preferences, context),
            parameters: {
                max_length: 300,
                temperature: 0.7
            }
        });
        return this.parseHuggingFaceResponse(response.generated_text);
    }

    combineRecommendations(gpt4Recs, cohereRecs, hfRecs) {
        // Create a map to track unique recommendations
        const uniqueRecs = new Map();

        // Add recommendations with their model confidence scores
        [...gpt4Recs, ...cohereRecs, ...hfRecs].forEach(rec => {
            const key = rec.businessId;
            if (!uniqueRecs.has(key)) {
                uniqueRecs.set(key, {
                    ...rec,
                    modelScores: []
                });
            }
            uniqueRecs.get(key).modelScores.push(rec.confidence);
        });

        // Calculate combined confidence scores
        return Array.from(uniqueRecs.values()).map(rec => ({
            ...rec,
            confidence: this.calculateCombinedConfidence(rec.modelScores),
            modelCount: rec.modelScores.length
        })).sort((a, b) => b.confidence - a.confidence);
    }

    calculateCombinedConfidence(scores) {
        // Weighted average based on model reliability
        const weights = [0.5, 0.3, 0.2]; // GPT-4, Cohere, HuggingFace
        return scores.reduce((acc, score, idx) => acc + (score * weights[idx]), 0) / scores.length;
    }

    buildGPT4Prompt(preferences, context) {
        return `Generate personalized recommendations based on:
User Preferences: ${JSON.stringify(preferences)}
Available Businesses: ${JSON.stringify(context)}

Consider:
1. Price range and location
2. Past interactions and ratings
3. Unique features and AI capabilities
4. Current trends and popularity

Format as JSON array with businessId, reason, features, and confidence.`;
    }

    buildCoherePrompt(preferences, context) {
        return `Based on user preferences ${JSON.stringify(preferences)} and available businesses ${JSON.stringify(context)}, suggest personalized recommendations. Focus on matching user interests with business features.`;
    }

    buildHuggingFacePrompt(preferences, context) {
        return `Generate recommendations for user with preferences ${JSON.stringify(preferences)} from businesses ${JSON.stringify(context)}. Consider price, location, and features.`;
    }

    parseGPT4Response(response) {
        try {
            return JSON.parse(response).recommendations || [];
        } catch (error) {
            console.error('Error parsing GPT-4 response:', error);
            return [];
        }
    }

    parseCohereResponse(response) {
        try {
            return JSON.parse(response).recommendations || [];
        } catch (error) {
            console.error('Error parsing Cohere response:', error);
            return [];
        }
    }

    parseHuggingFaceResponse(response) {
        try {
            return JSON.parse(response).recommendations || [];
        } catch (error) {
            console.error('Error parsing HuggingFace response:', error);
            return [];
        }
    }

    async handleAIChat(userId, message) {
        try {
            const userPreferences = await this.getUserPreferences(userId);
            const context = await this.getBusinessContext();

            const chatResponse = await this.openai.createChatCompletion({
                model: "gpt-4",
                messages: [
                    {
                        role: "system",
                        content: `You are a helpful AI assistant for a business discovery platform. 
                        User preferences: ${JSON.stringify(userPreferences)}
                        Available context: ${JSON.stringify(context)}
                        Provide personalized, helpful responses.`
                    },
                    {
                        role: "user",
                        content: message
                    }
                ],
                max_tokens: 300,
                temperature: 0.7
            });

            return chatResponse.data.choices[0].message.content;
        } catch (error) {
            console.error('Error handling AI chat:', error);
            throw error;
        }
    }

    async getUserPreferences(userId) {
        // Implementation from AIPersonalizationService
        const User = require('mongoose').model('User');
        const user = await User.findById(userId);
        return user?.preferences || {};
    }

    async getBusinessContext() {
        // Implementation from AIPersonalizationService
        const BusinessShowcase = require('mongoose').model('BusinessShowcase');
        return await BusinessShowcase.find().limit(10);
    }
}

module.exports = new MultiModelAIService(); 