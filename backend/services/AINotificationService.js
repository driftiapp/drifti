const mongoose = require('mongoose');
const admin = require('firebase-admin');
const AINotificationTimingService = require('./AINotificationTimingService');
const { ValidationError } = require('../utils/errors');

class AINotificationService {
    constructor() {
        this.db = admin.firestore();
    }

    async generatePersonalizedNotifications(userId) {
        try {
            // Get user data
            const [preferences, history, deals, trending] = await Promise.all([
                this.getUserPreferences(userId),
                this.getUserHistory(userId),
                this.getActiveDeals(userId),
                this.getTrendingItems()
            ]);

            // Generate notifications using AI
            const notifications = await this.generateNotificationsWithAI(preferences, history, deals, trending);

            // Get optimal timing for each notification
            const scheduledNotifications = await Promise.all(
                notifications.map(async (notification) => {
                    const timing = await AINotificationTimingService.getOptimalNotificationTime(
                        userId,
                        notification.type
                    );
                    return {
                        ...notification,
                        scheduledFor: timing.timestamp,
                        confidence: timing.confidence,
                        timingReason: timing.reason
                    };
                })
            );

            // Store notifications in database
            const Notification = mongoose.model('Notification');
            await Notification.insertMany(
                scheduledNotifications.map(n => ({
                    userId,
                    ...n,
                    createdAt: new Date()
                }))
            );

            // Schedule notifications for delivery
            await this.scheduleNotifications(userId, scheduledNotifications);

            return scheduledNotifications;
        } catch (error) {
            console.error('Failed to generate notifications:', error);
            throw error;
        }
    }

    async generateNotificationsWithAI(preferences, history, deals, trending) {
        const prompt = this.createNotificationPrompt(preferences, history, deals, trending);
        
        try {
            const response = await admin.firestore()
                .collection('ai_predictions')
                .add({
                    prompt,
                    timestamp: admin.firestore.FieldValue.serverTimestamp()
                });

            // Process AI response and format notifications
            return this.processAIResponse(response.id);
        } catch (error) {
            console.error('Failed to generate notifications with AI:', error);
            throw error;
        }
    }

    async scheduleNotifications(userId, notifications) {
        const User = mongoose.model('User');
        const user = await User.findById(userId);
        
        if (!user.fcmToken) {
            console.warn(`No FCM token found for user ${userId}`);
            return;
        }

        // Group notifications by scheduled time
        const groupedNotifications = notifications.reduce((acc, notification) => {
            const time = notification.scheduledFor.getTime();
            if (!acc[time]) {
                acc[time] = [];
            }
            acc[time].push(notification);
            return acc;
        }, {});

        // Schedule each group of notifications
        for (const [timestamp, notificationGroup] of Object.entries(groupedNotifications)) {
            const delay = new Date(parseInt(timestamp)).getTime() - Date.now();
            if (delay > 0) {
                setTimeout(async () => {
                    await this.sendNotificationGroup(userId, notificationGroup);
                }, delay);
            } else {
                await this.sendNotificationGroup(userId, notificationGroup);
            }
        }
    }

    async sendNotificationGroup(userId, notifications) {
        const User = mongoose.model('User');
        const user = await User.findById(userId);
        
        if (!user.fcmToken) return;

        const messages = notifications.map(notification => ({
            notification: {
                title: notification.title,
                body: notification.message,
                icon: notification.icon || '/logo192.png'
            },
            data: {
                type: notification.type,
                ...notification.data
            },
            token: user.fcmToken
        }));

        try {
            const response = await admin.messaging().sendAll(messages);
            console.log(`Successfully sent ${response.successCount} notifications`);
            
            // Update engagement metrics
            await Promise.all(
                notifications.map(notification =>
                    AINotificationTimingService.updateUserEngagementMetrics(
                        userId,
                        notification.id,
                        'sent'
                    )
                )
            );
        } catch (error) {
            console.error('Failed to send notification group:', error);
        }
    }

