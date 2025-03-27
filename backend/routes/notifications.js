const express = require('express');
const router = express.Router();
const AINotificationController = require('../controllers/AINotificationController');
const { authenticate } = require('../middleware/auth');
const rateLimit = require('express-rate-limit');
const admin = require('firebase-admin');
const { auth } = require('../middleware/auth');
const Notification = require('../models/Notification');
const AINotificationTimingService = require('../services/AINotificationTimingService');
const User = require('../models/User');
const { trackError } = require('../monitoring/errorMonitor');
const { optimizeNotificationTiming } = require('../services/AINotificationTimingService');

// Rate limiting for notifications
const notificationLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});

// Get personalized notifications
router.get('/:userId', authenticate, notificationLimiter, AINotificationController.getNotifications);

// Mark notification as read
router.patch('/:userId/:notificationId/read', authenticate, AINotificationController.markNotificationRead);

// Create new challenge
router.post('/:userId/challenges', authenticate, AINotificationController.createChallenge);

// Get active challenges
router.get('/:userId/challenges/active', authenticate, AINotificationController.getActiveChallenges);

// Complete challenge
router.patch('/:userId/challenges/:challengeId/complete', authenticate, AINotificationController.completeChallenge);

// Get user's notifications
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user.notifications);
  } catch (error) {
    trackError(error, { route: 'GET /api/notifications' });
    res.status(500).json({ message: 'Server error' });
  }
});

// Create notification
router.post('/', auth, async (req, res) => {
  try {
    const { title, message, type, priority } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Optimize notification timing using AI
    const optimalTime = await optimizeNotificationTiming(user, type, priority);

    const notification = {
      title,
      message,
      type,
      priority,
      read: false,
      createdAt: optimalTime || Date.now()
    };

    user.notifications.push(notification);
    await user.save();

    res.status(201).json(notification);
  } catch (error) {
    trackError(error, { route: 'POST /api/notifications' });
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark notification as read
router.put('/:id/read', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const notification = user.notifications.id(req.params.id);
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    notification.read = true;
    await user.save();

    res.json(notification);
  } catch (error) {
    trackError(error, { route: 'PUT /api/notifications/:id/read' });
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark all notifications as read
router.put('/read-all', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.notifications.forEach(notification => {
      notification.read = true;
    });

    await user.save();
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    trackError(error, { route: 'PUT /api/notifications/read-all' });
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete notification
router.delete('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const notification = user.notifications.id(req.params.id);
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    notification.remove();
    await user.save();

    res.json({ message: 'Notification deleted' });
  } catch (error) {
    trackError(error, { route: 'DELETE /api/notifications/:id' });
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 