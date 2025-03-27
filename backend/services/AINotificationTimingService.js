const mongoose = require('mongoose');
const Redis = require('ioredis');
const OpenAI = require('openai');
const User = require('../models/User');
const config = require('../config');

class AINotificationTimingService {
    constructor() {
        this.redis = new Redis(process.env.REDIS_URL);
        this.openai = new OpenAI({
            apiKey: config.openai.apiKey,
        });
        this.cacheTTL = 3600; // 1 hour
    }

    async getOptimalNotificationTime(userId, notificationType) {
        try {
            // Check cache first
            const cacheKey = `notification_timing:${userId}:${notificationType}`;
            const cachedTime = await this.redis.get(cacheKey);
            if (cachedTime) {
                return JSON.parse(cachedTime);
            }

            // Get user's activity patterns
            const user = await User.findById(userId);
            if (!user) {
                throw new Error('User not found');
            }

            // Get user's last active time and preferences
            const lastActive = user.lastActive;
            const preferences = user.preferences;

            // Prepare prompt for OpenAI
            const prompt = this._generatePrompt(user, notificationType, lastActive, preferences);

            // Get AI response
            const completion = await this.openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [
                    {
                        role: "system",
                        content: "You are an AI assistant that helps determine the optimal time to send notifications to users based on their activity patterns and preferences."
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                temperature: 0.7,
                max_tokens: 150
            });

            // Parse AI response
            const response = completion.choices[0].message.content;
            const optimalTime = this._parseResponse(response);

            // Cache the result
            await this.redis.setex(cacheKey, this.cacheTTL, JSON.stringify(optimalTime));
            
            return {
                timestamp: optimalTime,
                confidence: 0.8, // This could be calculated based on AI response
                reason: response
            };
        } catch (error) {
            console.error('Error getting optimal notification time:', error);
            // Fallback to a default time (e.g., current time + 1 hour)
            return {
                timestamp: new Date(Date.now() + 60 * 60 * 1000),
                confidence: 0.5,
                reason: 'Fallback to default time due to error'
            };
        }
    }

    _generatePrompt(user, notificationType, lastActive, preferences) {
        return `
            User Profile:
            - Name: ${user.displayName}
            - Last Active: ${lastActive}
            - Notification Preferences: ${JSON.stringify(preferences)}
            - Notification Type: ${notificationType}

            Please determine the optimal time to send this notification based on:
            1. User's last active time
            2. Notification preferences
            3. Type of notification
            4. Common user activity patterns

            Return the response in the format: "YYYY-MM-DD HH:mm:ss"
        `;
    }

    _parseResponse(response) {
        try {
            // Extract timestamp from AI response
            const timestampMatch = response.match(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/);
            if (timestampMatch) {
                return new Date(timestampMatch[0]);
            }
            throw new Error('Invalid timestamp format in response');
        } catch (error) {
            console.error('Error parsing AI response:', error);
            // Fallback to current time + 1 hour
            return new Date(Date.now() + 60 * 60 * 1000);
        }
    }

    async getUserEngagementData(userId) {
        const User = mongoose.model('User');
        const Notification = mongoose.model('Notification');
        const Challenge = mongoose.model('Challenge');

        // Get user's timezone and preferences
        const user = await User.findById(userId);
        
        // Get notification interaction history
        const notificationHistory = await Notification.find({
            userId,
            createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
        }).sort({ createdAt: -1 });

        // Get challenge completion history
        const challengeHistory = await Challenge.find({
            userId,
            status: 'completed',
            completedAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        }).sort({ completedAt: -1 });

        // Analyze engagement patterns
        const engagementPatterns = this.analyzeEngagementPatterns(notificationHistory, challengeHistory);

        return {
            timezone: user.timezone || 'UTC',
            preferences: user.notificationPreferences || {},
            engagementPatterns,
            notificationHistory,
            challengeHistory
        };
    }

    analyzeEngagementPatterns(notificationHistory, challengeHistory) {
        const patterns = {
            activeHours: new Array(24).fill(0),
            activeDays: new Array(7).fill(0),
            responseTimes: [],
            completionRates: new Array(24).fill(0)
        };

        // Analyze notification interactions
        notificationHistory.forEach(notification => {
            const hour = new Date(notification.createdAt).getHours();
            const day = new Date(notification.createdAt).getDay();
            
            patterns.activeHours[hour]++;
            patterns.activeDays[day]++;
            
            if (notification.read) {
                const responseTime = new Date(notification.readAt) - new Date(notification.createdAt);
                patterns.responseTimes.push(responseTime);
            }
        });

        // Analyze challenge completions
        challengeHistory.forEach(challenge => {
            const hour = new Date(challenge.completedAt).getHours();
            patterns.completionRates[hour]++;
        });

        return patterns;
    }

    async predictOptimalTime(userData, notificationType) {
        const { timezone, preferences, engagementPatterns } = userData;

        // Prepare prompt for GPT-4
        const prompt = this.createPredictionPrompt(engagementPatterns, notificationType, timezone, preferences);

        try {
            const response = await this.openai.chat.completions.create({
                model: "gpt-4",
                messages: [
                    {
                        role: "system",
                        content: "You are an AI assistant that predicts the optimal time to send notifications based on user engagement patterns. Consider timezone, historical engagement, and notification type."
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                temperature: 0.7,
                max_tokens: 150
            });

            const prediction = JSON.parse(response.choices[0].message.content);
            return {
                timestamp: new Date(prediction.timestamp),
                confidence: prediction.confidence,
                reason: prediction.reason
            };
        } catch (error) {
            console.error('Failed to get AI prediction:', error);
            throw error;
        }
    }

    createPredictionPrompt(patterns, notificationType, timezone, preferences) {
        return `Analyze the following user engagement patterns and predict the optimal time to send a ${notificationType} notification:

Timezone: ${timezone}
Active Hours: ${patterns.activeHours.join(', ')}
Active Days: ${patterns.activeDays.join(', ')}
Average Response Time: ${this.calculateAverageResponseTime(patterns.responseTimes)}ms
Completion Rates by Hour: ${patterns.completionRates.join(', ')}

User Preferences: ${JSON.stringify(preferences)}

Please provide a JSON response with:
1. timestamp: ISO string of the optimal time
2. confidence: number between 0 and 1
3. reason: brief explanation of the prediction`;
    }

    calculateAverageResponseTime(responseTimes) {
        if (responseTimes.length === 0) return 0;
        return responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    }

    async updateUserEngagementMetrics(userId, notificationId, interaction) {
        try {
            const User = mongoose.model('User');
            await User.findByIdAndUpdate(userId, {
                $push: {
                    engagementMetrics: {
                        notificationId,
                        interaction,
                        timestamp: new Date()
                    }
                }
            });
        } catch (error) {
            console.error('Failed to update engagement metrics:', error);
        }
    }
}

module.exports = new AINotificationTimingService(); 