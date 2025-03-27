const mongoose = require('mongoose');
const Redis = require('ioredis');
const AINotificationService = require('./AINotificationService');
const GamificationService = require('./GamificationService');

class RiskRewardService {
    constructor() {
        this.redis = new Redis(process.env.REDIS_URL);
        this.lootBoxTypes = {
            COMMON: 'common',
            RARE: 'rare',
            EPIC: 'epic',
            LEGENDARY: 'legendary'
        };
        this.lootBoxContents = {
            [this.lootBoxTypes.COMMON]: [
                { type: 'xp', amount: 100, probability: 0.4 },
                { type: 'multiplier', amount: 1.5, probability: 0.3 },
                { type: 'perk', id: 'priority_booking', probability: 0.3 }
            ],
            [this.lootBoxTypes.RARE]: [
                { type: 'xp', amount: 500, probability: 0.3 },
                { type: 'multiplier', amount: 2, probability: 0.3 },
                { type: 'perk', id: 'free_ride', probability: 0.2 },
                { type: 'perk', id: 'vip_status', probability: 0.2 }
            ],
            [this.lootBoxTypes.EPIC]: [
                { type: 'xp', amount: 1000, probability: 0.2 },
                { type: 'multiplier', amount: 3, probability: 0.2 },
                { type: 'perk', id: 'unlimited_rides', probability: 0.2 },
                { type: 'perk', id: 'exclusive_access', probability: 0.2 },
                { type: 'perk', id: 'premium_features', probability: 0.2 }
            ],
            [this.lootBoxTypes.LEGENDARY]: [
                { type: 'xp', amount: 5000, probability: 0.1 },
                { type: 'multiplier', amount: 5, probability: 0.1 },
                { type: 'perk', id: 'lifetime_vip', probability: 0.2 },
                { type: 'perk', id: 'custom_theme', probability: 0.2 },
                { type: 'perk', id: 'exclusive_emojis', probability: 0.2 },
                { type: 'perk', id: 'personal_driver', probability: 0.2 }
            ]
        };
    }

    async createRiskRewardChallenge(userId, challengeId, betAmount) {
        try {
            // Verify user has enough XP
            const userStats = await GamificationService.getUserStats(userId);
            if (userStats.points < betAmount) {
                throw new Error('Insufficient XP for bet');
            }

            // Create risk-reward challenge
            const riskChallenge = {
                id: `risk_${challengeId}`,
                originalChallengeId: challengeId,
                userId,
                betAmount,
                potentialReward: betAmount * 2,
                potentialLoss: betAmount / 2,
                status: 'active',
                createdAt: new Date()
            };

            // Store in Redis for quick access
            const riskKey = `risk:${userId}:${riskChallenge.id}`;
            await this.redis.setex(
                riskKey,
                86400, // 24 hours
                JSON.stringify(riskChallenge)
            );

            // Deduct bet amount from user's XP
            await GamificationService.updateUserScore(
                userId,
                -betAmount,
                { type: 'risk_bet', challengeId: riskChallenge.id }
            );

            // Send notification
            await this.notifyRiskChallengeCreated(userId, riskChallenge);

            return riskChallenge;
        } catch (error) {
            console.error('Failed to create risk-reward challenge:', error);
            throw error;
        }
    }

    async completeRiskChallenge(userId, riskChallengeId, success) {
        try {
            const riskKey = `risk:${userId}:${riskChallengeId}`;
            const riskChallenge = await this.redis.get(riskKey);
            
            if (!riskChallenge) {
                throw new Error('Risk challenge not found');
            }

            const parsedChallenge = JSON.parse(riskChallenge);
            const reward = success ? parsedChallenge.potentialReward : -parsedChallenge.potentialLoss;

            // Update user's XP
            await GamificationService.updateUserScore(
                userId,
                reward,
                {
                    type: 'risk_completion',
                    challengeId: riskChallengeId,
                    success
                }
            );

            // Award loot box on success
            if (success) {
                await this.awardLootBox(userId);
            }

            // Send completion notification
            await this.notifyRiskChallengeCompleted(userId, parsedChallenge, success);

            // Remove from Redis
            await this.redis.del(riskKey);

            return { success, reward };
        } catch (error) {
            console.error('Failed to complete risk challenge:', error);
            throw error;
        }
    }

