import { redisService } from './redisService';
import { logger } from '../utils/logger';

const ONLINE_USERS_KEY = 'online_users';
const USER_PRESENCE_TTL = 60; // 60 seconds
const PRESENCE_CHANNEL = 'user_presence';
const DEBOUNCE_INTERVAL = 5000; // 5 seconds
const PRESENCE_STREAM = 'presence_history';
const ROOM_PRESENCE_KEY = 'room_presence';
const USER_STATUS_KEY = 'user_status';

export type UserStatus = 'online' | 'idle' | 'offline';
export type UserActivity = 'active' | 'idle' | 'away';

interface UserPresence {
    userId: string;
    status: UserStatus;
    activity: UserActivity;
    timestamp: number;
    lastSeen: number;
    roomId?: string;
    metadata?: {
        role?: string;
        device?: string;
        location?: string;
        [key: string]: any;
    };
}

interface RoomPresence {
    roomId: string;
    users: string[];
    lastUpdated: number;
}

class OnlineUsersService {
    private static instance: OnlineUsersService;
    private cleanupInterval: NodeJS.Timeout | null = null;
    private lastBroadcasts: Map<string, number> = new Map();
    private activityCheckInterval: NodeJS.Timeout | null = null;

    private constructor() {
        this.setupPresenceSubscription();
        this.startCleanupJob();
        this.startActivityCheck();
    }

    private async setupPresenceSubscription() {
        try {
            await redisService.subscribe(PRESENCE_CHANNEL, (message) => {
                try {
                    const presence: UserPresence = JSON.parse(message);
                    logger.info(`User ${presence.userId} is now ${presence.status}`, {
                        metadata: presence.metadata
                    });
                } catch (error) {
                    logger.error('Failed to parse presence message:', error);
                }
            });
        } catch (error) {
            logger.error('Failed to setup presence subscription:', error);
        }
    }

    private async logPresenceToStream(presence: UserPresence): Promise<void> {
        try {
            await redisService.client.xadd(
                PRESENCE_STREAM,
                '*',
                'userId', presence.userId,
                'status', presence.status,
                'activity', presence.activity,
                'timestamp', presence.timestamp.toString(),
                'lastSeen', presence.lastSeen.toString(),
                'roomId', presence.roomId || '',
                'metadata', JSON.stringify(presence.metadata || {})
            );
        } catch (error) {
            logger.error('Failed to log presence to stream:', error);
        }
    }

    private startCleanupJob() {
        // Run cleanup every 30 seconds
        this.cleanupInterval = setInterval(() => {
            this.cleanupStaleUsers().catch((error) => {
                logger.error('Failed to run cleanup job:', error);
            });
        }, 30000);
    }

    private startActivityCheck() {
        // Check user activity every 30 seconds
        this.activityCheckInterval = setInterval(() => {
            this.updateUserActivity().catch((error) => {
                logger.error('Failed to update user activity:', error);
            });
        }, 30000);
    }

    private async updateUserActivity() {
        try {
            const users = await redisService.client.hgetall(ONLINE_USERS_KEY);
            const now = Date.now();

            for (const [userId, timestamp] of Object.entries(users)) {
                const lastSeen = parseInt(timestamp);
                const timeSinceLastSeen = now - lastSeen;

                let activity: UserActivity = 'active';
                if (timeSinceLastSeen > 300000) { // 5 minutes
                    activity = 'away';
                } else if (timeSinceLastSeen > 60000) { // 1 minute
                    activity = 'idle';
                }

                await this.updateUserStatus(userId, 'online', activity);
            }
        } catch (error) {
            logger.error('Failed to update user activity:', error);
        }
    }

    private shouldBroadcast(userId: string): boolean {
        const lastBroadcast = this.lastBroadcasts.get(userId) || 0;
        const now = Date.now();

        if (now - lastBroadcast < DEBOUNCE_INTERVAL) {
            return false;
        }

        this.lastBroadcasts.set(userId, now);
        return true;
    }

    public static getInstance(): OnlineUsersService {
        if (!OnlineUsersService.instance) {
            OnlineUsersService.instance = new OnlineUsersService();
        }
        return OnlineUsersService.instance;
    }

    public async addUser(userId: string, metadata?: UserPresence['metadata'], roomId?: string): Promise<void> {
        try {
            const now = Date.now();
            await redisService.hset(ONLINE_USERS_KEY, userId, now.toString());
            await redisService.client.expire(ONLINE_USERS_KEY, USER_PRESENCE_TTL);

            if (roomId) {
                await this.addUserToRoom(userId, roomId);
            }

            if (this.shouldBroadcast(userId)) {
                const presence: UserPresence = {
                    userId,
                    status: 'online',
                    activity: 'active',
                    timestamp: now,
                    lastSeen: now,
                    roomId,
                    metadata
                };
                await redisService.publish(PRESENCE_CHANNEL, JSON.stringify(presence));
                await this.logPresenceToStream(presence);
            }
        } catch (error) {
            logger.error('Failed to add online user:', error);
            throw error;
        }
    }

    public async removeUser(userId: string, metadata?: UserPresence['metadata']): Promise<void> {
        try {
            const now = Date.now();
            await redisService.client.hdel(ONLINE_USERS_KEY, userId);

            // Remove from all rooms
            const rooms = await this.getUserRooms(userId);
            for (const roomId of rooms) {
                await this.removeUserFromRoom(userId, roomId);
            }

            if (this.shouldBroadcast(userId)) {
                const presence: UserPresence = {
                    userId,
                    status: 'offline',
                    activity: 'away',
                    timestamp: now,
                    lastSeen: now,
                    metadata
                };
                await redisService.publish(PRESENCE_CHANNEL, JSON.stringify(presence));
                await this.logPresenceToStream(presence);
            }
        } catch (error) {
            logger.error('Failed to remove online user:', error);
            throw error;
        }
    }

