import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { app } from '../config/firebase';

class FirebaseMessagingService {
    private messaging = getMessaging(app);
    private vapidKey = process.env.REACT_APP_FIREBASE_VAPID_KEY;

    async requestPermission(): Promise<boolean> {
        try {
            const permission = await Notification.requestPermission();
            return permission === 'granted';
        } catch (error) {
            console.error('Failed to request notification permission:', error);
            return false;
        }
    }

    async getFCMToken(): Promise<string | null> {
        try {
            const currentToken = await getToken(this.messaging, {
                vapidKey: this.vapidKey
            });
            return currentToken;
        } catch (error) {
            console.error('Failed to get FCM token:', error);
            return null;
        }
    }

    onMessageListener() {
        return new Promise((resolve) => {
            onMessage(this.messaging, (payload) => {
                resolve(payload);
            });
        });
    }

    async showNotification(payload: any) {
        if (!('Notification' in window)) {
            console.log('This browser does not support notifications');
            return;
        }

        const permission = await this.requestPermission();
        if (permission) {
            const { title, body, icon, data } = payload.notification;
            const options = {
                body,
                icon: icon || '/logo192.png',
                badge: '/badge.png',
                data,
                vibrate: [100, 50, 100],
                tag: data?.type || 'default',
                renotify: true,
                requireInteraction: true,
                actions: [
                    {
                        action: 'open',
                        title: 'Open'
                    },
                    {
                        action: 'close',
                        title: 'Close'
                    }
                ]
            };

            const notification = new Notification(title, options);
            notification.onclick = (event) => {
                event.preventDefault();
                if (data?.action) {
                    this.handleNotificationAction(data.action);
                }
            };
        }
    }

    private handleNotificationAction(action: any) {
        switch (action.type) {
            case 'start_challenge':
                // Navigate to challenge
                window.location.href = `/challenges/${action.challengeId}`;
                break;
            case 'view_deal':
                // Navigate to deal
                window.location.href = `/deals/${action.dealId}`;
                break;
            case 'complete_profile':
                // Navigate to profile completion
                window.location.href = '/profile/complete';
                break;
            default:
                console.log('Unknown action type:', action.type);
        }
    }
}

export default new FirebaseMessagingService(); 