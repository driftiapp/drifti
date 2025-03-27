import React, { useState, useEffect } from 'react';
import { Box, Container, Grid, Paper, Typography, CircularProgress, Alert } from '@mui/material';
import HealthStatus from './HealthStatus';
import AlertStats from './AlertStats';
import RecentAlerts from './RecentAlerts';
import SystemMetrics from './SystemMetrics';
import AdvancedVisualizations from './AdvancedVisualizations';
import { api } from '../../services/api';

const HealthDashboard = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [healthStatus, setHealthStatus] = useState(null);
    const [alertStats, setAlertStats] = useState(null);
    const [recentAlerts, setRecentAlerts] = useState(null);
    const [systemMetrics, setSystemMetrics] = useState(null);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            setError(null);

            const [statusResponse, statsResponse, alertsResponse, metricsResponse] = await Promise.all([
                api.get('/health/status'),
                api.get('/alerts/stats'),
                api.get('/alerts/recent'),
                api.get('/metrics/system')
            ]);

            setHealthStatus(statusResponse.data);
            setAlertStats(statsResponse.data);
            setRecentAlerts(alertsResponse.data);
            setSystemMetrics(metricsResponse.data);
        } catch (err) {
            setError('Failed to fetch dashboard data. Please try again later.');
            console.error('Dashboard data fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
        const interval = setInterval(fetchDashboardData, 60000); // Refresh every minute
        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Container maxWidth="lg" sx={{ mt: 4 }}>
                <Alert severity="error">{error}</Alert>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Typography variant="h4" gutterBottom>
                System Health Dashboard
            </Typography>
            <Grid container spacing={3}>
                <Grid item xs={12}>
                    <Paper sx={{ p: 2 }}>
                        <HealthStatus status={healthStatus} />
                    </Paper>
                </Grid>
                <Grid item xs={12}>
                    <Paper sx={{ p: 2 }}>
                        <AlertStats stats={alertStats} />
                    </Paper>
                </Grid>
                <Grid item xs={12}>
                    <Paper sx={{ p: 2 }}>
                        <SystemMetrics metrics={systemMetrics} />
                    </Paper>
                </Grid>
                <Grid item xs={12}>
                    <Paper sx={{ p: 2 }}>
                        <AdvancedVisualizations alerts={recentAlerts} metrics={systemMetrics} />
                    </Paper>
                </Grid>
                <Grid item xs={12}>
                    <Paper sx={{ p: 2 }}>
                        <RecentAlerts alerts={recentAlerts} />
                    </Paper>
                </Grid>
            </Grid>
        </Container>
    );
};

export default HealthDashboard; 