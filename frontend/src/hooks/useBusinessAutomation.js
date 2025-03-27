import { useState, useEffect, useCallback } from 'react';
import aiService from '../services/aiService';
import * as aiAnalytics from '../utils/aiAnalytics';

export const useBusinessAutomation = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [metrics, setMetrics] = useState(null);
    const [automationState, setAutomationState] = useState({
        autoGrow: {
            enabled: false,
            actions: [],
            stats: null
        },
        workforce: {
            optimization: null,
            autoScheduling: false,
            recommendations: []
        },
        revenue: {
            optimization: null,
            alerts: [],
            adjustments: []
        },
        advertising: {
            insights: null,
            campaigns: [],
            retargeting: {
                segments: [],
                performance: null
            },
            flashSales: []
        }
    });

    // Fetch initial data
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                setLoading(true);
                const [
                    metricsData,
                    automationStats
                ] = await Promise.all([
                    aiService.getBusinessMetrics(),
                    aiService.getAutomationStats()
                ]);

                setMetrics(metricsData);
                updateAutomationState(automationStats);
            } catch (err) {
                setError(err);
            } finally {
                setLoading(false);
            }
        };

        fetchInitialData();
    }, []);

    // Update automation state with new data
    const updateAutomationState = useCallback((stats) => {
        setAutomationState(prevState => ({
            ...prevState,
            autoGrow: {
                ...prevState.autoGrow,
                stats: stats.autoGrow
            },
            workforce: {
                ...prevState.workforce,
                optimization: stats.workforce
            },
            revenue: {
                ...prevState.revenue,
                optimization: stats.revenue
            },
            advertising: {
                ...prevState.advertising,
                insights: stats.advertising
            }
        }));
    }, []);

    // Auto-Grow Functions
    const toggleAutoGrow = async (enabled) => {
        try {
            const response = await aiService.toggleAutoGrow(enabled);
            setAutomationState(prevState => ({
                ...prevState,
                autoGrow: {
                    ...prevState.autoGrow,
                    enabled
                }
            }));
            return response;
        } catch (err) {
            setError(err);
            throw err;
        }
    };

    const executeAutoGrowAction = async (actionId) => {
        try {
            const response = await aiService.executeAutoGrowAction(actionId);
            // Update actions list after execution
            const actions = await aiService.getAutoGrowActions();
            setAutomationState(prevState => ({
                ...prevState,
                autoGrow: {
                    ...prevState.autoGrow,
                    actions
                }
            }));
            return response;
        } catch (err) {
            setError(err);
            throw err;
        }
    };

    // Workforce Optimization Functions
    const toggleAutoScheduling = async (enabled) => {
        try {
            const response = await aiService.toggleAutoScheduling(enabled);
            setAutomationState(prevState => ({
                ...prevState,
                workforce: {
                    ...prevState.workforce,
                    autoScheduling: enabled
                }
            }));
            return response;
        } catch (err) {
            setError(err);
            throw err;
        }
    };

    const applyStaffingRecommendation = async (recommendationId) => {
        try {
            const response = await aiService.applyStaffingRecommendation(recommendationId);
            // Refresh workforce optimization data
            const optimization = await aiService.getWorkforceOptimization();
            setAutomationState(prevState => ({
                ...prevState,
                workforce: {
                    ...prevState.workforce,
                    optimization
                }
            }));
            return response;
        } catch (err) {
            setError(err);
            throw err;
        }
    };

    // Revenue Optimization Functions
    const applyPriceAdjustment = async (adjustmentId) => {
        try {
            const response = await aiService.applyPriceAdjustment(adjustmentId);
            // Refresh revenue optimization data
            const optimization = await aiService.getRevenueOptimization();
            setAutomationState(prevState => ({
                ...prevState,
                revenue: {
                    ...prevState.revenue,
                    optimization
                }
            }));
            return response;
        } catch (err) {
            setError(err);
            throw err;
        }
    };

    const checkInventoryAlerts = async () => {
        try {
            const alerts = await aiService.getInventoryAlerts();
            setAutomationState(prevState => ({
                ...prevState,
                revenue: {
                    ...prevState.revenue,
                    alerts
                }
            }));
            return alerts;
        } catch (err) {
            setError(err);
            throw err;
        }
    };

    // Smart Advertising Functions
    const createAutoCampaign = async (campaignData) => {
        try {
            const response = await aiService.createAutoCampaign(campaignData);
            // Refresh campaigns list
            const insights = await aiService.getAdvertisingInsights();
            setAutomationState(prevState => ({
                ...prevState,
                advertising: {
                    ...prevState.advertising,
                    insights
                }
            }));
            return response;
        } catch (err) {
            setError(err);
            throw err;
        }
    };

    const optimizeCampaign = async (campaignId) => {
        try {
            const response = await aiService.optimizeCampaign(campaignId);
            // Refresh advertising insights
            const insights = await aiService.getAdvertisingInsights();
            setAutomationState(prevState => ({
                ...prevState,
                advertising: {
                    ...prevState.advertising,
                    insights
                }
            }));
            return response;
        } catch (err) {
            setError(err);
            throw err;
        }
    };

    const createFlashSale = async (saleData) => {
        try {
            const response = await aiService.createFlashSale(saleData);
            // Update flash sales list
            setAutomationState(prevState => ({
                ...prevState,
                advertising: {
                    ...prevState.advertising,
                    flashSales: [...prevState.advertising.flashSales, response]
                }
            }));
            return response;
        } catch (err) {
            setError(err);
            throw err;
        }
    };

    // Analytics Functions
    const generateInsightsReport = async (options) => {
        try {
            return await aiService.generateInsightsReport(options);
        } catch (err) {
            setError(err);
            throw err;
        }
    };

    const getPerformanceMetrics = async (timeframe) => {
        try {
            return await aiService.getPerformanceMetrics(timeframe);
        } catch (err) {
            setError(err);
            throw err;
        }
    };

    // Utility Functions
    const calculateOptimizations = useCallback((data) => {
        return {
            budget: aiAnalytics.calculateOptimalBudget(data),
            targeting: aiAnalytics.generateTargetAudience(data),
            pricing: aiAnalytics.calculateOptimalDiscount(data)
        };
    }, []);

    return {
        loading,
        error,
        metrics,
        automationState,
        actions: {
            toggleAutoGrow,
            executeAutoGrowAction,
            toggleAutoScheduling,
            applyStaffingRecommendation,
            applyPriceAdjustment,
            checkInventoryAlerts,
            createAutoCampaign,
            optimizeCampaign,
            createFlashSale
        },
        analytics: {
            generateInsightsReport,
            getPerformanceMetrics,
            calculateOptimizations
        }
    };
};

export default useBusinessAutomation; 