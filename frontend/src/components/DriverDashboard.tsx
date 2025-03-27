import React, { useState, useEffect } from 'react';
import {
    Box,
    Container,
    Grid,
    Paper,
    Typography,
    CircularProgress,
    Button,
    TextField,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    IconButton,
    Snackbar,
    Alert,
    LinearProgress
} from '@mui/material';
import {
    Timeline,
    TimelineItem,
    TimelineContent,
    TimelineSeparator,
    TimelineDot,
    TimelineConnector
} from '@mui/lab';
import {
    TrendingUp,
    LocalAtm,
    Speed,
    LocationOn,
    Notifications,
    Settings,
    Close
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { MapContainer, TileLayer, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { api } from '../utils/api';
import { formatCurrency } from '../utils/format';
import { useAuth } from '../hooks/useAuth';

interface EarningsData {
    currentEarnings: number;
    dailyGoal: number;
    completedRides: number;
    plan: any;
}

interface HeatmapPoint {
    lat: number;
    lng: number;
    weight: number;
}

interface SurgeAlert {
    estimatedEarnings: number;
    distance: number;
}

interface Tip {
    type: string;
    message: string;
    suggestions?: string[];
}

const DriverDashboard: React.FC = () => {
    const theme = useTheme();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [earnings, setEarnings] = useState<EarningsData | null>(null);
    const [heatmap, setHeatmap] = useState<{ points: HeatmapPoint[] } | null>(null);
    const [insights, setInsights] = useState<{ tips: Tip[] } | null>(null);
    const [surgeAlerts, setSurgeAlerts] = useState<SurgeAlert[]>([]);
    const [showGoalDialog, setShowGoalDialog] = useState(false);
    const [dailyGoal, setDailyGoal] = useState('');
    const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    useEffect(() => {
        // Get user's location
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLocation({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                });
                loadDashboardData(position.coords);
            },
            (error) => {
                console.error('Error getting location:', error);
                setError('Please enable location services to use all features');
            }
        );

        // Set up location watching for real-time updates
        const watchId = navigator.geolocation.watchPosition(
            (position) => {
                setLocation({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                });
                checkForSurgeAlerts(position.coords);
            },
            (error) => console.error('Error watching location:', error),
            { enableHighAccuracy: true }
        );

        return () => navigator.geolocation.clearWatch(watchId);
    }, []);

    const loadDashboardData = async (coords: GeolocationCoordinates) => {
        try {
            setLoading(true);
            const [earningsData, heatmapData, insightsData] = await Promise.all([
                api.get('/driver/earnings/progress'),
                api.get(`/driver/heatmap?lat=${coords.latitude}&lng=${coords.longitude}`),
                api.get(`/driver/earnings/insights?lat=${coords.latitude}&lng=${coords.longitude}`)
            ]);

            setEarnings(earningsData.data);
            setHeatmap(heatmapData.data);
            setInsights(insightsData.data);
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            setError('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    const checkForSurgeAlerts = async (coords: GeolocationCoordinates) => {
        try {
            const { data } = await api.get(
                `/driver/surge-alerts?lat=${coords.latitude}&lng=${coords.longitude}`
            );
            setSurgeAlerts(data);

            // Show notification for new surge zones
            if (data.length > 0) {
                const topSurge = data[0];
                setNotification({
                    type: 'success',
                    message: `Surge alert! ${formatCurrency(topSurge.estimatedEarnings)} potential earnings ${topSurge.distance.toFixed(1)}km away`
                });
            }
        } catch (error) {
            console.error('Error checking surge alerts:', error);
        }
    };

    const handleSetGoal = async () => {
        try {
            const { data } = await api.post('/driver/earnings/goal', {
                dailyGoal: parseFloat(dailyGoal)
            });

            setEarnings(prev => ({
                ...prev!,
                dailyGoal: data.dailyGoal,
                plan: data.hourlyPlan
            }));

            setShowGoalDialog(false);
            setNotification({
                type: 'success',
                message: 'Daily earnings goal set successfully!'
            });
        } catch (error) {
            console.error('Error setting earnings goal:', error);
            setNotification({
                type: 'error',
                message: 'Failed to set earnings goal'
            });
        }
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            {/* Header Section */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
                <Typography variant="h4" component="h1">
                    Driver Dashboard
                </Typography>
                <Button
                    variant="contained"
                    color="primary"
                    startIcon={<LocalAtm />}
                    onClick={() => setShowGoalDialog(true)}
                >
                    Set Daily Goal
                </Button>
            </Box>

            {/* Earnings Overview */}
            <Grid container spacing={3} mb={4}>
                <Grid item xs={12} md={4}>
                    <Paper
                        sx={{
                            p: 3,
                            height: '100%',
                            background: theme.palette.primary.main,
                            color: 'white'
                        }}
                    >
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Typography variant="h6">Today's Earnings</Typography>
                            <TrendingUp />
                        </Box>
                        <Typography variant="h3" component="div" sx={{ my: 2 }}>
                            {formatCurrency(earnings?.currentEarnings || 0)}
                        </Typography>
                        <Typography variant="body2">
                            Goal: {formatCurrency(earnings?.dailyGoal || 0)}
                        </Typography>
                        <LinearProgress
                            variant="determinate"
                            value={((earnings?.currentEarnings || 0) / (earnings?.dailyGoal || 1)) * 100}
                            sx={{ mt: 1, bgcolor: 'rgba(255,255,255,0.2)' }}
                        />
                    </Paper>
                </Grid>

                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 3, height: '100%' }}>
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Typography variant="h6">Completed Rides</Typography>
                            <Speed />
                        </Box>
                        <Typography variant="h3" component="div" sx={{ my: 2 }}>
                            {earnings?.completedRides || 0}
                        </Typography>
                        <Typography variant="body2">
                            Average: ${((earnings?.currentEarnings || 0) / (earnings?.completedRides || 1)).toFixed(2)}/ride
                        </Typography>
                    </Paper>
                </Grid>

                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 3, height: '100%' }}>
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Typography variant="h6">Active Surge Zones</Typography>
                            <Notifications color={surgeAlerts.length > 0 ? 'error' : 'disabled'} />
                        </Box>
                        <Typography variant="h3" component="div" sx={{ my: 2 }}>
                            {surgeAlerts.length}
                        </Typography>
                        {surgeAlerts.length > 0 && (
                            <Typography variant="body2" color="error">
                                Up to {formatCurrency(Math.max(...surgeAlerts.map(a => a.estimatedEarnings)))} potential earnings
                            </Typography>
                        )}
                    </Paper>
                </Grid>
            </Grid>

            {/* Map and Insights */}
            <Grid container spacing={3}>
                <Grid item xs={12} md={8}>
                    <Paper sx={{ p: 2, height: 400 }}>
                        {location && (
                            <MapContainer
                                center={[location.lat, location.lng]}
                                zoom={13}
                                style={{ height: '100%', width: '100%' }}
                            >
                                <TileLayer
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                />
                                {heatmap?.points.map((point: HeatmapPoint, index: number) => (
                                    <Circle
                                        key={index}
                                        center={[point.lat, point.lng]}
                                        radius={200}
                                        pathOptions={{
                                            color: point.weight > 0.7 ? 'red' : point.weight > 0.4 ? 'orange' : 'yellow',
                                            fillColor: point.weight > 0.7 ? 'red' : point.weight > 0.4 ? 'orange' : 'yellow',
                                            fillOpacity: 0.5
                                        }}
                                    />
                                ))}
                            </MapContainer>
                        )}
                    </Paper>
                </Grid>

                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 2, height: 400, overflow: 'auto' }}>
                        <Typography variant="h6" gutterBottom>
                            Earnings Insights
                        </Typography>
                        <Timeline>
                            {insights?.tips.map((tip: Tip, index: number) => (
                                <TimelineItem key={index}>
                                    <TimelineSeparator>
                                        <TimelineDot color={tip.type === 'improvement' ? 'warning' : 'success'} />
                                        {index < (insights?.tips.length || 0) - 1 && <TimelineConnector />}
                                    </TimelineSeparator>
                                    <TimelineContent>
                                        <Typography variant="subtitle2">{tip.message}</Typography>
                                        {tip.suggestions?.map((suggestion: string, i: number) => (
                                            <Typography key={i} variant="body2" color="textSecondary">
                                                • {suggestion}
                                            </Typography>
                                        ))}
                                    </TimelineContent>
                                </TimelineItem>
                            ))}
                        </Timeline>
                    </Paper>
                </Grid>
            </Grid>

            {/* Set Goal Dialog */}
            <Dialog open={showGoalDialog} onClose={() => setShowGoalDialog(false)}>
                <DialogTitle>
                    Set Daily Earnings Goal
                    <IconButton
                        sx={{ position: 'absolute', right: 8, top: 8 }}
                        onClick={() => setShowGoalDialog(false)}
                    >
                        <Close />
                    </IconButton>
                </DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Daily Goal ($)"
                        type="number"
                        fullWidth
                        value={dailyGoal}
                        onChange={(e) => setDailyGoal(e.target.value)}
                        InputProps={{ inputProps: { min: 0 } }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowGoalDialog(false)}>Cancel</Button>
                    <Button onClick={handleSetGoal} variant="contained" color="primary">
                        Set Goal
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Notifications */}
            {notification && (
                <Snackbar
                    open={true}
                    autoHideDuration={6000}
                    onClose={() => setNotification(null)}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                >
                    <Alert
                        onClose={() => setNotification(null)}
                        severity={notification.type}
                        sx={{ width: '100%' }}
                    >
                        {notification.message}
                    </Alert>
                </Snackbar>
            )}
        </Container>
    );
};

export default DriverDashboard; 