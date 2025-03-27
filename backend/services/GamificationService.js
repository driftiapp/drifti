const mongoose = require('mongoose');
const Redis = require('ioredis');
const AINotificationService = require('./AINotificationService');

class GamificationService {
    constructor() {
        this.redis = new Redis(process.env.REDIS_URL);
        this.leaderboardTTL = 3600; // 1 hour
        this.streakTTL = 86400; // 24 hours
    }

    async updateUserScore(userId, points, activity) {
        try {
            const User = mongoose.model('User');
            const user = await User.findById(userId);
            
            if (!user) {
                throw new Error('User not found');
            }

            // Update user's total score
            user.score = (user.score || 0) + points;
            
            // Update streak
            const streak = await this.updateStreak(userId);
            
            // Apply streak bonus if applicable
            const streakBonus = this.calculateStreakBonus(streak);
            if (streakBonus > 0) {
                user.score += streakBonus;
            }

            // Update user's level
            const newLevel = this.calculateLevel(user.score);
            const levelUp = newLevel > (user.level || 1);
            
            if (levelUp) {
                user.level = newLevel;
                await this.handleLevelUp(userId, newLevel);
            }

            await user.save();

            // Update leaderboard
            await this.updateLeaderboard(userId, user.score);

            // Record activity
            await this.recordActivity(userId, activity, points);

            return {
                score: user.score,
                level: user.level,
                streak,
                streakBonus,
                levelUp
            };
        } catch (error) {
            console.error('Failed to update user score:', error);
            throw error;
        }
    }

    async updateStreak(userId) {
        const streakKey = `streak:${userId}`;
        const lastActivityKey = `last_activity:${userId}`;
        
        const lastActivity = await this.redis.get(lastActivityKey);
        const now = Date.now();
        
        if (!lastActivity) {
            await this.redis.set(lastActivityKey, now);
            await this.redis.set(streakKey, 1, 'EX', this.streakTTL);
            return 1;
        }

        const lastActivityTime = parseInt(lastActivity);
        const daysSinceLastActivity = Math.floor((now - lastActivityTime) / (24 * 60 * 60 * 1000));

        if (daysSinceLastActivity <= 1) {
            const currentStreak = await this.redis.incr(streakKey);
            await this.redis.expire(streakKey, this.streakTTL);
            await this.redis.set(lastActivityKey, now);
            return currentStreak;
        } else {
            await this.redis.set(streakKey, 1, 'EX', this.streakTTL);
            await this.redis.set(lastActivityKey, now);
            return 1;
        }
    }

    calculateStreakBonus(streak) {
        if (streak >= 7) return 100;
        if (streak >= 5) return 50;
        if (streak >= 3) return 25;
        return 0;
    }

    calculateLevel(score) {
        return Math.floor(Math.sqrt(score / 1000)) + 1;
    }

    async handleLevelUp(userId, newLevel) {
        const rewards = this.getLevelRewards(newLevel);
        
        // Send level up notification
        await AINotificationService.sendNotification(userId, {
            type: 'success',
            title: 'Level Up! 🎉',
            message: `Congratulations! You've reached level ${newLevel}!`,
            data: {
                type: 'level_up',
                level: newLevel,
                rewards
            }
        });

        // Apply rewards
        await this.applyRewards(userId, rewards);
    }

    getLevelRewards(level) {
        const rewards = {
            points: level * 1000,
            perks: []
        };

        // Add special perks for milestone levels
        if (level % 5 === 0) {
            rewards.perks.push({
                type: 'vip_access',
                duration: '7d'
            });
        }
        if (level % 10 === 0) {
            rewards.perks.push({
                type: 'exclusive_discount',
                value: '20%'
            });
        }

        return rewards;
    }

    async applyRewards(userId, rewards) {
        const User = mongoose.model('User');
        await User.findByIdAndUpdate(userId, {
            $inc: { score: rewards.points },
            $push: {
                activePerks: {
                    $each: rewards.perks,
                    $slice: -10 // Keep only the 10 most recent perks
                }
            }
        });
    }

    async updateLeaderboard(userId, score) {
        const leaderboardKey = 'global_leaderboard';
        await this.redis.zadd(leaderboardKey, score, userId);
        await this.redis.expire(leaderboardKey, this.leaderboardTTL);
    }

    async getLeaderboard(limit = 100) {
        const leaderboardKey = 'global_leaderboard';
        const User = mongoose.model('User');
        
        const topUsers = await this.redis.zrevrange(leaderboardKey, 0, limit - 1, 'WITHSCORES');
        const userIds = topUsers.filter((_, index) => index % 2 === 0);
        
        const users = await User.find({ _id: { $in: userIds } })
            .select('username score level avatar');

        return users.map((user, index) => ({
            rank: index + 1,
            username: user.username,
            score: user.score,
            level: user.level,
            avatar: user.avatar
        }));
    }

    async recordActivity(userId, activity, points) {
        const Activity = mongoose.model('Activity');
        await Activity.create({
            userId,
            type: activity.type,
            points,
            timestamp: new Date(),
            metadata: activity.metadata
        });
    }

    async getUserStats(userId) {
        const User = mongoose.model('User');
        const Activity = mongoose.model('Activity');
        
        const [user, recentActivity] = await Promise.all([
            User.findById(userId).select('score level streak activePerks'),
            Activity.find({ userId })
                .sort({ timestamp: -1 })
                .limit(10)
        ]);

        const streak = await this.redis.get(`streak:${userId}`) || 0;
        const rank = await this.getUserRank(userId);

        return {
            score: user.score,
            level: user.level,
            streak: parseInt(streak),
            rank,
            activePerks: user.activePerks,
            recentActivity
        };
    }

    async getUserRank(userId) {
        const leaderboardKey = 'global_leaderboard';
        return await this.redis.zrevrank(leaderboardKey, userId) + 1;
    }
}

module.exports = new GamificationService(); 