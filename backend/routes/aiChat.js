const express = require('express');
const router = express.Router();
const AIChatController = require('../controllers/AIChatController');
const { authenticate } = require('../middleware/auth');
const rateLimit = require('express-rate-limit');

// Rate limiting configuration for chat endpoints
const chatLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 30, // limit each IP to 30 requests per minute
    message: 'Too many chat messages, please try again later.'
});

// Apply rate limiting to all chat routes
router.use(chatLimiter);

// Handle chat messages
router.post(
    '/chat/:userId',
    authenticate,
    AIChatController.handleChatMessage
);

// Get chat history
router.get(
    '/chat/:userId/history',
    authenticate,
    AIChatController.getChatHistory
);

// Clear chat history
router.delete(
    '/chat/:userId/history',
    authenticate,
    AIChatController.clearChatHistory
);

module.exports = router; 