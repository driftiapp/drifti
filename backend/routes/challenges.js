const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const User = require('../models/User');
const Challenge = require('../models/Challenge');
const { trackError } = require('../monitoring/errorMonitor');

// Get available challenges
router.get('/', auth, async (req, res) => {
  try {
    const challenges = await Challenge.find();
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const challengesWithProgress = challenges.map(challenge => ({
      ...challenge.toObject(),
      joined: user.activeChallenges.includes(challenge._id),
      progress: user.challengeProgress.get(challenge._id.toString()) || 0
    }));

    res.json(challengesWithProgress);
  } catch (error) {
    trackError(error, { route: 'GET /api/challenges' });
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's active challenges
router.get('/active', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('activeChallenges');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const activeChallenges = user.activeChallenges.map(challenge => ({
      ...challenge.toObject(),
      progress: user.challengeProgress.get(challenge._id.toString()) || 0
    }));

    res.json(activeChallenges);
  } catch (error) {
    trackError(error, { route: 'GET /api/challenges/active' });
    res.status(500).json({ message: 'Server error' });
  }
});

// Join a challenge
router.post('/:id/join', auth, async (req, res) => {
  try {
    const challenge = await Challenge.findById(req.params.id);
    if (!challenge) {
      return res.status(404).json({ message: 'Challenge not found' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.activeChallenges.includes(challenge._id)) {
      return res.status(400).json({ message: 'Already joined this challenge' });
    }

    user.activeChallenges.push(challenge._id);
    user.challengeProgress.set(challenge._id.toString(), 0);
    await user.save();

    res.json({
      message: 'Successfully joined challenge',
      challenge,
      progress: 0
    });
  } catch (error) {
    trackError(error, { route: 'POST /api/challenges/:id/join' });
    res.status(500).json({ message: 'Server error' });
  }
});

// Update challenge progress
router.put('/:id/progress', auth, async (req, res) => {
  try {
    const { progress } = req.body;
    const challenge = await Challenge.findById(req.params.id);
    
    if (!challenge) {
      return res.status(404).json({ message: 'Challenge not found' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.activeChallenges.includes(challenge._id)) {
      return res.status(400).json({ message: 'Not joined this challenge' });
    }

    user.challengeProgress.set(challenge._id.toString(), progress);
    
    // Check if challenge is completed
    if (progress >= challenge.target) {
      user.activeChallenges = user.activeChallenges.filter(
        id => id.toString() !== challenge._id.toString()
      );
      user.completedChallenges.push({
        challenge: challenge._id,
        completedAt: Date.now()
      });
      
      // Award points for completing challenge
      user.points += challenge.rewardPoints;
    }

    await user.save();
    res.json({
      progress,
      completed: progress >= challenge.target
    });
  } catch (error) {
    trackError(error, { route: 'PUT /api/challenges/:id/progress' });
    res.status(500).json({ message: 'Server error' });
  }
});

// Get challenge leaderboard
router.get('/:id/leaderboard', async (req, res) => {
  try {
    const challenge = await Challenge.findById(req.params.id);
    if (!challenge) {
      return res.status(404).json({ message: 'Challenge not found' });
    }

    const users = await User.find({
      activeChallenges: challenge._id
    })
    .select('displayName challengeProgress')
    .sort({ [`challengeProgress.${challenge._id}`]: -1 })
    .limit(100);

    const leaderboard = users.map(user => ({
      displayName: user.displayName,
      progress: user.challengeProgress.get(challenge._id.toString()) || 0
    }));

    res.json(leaderboard);
  } catch (error) {
    trackError(error, { route: 'GET /api/challenges/:id/leaderboard' });
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 