const mongoose = require('mongoose');
const Redis = require('ioredis');
const AINotificationService = require('./AINotificationService');
const GamificationService = require('./GamificationService');

class AIChallengeService {
    constructor() {
        this.redis = new Redis(process.env.REDIS_URL);
        this.challengeTTL = 86400; // 24 hours
        this.challengeTypes = {
            DAILY: 'daily',
            WEEKLY: 'weekly',
            SPECIAL: 'special',
            TEAM: 'team'
        };
    }

    async generatePersonalizedChallenge(userId) {
        try {
            // Get user data for personalization
            const [userStats, userHistory] = await Promise.all([
                GamificationService.getUserStats(userId),
                this.getUserActivityHistory(userId)
            ]);

            // Generate challenge using AI
            const challenge = await this.generateChallengeWithAI(userStats, userHistory);

            // Store challenge in Redis for quick access
            const challengeKey = `challenge:${userId}:${challenge.id}`;
            await this.redis.setex(
                challengeKey,
                this.challengeTTL,
                JSON.stringify(challenge)
            );

            // Send challenge notification
            await this.notifyUserOfChallenge(userId, challenge);

            return challenge;
        } catch (error) {
            console.error('Failed to generate personalized challenge:', error);
            throw error;
        }
    }

    async generateChallengeWithAI(userStats, userHistory) {
        const prompt = this.createChallengePrompt(userStats, userHistory);
        
        try {
            const response = await admin.firestore()
                .collection('ai_predictions')
                .add({
                    prompt,
                    timestamp: admin.firestore.FieldValue.serverTimestamp()
                });

            // Process AI response and format challenge
            return this.processAIResponse(response.id);
        } catch (error) {
            console.error('Failed to generate challenge with AI:', error);
            throw error;
        }
    }

    createChallengePrompt(userStats, userHistory) {
        return `Generate a personalized challenge based on the following data:

User Stats: ${JSON.stringify(userStats)}
User History: ${JSON.stringify(userHistory)}

Please generate a challenge that is:
1. Appropriate for the user's level (${userStats.level})
2. Based on their recent activity patterns
3. Achievable within 24 hours
4. Rewarding enough to be engaging
5. Varied from their recent challenges

Format as JSON with:
- id: string (unique identifier)
- type: string (daily, weekly, special, team)
- title: string
- description: string
- requirements: object (specific goals)
- rewards: object (points, perks, multipliers)
- duration: number (hours)
- difficulty: number (1-5)
- specialConditions: array (optional)`;
    }

    async processAIResponse(responseId) {
        // Implementation for processing AI response
        // This would typically involve parsing the AI's response and formatting it into a challenge
        return {
            id: 'challenge_' + Date.now(),
            type: this.challengeTypes.DAILY,
            title: 'Complete 3 Deliveries Today',
            description: 'Complete 3 deliveries within 24 hours for a 2X XP bonus!',
            requirements: {
                deliveries: 3,
                timeLimit: 24
            },
            rewards: {
                points: 1000,
                multiplier: 2,
                perks: ['priority_booking']
            },
            duration: 24,
            difficulty: 2,
            specialConditions: ['time_sensitive']
        };
    }

    async notifyUserOfChallenge(userId, challenge) {
        const notification = {
            type: 'challenge',
            title: 'New Challenge Available! 🎯',
            message: challenge.description,
            data: {
                type: 'challenge',
                challengeId: challenge.id,
                rewards: challenge.rewards
            }
        };

        await AINotificationService.sendNotification(userId, notification);
    }

    async getUserActivityHistory(userId) {
        const Activity = mongoose.model('Activity');
        return await Activity.find({ userId })
            .sort({ timestamp: -1 })
            .limit(50);
    }

    async checkChallengeProgress(userId, challengeId) {
        const challengeKey = `challenge:${userId}:${challengeId}`;
        const challenge = await this.redis.get(challengeKey);
        
        if (!challenge) {
            throw new Error('Challenge not found');
        }

        const parsedChallenge = JSON.parse(challenge);
        const progress = await this.calculateProgress(userId, parsedChallenge);

        if (this.isChallengeComplete(progress, parsedChallenge.requirements)) {
            await this.handleChallengeCompletion(userId, parsedChallenge);
        }

        return progress;
    }

    async calculateProgress(userId, challenge) {
        // Implementation for calculating challenge progress
        // This would check the user's recent activities against the challenge requirements
        return {
            completed: false,
            progress: 0,
            remaining: challenge.requirements.deliveries
        };
    }

    isChallengeComplete(progress, requirements) {
        return progress.progress >= requirements.deliveries;
    }

    async handleChallengeCompletion(userId, challenge) {
        // Apply rewards
        await GamificationService.updateUserScore(
            userId,
            challenge.rewards.points * (challenge.rewards.multiplier || 1),
            {
                type: 'challenge_completion',
                challengeId: challenge.id
            }
        );

        // Apply special perks
        if (challenge.rewards.perks) {
            await this.applyPerks(userId, challenge.rewards.perks);
        }

        // Send completion notification
        await this.notifyChallengeCompletion(userId, challenge);

        // Remove challenge from Redis
        const challengeKey = `challenge:${userId}:${challenge.id}`;
        await this.redis.del(challengeKey);
    }

    async applyPerks(userId, perks) {
        const User = mongoose.model('User');
        await User.findByIdAndUpdate(userId, {
            $push: {
                activePerks: {
                    $each: perks,
                    $slice: -10
                }
            }
        });
    }

    async notifyChallengeCompletion(userId, challenge) {
        const notification = {
            type: 'success',
            title: 'Challenge Completed! 🎉',
            message: `Congratulations! You've completed the challenge: ${challenge.title}`,
            data: {
                type: 'challenge_completion',
                challengeId: challenge.id,
                rewards: challenge.rewards
            }
        };

        await AINotificationService.sendNotification(userId, notification);
    }
}

module.exports = new AIChallengeService(); 