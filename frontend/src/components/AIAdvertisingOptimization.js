import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Grid, Typography, Box, Chip, Tooltip, LinearProgress, Alert } from '@/components/ui/layout';
import CampaignIcon from '@mui/icons-material/Campaign';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import GroupIcon from '@mui/icons-material/Group';
import useBusinessAutomation from '../hooks/useBusinessAutomation';

const AIAdvertisingOptimization = () => {
    const {
        loading,
        error,
        metrics,
        automationState,
        actions
    } = useBusinessAutomation();

    const [advertisingState, setAdvertisingState] = useState({
        activeCampaigns: [],
        budgetAllocation: {},
        pricingOptimizations: [],
        promotions: [],
        customerSegments: [],
        retargetingCampaigns: []
    });

    const [autoActions, setAutoActions] = useState([]);

    useEffect(() => {
        if (metrics) {
            // Process advertising metrics
            const campaigns = generateAdCampaigns(metrics);
            const budget = optimizeBudgetAllocation(metrics);
            const pricing = optimizePricing(metrics);
            const promotions = generatePromotions(metrics);
            const segments = analyzeCustomerSegments(metrics);
            const retargeting = generateRetargetingCampaigns(metrics);

            setAdvertisingState({
                activeCampaigns: campaigns,
                budgetAllocation: budget,
                pricingOptimizations: pricing,
                promotions: promotions,
                customerSegments: segments,
                retargetingCampaigns: retargeting
            });

            // Generate auto actions based on metrics
            const actions = generateAutoActions(metrics);
            setAutoActions(actions);
        }
    }, [metrics]);

    const generateAdCampaigns = (metrics) => {
        return metrics.productPerformance.map(product => ({
            id: product.id,
            name: generateCampaignName(product),
            platform: determineBestPlatform(product),
            budget: calculateOptimalBudget(product),
            status: 'ACTIVE',
            performance: {
                impressions: product.impressions,
                clicks: product.clicks,
                conversions: product.conversions,
                roi: calculateROI(product)
            },
            targeting: generateTargetingStrategy(product),
            creative: generateAdCreative(product)
        }));
    };

    const optimizeBudgetAllocation = (metrics) => {
        return {
            platforms: metrics.platformPerformance.map(platform => ({
                name: platform.name,
                currentBudget: platform.budget,
                recommendedBudget: calculateOptimalBudget(platform),
                roi: platform.roi,
                performance: platform.performance
            })),
            totalBudget: metrics.totalBudget,
            recommendations: generateBudgetRecommendations(metrics)
        };
    };

    const optimizePricing = (metrics) => {
        return metrics.products.map(product => ({
            id: product.id,
            name: product.name,
            currentPrice: product.price,
            recommendedPrice: calculateOptimalPrice(product),
            competitorPrices: product.competitorPrices,
            demandScore: product.demandScore,
            seasonalityFactor: calculateSeasonalityFactor(product),
            recommendations: generatePricingRecommendations(product)
        }));
    };

    const generatePromotions = (metrics) => {
        return [
            ...generateTrendBasedPromotions(metrics),
            ...generateHolidayPromotions(metrics),
            ...generateSmartBundles(metrics)
        ];
    };

    const analyzeCustomerSegments = (metrics) => {
        return metrics.customerData.map(segment => ({
            name: segment.name,
            size: segment.size,
            characteristics: segment.characteristics,
            preferences: segment.preferences,
            value: segment.value,
            recommendations: generateSegmentRecommendations(segment)
        }));
    };

    const generateRetargetingCampaigns = (metrics) => {
        return metrics.abandonedCarts.map(cart => ({
            id: cart.id,
            customer: cart.customer,
            items: cart.items,
            value: cart.value,
            timeAbandoned: cart.timeAbandoned,
            recoveryStrategy: generateRecoveryStrategy(cart)
        }));
    };

    const generateAutoActions = (metrics) => {
        const actions = [];

        // Sales Performance Monitoring
        if (metrics.revenueGrowth < 0) {
            actions.push({
                type: 'SALES_BOOST',
                title: 'Auto-Launch Sales Campaign',
                description: `Sales decreased by ${Math.abs(metrics.revenueGrowth)}% - Launching targeted ad campaign`,
                autoExecute: true,
                priority: 'URGENT'
            });
        }

        // Competitor Price Changes
        metrics.competitorChanges.forEach(change => {
            actions.push({
                type: 'PRICE_MATCH',
                title: 'Competitor Price Change Detected',
                description: `${change.competitor} changed ${change.product} price to $${change.newPrice}`,
                autoExecute: true,
                priority: 'HIGH'
            });
        });

        // Trend Detection
        metrics.trendingProducts.forEach(product => {
            actions.push({
                type: 'TREND_PROMOTION',
                title: 'Trending Product Detected',
                description: `${product.name} is trending - Launching promotion`,
                autoExecute: true,
                priority: 'MEDIUM'
            });
        });

        return actions;
    };

    const generateCampaignName = (product) => {
        const demandTrend = product.demandTrend;
        const timeOfDay = new Date().getHours();
        
        if (demandTrend > 0.2) {
            return `${product.name} Weekend Special`;
        } else if (timeOfDay >= 20 || timeOfDay <= 4) {
            return `Late Night ${product.name} Deals`;
        } else {
            return `${product.name} Daily Special`;
        }
    };

    const determineBestPlatform = (product) => {
        const platformPerformance = product.platformPerformance;
        return Object.entries(platformPerformance)
            .sort(([,a], [,b]) => b.roi - a.roi)[0][0];
    };

    const calculateOptimalBudget = (item) => {
        const baseBudget = item.currentBudget || 100;
        const performanceMultiplier = item.roi || 1;
        return Math.round(baseBudget * performanceMultiplier);
    };

    const calculateROI = (item) => {
        return ((item.revenue - item.cost) / item.cost) * 100;
    };

    const generateTargetingStrategy = (product) => {
        return {
            demographics: product.targetDemographics,
            interests: product.targetInterests,
            behaviors: product.targetBehaviors,
            customAudiences: product.customAudiences
        };
    };

    const generateAdCreative = (product) => {
        return {
            headline: generateHeadline(product),
            description: generateDescription(product),
            callToAction: generateCallToAction(product),
            images: generateAdImages(product)
        };
    };

    const generateBudgetRecommendations = (metrics) => {
        return metrics.platformPerformance.map(platform => ({
            platform: platform.name,
            currentBudget: platform.budget,
            recommendedBudget: calculateOptimalBudget(platform),
            reason: `ROI of ${platform.roi}% - ${platform.roi > 1 ? 'Increasing' : 'Decreasing'} budget`
        }));
    };

    const calculateOptimalPrice = (product) => {
        const basePrice = product.currentPrice;
        const demandFactor = product.demandScore;
        const competitorFactor = Math.min(...product.competitorPrices) / basePrice;
        return Math.round(basePrice * demandFactor * competitorFactor * 100) / 100;
    };

    const calculateSeasonalityFactor = (product) => {
        const currentMonth = new Date().getMonth();
        const seasonalityData = product.seasonalityData;
        return seasonalityData[currentMonth] || 1;
    };

    const generatePricingRecommendations = (product) => {
        const recommendations = [];
        
        if (product.demandScore > 1.2) {
            recommendations.push({
                type: 'PRICE_INCREASE',
                amount: Math.round((product.demandScore - 1) * 100),
                reason: 'High demand detected'
            });
        }

        if (product.competitorPrices.some(price => price < product.currentPrice)) {
            recommendations.push({
                type: 'PRICE_MATCH',
                amount: Math.min(...product.competitorPrices),
                reason: 'Competitor price lower'
            });
        }

        return recommendations;
    };

    const generateTrendBasedPromotions = (metrics) => {
        return metrics.trendingProducts.map(product => ({
            type: 'TREND',
            name: `${product.name} Trend Sale`,
            discount: calculateTrendDiscount(product),
            duration: '24 hours',
            trigger: 'Trending now'
        }));
    };

    const generateHolidayPromotions = (metrics) => {
        const upcomingHolidays = metrics.upcomingHolidays;
        return upcomingHolidays.map(holiday => ({
            type: 'HOLIDAY',
            name: `${holiday.name} Special`,
            discount: calculateHolidayDiscount(holiday),
            duration: holiday.duration,
            trigger: holiday.date
        }));
    };

    const generateSmartBundles = (metrics) => {
        return metrics.bundleOpportunities.map(opportunity => ({
            type: 'BUNDLE',
            name: `${opportunity.name} Bundle`,
            discount: calculateBundleDiscount(opportunity),
            products: opportunity.products,
            trigger: 'Frequently bought together'
        }));
    };

    const calculateTrendDiscount = (product) => {
        const baseDiscount = 0.1;
        const trendMultiplier = Math.min(product.trendScore / 2, 1);
        return Math.round((baseDiscount * (1 + trendMultiplier)) * 100);
    };

    const calculateHolidayDiscount = (holiday) => {
        const baseDiscount = 0.15;
        const importanceMultiplier = holiday.importance;
        return Math.round((baseDiscount * importanceMultiplier) * 100);
    };

    const calculateBundleDiscount = (opportunity) => {
        const baseDiscount = 0.2;
        const popularityMultiplier = opportunity.popularity;
        return Math.round((baseDiscount * (1 + popularityMultiplier)) * 100);
    };

    const generateSegmentRecommendations = (segment) => {
        return {
            marketing: generateMarketingRecommendations(segment),
            products: generateProductRecommendations(segment),
            promotions: generatePromotionRecommendations(segment)
        };
    };

    const generateRecoveryStrategy = (cart) => {
        const timeAbandoned = new Date() - new Date(cart.timeAbandoned);
        const hoursAbandoned = timeAbandoned / (1000 * 60 * 60);
        
        if (hoursAbandoned < 1) {
            return {
                type: 'IMMEDIATE',
                discount: 5,
                message: 'Complete your order within 1 hour for 5% off!'
            };
        } else if (hoursAbandoned < 24) {
            return {
                type: 'DAILY',
                discount: 10,
                message: '24-hour special: 10% off your abandoned cart!'
            };
        } else {
            return {
                type: 'FINAL',
                discount: 15,
                message: 'Last chance: 15% off if you complete your order now!'
            };
        }
    };

    const handleAutoAction = async (action) => {
        try {
            await actions.executeAdvertisingAction(action.id);
            // Refresh metrics after action
            const updatedMetrics = await actions.getPerformanceMetrics('realtime');
            const newActions = generateAutoActions(updatedMetrics);
            setAutoActions(newActions);
        } catch (error) {
            console.error('Error executing auto action:', error);
        }
    };

    return (
        <div className="ai-advertising-optimization">
            <Grid container spacing={3}>
                <Grid item xs={12}>
                    <Typography variant="h4" gutterBottom>
                        <CampaignIcon /> AI Advertising & Revenue Optimization
                    </Typography>
                </Grid>

                {/* Active Campaigns */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6">
                                Active Campaigns
                            </Typography>
                            <Box mt={2}>
                                {advertisingState.activeCampaigns.map((campaign, index) => (
                                    <Box key={index} mb={2}>
                                        <Typography variant="subtitle1">
                                            {campaign.name}
                                        </Typography>
                                        <Typography variant="body2">
                                            Platform: {campaign.platform}
                                        </Typography>
                                        <Typography variant="body2">
                                            Budget: ${campaign.budget}
                                        </Typography>
                                        <LinearProgress 
                                            variant="determinate" 
                                            value={campaign.performance.roi}
                                            color="primary"
                                        />
                                        <Typography variant="body2" color="textSecondary">
                                            ROI: {campaign.performance.roi}%
                                        </Typography>
                                    </Box>
                                ))}
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Budget Allocation */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6">
                                Budget Allocation
                            </Typography>
                            <Box mt={2}>
                                {Object.entries(advertisingState.budgetAllocation.platforms || {}).map(([platform, data], index) => (
                                    <Box key={index} mb={2}>
                                        <Typography variant="subtitle1">
                                            {platform}
                                        </Typography>
                                        <Typography variant="body2">
                                            Current: ${data.currentBudget}
                                        </Typography>
                                        <Typography variant="body2">
                                            Recommended: ${data.recommendedBudget}
                                        </Typography>
                                        <LinearProgress 
                                            variant="determinate" 
                                            value={data.roi}
                                            color="success"
                                        />
                                        <Typography variant="body2" color="textSecondary">
                                            ROI: {data.roi}%
                                        </Typography>
                                    </Box>
                                ))}
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Pricing Optimization */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6">
                                Pricing Optimization
                            </Typography>
                            <Box mt={2}>
                                {advertisingState.pricingOptimizations.map((product, index) => (
                                    <Box key={index} mb={2}>
                                        <Typography variant="subtitle1">
                                            {product.name}
                                        </Typography>
                                        <Typography variant="body2">
                                            Current: ${product.currentPrice}
                                        </Typography>
                                        <Typography variant="body2">
                                            Recommended: ${product.recommendedPrice}
                                        </Typography>
                                        <Typography variant="body2" color="success">
                                            Demand Score: {product.demandScore}
                                        </Typography>
                                        {product.recommendations.map((rec, recIndex) => (
                                            <Chip
                                                key={recIndex}
                                                label={`${rec.type}: ${rec.amount}%`}
                                                color="primary"
                                                style={{ margin: '4px' }}
                                            />
                                        ))}
                                    </Box>
                                ))}
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Active Promotions */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6">
                                Active Promotions
                            </Typography>
                            <Box mt={2}>
                                {advertisingState.promotions.map((promo, index) => (
                                    <Box key={index} mb={2}>
                                        <Typography variant="subtitle1">
                                            {promo.name}
                                        </Typography>
                                        <Typography variant="body2">
                                            Discount: {promo.discount}%
                                        </Typography>
                                        <Typography variant="body2">
                                            Duration: {promo.duration}
                                        </Typography>
                                        <Chip
                                            label={promo.type}
                                            color="secondary"
                                            style={{ margin: '4px' }}
                                        />
                                    </Box>
                                ))}
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Customer Segments */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6">
                                Customer Segments
                            </Typography>
                            <Box mt={2}>
                                {advertisingState.customerSegments.map((segment, index) => (
                                    <Box key={index} mb={2}>
                                        <Typography variant="subtitle1">
                                            {segment.name}
                                        </Typography>
                                        <Typography variant="body2">
                                            Size: {segment.size} customers
                                        </Typography>
                                        <Typography variant="body2">
                                            Value: ${segment.value}
                                        </Typography>
                                        <Box mt={1}>
                                            {Object.entries(segment.recommendations).map(([key, value], recIndex) => (
                                                <Chip
                                                    key={recIndex}
                                                    label={`${key}: ${value}`}
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

                {/* Retargeting Campaigns */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6">
                                Retargeting Campaigns
                            </Typography>
                            <Box mt={2}>
                                {advertisingState.retargetingCampaigns.map((campaign, index) => (
                                    <Box key={index} mb={2}>
                                        <Typography variant="subtitle1">
                                            Cart Value: ${campaign.value}
                                        </Typography>
                                        <Typography variant="body2">
                                            Items: {campaign.items.length}
                                        </Typography>
                                        <Typography variant="body2" color="error">
                                            Abandoned: {new Date(campaign.timeAbandoned).toLocaleString()}
                                        </Typography>
                                        <Chip
                                            label={`${campaign.recoveryStrategy.type}: ${campaign.recoveryStrategy.discount}% off`}
                                            color="primary"
                                            style={{ margin: '4px' }}
                                        />
                                    </Box>
                                ))}
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Auto Actions */}
                <Grid item xs={12}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6">
                                Auto Actions
                            </Typography>
                            <Box mt={2}>
                                {autoActions.map((action, index) => (
                                    <Box key={index} mb={2}>
                                        <Alert severity={action.priority === 'URGENT' ? 'error' : 'warning'}>
                                            <Typography variant="subtitle1">
                                                {action.title}
                                            </Typography>
                                            <Typography variant="body2">
                                                {action.description}
                                            </Typography>
                                        </Alert>
                                        <Button
                                            variant="contained"
                                            color="primary"
                                            onClick={() => handleAutoAction(action)}
                                            disabled={!action.autoExecute}
                                        >
                                            Execute
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

export default AIAdvertisingOptimization; 