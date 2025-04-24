import { WebSocket, WebSocketServer } from 'ws';
import { redisService } from './redisService';
import { logger } from '../utils/logger';
import { onlineUsersService } from './onlineUsersService';

interface WebSocketClient extends WebSocket {
    userId?: string;
    isAlive: boolean;
}

class WebSocketService {
    private static instance: WebSocketService;
    private wss: WebSocketServer | null = null;
    private clients: Map<string, WebSocketClient> = new Map();
    private heartbeatInterval: NodeJS.Timeout | null = null;

    private constructor() {
        this.setupPresenceSubscription();
    }

    private async setupPresenceSubscription() {
        try {
            await redisService.subscribe('user_presence', (message) => {
                this.broadcastToAll(message);
            });
        } catch (error) {
            logger.error('Failed to setup presence subscription:', error);
        }
    }

    public static getInstance(): WebSocketService {
        if (!WebSocketService.instance) {
            WebSocketService.instance = new WebSocketService();
        }
        return WebSocketService.instance;
    }

    public async start(port: number): Promise<void> {
        if (this.wss) return;

        this.wss = new WebSocketServer({ port });
        this.setupWebSocketServer();
        this.startHeartbeat();
        logger.info(`WebSocket server started on port ${port}`);
    }

    private setupWebSocketServer() {
        if (!this.wss) return;

        this.wss.on('connection', (ws: WebSocketClient) => {
            this.handleConnection(ws);
        });

        this.wss.on('error', (error) => {
            logger.error('WebSocket server error:', error);
        });
    }

    private handleConnection(ws: WebSocketClient) {
        ws.isAlive = true;

        ws.on('pong', () => {
            ws.isAlive = true;
        });

        ws.on('message', async (message: string) => {
            try {
                const data = JSON.parse(message);
                if (data.type === 'auth' && data.userId) {
                    ws.userId = data.userId;
                    this.clients.set(data.userId, ws);
                    await onlineUsersService.addUser(data.userId);
                }
            } catch (error) {
                logger.error('Failed to handle WebSocket message:', error);
            }
        });

        ws.on('close', () => {
            if (ws.userId) {
                this.clients.delete(ws.userId);
                onlineUsersService.removeUser(ws.userId).catch((error) => {
                    logger.error('Failed to remove user on WebSocket close:', error);
                });
            }
        });

        ws.on('error', (error) => {
            logger.error('WebSocket client error:', error);
            if (ws.userId) {
                this.clients.delete(ws.userId);
            }
        });
    }

    private startHeartbeat() {
        this.heartbeatInterval = setInterval(() => {
            this.wss?.clients.forEach((ws) => {
                const client = ws as WebSocketClient;
                if (!client.isAlive) {
                    if (client.userId) {
                        this.clients.delete(client.userId);
                        onlineUsersService.removeUser(client.userId).catch((error) => {
                            logger.error('Failed to remove user on heartbeat timeout:', error);
                        });
                    }
                    return client.terminate();
                }
                client.isAlive = false;
                client.ping();
            });
        }, 30000);
    }

    private broadcastToAll(message: string) {
        this.wss?.clients.forEach((ws) => {
            const client = ws as WebSocketClient;
            if (client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    }

    public async shutdown(): Promise<void> {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }

        if (this.wss) {
            this.wss.close();
            this.wss = null;
        }

        // Remove all users
        for (const [userId] of this.clients) {
            await onlineUsersService.removeUser(userId).catch((error) => {
                logger.error(`Failed to remove user ${userId} during shutdown:`, error);
            });
        }
    }
}

export const websocketService = WebSocketService.getInstance(); 