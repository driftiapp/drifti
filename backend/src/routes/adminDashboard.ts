import { Router } from 'express';
import { onlineUsersService } from '../services/onlineUsersService';
import { metricsService } from '../services/metricsService';
import { logger } from '../utils/logger';
import { requireAuth, requireAdmin, AuthenticatedRequest } from '../middleware/auth';
import { defaultRateLimiter } from '../middleware/rateLimiter';

const router = Router();

// Apply rate limiting to all routes
router.use(defaultRateLimiter);

// Apply authentication to all routes
router.use(requireAuth);
router.use(requireAdmin);

// Get all online users
router.get('/online-users', async (req, res) => {
    try {
        const users = await onlineUsersService.getOnlineUsers();
        const userDetails = await Promise.all(
            users.map(async (userId) => {
                const lastSeen = await onlineUsersService.getUserLastSeen(userId);
                const rooms = await onlineUsersService.getUserRooms(userId);
                return {
                    userId,
                    lastSeen,
                    rooms
                };
            })
        );
        res.json({ users: userDetails });
    } catch (error) {
        logger.error('Failed to get online users:', error);
        res.status(500).json({ error: 'Failed to get online users' });
    }
});

// Get presence history for a user
router.get('/presence-history/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const limit = parseInt(req.query.limit as string) || 100;
        const history = await onlineUsersService.getPresenceHistory(userId, limit);
        res.json({ history });
    } catch (error) {
        logger.error('Failed to get presence history:', error);
        res.status(500).json({ error: 'Failed to get presence history' });
    }
});

// Check if a user is online
router.get('/user-status/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const isOnline = await onlineUsersService.isUserOnline(userId);
        const lastSeen = await onlineUsersService.getUserLastSeen(userId);
        const rooms = await onlineUsersService.getUserRooms(userId);
        res.json({ isOnline, lastSeen, rooms });
    } catch (error) {
        logger.error('Failed to check user status:', error);
        res.status(500).json({ error: 'Failed to check user status' });
    }
});

// Get room presence
router.get('/room/:roomId/users', async (req, res) => {
    try {
        const { roomId } = req.params;
        const users = await onlineUsersService.getRoomUsers(roomId);
        const userDetails = await Promise.all(
            users.map(async (userId) => {
                const lastSeen = await onlineUsersService.getUserLastSeen(userId);
                return {
                    userId,
                    lastSeen
                };
            })
        );
        res.json({ roomId, users: userDetails });
    } catch (error) {
        logger.error('Failed to get room users:', error);
        res.status(500).json({ error: 'Failed to get room users' });
    }
});

// Get system metrics
router.get('/metrics', async (req, res) => {
    try {
        const metrics = metricsService.getMetrics();
        res.json(metrics);
    } catch (error) {
        logger.error('Failed to get metrics:', error);
        res.status(500).json({ error: 'Failed to get metrics' });
    }
});

// Health check endpoint
router.get('/health', async (req, res) => {
    try {
        const metrics = metricsService.getMetrics();
        const isHealthy = metrics.uptime > 0 && metrics.redisMemoryUsage > 0;

        res.json({
            status: isHealthy ? 'healthy' : 'unhealthy',
            uptime: metrics.uptime,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Health check failed:', error);
        res.status(500).json({
            status: 'unhealthy',
            error: 'Health check failed'
        });
    }
});

export default router; 