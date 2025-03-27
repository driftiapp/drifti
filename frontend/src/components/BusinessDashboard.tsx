import React, { useState, useEffect } from 'react';
import {
    Box,
    Container,
    Grid,
    Paper,
    Typography,
    Tabs,
    Tab,
    Button,
    IconButton,
    Card,
    CardContent,
    Alert,
    CircularProgress,
    useTheme,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    MenuItem,
    Switch,
    FormControlLabel
} from '@mui/material';
import {
    Notifications as NotificationsIcon,
    TrendingUp as TrendingUpIcon,
    Warning as WarningIcon,
    LocalShipping as ShippingIcon,
    Inventory as InventoryIcon,
    Hotel as HotelIcon,
    LocalBar as BarIcon,
    DirectionsCar as CarIcon,
    Restaurant as RestaurantIcon,
    Settings as SettingsIcon
} from '@mui/icons-material';
import { Line, Bar } from 'react-chartjs-2';
import axios from 'axios';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

interface BusinessStats {
    revenue: number;
    orders: number;
    customers: number;
    avgOrderValue: number;
    topCategories: Array<{
        name: string;
        revenue: number;
        orders: number;
    }>;
    lowStock: number;
    pendingDeliveries: number;
}

interface AlertItem {
    id: string;
    type: 'stock' | 'order' | 'system';
    severity: 'info' | 'warning' | 'error';
    message: string;
    timestamp: string;
    metadata?: any;
}

interface SalesData {
    labels: string[];
    datasets: Array<{
        label: string;
        data: number[];
        borderColor: string;
        fill: boolean;
    }>;
}