    async createGamifiedChallenge(userId, challengeType) {
        try {
            // Get user preferences and history
            const [preferences, history] = await Promise.all([
                this.getUserPreferences(userId),
                this.getUserHistory(userId)
            ]);

            // Generate challenge using AI
            const challenge = await this.generateChallengeWithAI(preferences, history, challengeType);

            // Get optimal timing for challenge notification
            const timing = await AINotificationTimingService.getOptimalNotificationTime(
                userId,
                'challenge'
            );

            // Store challenge in database
            const Challenge = mongoose.model('Challenge');
            const savedChallenge = await Challenge.create({
                userId,
                ...challenge,
                scheduledFor: timing.timestamp,
                confidence: timing.confidence,
                timingReason: timing.reason
            });

            // Schedule challenge notification
            await this.scheduleNotifications(userId, [{
                type: 'challenge',
                title: 'New Challenge Available!',
                message: challenge.description,
                data: {
                    type: 'challenge',
                    challengeId: savedChallenge._id
                },
                scheduledFor: timing.timestamp
            }]);

            return savedChallenge;
        } catch (error) {
            console.error('Failed to create challenge:', error);
            throw error;
        }
    }

    async generateChallengeWithAI(preferences, history, challengeType) {
        const prompt = `Generate a gamified challenge based on:
User Preferences: ${JSON.stringify(preferences)}
User History: ${JSON.stringify(history)}
Challenge Type: ${challengeType}

Consider:
1. User's interests and preferences
2. Appropriate difficulty level
3. Engaging rewards
4. Time commitment
5. Social aspects

Format as JSON with id, title, description, type, rewards, duration, and requirements.`;

        const response = await admin.firestore()
            .collection('ai_predictions')
            .add({
                prompt,
                timestamp: admin.firestore.FieldValue.serverTimestamp()
            });

        return this.processAIResponse(response.id);
    }

    async sendNotification(userId, notification) {
        try {
            // Get user's FCM token
            const user = await this.getUser(userId);
            if (!user?.fcmToken) {
                throw new ValidationError('User has no FCM token');
            }

            // Send notification via Firebase Cloud Messaging
            await admin.messaging().send({
                token: user.fcmToken,
                notification: {
                    title: notification.title,
                    body: notification.message
                },
                data: {
                    type: notification.type,
                    action: JSON.stringify(notification.action)
                }
            });

            // Store notification in database
            await this.storeNotification(userId, notification);

            return true;
        } catch (error) {
            console.error('Error sending notification:', error);
            throw error;
        }
    }

    async storeNotification(userId, notification) {
        const Notification = require('mongoose').model('Notification');
        await Notification.create({
            userId,
            ...notification,
            timestamp: new Date(),
            read: false
        });
    }

    async getUser(userId) {
        const User = require('mongoose').model('User');
        return await User.findById(userId);
    }

    async getUserPreferences(userId) {
        const User = require('mongoose').model('User');
        const user = await User.findById(userId);
        return user?.preferences || {};
    }

    async getUserHistory(userId) {
        const Interaction = require('mongoose').model('Interaction');
        return await Interaction.find({ userId })
            .sort({ timestamp: -1 })
            .limit(50);
    }

    async getActiveDeals(userId) {
        const Deal = require('mongoose').model('Deal');
        return await Deal.find({ isActive: true })
            .sort({ endDate: 1 })
            .limit(20);
    }

    async getTrendingItems() {
        const BusinessShowcase = require('mongoose').model('BusinessShowcase');
        return await BusinessShowcase.find()
            .sort({ 'metrics.views': -1 })
            .limit(20);
    }

    createNotificationPrompt(preferences, history, deals, trending) {
        return `Generate personalized notifications based on the following data:

User Preferences: ${JSON.stringify(preferences)}
User History: ${JSON.stringify(history)}
Active Deals: ${JSON.stringify(deals)}
Trending Items: ${JSON.stringify(trending)}

Please generate a list of notifications that are:
1. Relevant to the user's interests
2. Timely and contextual
3. Varied in type (deals, challenges, updates)
4. Engaging and actionable

Format each notification as a JSON object with:
- type: string (info, success, warning, challenge)
- title: string
- message: string
- data: object (additional data for the notification)
- icon: string (optional)`;
    }

    async processAIResponse(responseId) {
        // Implementation for processing AI response
        // This would typically involve parsing the AI's response and formatting it into notifications
        return [];
    }
}

module.exports = new AINotificationService(); 