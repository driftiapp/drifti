const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const User = require('../models/User');
const Achievement = require('../models/Achievement');
const { trackError } = require('../monitoring/errorMonitor');

// Get user's points and achievements
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('achievements.achievement');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      points: user.points,
      level: user.level,
      achievements: user.achievements,
      nextLevelPoints: user.nextLevelPoints
    });
  } catch (error) {
    trackError(error, { route: 'GET /api/gamification/profile' });
    res.status(500).json({ message: 'Server error' });
  }
});

// Award points to user
router.post('/points', auth, async (req, res) => {
  try {
    const { points, reason } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Add points
    user.points += points;

    // Check for level up
    while (user.points >= user.nextLevelPoints) {
      user.level += 1;
      user.points -= user.nextLevelPoints;
      user.nextLevelPoints = Math.floor(user.nextLevelPoints * 1.5);
    }

    // Check for achievements
    const achievements = await Achievement.find();
    for (const achievement of achievements) {
      if (!user.achievements.includes(achievement._id)) {
        if (user.points >= achievement.requiredPoints) {
          user.achievements.push({
            achievement: achievement._id,
            unlockedAt: Date.now()
          });
        }
      }
    }

    await user.save();
    res.json({
      points: user.points,
      level: user.level,
      nextLevelPoints: user.nextLevelPoints
    });
  } catch (error) {
    trackError(error, { route: 'POST /api/gamification/points' });
    res.status(500).json({ message: 'Server error' });
  }
});

// Get available achievements
router.get('/achievements', auth, async (req, res) => {
  try {
    const achievements = await Achievement.find();
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const achievementsWithProgress = achievements.map(achievement => ({
      ...achievement.toObject(),
      unlocked: user.achievements.includes(achievement._id),
      progress: Math.min(user.points / achievement.requiredPoints, 1)
    }));

    res.json(achievementsWithProgress);
  } catch (error) {
    trackError(error, { route: 'GET /api/gamification/achievements' });
    res.status(500).json({ message: 'Server error' });
  }
});

// Get leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    const users = await User.find()
      .select('displayName points level achievements')
      .sort({ points: -1 })
      .limit(100);

    res.json(users);
  } catch (error) {
    trackError(error, { route: 'GET /api/gamification/leaderboard' });
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 