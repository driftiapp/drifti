import React, { useEffect, useState } from 'react';
import { presenceService, UserStatus, UserActivity } from '../services/presenceService';
import { FaCircle, FaRegCircle, FaMoon } from 'react-icons/fa';
import styled from 'styled-components';

interface PresenceIndicatorProps {
    userId: string;
    showActivity?: boolean;
    size?: 'small' | 'medium' | 'large';
}

const IndicatorContainer = styled.div<{ size: string }>`
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: ${props => {
        switch (props.size) {
            case 'small': return '12px';
            case 'large': return '20px';
            default: return '16px';
        }
    }};
`;

const StatusIcon = styled.div<{ status: UserStatus }>`
    color: ${props => {
        switch (props.status) {
            case 'online': return '#4CAF50';
            case 'idle': return '#FFC107';
            case 'offline': return '#9E9E9E';
        }
    }};
`;

const ActivityText = styled.span<{ activity: UserActivity }>`
    color: ${props => {
        switch (props.activity) {
            case 'active': return '#4CAF50';
            case 'idle': return '#FFC107';
            case 'away': return '#9E9E9E';
        }
    }};
    font-size: 0.8em;
`;

export const PresenceIndicator: React.FC<PresenceIndicatorProps> = ({
    userId,
    showActivity = false,
    size = 'medium'
}) => {
    const [status, setStatus] = useState<UserStatus>('offline');
    const [activity, setActivity] = useState<UserActivity>('away');

    useEffect(() => {
        const handlePresenceUpdate = (presence: any) => {
            if (presence.userId === userId) {
                setStatus(presence.status);
                setActivity(presence.activity);
            }
        };

        presenceService.on('presenceUpdate', handlePresenceUpdate);

        return () => {
            presenceService.off('presenceUpdate', handlePresenceUpdate);
        };
    }, [userId]);

    const getStatusIcon = () => {
        switch (status) {
            case 'online':
                return <FaCircle />;
            case 'idle':
                return <FaMoon />;
            case 'offline':
                return <FaRegCircle />;
        }
    };

    return (
        <IndicatorContainer size={size}>
            <StatusIcon status={status}>
                {getStatusIcon()}
            </StatusIcon>
            {showActivity && (
                <ActivityText activity={activity}>
                    {activity.charAt(0).toUpperCase() + activity.slice(1)}
                </ActivityText>
            )}
        </IndicatorContainer>
    );
}; 