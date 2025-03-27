import { api } from './api';

export interface Notification {
    id: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'challenge';
    read: boolean;
    createdAt: string;
    data?: any;
}

export interface Challenge {
    id: string;
    title: string;
    description: string;
    type: string;
    rewards: {
        type: string;
        amount: number;
    };
    status: 'active' | 'completed';
    endDate: string;
    progress?: number;
}

class NotificationService {
    async getNotifications(userId: string): Promise<Notification[]> {
        const response = await api.get(`/notifications/${userId}`);
        return response.data.data;
    }

    async markAsRead(userId: string, notificationId: string): Promise<void> {
        await api.patch(`/notifications/${userId}/${notificationId}/read`);
    }

    async createChallenge(userId: string, challengeType: string): Promise<Challenge> {
        const response = await api.post(`/notifications/${userId}/challenges`, {
            challengeType
        });
        return response.data.data;
    }

    async getActiveChallenges(userId: string): Promise<Challenge[]> {
        const response = await api.get(`/notifications/${userId}/challenges/active`);
        return response.data.data;
    }

    async completeChallenge(userId: string, challengeId: string): Promise<Challenge> {
        const response = await api.patch(`/notifications/${userId}/challenges/${challengeId}/complete`);
        return response.data.data;
    }

    async updateFCMToken(userId: string, token: string): Promise<void> {
        await api.post(`/notifications/${userId}/fcm-token`, { token });
    }
}

export default new NotificationService(); 