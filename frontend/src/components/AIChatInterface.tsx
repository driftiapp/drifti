import React, { useState, useRef, useEffect } from 'react';
import {
    Box,
    TextField,
    Paper,
    Typography,
    CircularProgress,
    Avatar,
    Fade,
    Tooltip,
    IconButton
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import ClearIcon from '@mui/icons-material/Clear';
import AIIcon from '@mui/icons-material/SmartToy';
import UserIcon from '@mui/icons-material/Person';
import RefreshIcon from '@mui/icons-material/Refresh';
import { styled } from '@mui/material/styles';
import { useAuth } from '../hooks/useAuth';
import { logger } from '../utils/logger';

interface Message {
    id: string;
    content: string;
    sender: 'user' | 'ai';
    timestamp: Date;
}

interface AIChatInterfaceProps {
    onClose?: () => void;
    onSendMessage: (message: string) => Promise<void>;
    onClearHistory: () => Promise<void>;
}

const ChatContainer = styled(Paper)(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    maxHeight: '80vh',
    overflow: 'hidden',
    backgroundColor: theme.palette.background.paper,
    borderRadius: theme.shape.borderRadius,
    boxShadow: theme.shadows[4]
}));

const MessageContainer = styled(Box)(({ theme }) => ({
    flexGrow: 1,
    overflowY: 'auto',
    padding: theme.spacing(2),
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2)
}));

const MessageBubble = styled(Box, {
    shouldForwardProp: (prop) => prop !== 'isUser'
})<{ isUser: boolean }>(({ theme, isUser }) => ({
    backgroundColor: isUser ? theme.palette.primary.light : theme.palette.grey[100],
    color: isUser ? theme.palette.primary.contrastText : theme.palette.text.primary,
    padding: theme.spacing(1, 2),
    borderRadius: theme.shape.borderRadius,
    maxWidth: '80%',
    wordBreak: 'break-word'
}));

const InputContainer = styled(Box)(({ theme }) => ({
    display: 'flex',
    gap: theme.spacing(1),
    padding: theme.spacing(2),
    borderTop: `1px solid ${theme.palette.divider}`
}));

const AIChatInterface: React.FC<AIChatInterfaceProps> = ({ onClose, onSendMessage, onClearHistory }) => {
    const { user } = useAuth();
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        fetchChatHistory();
    }, []);

    const fetchChatHistory = async () => {
        try {
            setIsLoading(true);
            const response = await fetch(`/api/chat/${user?.uid}/history`);
            const data = await response.json();
            setMessages(data);
        } catch (err) {
            console.error('Error fetching chat history:', err);
            setError('Failed to load chat history');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputMessage.trim() || isLoading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            content: inputMessage,
            sender: 'user',
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setInputMessage('');
        setIsLoading(true);

        try {
            await onSendMessage(inputMessage);
        } catch (err) {
            const error = err instanceof Error ? err : new Error('Failed to send message');
            logger.error('Failed to send message', {
                component: 'AIChatInterface',
                action: 'sendMessage',
                error
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleClearHistory = async () => {
        try {
            await onClearHistory();
            setMessages([]);
        } catch (err) {
            const error = err instanceof Error ? err : new Error('Failed to clear chat history');
            logger.error('Failed to clear chat history', {
                component: 'AIChatInterface',
                action: 'clearHistory',
                error
            });
        }
    };

    const handleKeyPress = (event: React.KeyboardEvent) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            handleSendMessage(event);
        }
    };

    return (
        <ChatContainer>
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6" component="div">
                        AI Assistant
                    </Typography>
                    <Box>
                        <Tooltip title="Clear History">
                            <IconButton onClick={handleClearHistory} size="small">
                                <ClearIcon />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Refresh">
                            <IconButton onClick={fetchChatHistory} size="small">
                                <RefreshIcon />
                            </IconButton>
                        </Tooltip>
                        {onClose && (
                            <Tooltip title="Close">
                                <IconButton onClick={onClose} size="small">
                                    <ClearIcon />
                                </IconButton>
                            </Tooltip>
                        )}
                    </Box>
                </Box>
            </Box>

            <MessageContainer>
                {isLoading && messages.length === 0 ? (
                    <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                        <CircularProgress />
                    </Box>
                ) : (
                    messages.map((msg, index) => (
                        <Fade in key={index} timeout={500}>
                            <Box display="flex" gap={1} alignItems="flex-start">
                                <Avatar sx={{ bgcolor: msg.content ? 'primary.main' : 'secondary.main' }}>
                                    {msg.content ? <UserIcon /> : <AIIcon />}
                                </Avatar>
                                <MessageBubble isUser={!!msg.content}>
                                    <Typography variant="body1">
                                        {msg.content}
                                    </Typography>
                                    <Typography variant="caption" sx={{ opacity: 0.7 }}>
                                        {new Date(msg.timestamp).toLocaleTimeString()}
                                    </Typography>
                                </MessageBubble>
                            </Box>
                        </Fade>
                    ))
                )}
                <div ref={messagesEndRef} />
            </MessageContainer>

            <InputContainer>
                <TextField
                    fullWidth
                    multiline
                    maxRows={4}
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask me anything about businesses, deals, or experiences..."
                    disabled={isLoading}
                    error={!!error}
                    helperText={error}
                />
                <IconButton
                    color="primary"
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim() || isLoading}
                >
                    {isLoading ? <CircularProgress size={24} /> : <SendIcon />}
                </IconButton>
            </InputContainer>
        </ChatContainer>
    );
};

export default AIChatInterface;