    async awardLootBox(userId) {
        try {
            // Determine loot box type based on streak
            const userStats = await GamificationService.getUserStats(userId);
            const streak = userStats.currentStreak || 0;
            
            let lootBoxType;
            if (streak >= 30) {
                lootBoxType = this.lootBoxTypes.LEGENDARY;
            } else if (streak >= 15) {
                lootBoxType = this.lootBoxTypes.EPIC;
            } else if (streak >= 7) {
                lootBoxType = this.lootBoxTypes.RARE;
            } else {
                lootBoxType = this.lootBoxTypes.COMMON;
            }

            // Generate loot box contents
            const contents = this.generateLootBoxContents(lootBoxType);

            // Store loot box in database
            const LootBox = mongoose.model('LootBox');
            const lootBox = await LootBox.create({
                userId,
                type: lootBoxType,
                contents,
                status: 'unopened',
                createdAt: new Date()
            });

            // Send notification
            await this.notifyLootBoxAwarded(userId, lootBox);

            return lootBox;
        } catch (error) {
            console.error('Failed to award loot box:', error);
            throw error;
        }
    }

    generateLootBoxContents(type) {
        const possibleContents = this.lootBoxContents[type];
        const contents = [];
        
        // Generate 3 random items
        for (let i = 0; i < 3; i++) {
            const random = Math.random();
            let cumulativeProbability = 0;
            
            for (const item of possibleContents) {
                cumulativeProbability += item.probability;
                if (random <= cumulativeProbability) {
                    contents.push({
                        type: item.type,
                        amount: item.amount,
                        id: item.id
                    });
                    break;
                }
            }
        }

        return contents;
    }

    async openLootBox(userId, lootBoxId) {
        try {
            const LootBox = mongoose.model('LootBox');
            const lootBox = await LootBox.findOne({ _id: lootBoxId, userId });

            if (!lootBox) {
                throw new Error('Loot box not found');
            }

            if (lootBox.status !== 'unopened') {
                throw new Error('Loot box already opened');
            }

            // Apply rewards
            for (const item of lootBox.contents) {
                switch (item.type) {
                    case 'xp':
                        await GamificationService.updateUserScore(
                            userId,
                            item.amount,
                            { type: 'loot_box', lootBoxId }
                        );
                        break;
                    case 'perk':
                        await this.applyPerk(userId, item.id);
                        break;
                    case 'multiplier':
                        await this.applyMultiplier(userId, item.amount);
                        break;
                }
            }

            // Update loot box status
            lootBox.status = 'opened';
            await lootBox.save();

            // Send notification
            await this.notifyLootBoxOpened(userId, lootBox);

            return lootBox;
        } catch (error) {
            console.error('Failed to open loot box:', error);
            throw error;
        }
    }

    async applyPerk(userId, perkId) {
        const User = mongoose.model('User');
        await User.findByIdAndUpdate(userId, {
            $push: {
                activePerks: {
                    $each: [perkId],
                    $slice: -10
                }
            }
        });
    }

    async applyMultiplier(userId, multiplier) {
        const User = mongoose.model('User');
        await User.findByIdAndUpdate(userId, {
            $push: {
                activeMultipliers: {
                    multiplier,
                    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
                }
            }
        });
    }

    async notifyRiskChallengeCreated(userId, challenge) {
        const notification = {
            type: 'risk_challenge',
            title: 'Risk-Reward Challenge Created! 🎲',
            message: `You've bet ${challenge.betAmount} XP on completing this challenge. Win ${challenge.potentialReward} XP or lose ${challenge.potentialLoss} XP!`,
            data: {
                type: 'risk_challenge',
                challengeId: challenge.id,
                betAmount: challenge.betAmount,
                potentialReward: challenge.potentialReward,
                potentialLoss: challenge.potentialLoss
            }
        };

        await AINotificationService.sendNotification(userId, notification);
    }

    async notifyRiskChallengeCompleted(userId, challenge, success) {
        const notification = {
            type: success ? 'success' : 'warning',
            title: success ? 'Risk Challenge Won! 🎉' : 'Risk Challenge Lost 😢',
            message: success 
                ? `Congratulations! You've won ${challenge.potentialReward} XP!`
                : `Better luck next time! You've lost ${challenge.potentialLoss} XP.`,
            data: {
                type: 'risk_completion',
                challengeId: challenge.id,
                success,
                reward: success ? challenge.potentialReward : -challenge.potentialLoss
            }
        };

        await AINotificationService.sendNotification(userId, notification);
    }

    async notifyLootBoxAwarded(userId, lootBox) {
        const notification = {
            type: 'loot_box',
            title: 'New Loot Box! 🎁',
            message: `You've earned a ${lootBox.type} loot box! Open it to claim your rewards!`,
            data: {
                type: 'loot_box',
                lootBoxId: lootBox._id,
                lootBoxType: lootBox.type
            }
        };

        await AINotificationService.sendNotification(userId, notification);
    }

    async notifyLootBoxOpened(userId, lootBox) {
        const notification = {
            type: 'success',
            title: 'Loot Box Opened! 🎉',
            message: 'Check out your new rewards!',
            data: {
                type: 'loot_box_opened',
                lootBoxId: lootBox._id,
                contents: lootBox.contents
            }
        };

        await AINotificationService.sendNotification(userId, notification);
    }
}

module.exports = new RiskRewardService(); 