import React, { useRef, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Box, Typography, Card, CardContent, Button, CircularProgress, Alert } from '@mui/material';
import { toast } from 'react-hot-toast';
import { api } from '../utils/api';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { useSmoothScroll } from '../hooks/useSmoothScroll';
import { useScrollRestoration } from '../hooks/useScrollRestoration';

interface Challenge {
    id: string;
    title: string;
    reward: string;
}

interface ChallengesResponse {
    data: Challenge[];
    status: string;
}

interface ApiError {
    message: string;
    status: number;
}

const RiskReward: React.FC = () => {
    const gridRef = useRef<HTMLDivElement>(null);
    const containerRef = useScrollRestoration('risk-reward');
    const [focusedIndex, setFocusedIndex] = React.useState<number>(-1);
    const [isGridFocused, setIsGridFocused] = React.useState(false);
    const scrollIntoView = useSmoothScroll();

    const { data: activeChallenges, isLoading, error } = useQuery<Challenge[], ApiError>({
        queryKey: ['activeChallenges'],
        queryFn: async () => {
            const response = await api.get<ChallengesResponse>('/api/risk-reward/challenges');
            return response.data.data;
        },
    });

    const acceptChallengeMutation = useMutation<void, ApiError, string>({
        mutationFn: async (challengeId: string) => {
            await api.post(`/api/risk-reward/challenges/${challengeId}/accept`);
        },
        onSuccess: () => {
            toast.success('Challenge accepted successfully!', {
                ariaProps: {
                    role: 'status',
                    'aria-live': 'polite',
                },
            });
        },
        onError: (error) => {
            const message = error?.message || 'Failed to accept challenge. Please try again.';
            toast.error(message, {
                ariaProps: {
                    role: 'alert',
                    'aria-live': 'assertive',
                },
            });
        },
    });

    const handleChallengeClick = React.useCallback((challengeId: string) => {
        acceptChallengeMutation.mutate(challengeId);
    }, [acceptChallengeMutation]);

    const handleKeyDown = React.useCallback((event: React.KeyboardEvent) => {
        if (!activeChallenges?.length) return;

        const maxIndex = activeChallenges.length - 1;
        let newIndex = focusedIndex;

        switch (event.key) {
            case 'ArrowRight':
            case 'ArrowDown':
                event.preventDefault();
                newIndex = focusedIndex < maxIndex ? focusedIndex + 1 : 0;
                break;
            case 'ArrowLeft':
            case 'ArrowUp':
                event.preventDefault();
                newIndex = focusedIndex > 0 ? focusedIndex - 1 : maxIndex;
                break;
            case 'Home':
                event.preventDefault();
                newIndex = 0;
                break;
            case 'End':
                event.preventDefault();
                newIndex = maxIndex;
                break;
            case 'Enter':
            case ' ':
                event.preventDefault();
                if (focusedIndex !== -1) {
                    const challenge = activeChallenges[focusedIndex];
                    handleChallengeClick(challenge.id);
                }
                break;
            default:
                return;
        }

        setFocusedIndex(newIndex);
    }, [activeChallenges, focusedIndex, handleChallengeClick]);

    // Focus trap setup
    const { updateFocusableRefs, handleKeyDown: handleFocusTrapKeyDown } = useFocusTrap({
        enabled: isGridFocused,
        onEscape: () => setIsGridFocused(false),
    });

    // Update focusable elements when challenges change
    useEffect(() => {
        if (gridRef.current) {
            updateFocusableRefs(gridRef.current);
        }
    }, [activeChallenges, updateFocusableRefs]);

    // Add focus trap keyboard listener
    useEffect(() => {
        const element = gridRef.current;
        if (!element) return;

        element.addEventListener('keydown', handleFocusTrapKeyDown);
        return () => {
            element.removeEventListener('keydown', handleFocusTrapKeyDown);
        };
    }, [handleFocusTrapKeyDown]);

    // Reset focus index when challenges change
    useEffect(() => {
        setFocusedIndex(-1);
    }, [activeChallenges]);

    // Focus management and smooth scrolling for the focused card
    useEffect(() => {
        if (focusedIndex !== -1 && gridRef.current) {
            const cards = gridRef.current.querySelectorAll('[role="article"]');
            const cardToFocus = cards[focusedIndex] as HTMLElement;
            if (cardToFocus) {
                cardToFocus.focus();
                // Use smooth scrolling with a slight delay to ensure focus is set first
                requestAnimationFrame(() => {
                    scrollIntoView(cardToFocus, {
                        block: 'nearest',
                        inline: 'nearest'
                    });
                });
            }
        }
    }, [focusedIndex, scrollIntoView]);

    if (isLoading) {
        return (
            <Box 
                p={3} 
                display="flex" 
                justifyContent="center" 
                alignItems="center" 
                minHeight="200px"
                role="status"
                aria-label="Loading challenges"
            >
                <CircularProgress aria-label="Loading" />
            </Box>
        );
    }

    if (error) {
        return (
            <Box p={3}>
                <Alert 
                    severity="error"
                    role="alert"
                    aria-live="assertive"
                >
                    {error.message || 'Failed to load challenges. Please try again later.'}
                </Alert>
            </Box>
        );
    }

    const hasNoChallenges = !activeChallenges || activeChallenges.length === 0;

    return (
        <Box 
            ref={containerRef}
            p={3}
            component="main"
            role="main"
            aria-label="Risk and Reward Challenges"
            sx={{ 
                height: '100%',
                overflowY: 'auto',
                scrollBehavior: 'smooth',
                // Ensure smooth scrolling only after initial restoration
                '@media (prefers-reduced-motion: no-preference)': {
                    scrollBehavior: 'smooth'
                }
            }}
        >
            <Typography variant="h4" gutterBottom component="h1">
                Risk & Reward Challenges
            </Typography>
            {hasNoChallenges ? (
                <Alert 
                    severity="info"
                    role="status"
                    aria-live="polite"
                >
                    No active challenges available at the moment.
                </Alert>
            ) : (
                <Box 
                    ref={gridRef}
                    display="grid" 
                    gap={3}
                    gridTemplateColumns={{
                        xs: '1fr',
                        sm: 'repeat(2, 1fr)',
                        md: 'repeat(3, 1fr)'
                    }}
                    component="section"
                    role="feed"
                    aria-label="List of challenges"
                    onKeyDown={handleKeyDown}
                    onFocus={() => setIsGridFocused(true)}
                    onBlur={(e) => {
                        if (!gridRef.current?.contains(e.relatedTarget as Node)) {
                            setIsGridFocused(false);
                            setFocusedIndex(-1);
                        }
                    }}
                    tabIndex={0}
                    sx={{
                        scrollPaddingBlock: 3,
                        scrollPaddingInline: 3
                    }}
                >
                    {activeChallenges.map((challenge, index) => (
                        <Box 
                            key={challenge.id}
                            role="article"
                            aria-labelledby={`challenge-title-${challenge.id}`}
                            tabIndex={focusedIndex === index ? 0 : -1}
                            sx={{
                                outline: 'none',
                                scrollMarginBlock: 3,
                                scrollMarginInline: 3,
                                '&:focus': {
                                    '& .MuiCard-root': {
                                        outline: '2px solid',
                                        outlineColor: 'primary.main',
                                    },
                                },
                                '&:focus-visible': {
                                    '& .MuiCard-root': {
                                        outline: '2px solid',
                                        outlineColor: 'primary.main',
                                    },
                                },
                            }}
                        >
                            <Card>
                                <CardContent>
                                    <Typography 
                                        variant="h6" 
                                        gutterBottom
                                        id={`challenge-title-${challenge.id}`}
                                    >
                                        {challenge.title}
                                    </Typography>
                                    <Typography 
                                        color="textSecondary" 
                                        gutterBottom
                                        aria-label={`Reward: ${challenge.reward}`}
                                    >
                                        Reward: {challenge.reward}
                                    </Typography>
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        onClick={() => handleChallengeClick(challenge.id)}
                                        disabled={acceptChallengeMutation.isPending}
                                        fullWidth
                                        sx={{ mt: 2 }}
                                        aria-label={`Accept challenge: ${challenge.title}`}
                                        aria-busy={acceptChallengeMutation.isPending}
                                    >
                                        {acceptChallengeMutation.isPending ? 'Accepting...' : 'Accept Challenge'}
                                    </Button>
                                </CardContent>
                            </Card>
                        </Box>
                    ))}
                </Box>
            )}
        </Box>
    );
};

export default RiskReward; 