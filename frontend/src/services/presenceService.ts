import { EventEmitter } from 'events';
import { logger } from '../utils/logger';

export type UserStatus = 'online' | 'idle' | 'offline';
export type UserActivity = 'active' | 'idle' | 'away';

interface PresenceEvent {
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

class PresenceService extends EventEmitter {
    private static instance: PresenceService;
    private ws: WebSocket | null = null;
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private reconnectDelay = 1000;
    private userId: string | null = null;
    private rooms: Set<string> = new Set();
    private lastActivity = Date.now();
    private activityCheckInterval: NodeJS.Timeout | null = null;

    private constructor() {
        super();
        this.setupActivityTracking();
    }

    public static getInstance(): PresenceService {
        if (!PresenceService.instance) {
            PresenceService.instance = new PresenceService();
        }
        return PresenceService.instance;
    }

    private setupActivityTracking() {
        // Track user activity
        window.addEventListener('mousemove', () => this.updateActivity());
        window.addEventListener('keydown', () => this.updateActivity());
        window.addEventListener('click', () => this.updateActivity());
        window.addEventListener('scroll', () => this.updateActivity());

        // Track window focus
        window.addEventListener('focus', () => this.updateActivity());
        window.addEventListener('blur', () => this.handleBlur());

        // Start activity check interval
        this.activityCheckInterval = setInterval(() => {
            this.checkActivity();
        }, 30000);
    }

    private updateActivity() {
        this.lastActivity = Date.now();
        if (this.userId) {
            this.sendPresenceUpdate('active');
        }
    }

    private handleBlur() {
        if (this.userId) {
            this.sendPresenceUpdate('idle');
        }
    }

    private checkActivity() {
        const now = Date.now();
        const timeSinceLastActivity = now - this.lastActivity;

        if (timeSinceLastActivity > 300000) { // 5 minutes
            this.sendPresenceUpdate('away');
        } else if (timeSinceLastActivity > 60000) { // 1 minute
            this.sendPresenceUpdate('idle');
        }
    }

    private sendPresenceUpdate(activity: UserActivity) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                type: 'presence',
                payload: {
                    activity,
                    timestamp: Date.now()
                }
            }));
        }
    }

    public async connect(userId: string, token: string): Promise<void> {
        this.userId = userId;
        const wsUrl = `${process.env.REACT_APP_WS_URL}/presence?token=${token}`;

        try {
            this.ws = new WebSocket(wsUrl);
            this.setupWebSocket();
        } catch (error) {
            logger.error('Failed to connect to WebSocket:', error);
            this.handleReconnect();
        }
    }

    private setupWebSocket() {
        if (!this.ws) return;

        this.ws.onopen = () => {
            logger.info('WebSocket connected');
            this.reconnectAttempts = 0;
            this.authenticate();
        };

        this.ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === 'presence') {
                    this.handlePresenceUpdate(data.payload as PresenceEvent);
                }
            } catch (error) {
                logger.error('Failed to parse WebSocket message:', error);
            }
        };

        this.ws.onclose = () => {
            logger.info('WebSocket disconnected');
            this.handleReconnect();
        };

        this.ws.onerror = (error) => {
            logger.error('WebSocket error:', error);
        };
    }

    private authenticate() {
        if (this.ws && this.ws.readyState === WebSocket.OPEN && this.userId) {
            this.ws.send(JSON.stringify({
                type: 'auth',
                payload: {
                    userId: this.userId
                }
            }));
        }
    }

    private handleReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

            setTimeout(() => {
                logger.info(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
                this.connect(this.userId!, 'token'); // You should store the token securely
            }, delay);
        } else {
            logger.error('Max reconnection attempts reached');
            this.emit('reconnectFailed');
        }
    }

    private handlePresenceUpdate(presence: PresenceEvent) {
        this.emit('presenceUpdate', presence);
    }

    public joinRoom(roomId: string): void {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.rooms.add(roomId);
            this.ws.send(JSON.stringify({
                type: 'joinRoom',
                payload: { roomId }
            }));
        }
    }

    public leaveRoom(roomId: string): void {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.rooms.delete(roomId);
            this.ws.send(JSON.stringify({
                type: 'leaveRoom',
                payload: { roomId }
            }));
        }
    }

    public disconnect(): void {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        if (this.activityCheckInterval) {
            clearInterval(this.activityCheckInterval);
            this.activityCheckInterval = null;
        }
    }
}

export const presenceService = PresenceService.getInstance(); 