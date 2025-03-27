import React, { useEffect, useState } from 'react';
import {
    Box,
    Grid,
    Paper,
    Typography,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Alert,
    CircularProgress,
    Chip,
    IconButton,
    Card,
    CardContent,
    useTheme
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Warning as WarningIcon,
    TrendingUp as TrendingUpIcon,
    Refresh as RefreshIcon
} from '@mui/icons-material';
import { Line } from 'react-chartjs-2';
import axios from 'axios';
import { format } from 'date-fns';

interface InventoryItem {
    _id: string;
    itemId: {
        _id: string;
        name: string;
        description: string;
        price: number;
    };
    currentQuantity: number;
    minThreshold: number;
    maxThreshold: number;
    unit: string;
    status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'disabled';
    lastVerified: string;
    alerts: Array<{
        type: string;
        message: string;
        createdAt: string;
    }>;
    aiPredictions: {
        nextRestockDate: string;
        suggestedQuantity: number;
        confidence: number;
        factors: Array<{
            name: string;
            impact: number;
        }>;
    };
}

interface InventoryAnalytics {
    totalItems: number;
    lowStockItems: number;
    outOfStockItems: number;
    disabledItems: number;
    averageTurnover: number;
    topSellingItems: Array<{
        itemId: string;
        name: string;
        quantity: number;
    }>;
    stockoutRate: number;
    predictions: {
        expectedDemand: number;
        suggestedRestockDate: string;
    };
}

