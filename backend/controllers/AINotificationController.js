const AINotificationService = require('../services/AINotificationService');
const { ValidationError } = require('../utils/errors');

class AINotificationController {
    async getNotifications(req, res, next) {
        try {
            const { userId } = req.params;

            if (!userId) {
                throw new ValidationError('User ID is required');
            }

            const notifications = await AINotificationService.generatePersonalizedNotifications(userId);

            res.json({
                success: true,
                data: notifications
            });
        } catch (error) {
            next(error);
        }
    }

    async createChallenge(req, res, next) {
        try {
            const { userId } = req.params;
            const { challengeType } = req.body;

            if (!userId || !challengeType) {
                throw new ValidationError('User ID and challenge type are required');
            }

            const challenge = await AINotificationService.createGamifiedChallenge(userId, challengeType);

            res.json({
                success: true,
                data: challenge
            });
        } catch (error) {
            next(error);
        }
    }

    async markNotificationRead(req, res, next) {
        try {
            const { userId, notificationId } = req.params;

            if (!userId || !notificationId) {
                throw new ValidationError('User ID and notification ID are required');
            }

            const Notification = require('mongoose').model('Notification');
            await Notification.findOneAndUpdate(
                { _id: notificationId, userId },
                { read: true }
            );

            res.json({
                success: true,
                message: 'Notification marked as read'
            });
        } catch (error) {
            next(error);
        }
    }

    async getActiveChallenges(req, res, next) {
        try {
            const { userId } = req.params;

            if (!userId) {
                throw new ValidationError('User ID is required');
            }

            const Challenge = require('mongoose').model('Challenge');
            const challenges = await Challenge.find({
                userId,
                status: 'active',
                endDate: { $gt: new Date() }
            });

            res.json({
                success: true,
                data: challenges
            });
        } catch (error) {
            next(error);
        }
    }

    async completeChallenge(req, res, next) {
        try {
            const { userId, challengeId } = req.params;

            if (!userId || !challengeId) {
                throw new ValidationError('User ID and challenge ID are required');
            }

            const Challenge = require('mongoose').model('Challenge');
            const challenge = await Challenge.findOneAndUpdate(
                { _id: challengeId, userId },
                { 
                    status: 'completed',
                    completedAt: new Date()
                },
                { new: true }
            );

            if (!challenge) {
                throw new ValidationError('Challenge not found');
            }

            // Award rewards
            await this.awardChallengeRewards(userId, challenge);

            res.json({
                success: true,
                data: challenge
            });
        } catch (error) {
            next(error);
        }
    }

    async awardChallengeRewards(userId, challenge) {
        const User = require('mongoose').model('User');
        const Reward = require('mongoose').model('Reward');

        // Create reward record
        await Reward.create({
            userId,
            challengeId: challenge._id,
            type: challenge.rewards.type,
            amount: challenge.rewards.amount,
            status: 'pending'
        });

        // Update user's rewards
        await User.findByIdAndUpdate(userId, {
            $inc: {
                [`rewards.${challenge.rewards.type}`]: challenge.rewards.amount
            }
        });
    }
}

module.exports = new AINotificationController(); 