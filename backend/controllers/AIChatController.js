const MultiModelAIService = require('../services/MultiModelAIService');
const { ValidationError } = require('../utils/errors');
const Redis = require('ioredis');

class AIChatController {
    constructor() {
        this.redis = new Redis(process.env.REDIS_URL);
        this.chatHistoryTTL = 3600; // 1 hour
    }

    async handleChatMessage(req, res, next) {
        try {
            const { userId } = req.params;
            const { message } = req.body;

            if (!userId || !message) {
                throw new ValidationError('User ID and message are required');
            }

            // Get chat history
            const chatHistory = await this.getChatHistory(userId);

            // Handle the message with AI
            const response = await MultiModelAIService.handleAIChat(userId, message);

            // Update chat history
            await this.updateChatHistory(userId, message, response);

            res.json({
                success: true,
                data: {
                    response,
                    timestamp: new Date(),
                    history: chatHistory
                }
            });
        } catch (error) {
            next(error);
        }
    }

    async getChatHistory(req, res, next) {
        try {
            const { userId } = req.params;

            if (!userId) {
                throw new ValidationError('User ID is required');
            }

            const history = await this.getChatHistory(userId);

            res.json({
                success: true,
                data: history
            });
        } catch (error) {
            next(error);
        }
    }

    async clearChatHistory(req, res, next) {
        try {
            const { userId } = req.params;

            if (!userId) {
                throw new ValidationError('User ID is required');
            }

            await this.clearChatHistory(userId);

            res.json({
                success: true,
                message: 'Chat history cleared successfully'
            });
        } catch (error) {
            next(error);
        }
    }

    async getChatHistory(userId) {
        const historyKey = `chat:history:${userId}`;
        const history = await this.redis.get(historyKey);
        return history ? JSON.parse(history) : [];
    }

    async updateChatHistory(userId, message, response) {
        const historyKey = `chat:history:${userId}`;
        const history = await this.getChatHistory(userId);

        history.push({
            message,
            response,
            timestamp: new Date()
        });

        // Keep only last 50 messages
        if (history.length > 50) {
            history.shift();
        }

        await this.redis.setex(
            historyKey,
            this.chatHistoryTTL,
            JSON.stringify(history)
        );
    }

    async clearChatHistory(userId) {
        const historyKey = `chat:history:${userId}`;
        await this.redis.del(historyKey);
    }
}

module.exports = new AIChatController(); 