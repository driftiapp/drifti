import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import NotificationCenter from '../NotificationCenter';
import notificationService from '../../services/notificationService';
import { useAuth } from '../../hooks/useAuth';

// Mock the notification service
jest.mock('../../services/notificationService');

// Mock the auth hook
jest.mock('../../hooks/useAuth');

const theme = createTheme();

const mockUser = {
    id: '123',
    email: 'test@example.com',
    name: 'Test User',
    role: 'user'
};

const mockNotifications = [
    {
        id: '1',
        title: 'Test Notification',
        message: 'This is a test notification',
        type: 'info' as const,
        read: false,
        createdAt: new Date().toISOString()
    }
];

const mockChallenges = [
    {
        id: '1',
        title: 'Test Challenge',
        description: 'Complete this challenge',
        type: 'daily',
        rewards: {
            type: 'points',
            amount: 100
        },
        status: 'active' as const,
        endDate: new Date(Date.now() + 86400000).toISOString(),
        progress: 50
    }
];

describe('NotificationCenter', () => {
    beforeEach(() => {
        (useAuth as jest.Mock).mockReturnValue({ user: mockUser });
        (notificationService.getNotifications as jest.Mock).mockResolvedValue(mockNotifications);
        (notificationService.getActiveChallenges as jest.Mock).mockResolvedValue(mockChallenges);
        (notificationService.markAsRead as jest.Mock).mockResolvedValue(undefined);
        (notificationService.completeChallenge as jest.Mock).mockResolvedValue(undefined);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('renders notification icon with unread count', () => {
        render(
            <ThemeProvider theme={theme}>
                <NotificationCenter />
            </ThemeProvider>
        );

        const badge = screen.getByText('1');
        expect(badge).toBeInTheDocument();
    });

    it('opens notification panel when clicked', async () => {
        render(
            <ThemeProvider theme={theme}>
                <NotificationCenter />
            </ThemeProvider>
        );

        const button = screen.getByRole('button');
        fireEvent.click(button);

        await waitFor(() => {
            expect(screen.getByText('Notifications')).toBeInTheDocument();
        });
    });

    it('displays notifications and challenges', async () => {
        render(
            <ThemeProvider theme={theme}>
                <NotificationCenter />
            </ThemeProvider>
        );

        const button = screen.getByRole('button');
        fireEvent.click(button);

        await waitFor(() => {
            expect(screen.getByText('Test Notification')).toBeInTheDocument();
            expect(screen.getByText('Test Challenge')).toBeInTheDocument();
        });
    });

    it('marks notification as read when clicked', async () => {
        render(
            <ThemeProvider theme={theme}>
                <NotificationCenter />
            </ThemeProvider>
        );

        const button = screen.getByRole('button');
        fireEvent.click(button);

        await waitFor(() => {
            const markAsReadButton = screen.getByTestId('mark-read-1');
            fireEvent.click(markAsReadButton);
        });

        expect(notificationService.markAsRead).toHaveBeenCalledWith('123', '1');
    });

    it('completes challenge when clicked', async () => {
        render(
            <ThemeProvider theme={theme}>
                <NotificationCenter />
            </ThemeProvider>
        );

        const button = screen.getByRole('button');
        fireEvent.click(button);

        await waitFor(() => {
            const completeButton = screen.getByText('Complete');
            fireEvent.click(completeButton);
        });

        expect(notificationService.completeChallenge).toHaveBeenCalledWith('123', '1');
    });

    it('displays empty state when no notifications', async () => {
        (notificationService.getNotifications as jest.Mock).mockResolvedValue([]);
        (notificationService.getActiveChallenges as jest.Mock).mockResolvedValue([]);

        render(
            <ThemeProvider theme={theme}>
                <NotificationCenter />
            </ThemeProvider>
        );

        const button = screen.getByRole('button');
        fireEvent.click(button);

        await waitFor(() => {
            expect(screen.getByText('No notifications')).toBeInTheDocument();
        });
    });

    it('handles errors gracefully', async () => {
        const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
        (notificationService.getNotifications as jest.Mock).mockRejectedValue(new Error('Failed to load'));

        render(
            <ThemeProvider theme={theme}>
                <NotificationCenter />
            </ThemeProvider>
        );

        const button = screen.getByRole('button');
        fireEvent.click(button);

        await waitFor(() => {
            expect(consoleError).toHaveBeenCalledWith('Failed to load notifications:', expect.any(Error));
        });

        consoleError.mockRestore();
    });
}); 