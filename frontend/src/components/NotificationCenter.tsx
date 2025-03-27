import React, { useEffect, useState } from 'react';
import {
    Box,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Typography,
    IconButton,
    Badge,
    Paper,
    Divider,
    Button,
    LinearProgress,
    Chip,
    Snackbar,
    Alert
} from '@mui/material';
import {
    Notifications as NotificationsIcon,
    CheckCircle as CheckCircleIcon,
    EmojiEvents as EmojiEventsIcon,
    Close as CloseIcon,
    Info as InfoIcon,
    Warning as WarningIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import notificationService, { Notification, Challenge } from '../services/notificationService';
import firebaseMessaging from '../services/firebaseMessaging';
import { useAuth } from '../hooks/useAuth';

const StyledPaper = styled(Paper)(({ theme }) => ({
    position: 'fixed',
    top: theme.spacing(8),
    right: theme.spacing(2),
    width: 400,
    maxHeight: '80vh',
    overflow: 'auto',
    zIndex: 1000,
    [theme.breakpoints.down('sm')]: {
        width: '100%',
        right: 0,
        top: theme.spacing(7)
    }
}));

const NotificationCenter: React.FC = () => {
    const [open, setOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [challenges, setChallenges] = useState<Challenge[]>([]);
    const [permissionError, setPermissionError] = useState<string | null>(null);
    const { user } = useAuth();

    useEffect(() => {
        if (user) {
            loadNotifications();
            loadChallenges();
            setupPushNotifications();
        }
    }, [user]);

    const setupPushNotifications = async () => {
        if (!user) return;
        
        try {
            const permission = await firebaseMessaging.requestPermission();
            if (permission) {
                const token = await firebaseMessaging.getFCMToken();
                if (token) {
                    // Store the token in your backend
                    await notificationService.updateFCMToken(user.id, token);
                }
            } else {
                setPermissionError('Please enable notifications to receive updates');
            }

            // Listen for incoming messages
            firebaseMessaging.onMessageListener()
                .then((payload: any) => {
                    firebaseMessaging.showNotification(payload);
                    // Refresh notifications
                    loadNotifications();
                    loadChallenges();
                })
                .catch((err: Error) => {
                    console.error('Failed to receive message:', err);
                });
        } catch (error) {
            console.error('Failed to setup push notifications:', error);
            setPermissionError('Failed to setup push notifications');
        }
    };

    const loadNotifications = async () => {
        if (!user) return;
        try {
            const data = await notificationService.getNotifications(user.id);
            setNotifications(data);
        } catch (error) {
            console.error('Failed to load notifications:', error);
        }
    };

    const loadChallenges = async () => {
        if (!user) return;
        try {
            const data = await notificationService.getActiveChallenges(user.id);
            setChallenges(data);
        } catch (error) {
            console.error('Failed to load challenges:', error);
        }
    };

    const handleMarkAsRead = async (notificationId: string) => {
        if (!user) return;
        try {
            await notificationService.markAsRead(user.id, notificationId);
            setNotifications(notifications.map(n =>
                n.id === notificationId ? { ...n, read: true } : n
            ));
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    };

    const handleCompleteChallenge = async (challengeId: string) => {
        if (!user) return;
        try {
            await notificationService.completeChallenge(user.id, challengeId);
            setChallenges(challenges.filter(c => c.id !== challengeId));
        } catch (error) {
            console.error('Failed to complete challenge:', error);
        }
    };

    const getNotificationIcon = (type: Notification['type']) => {
        switch (type) {
            case 'success':
                return <CheckCircleIcon color="success" />;
            case 'warning':
                return <WarningIcon color="warning" />;
            case 'challenge':
                return <EmojiEventsIcon color="primary" />;
            default:
                return <InfoIcon color="info" />;
        }
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <>
            <IconButton
                color="inherit"
                onClick={() => setOpen(!open)}
                sx={{ position: 'relative' }}
            >
                <Badge badgeContent={unreadCount} color="error">
                    <NotificationsIcon />
                </Badge>
            </IconButton>

            {open && (
                <StyledPaper elevation={3}>
                    <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6">Notifications</Typography>
                        <IconButton size="small" onClick={() => setOpen(false)}>
                            <CloseIcon />
                        </IconButton>
                    </Box>
                    <Divider />

                    {challenges.length > 0 && (
                        <>
                            <Box sx={{ p: 2 }}>
                                <Typography variant="subtitle1" gutterBottom>
                                    Active Challenges
                                </Typography>
                                {challenges.map(challenge => (
                                    <Paper
                                        key={challenge.id}
                                        sx={{ p: 2, mb: 2, bgcolor: 'primary.light' }}
                                    >
                                        <Typography variant="subtitle2" gutterBottom>
                                            {challenge.title}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" gutterBottom>
                                            {challenge.description}
                                        </Typography>
                                        {challenge.progress !== undefined && (
                                            <Box sx={{ mb: 1 }}>
                                                <LinearProgress
                                                    variant="determinate"
                                                    value={challenge.progress}
                                                    sx={{ mb: 1 }}
                                                />
                                                <Typography variant="caption" color="text.secondary">
                                                    {challenge.progress}% Complete
                                                </Typography>
                                            </Box>
                                        )}
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <Chip
                                                icon={<EmojiEventsIcon />}
                                                label={`${challenge.rewards.amount} ${challenge.rewards.type}`}
                                                color="secondary"
                                                size="small"
                                            />
                                            <Button
                                                variant="contained"
                                                size="small"
                                                onClick={() => handleCompleteChallenge(challenge.id)}
                                            >
                                                Complete
                                            </Button>
                                        </Box>
                                    </Paper>
                                ))}
                            </Box>
                            <Divider />
                        </>
                    )}

                    <List>
                        {notifications.length === 0 ? (
                            <ListItem>
                                <ListItemText primary="No notifications" />
                            </ListItem>
                        ) : (
                            notifications.map(notification => (
                                <ListItem
                                    key={notification.id}
                                    sx={{
                                        bgcolor: notification.read ? 'inherit' : 'action.hover'
                                    }}
                                >
                                    <ListItemIcon>
                                        {getNotificationIcon(notification.type)}
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={notification.title}
                                        secondary={
                                            <>
                                                <Typography
                                                    component="span"
                                                    variant="body2"
                                                    color="text.primary"
                                                >
                                                    {notification.message}
                                                </Typography>
                                                <Typography
                                                    component="span"
                                                    variant="caption"
                                                    display="block"
                                                    color="text.secondary"
                                                >
                                                    {new Date(notification.createdAt).toLocaleString()}
                                                </Typography>
                                            </>
                                        }
                                    />
                                    {!notification.read && (
                                        <IconButton
                                            size="small"
                                            onClick={() => handleMarkAsRead(notification.id)}
                                            data-testid={`mark-read-${notification.id}`}
                                        >
                                            <CheckCircleIcon />
                                        </IconButton>
                                    )}
                                </ListItem>
                            ))
                        )}
                    </List>
                </StyledPaper>
            )}

            <Snackbar
                open={!!permissionError}
                autoHideDuration={6000}
                onClose={() => setPermissionError(null)}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert onClose={() => setPermissionError(null)} severity="warning">
                    {permissionError}
                </Alert>
            </Snackbar>
        </>
    );
};

export default NotificationCenter; 