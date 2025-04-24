import React, { useEffect, useState } from 'react';
import { presenceService, UserStatus, UserActivity } from '../services/presenceService';
import { PresenceIndicator } from './PresenceIndicator';
import styled from 'styled-components';

interface RoomUser {
    userId: string;
    status: UserStatus;
    activity: UserActivity;
    lastSeen: number;
    metadata?: {
        role?: string;
        device?: string;
        location?: string;
    };
}

interface RoomPresenceListProps {
    roomId: string;
    showMetadata?: boolean;
}

const ListContainer = styled.div`
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 16px;
    background: #f5f5f5;
    border-radius: 8px;
`;

const UserItem = styled.div`
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px;
    background: white;
    border-radius: 4px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const UserInfo = styled.div`
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
`;

const UserName = styled.span`
    font-weight: 500;
`;

const UserMetadata = styled.div`
    font-size: 0.8em;
    color: #666;
`;

const LastSeen = styled.span`
    font-size: 0.8em;
    color: #999;
`;

export const RoomPresenceList: React.FC<RoomPresenceListProps> = ({
    roomId,
    showMetadata = false
}) => {
    const [users, setUsers] = useState<RoomUser[]>([]);

    useEffect(() => {
        // Join the room
        presenceService.joinRoom(roomId);

        const handlePresenceUpdate = (presence: any) => {
            if (presence.roomId === roomId) {
                setUsers(prevUsers => {
                    const index = prevUsers.findIndex(u => u.userId === presence.userId);
                    if (index === -1) {
                        return [...prevUsers, presence];
                    }
                    const newUsers = [...prevUsers];
                    newUsers[index] = presence;
                    return newUsers;
                });
            }
        };

        presenceService.on('presenceUpdate', handlePresenceUpdate);

        // Initial room users fetch
        fetch(`/api/admin/room/${roomId}/users`)
            .then(res => res.json())
            .then(data => {
                setUsers(data.users);
            })
            .catch(error => {
                console.error('Failed to fetch room users:', error);
            });

        return () => {
            presenceService.off('presenceUpdate', handlePresenceUpdate);
            presenceService.leaveRoom(roomId);
        };
    }, [roomId]);

    const formatLastSeen = (timestamp: number) => {
        const now = Date.now();
        const diff = now - timestamp;

        if (diff < 60000) return 'just now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
        return `${Math.floor(diff / 86400000)}d ago`;
    };

    return (
        <ListContainer>
            {users.map(user => (
                <UserItem key={user.userId}>
                    <PresenceIndicator userId={user.userId} size="small" />
                    <UserInfo>
                        <UserName>{user.userId}</UserName>
                        {showMetadata && user.metadata && (
                            <UserMetadata>
                                {user.metadata.role && <span>Role: {user.metadata.role}</span>}
                                {user.metadata.device && <span> • Device: {user.metadata.device}</span>}
                                {user.metadata.location && <span> • Location: {user.metadata.location}</span>}
                            </UserMetadata>
                        )}
                    </UserInfo>
                    <LastSeen>
                        {formatLastSeen(user.lastSeen)}
                    </LastSeen>
                </UserItem>
            ))}
        </ListContainer>
    );
}; 