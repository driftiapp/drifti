import React, { useState, useEffect, useRef } from 'react';
import {
    Box,
    Paper,
    TextField,
    IconButton,
    Typography,
    CircularProgress,
    Avatar,
    Divider,
    Fade,
    Tooltip,
    useTheme,
    useMediaQuery
} from '@mui/material';
import {
    Send as SendIcon,
    Clear as ClearIcon,
    SmartToy as AIIcon,
    Person as UserIcon,
    Refresh as RefreshIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';

interface Message {
    message: string;
    response: string;
    timestamp: string;
}

interface AIChatInterfaceProps {
    onClose?: () => void;
}

const ChatContainer = styled(Paper)(({ theme }) => ({
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    overflow: 'hidden',
    borderRadius: theme.shape.borderRadius,
    boxShadow: theme.shadows[3]
}));

const MessageContainer = styled(Box)(({ theme }) => ({
    flex: 1,
    overflowY: 'auto',
    padding: theme.spacing(2),
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2)
}));

const MessageBubble = styled(Box)<{ isUser: boolean }>(({ theme, isUser }) => ({
    maxWidth: '80%',
    padding: theme.spacing(1.5),
    borderRadius: theme.shape.borderRadius,
    backgroundColor: isUser ? theme.palette.primary.main : theme.palette.background.paper,
    color: isUser ? theme.palette.primary.contrastText : theme.palette.text.primary,
    alignSelf: isUser ? 'flex-end' : 'flex-start',
    position: 'relative',
    '&::before': {
        content: '""',
        position: 'absolute',
        top: '50%',
        [isUser ? 'right' : 'left']: -8,
        transform: 'translateY(-50%)',
        border: `8px solid transparent`,
        borderRightColor: isUser ? theme.palette.primary.main : theme.palette.background.paper,
        borderLeftColor: isUser ? theme.palette.primary.main : theme.palette.background.paper,
        [isUser ? 'borderRight' : 'borderLeft']: 'none'
    }
}));

const InputContainer = styled(Box)(({ theme }) => ({
    padding: theme.spacing(2),
    borderTop: `1px solid ${theme.palette.divider}`,
    display: 'flex',
    gap: theme.spacing(1),
    backgroundColor: theme.palette.background.paper
}));

const AIChatInterface: React.FC<AIChatInterfaceProps> = ({ onClose }) => {
    const { user } = useAuth();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (user?.id) {
            fetchChatHistory();
        }
    }, [user?.id]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const fetchChatHistory = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/ai/chat/${user?.id}/history`);
            setMessages(response.data.data);
        } catch (err) {
            setError('Failed to load chat history');
            console.error('Error fetching chat history:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSend = async () => {
        if (!input.trim() || !user?.id) return;

        const userMessage = input.trim();
        setInput('');
        setLoading(true);
        setError(null);

        try {
            const response = await api.post(`/ai/chat/${user.id}`, {
                message: userMessage
            });

            setMessages(prev => [...prev, response.data.data]);
        } catch (err) {
            setError('Failed to send message');
            console.error('Error sending message:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleClearHistory = async () => {
        if (!user?.id) return;

        try {
            await api.delete(`/ai/chat/${user.id}/history`);
            setMessages([]);
        } catch (err) {
            setError('Failed to clear chat history');
            console.error('Error clearing chat history:', err);
        }
    };

    const handleKeyPress = (event: React.KeyboardEvent) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            handleSend();
        }
    };

    return (
        <ChatContainer>
            <Box p={2} display="flex" alignItems="center" justifyContent="space-between" borderBottom={1} borderColor="divider">
                <Box display="flex" alignItems="center" gap={1}>
                    <AIIcon color="primary" />
                    <Typography variant="h6">AI Assistant</Typography>
                </Box>
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

            <MessageContainer>
                {loading && messages.length === 0 ? (
                    <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                        <CircularProgress />
                    </Box>
                ) : (
                    messages.map((msg, index) => (
                        <Fade in key={index} timeout={500}>
                            <Box display="flex" gap={1} alignItems="flex-start">
                                <Avatar sx={{ bgcolor: msg.message ? 'primary.main' : 'secondary.main' }}>
                                    {msg.message ? <UserIcon /> : <AIIcon />}
                                </Avatar>
                                <MessageBubble isUser={!!msg.message}>
                                    <Typography variant="body1">
                                        {msg.message || msg.response}
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
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask me anything about businesses, deals, or experiences..."
                    disabled={loading}
                    error={!!error}
                    helperText={error}
                />
                <IconButton
                    color="primary"
                    onClick={handleSend}
                    disabled={!input.trim() || loading}
                >
                    {loading ? <CircularProgress size={24} /> : <SendIcon />}
                </IconButton>
            </InputContainer>
        </ChatContainer>
    );
};

export default AIChatInterface; 