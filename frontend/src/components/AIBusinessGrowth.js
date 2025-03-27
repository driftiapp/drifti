import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Grid, Typography, Box, Chip, Tooltip, LinearProgress } from '@/components/ui/layout';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AutoGraphIcon from '@mui/icons-material/AutoGraph';
import StorefrontIcon from '@mui/icons-material/Storefront';
import GroupIcon from '@mui/icons-material/Group';
import useBusinessAutomation from '../hooks/useBusinessAutomation';

const AIBusinessGrowth = () => {
    const {
        loading,
        error,
        metrics,
        automationState,
        actions
    } = useBusinessAutomation();

    const [growthMetrics, setGrowthMetrics] = useState({
        demandPredictions: [],
        expansionOpportunities: [],
        workforceOptimizations: [],
        autoActions: []
    });

    const [activeExpansions, setActiveExpansions] = useState([]);

    useEffect(() => {
        if (metrics) {
            // Process growth metrics
            const predictions = processDemandPredictions(metrics);
            const opportunities = identifyExpansionOpportunities(metrics);
            const optimizations = optimizeWorkforce(metrics);
            const actions = generateAutoActions(metrics);

            setGrowthMetrics({
                demandPredictions: predictions,
                expansionOpportunities: opportunities,
                workforceOptimizations: optimizations,
                autoActions: actions
            });
        }
    }, [metrics]);

    const processDemandPredictions = (metrics) => {
        return metrics.demandPatterns.map(pattern => ({
            category: pattern.category,
            predictedDemand: pattern.predictedDemand,
            confidence: pattern.confidence,
            recommendedActions: generateDemandActions(pattern)
        }));
    };

    const identifyExpansionOpportunities = (metrics) => {
        return metrics.areaPerformance.map(area => ({
            location: area.location,
            demandScore: area.demandScore,
            growthPotential: area.growthPotential,
            recommendedActions: generateExpansionActions(area)
        }));
    };

    const optimizeWorkforce = (metrics) => {
        return metrics.workforcePatterns.map(pattern => ({
            timeSlot: pattern.timeSlot,
            currentStaff: pattern.currentStaff,
            recommendedStaff: pattern.recommendedStaff,
            demandLevel: pattern.demandLevel,
            actions: generateWorkforceActions(pattern)
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

        // Cart Abandonment Handling
        if (metrics.cartAbandonmentRate > 0.3) {
            actions.push({
                type: 'CART_RECOVERY',
                title: 'Auto-Send Abandoned Cart Offers',
                description: 'High cart abandonment detected - Sending recovery offers',
                autoExecute: true,
                priority: 'HIGH'
            });
        }

        return actions;
    };

    const generateDemandActions = (pattern) => {
        const actions = [];
        
        if (pattern.predictedDemand > pattern.currentCapacity * 1.5) {
            actions.push({
                type: 'SCALE_UP',
                title: 'Increase Stock Levels',
                description: `Predicted demand increase of ${Math.round((pattern.predictedDemand / pattern.currentCapacity - 1) * 100)}%`,
                priority: 'HIGH'
            });
        }

        return actions;
    };

    const generateExpansionActions = (area) => {
        const actions = [];
        
        if (area.growthPotential > 0.8) {
            actions.push({
                type: 'EXPAND',
                title: 'Open New Location',
                description: `High growth potential in ${area.location}`,
                priority: 'HIGH'
            });
        }

        return actions;
    };

    const generateWorkforceActions = (pattern) => {
        const actions = [];
        
        if (pattern.recommendedStaff > pattern.currentStaff) {
            actions.push({
                type: 'HIRE',
                title: 'Increase Staff',
                description: `Add ${pattern.recommendedStaff - pattern.currentStaff} staff members`,
                priority: 'MEDIUM'
            });
        }

        return actions;
    };

    const handleAutoAction = async (action) => {
        try {
            await actions.executeAutoGrowAction(action.id);
            // Refresh metrics after action
            const updatedMetrics = await actions.getPerformanceMetrics('realtime');
            setGrowthMetrics(prev => ({
                ...prev,
                autoActions: generateAutoActions(updatedMetrics)
            }));
        } catch (error) {
            console.error('Error executing auto action:', error);
        }
    };

    const handleExpansion = async (opportunity) => {
        try {
            // Implement expansion logic
            setActiveExpansions(prev => [...prev, opportunity]);
        } catch (error) {
            console.error('Error handling expansion:', error);
        }
    };

    return (
        <div className="ai-business-growth">
            <Grid container spacing={3}>
                <Grid item xs={12}>
                    <Typography variant="h4" gutterBottom>
                        <AutoGraphIcon /> AI Business Growth Automation
                    </Typography>
                </Grid>

                {/* Demand Predictions */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6">
                                <TrendingUpIcon /> Demand Predictions
                            </Typography>
                            <Box mt={2}>
                                {growthMetrics.demandPredictions.map((prediction, index) => (
                                    <Box key={index} mb={2}>
                                        <Typography variant="subtitle1">
                                            {prediction.category}
                                        </Typography>
                                        <LinearProgress 
                                            variant="determinate" 
                                            value={prediction.confidence * 100}
                                            color="primary"
                                        />
                                        <Typography variant="body2" color="textSecondary">
                                            Predicted Demand: {prediction.predictedDemand}
                                        </Typography>
                                        {prediction.recommendedActions.map((action, actionIndex) => (
                                            <Chip
                                                key={actionIndex}
                                                label={action.title}
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

                {/* Expansion Opportunities */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6">
                                <StorefrontIcon /> Expansion Opportunities
                            </Typography>
                            <Box mt={2}>
                                {growthMetrics.expansionOpportunities.map((opportunity, index) => (
                                    <Box key={index} mb={2}>
                                        <Typography variant="subtitle1">
                                            {opportunity.location}
                                        </Typography>
                                        <LinearProgress 
                                            variant="determinate" 
                                            value={opportunity.growthPotential * 100}
                                            color="success"
                                        />
                                        <Typography variant="body2" color="textSecondary">
                                            Demand Score: {opportunity.demandScore}
                                        </Typography>
                                        <Button
                                            variant="contained"
                                            color="primary"
                                            onClick={() => handleExpansion(opportunity)}
                                            disabled={activeExpansions.includes(opportunity)}
                                        >
                                            {activeExpansions.includes(opportunity) ? 'Expanding...' : 'Expand'}
                                        </Button>
                                    </Box>
                                ))}
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Workforce Optimization */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6">
                                <GroupIcon /> Workforce Optimization
                            </Typography>
                            <Box mt={2}>
                                {growthMetrics.workforceOptimizations.map((optimization, index) => (
                                    <Box key={index} mb={2}>
                                        <Typography variant="subtitle1">
                                            {optimization.timeSlot}
                                        </Typography>
                                        <Typography variant="body2">
                                            Current Staff: {optimization.currentStaff}
                                        </Typography>
                                        <Typography variant="body2">
                                            Recommended: {optimization.recommendedStaff}
                                        </Typography>
                                        {optimization.actions.map((action, actionIndex) => (
                                            <Chip
                                                key={actionIndex}
                                                label={action.title}
                                                color="secondary"
                                                style={{ margin: '4px' }}
                                            />
                                        ))}
                                    </Box>
                                ))}
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Auto Actions */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6">
                                Auto Actions
                            </Typography>
                            <Box mt={2}>
                                {growthMetrics.autoActions.map((action, index) => (
                                    <Box key={index} mb={2}>
                                        <Typography variant="subtitle1">
                                            {action.title}
                                        </Typography>
                                        <Typography variant="body2" color="textSecondary">
                                            {action.description}
                                        </Typography>
                                        <Chip
                                            label={action.priority}
                                            color={action.priority === 'URGENT' ? 'error' : 'warning'}
                                            style={{ margin: '4px' }}
                                        />
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

export default AIBusinessGrowth; 