    public async getOnlineUsers(): Promise<string[]> {
        try {
            const users = await redisService.client.hgetall(ONLINE_USERS_KEY);
            return Object.keys(users);
        } catch (error) {
            logger.error('Failed to get online users:', error);
            throw error;
        }
    }

    public async isUserOnline(userId: string): Promise<boolean> {
        try {
            const exists = await redisService.client.hexists(ONLINE_USERS_KEY, userId);
            return exists === 1;
        } catch (error) {
            logger.error('Failed to check user online status:', error);
            throw error;
        }
    }

    public async updateUserPresence(userId: string, metadata?: UserPresence['metadata'], roomId?: string): Promise<void> {
        try {
            await this.addUser(userId, metadata, roomId);
        } catch (error) {
            logger.error('Failed to update user presence:', error);
            throw error;
        }
    }

    public async updateUserStatus(userId: string, status: UserStatus, activity: UserActivity): Promise<void> {
        try {
            const now = Date.now();
            const presence: UserPresence = {
                userId,
                status,
                activity,
                timestamp: now,
                lastSeen: now,
                metadata: await this.getUserMetadata(userId)
            };
            await redisService.publish(PRESENCE_CHANNEL, JSON.stringify(presence));
            await this.logPresenceToStream(presence);
        } catch (error) {
            logger.error('Failed to update user status:', error);
            throw error;
        }
    }

    public async getUserLastSeen(userId: string): Promise<number> {
        try {
            const timestamp = await redisService.client.hget(ONLINE_USERS_KEY, userId);
            return timestamp ? parseInt(timestamp) : 0;
        } catch (error) {
            logger.error('Failed to get user last seen:', error);
            throw error;
        }
    }

    public async addUserToRoom(userId: string, roomId: string): Promise<void> {
        try {
            const key = `${ROOM_PRESENCE_KEY}:${roomId}`;
            await redisService.client.sadd(key, userId);
            await redisService.client.expire(key, USER_PRESENCE_TTL);
        } catch (error) {
            logger.error('Failed to add user to room:', error);
            throw error;
        }
    }

    public async removeUserFromRoom(userId: string, roomId: string): Promise<void> {
        try {
            const key = `${ROOM_PRESENCE_KEY}:${roomId}`;
            await redisService.client.srem(key, userId);
        } catch (error) {
            logger.error('Failed to remove user from room:', error);
            throw error;
        }
    }

    public async getRoomUsers(roomId: string): Promise<string[]> {
        try {
            const key = `${ROOM_PRESENCE_KEY}:${roomId}`;
            return await redisService.client.smembers(key);
        } catch (error) {
            logger.error('Failed to get room users:', error);
            throw error;
        }
    }

    public async getUserRooms(userId: string): Promise<string[]> {
        try {
            const rooms = await redisService.client.keys(`${ROOM_PRESENCE_KEY}:*`);
            const userRooms: string[] = [];

            for (const roomKey of rooms) {
                const roomId = roomKey.split(':')[1];
                const isMember = await redisService.client.sismember(roomKey, userId);
                if (isMember) {
                    userRooms.push(roomId);
                }
            }

            return userRooms;
        } catch (error) {
            logger.error('Failed to get user rooms:', error);
            throw error;
        }
    }

    private async getUserMetadata(userId: string): Promise<UserPresence['metadata']> {
        try {
            const key = `${USER_STATUS_KEY}:${userId}`;
            const metadata = await redisService.client.get(key);
            return metadata ? JSON.parse(metadata) : {};
        } catch (error) {
            logger.error('Failed to get user metadata:', error);
            return {};
        }
    }

    public async cleanupStaleUsers(): Promise<void> {
        try {
            const users = await redisService.client.hgetall(ONLINE_USERS_KEY);
            const now = Date.now();

            for (const [userId, timestamp] of Object.entries(users)) {
                const lastSeen = parseInt(timestamp);
                if (now - lastSeen > USER_PRESENCE_TTL * 1000) {
                    await this.removeUser(userId);
                }
            }
        } catch (error) {
            logger.error('Failed to cleanup stale users:', error);
            throw error;
        }
    }

    public async getPresenceHistory(userId: string, limit: number = 100): Promise<UserPresence[]> {
        try {
            const stream = await redisService.client.xrevrange(
                PRESENCE_STREAM,
                '+',
                '-',
                'COUNT',
                limit.toString()
            ) as unknown as [string, { [key: string]: string }][];

            return stream
                .filter(entry => {
                    const [_, fields] = entry;
                    return fields.userId === userId;
                })
                .map(entry => {
                    const [_, fields] = entry;
                    return {
                        userId: fields.userId,
                        status: fields.status as UserStatus,
                        activity: fields.activity as UserActivity,
                        timestamp: parseInt(fields.timestamp),
                        lastSeen: parseInt(fields.lastSeen),
                        roomId: fields.roomId || undefined,
                        metadata: JSON.parse(fields.metadata || '{}')
                    };
                });
        } catch (error) {
            logger.error('Failed to get presence history:', error);
            throw error;
        }
    }

    public async shutdown(): Promise<void> {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
        if (this.activityCheckInterval) {
            clearInterval(this.activityCheckInterval);
            this.activityCheckInterval = null;
        }
    }
}

export const onlineUsersService = OnlineUsersService.getInstance(); 