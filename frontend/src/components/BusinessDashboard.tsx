import React, { useState, useEffect } from 'react';
import {
    Box,
    Container,
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
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    MenuItem
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import InventoryIcon from '@mui/icons-material/Inventory';
import SettingsIcon from '@mui/icons-material/Settings';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import LocalBarIcon from '@mui/icons-material/LocalBar';
import HotelIcon from '@mui/icons-material/Hotel';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import { Line } from 'react-chartjs-2';
import axios from 'axios';
import { format } from 'date-fns';

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
    totalRides: number;
    activeDrivers: number;
    customerRating: number;
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
    const [activeTab, setActiveTab] = useState(0);
    const [timeRange, setTimeRange] = useState('week');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [stats, setStats] = useState<BusinessStats | null>(null);
    const [alerts, setAlerts] = useState<AlertItem[]>([]);
    const [salesData, setSalesData] = useState<SalesData | null>(null);
    const [showAlertDialog, setShowAlertDialog] = useState(false);

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
                return <LocalBarIcon />;
            case 'hotel':
                return <HotelIcon />;
            case 'car_rental':
                return <DirectionsCarIcon />;
            default:
                return <InventoryIcon />;
        }
    };

    const renderStats = () => (
        <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr 1fr' }, 
            gap: 3 
        }}>
            <Box>
                <Card>
                    <CardContent>
                        <Typography color="textSecondary" gutterBottom>
                            Total Rides
                        </Typography>
                        <Typography variant="h4">
                            {stats?.totalRides || 0}
                        </Typography>
                    </CardContent>
                </Card>
            </Box>
            <Box>
                <Card>
                    <CardContent>
                        <Typography color="textSecondary" gutterBottom>
                            Active Drivers
                        </Typography>
                        <Typography variant="h4">
                            {stats?.activeDrivers || 0}
                        </Typography>
                    </CardContent>
                </Card>
            </Box>
            <Box>
                <Card>
                    <CardContent>
                        <Typography color="textSecondary" gutterBottom>
                            Revenue
                        </Typography>
                        <Typography variant="h4">
                            ${(stats?.revenue || 0).toFixed(2)}
                        </Typography>
                    </CardContent>
                </Card>
            </Box>
            <Box>
                <Card>
                    <CardContent>
                        <Typography color="textSecondary" gutterBottom>
                            Customer Rating
                        </Typography>
                        <Typography variant="h4">
                            {(stats?.customerRating || 0).toFixed(1)}
                        </Typography>
                    </CardContent>
                </Card>
            </Box>
        </Box>
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

    const renderSalesChart = () => (
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 3 }}>
            <Box>
                <Card>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            Sales Trend
                        </Typography>
                        <Box sx={{ height: 300 }}>
                            {salesData && (
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
                            )}
                        </Box>
                    </CardContent>
                </Card>
            </Box>
        </Box>
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

                <Box sx={{ mb: 4 }}>
                    <Typography variant="h4" gutterBottom>
                        Dashboard
                    </Typography>
                    {renderStats()}
                </Box>

                <Box sx={{ 
                    display: 'grid', 
                    gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, 
                    gap: 4 
                }}>
                    <Box>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    Recent Activity
                                </Typography>
                                {/* Recent activity content */}
                            </CardContent>
                        </Card>
                    </Box>
                    <Box>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    Performance Metrics
                                </Typography>
                                {/* Performance metrics content */}
                            </CardContent>
                        </Card>
                    </Box>
                </Box>

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
                        <Box sx={{ 
                            display: 'grid', 
                            gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, 
                            gap: 3 
                        }}>
                            <Box>
                                <Paper sx={{ p: 2 }}>
                                    <Typography variant="h6" gutterBottom>
                                        Sales Trend
                                    </Typography>
                                    {renderSalesChart()}
                                </Paper>
                            </Box>
                            <Box>
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
                            </Box>
                        </Box>
                    )}
                </Box>

                {renderAlerts()}
            </Box>
        </Container>
    );
};

export default BusinessDashboard; 