import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Grid, Typography, Box, Chip, Tooltip, LinearProgress } from '@/components/ui/layout';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import LoyaltyIcon from '@mui/icons-material/Loyalty';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import GroupIcon from '@mui/icons-material/Group';
import useBusinessAutomation from '../hooks/useBusinessAutomation';

const AISmartShopping = () => {
    const {
        loading,
        error,
        metrics,
        automationState,
        actions
    } = useBusinessAutomation();

    const [smartShopping, setSmartShopping] = useState({
        subscriptions: [],
        loyaltyProgram: {
            tiers: [],
            rewards: [],
            challenges: []
        },
        socialBuying: {
            activeGroups: [],
            opportunities: []
        },
        gamification: {
            activeChallenges: [],
            achievements: []
        }
    });

    useEffect(() => {
        if (metrics) {
            // Process smart shopping metrics
            const subscriptions = generateSubscriptionSuggestions(metrics);
            const loyaltyProgram = updateLoyaltyProgram(metrics);
            const socialBuying = identifySocialBuyingOpportunities(metrics);
            const gamification = generateGamificationChallenges(metrics);

            setSmartShopping({
                subscriptions,
                loyaltyProgram,
                socialBuying,
                gamification
            });
        }
    }, [metrics]);

    const generateSubscriptionSuggestions = (metrics) => {
        return metrics.purchasePatterns
            .filter(pattern => pattern.frequency > 2) // More than 2 purchases
            .map(pattern => ({
                category: pattern.category,
                frequency: pattern.frequency,
                averageValue: pattern.averageValue,
                savings: calculateSubscriptionSavings(pattern),
                recommendation: generateSubscriptionRecommendation(pattern)
            }));
    };

    const updateLoyaltyProgram = (metrics) => {
        return {
            tiers: generateLoyaltyTiers(metrics),
            rewards: generateRewards(metrics),
            challenges: generateLoyaltyChallenges(metrics)
        };
    };

    const identifySocialBuyingOpportunities = (metrics) => {
        return metrics.socialPatterns.map(pattern => ({
            group: pattern.group,
            size: pattern.size,
            potentialSavings: calculateGroupSavings(pattern),
            recommendation: generateGroupBuyingRecommendation(pattern)
        }));
    };

    const generateGamificationChallenges = (metrics) => {
        return {
            activeChallenges: generateActiveChallenges(metrics),
            achievements: generateAchievements(metrics)
        };
    };

    const calculateSubscriptionSavings = (pattern) => {
        const baseDiscount = 0.1; // 10% base discount
        const frequencyMultiplier = Math.min(pattern.frequency / 5, 1); // Up to 100% based on frequency
        return baseDiscount * (1 + frequencyMultiplier);
    };

    const generateSubscriptionRecommendation = (pattern) => {
        return {
            title: `Subscribe & Save ${Math.round(calculateSubscriptionSavings(pattern) * 100)}%`,
            description: `Auto-reorder ${pattern.category} every ${pattern.frequency} days`,
            benefits: [
                'Free delivery',
                'Priority support',
                'Exclusive discounts'
            ]
        };
    };

    const generateLoyaltyTiers = (metrics) => {
        return [
            {
                name: 'PLATINUM',
                threshold: 1000,
                benefits: [
                    '20% off all orders',
                    'Free priority delivery',
                    'Exclusive VIP events'
                ]
            },
            {
                name: 'GOLD',
                threshold: 500,
                benefits: [
                    '15% off all orders',
                    'Free standard delivery',
                    'Early access to sales'
                ]
            },
            {
                name: 'SILVER',
                threshold: 250,
                benefits: [
                    '10% off all orders',
                    'Free delivery on orders over $100',
                    'Birthday rewards'
                ]
            }
        ];
    };

    const generateRewards = (metrics) => {
        return metrics.customerSegments.map(segment => ({
            segment: segment.name,
            rewards: generateSegmentRewards(segment)
        }));
    };

    const generateSegmentRewards = (segment) => {
        return [
            {
                type: 'POINTS',
                amount: calculatePointsReward(segment),
                description: 'Points for next purchase'
            },
            {
                type: 'DISCOUNT',
                amount: calculateDiscountReward(segment),
                description: 'Percentage off next order'
            }
        ];
    };

    const generateLoyaltyChallenges = (metrics) => {
        return [
            {
                title: 'Monthly Master',
                description: 'Complete 5 orders this month',
                reward: '500 points + 15% off next order',
                progress: calculateChallengeProgress(metrics, 'monthly')
            },
            {
                title: 'Weekend Warrior',
                description: 'Order 3 times this weekend',
                reward: 'Free delivery + 10% off next order',
                progress: calculateChallengeProgress(metrics, 'weekend')
            }
        ];
    };

    const calculateGroupSavings = (pattern) => {
        const baseDiscount = 0.05; // 5% base discount
        const sizeMultiplier = Math.min(pattern.size / 10, 1); // Up to 100% based on group size
        return baseDiscount * (1 + sizeMultiplier);
    };

    const generateGroupBuyingRecommendation = (pattern) => {
        return {
            title: `Group Buy & Save ${Math.round(calculateGroupSavings(pattern) * 100)}%`,
            description: `Join ${pattern.size} others to unlock group discounts`,
            benefits: [
                'Shared delivery cost',
                'Bulk discounts',
                'Social rewards'
            ]
        };
    };

    const generateActiveChallenges = (metrics) => {
        return [
            {
                title: 'Order Streak',
                description: 'Order 5 days in a row',
                progress: calculateStreakProgress(metrics),
                reward: 'VIP status for 1 month'
            },
            {
                title: 'Category Explorer',
                description: 'Try 3 new categories',
                progress: calculateCategoryProgress(metrics),
                reward: '20% off next order'
            }
        ];
    };

    const generateAchievements = (metrics) => {
        return [
            {
                title: 'Early Bird',
                description: 'Order before 10 AM',
                progress: calculateAchievementProgress(metrics, 'early_bird'),
                reward: 'Free delivery'
            },
            {
                title: 'Party Planner',
                description: 'Order party supplies',
                progress: calculateAchievementProgress(metrics, 'party_planner'),
                reward: '10% off party orders'
            }
        ];
    };

    const calculatePointsReward = (segment) => {
        return Math.round(segment.averageOrderValue * 0.1); // 10% of order value
    };

    const calculateDiscountReward = (segment) => {
        return Math.min(0.15 + (segment.lifetimeValue / 1000), 0.25); // 15-25% based on lifetime value
    };

    const calculateChallengeProgress = (metrics, type) => {
        // Implementation would depend on specific challenge type
        return 0.5;
    };

    const calculateStreakProgress = (metrics) => {
        // Implementation would track consecutive order days
        return 0.3;
    };

    const calculateCategoryProgress = (metrics) => {
        // Implementation would track unique categories ordered
        return 0.6;
    };

    const calculateAchievementProgress = (metrics, type) => {
        // Implementation would track specific achievement criteria
        return 0.8;
    };

    const handleSubscriptionSignup = async (subscription) => {
        try {
            // Implement subscription signup logic
            console.log('Signing up for subscription:', subscription);
        } catch (error) {
            console.error('Error signing up for subscription:', error);
        }
    };

    const handleChallengeJoin = async (challenge) => {
        try {
            // Implement challenge join logic
            console.log('Joining challenge:', challenge);
        } catch (error) {
            console.error('Error joining challenge:', error);
        }
    };

    const handleGroupJoin = async (group) => {
        try {
            // Implement group join logic
            console.log('Joining group:', group);
        } catch (error) {
            console.error('Error joining group:', error);
        }
    };

    return (
        <div className="ai-smart-shopping">
            <Grid container spacing={3}>
                <Grid item xs={12}>
                    <Typography variant="h4" gutterBottom>
                        <ShoppingCartIcon /> AI Smart Shopping & Loyalty
                    </Typography>
                </Grid>

                {/* Smart Subscriptions */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6">
                                Smart Subscriptions
                            </Typography>
                            <Box mt={2}>
                                {smartShopping.subscriptions.map((subscription, index) => (
                                    <Box key={index} mb={2}>
                                        <Typography variant="subtitle1">
                                            {subscription.category}
                                        </Typography>
                                        <Typography variant="body2" color="textSecondary">
                                            Order every {subscription.frequency} days
                                        </Typography>
                                        <Typography variant="body2">
                                            Average Order: ${subscription.averageValue}
                                        </Typography>
                                        <Typography variant="body2" color="success">
                                            Save {Math.round(subscription.savings * 100)}%
                                        </Typography>
                                        <Button
                                            variant="contained"
                                            color="primary"
                                            onClick={() => handleSubscriptionSignup(subscription)}
                                        >
                                            Subscribe
                                        </Button>
                                    </Box>
                                ))}
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Loyalty Program */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6">
                                <LoyaltyIcon /> Loyalty Program
                            </Typography>
                            <Box mt={2}>
                                {smartShopping.loyaltyProgram.tiers.map((tier, index) => (
                                    <Box key={index} mb={2}>
                                        <Typography variant="subtitle1">
                                            {tier.name}
                                        </Typography>
                                        <Typography variant="body2">
                                            Spend ${tier.threshold} to unlock
                                        </Typography>
                                        <Box mt={1}>
                                            {tier.benefits.map((benefit, benefitIndex) => (
                                                <Chip
                                                    key={benefitIndex}
                                                    label={benefit}
                                                    color="primary"
                                                    style={{ margin: '4px' }}
                                                />
                                            ))}
                                        </Box>
                                    </Box>
                                ))}
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Social Buying */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6">
                                <GroupIcon /> Social Buying
                            </Typography>
                            <Box mt={2}>
                                {smartShopping.socialBuying.opportunities.map((opportunity, index) => (
                                    <Box key={index} mb={2}>
                                        <Typography variant="subtitle1">
                                            Group of {opportunity.size}
                                        </Typography>
                                        <Typography variant="body2" color="success">
                                            Save {Math.round(opportunity.potentialSavings * 100)}%
                                        </Typography>
                                        <Button
                                            variant="contained"
                                            color="primary"
                                            onClick={() => handleGroupJoin(opportunity)}
                                        >
                                            Join Group
                                        </Button>
                                    </Box>
                                ))}
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Gamification */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6">
                                <EmojiEventsIcon /> Challenges & Achievements
                            </Typography>
                            <Box mt={2}>
                                {smartShopping.gamification.activeChallenges.map((challenge, index) => (
                                    <Box key={index} mb={2}>
                                        <Typography variant="subtitle1">
                                            {challenge.title}
                                        </Typography>
                                        <Typography variant="body2">
                                            {challenge.description}
                                        </Typography>
                                        <LinearProgress 
                                            variant="determinate" 
                                            value={challenge.progress * 100}
                                            color="primary"
                                        />
                                        <Button
                                            variant="contained"
                                            color="primary"
                                            onClick={() => handleChallengeJoin(challenge)}
                                        >
                                            Join Challenge
                                        </Button>
                                    </Box>
                                ))}
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </div>
    );
};

export default AISmartShopping; 