const InventoryDashboard: React.FC<{ storeId: string }> = ({ storeId }) => {
    const theme = useTheme();
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [analytics, setAnalytics] = useState<InventoryAnalytics | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
    const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
    const [newQuantity, setNewQuantity] = useState('');
    const [updateReason, setUpdateReason] = useState('');
    const [verifyingInventory, setVerifyingInventory] = useState(false);

    const fetchInventory = async () => {
        try {
            setLoading(true);
            const [inventoryRes, analyticsRes] = await Promise.all([
                axios.get(`/api/inventory/${storeId}`),
                axios.get(`/api/inventory/${storeId}/analytics`)
            ]);

            setInventory(inventoryRes.data);
            setAnalytics(analyticsRes.data);
            setError(null);
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Failed to fetch inventory data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInventory();
        // Refresh data every 5 minutes
        const interval = setInterval(fetchInventory, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, [storeId]);

    const handleUpdateStock = async () => {
        if (!selectedItem) return;

        try {
            await axios.patch(`/api/inventory/${selectedItem._id}/stock`, {
                quantity: parseInt(newQuantity),
                reason: updateReason
            });

            setUpdateDialogOpen(false);
            setNewQuantity('');
            setUpdateReason('');
            await fetchInventory();
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Failed to update stock');
        }
    };

    const handleVerifyInventory = async () => {
        try {
            setVerifyingInventory(true);
            await axios.post(`/api/inventory/${storeId}/verify`);
            await fetchInventory();
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Failed to verify inventory');
        } finally {
            setVerifyingInventory(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'in_stock':
                return theme.palette.success.main;
            case 'low_stock':
                return theme.palette.warning.main;
            case 'out_of_stock':
            case 'disabled':
                return theme.palette.error.main;
            default:
                return theme.palette.info.main;
        }
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" p={4}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box p={3}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h4">Inventory Management</Typography>
                <Box>
                    <Button
                        variant="outlined"
                        startIcon={<RefreshIcon />}
                        onClick={handleVerifyInventory}
                        disabled={verifyingInventory}
                        sx={{ mr: 2 }}
                    >
                        Verify Inventory
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        color="primary"
                    >
                        Add New Item
                    </Button>
                </Box>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            {analytics && (
                <Grid container spacing={3} mb={3}>
                    <Grid item xs={12} md={3}>
                        <Card>
                            <CardContent>
                                <Typography color="textSecondary" gutterBottom>
                                    Total Items
                                </Typography>
                                <Typography variant="h4">
                                    {analytics.totalItems}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <Card>
                            <CardContent>
                                <Typography color="textSecondary" gutterBottom>
                                    Low Stock Items
                                </Typography>
                                <Typography variant="h4" color="warning.main">
                                    {analytics.lowStockItems}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <Card>
                            <CardContent>
                                <Typography color="textSecondary" gutterBottom>
                                    Out of Stock
                                </Typography>
                                <Typography variant="h4" color="error.main">
                                    {analytics.outOfStockItems}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <Card>
                            <CardContent>
                                <Typography color="textSecondary" gutterBottom>
                                    Average Turnover
                                </Typography>
                                <Typography variant="h4">
                                    {analytics.averageTurnover.toFixed(1)}x
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            )}

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Item</TableCell>
                            <TableCell align="right">Current Stock</TableCell>
                            <TableCell align="right">Min Threshold</TableCell>
                            <TableCell align="center">Status</TableCell>
                            <TableCell>Last Verified</TableCell>
                            <TableCell>AI Prediction</TableCell>
                            <TableCell align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {inventory.map((item) => (
                            <TableRow key={item._id}>
                                <TableCell>
                                    <Typography variant="subtitle2">
                                        {item.itemId.name}
                                    </Typography>
                                    <Typography variant="caption" color="textSecondary">
                                        {item.itemId.description}
                                    </Typography>
                                </TableCell>
                                <TableCell align="right">
                                    {item.currentQuantity} {item.unit}
                                </TableCell>
                                <TableCell align="right">
                                    {item.minThreshold} {item.unit}
                                </TableCell>
                                <TableCell align="center">
                                    <Chip
                                        label={item.status.replace('_', ' ').toUpperCase()}
                                        size="small"
                                        sx={{
                                            backgroundColor: getStatusColor(item.status),
                                            color: 'white'
                                        }}
                                    />
                                </TableCell>
                                <TableCell>
                                    {format(new Date(item.lastVerified), 'PPp')}
                                </TableCell>
                                <TableCell>
                                    {item.aiPredictions && (
                                        <Box>
                                            <Typography variant="caption" display="block">
                                                Next Restock: {format(new Date(item.aiPredictions.nextRestockDate), 'PP')}
                                            </Typography>
                                            <Typography variant="caption" display="block">
                                                Suggested: {item.aiPredictions.suggestedQuantity} {item.unit}
                                            </Typography>
                                        </Box>
                                    )}
                                </TableCell>
                                <TableCell align="right">
                                    <IconButton
                                        size="small"
                                        onClick={() => {
                                            setSelectedItem(item);
                                            setNewQuantity(item.currentQuantity.toString());
                                            setUpdateDialogOpen(true);
                                        }}
                                    >
                                        <EditIcon />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <Dialog
                open={updateDialogOpen}
                onClose={() => setUpdateDialogOpen(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>
                    Update Stock - {selectedItem?.itemId.name}
                </DialogTitle>
                <DialogContent>
                    <Box mb={2}>
                        <Typography variant="caption" display="block" gutterBottom>
                            Current Stock: {selectedItem?.currentQuantity} {selectedItem?.unit}
                        </Typography>
                        <Typography variant="caption" display="block" gutterBottom>
                            Min Threshold: {selectedItem?.minThreshold} {selectedItem?.unit}
                        </Typography>
                    </Box>

                    <TextField
                        label="New Quantity"
                        type="number"
                        fullWidth
                        value={newQuantity}
                        onChange={(e) => setNewQuantity(e.target.value)}
                        sx={{ mb: 2 }}
                    />

                    <TextField
                        label="Reason for Update"
                        fullWidth
                        multiline
                        rows={3}
                        value={updateReason}
                        onChange={(e) => setUpdateReason(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setUpdateDialogOpen(false)}>Cancel</Button>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handleUpdateStock}
                        disabled={!newQuantity || !updateReason}
                    >
                        Update Stock
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default InventoryDashboard; 