const BusinessDashboard: React.FC<{ businessId: string; businessType: string }> = ({
    businessId,
    businessType
}) => {
    const theme = useTheme();
    const [activeTab, setActiveTab] = useState(0);
    const [timeRange, setTimeRange] = useState('week');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [stats, setStats] = useState<BusinessStats | null>(null);
    const [alerts, setAlerts] = useState<AlertItem[]>([]);
    const [salesData, setSalesData] = useState<SalesData | null>(null);
    const [showAlertDialog, setShowAlertDialog] = useState(false);
    const [selectedAlert, setSelectedAlert] = useState<AlertItem | null>(null);

    useEffect(() => {
        fetchDashboardData();
        // Refresh data every 5 minutes
        const interval = setInterval(fetchDashboardData, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, [businessId, timeRange]);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const [statsRes, alertsRes, salesRes] = await Promise.all([
                axios.get(`/api/business/${businessId}/stats?range=${timeRange}`),
                axios.get(`/api/business/${businessId}/alerts`),
                axios.get(`/api/business/${businessId}/sales?range=${timeRange}`)
            ]);

            setStats(statsRes.data);
            setAlerts(alertsRes.data);
            setSalesData(salesRes.data);
            setError(null);
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Failed to fetch dashboard data');
        } finally {
            setLoading(false);
        }
    };

    const handleAlertAction = async (alertId: string, action: string) => {
        try {
            await axios.post(`/api/business/alerts/${alertId}/action`, { action });
            setAlerts(alerts.filter(alert => alert.id !== alertId));
            setShowAlertDialog(false);
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Failed to process alert action');
        }
    };

    const getBusinessIcon = () => {
        switch (businessType) {
            case 'restaurant':
                return <RestaurantIcon />;
            case 'liquor_store':
                return <BarIcon />;
            case 'hotel':
                return <HotelIcon />;
            case 'car_rental':
                return <CarIcon />;
            default:
                return <InventoryIcon />;
        }
    };

    const renderStats = () => (
        <Grid container spacing={3}>
            <Grid item xs={12} md={3}>
                <Card>
                    <CardContent>
                        <Typography color="textSecondary" gutterBottom>
                            Revenue
                        </Typography>
                        <Typography variant="h4">
                            ${stats?.revenue.toLocaleString()}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                            {timeRange === 'today' ? 'Today' : 'This ' + timeRange}
                        </Typography>
                    </CardContent>
                </Card>
            </Grid>
            <Grid item xs={12} md={3}>
                <Card>
                    <CardContent>
                        <Typography color="textSecondary" gutterBottom>
                            Orders
                        </Typography>
                        <Typography variant="h4">
                            {stats?.orders}
                        </Typography>
                        <Typography variant="body2" color="success.main">
                            +{((stats?.orders || 0) / 100).toFixed(1)}% vs last {timeRange}
                        </Typography>
                    </CardContent>
                </Card>
            </Grid>
            <Grid item xs={12} md={3}>
                <Card>
                    <CardContent>
                        <Typography color="textSecondary" gutterBottom>
                            Avg Order Value
                        </Typography>
                        <Typography variant="h4">
                            ${stats?.avgOrderValue.toFixed(2)}
                        </Typography>
                    </CardContent>
                </Card>
            </Grid>
            <Grid item xs={12} md={3}>
                <Card>
                    <CardContent>
                        <Typography color="textSecondary" gutterBottom>
                            Alerts
                        </Typography>
                        <Typography variant="h4" color={alerts.length > 0 ? 'error.main' : 'success.main'}>
                            {alerts.length}
                        </Typography>
                        {alerts.length > 0 && (
                            <Button
                                size="small"
                                color="primary"
                                onClick={() => setShowAlertDialog(true)}
                            >
                                View All
                            </Button>
                        )}
                    </CardContent>
                </Card>
            </Grid>
        </Grid>
    );

    const renderAlerts = () => (
        <Dialog
            open={showAlertDialog}
            onClose={() => setShowAlertDialog(false)}
            maxWidth="md"
            fullWidth
        >
            <DialogTitle>Active Alerts</DialogTitle>
            <DialogContent>
                {alerts.map(alert => (
                    <Alert
                        key={alert.id}
                        severity={alert.severity}
                        action={
                            <Button
                                color="inherit"
                                size="small"
                                onClick={() => handleAlertAction(alert.id, 'resolve')}
                            >
                                Resolve
                            </Button>
                        }
                        sx={{ mb: 2 }}
                    >
                        <Typography variant="subtitle2">
                            {alert.message}
                        </Typography>
                        <Typography variant="caption" display="block">
                            {format(new Date(alert.timestamp), 'PPp')}
                        </Typography>
                    </Alert>
                ))}
            </DialogContent>
            <DialogActions>
                <Button onClick={() => setShowAlertDialog(false)}>Close</Button>
            </DialogActions>
        </Dialog>
    );

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" p={4}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Container maxWidth="xl">
            <Box py={3}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                    <Box display="flex" alignItems="center">
                        <IconButton color="primary" sx={{ mr: 2 }}>
                            {getBusinessIcon()}
                        </IconButton>
                        <Typography variant="h4">Business Dashboard</Typography>
                    </Box>
                    <Box>
                        <TextField
                            select
                            size="small"
                            value={timeRange}
                            onChange={(e) => setTimeRange(e.target.value)}
                            sx={{ mr: 2 }}
                        >
                            <MenuItem value="today">Today</MenuItem>
                            <MenuItem value="week">This Week</MenuItem>
                            <MenuItem value="month">This Month</MenuItem>
                            <MenuItem value="year">This Year</MenuItem>
                        </TextField>
                        <IconButton
                            color="primary"
                            onClick={() => setShowAlertDialog(true)}
                        >
                            <NotificationsIcon />
                        </IconButton>
                        <IconButton color="primary">
                            <SettingsIcon />
                        </IconButton>
                    </Box>
                </Box>

                {error && (
                    <Alert severity="error" sx={{ mb: 3 }}>
                        {error}
                    </Alert>
                )}

                {renderStats()}

                <Box mt={4}>
                    <Paper>
                        <Tabs
                            value={activeTab}
                            onChange={(_, newValue) => setActiveTab(newValue)}
                            variant="scrollable"
                            scrollButtons="auto"
                        >
                            <Tab label="Overview" />
                            <Tab label="Inventory" />
                            <Tab label="Orders" />
                            <Tab label="Analytics" />
                            <Tab label="Settings" />
                        </Tabs>
                    </Paper>
                </Box>

                <Box mt={3}>
                    {activeTab === 0 && (
                        <Grid container spacing={3}>
                            <Grid item xs={12} md={8}>
                                <Paper sx={{ p: 2 }}>
                                    <Typography variant="h6" gutterBottom>
                                        Sales Trend
                                    </Typography>
                                    {salesData && (
                                        <Box height={300}>
                                            <Line
                                                data={salesData}
                                                options={{
                                                    responsive: true,
                                                    maintainAspectRatio: false,
                                                    scales: {
                                                        y: {
                                                            beginAtZero: true
                                                        }
                                                    }
                                                }}
                                            />
                                        </Box>
                                    )}
                                </Paper>
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <Paper sx={{ p: 2 }}>
                                    <Typography variant="h6" gutterBottom>
                                        Top Categories
                                    </Typography>
                                    {stats?.topCategories.map(category => (
                                        <Box
                                            key={category.name}
                                            display="flex"
                                            justifyContent="space-between"
                                            alignItems="center"
                                            mb={2}
                                        >
                                            <Typography variant="body1">
                                                {category.name}
                                            </Typography>
                                            <Typography variant="body2" color="textSecondary">
                                                ${category.revenue.toLocaleString()}
                                            </Typography>
                                        </Box>
                                    ))}
                                </Paper>
                            </Grid>
                        </Grid>
                    )}
                </Box>

                {renderAlerts()}
            </Box>
        </Container>
    );
};

export default BusinessDashboard; 