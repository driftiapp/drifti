import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Grid, Typography, Box, Chip, Tooltip, LinearProgress, Alert } from '@/components/ui/layout';
import InventoryIcon from '@mui/icons-material/Inventory';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import WarningIcon from '@mui/icons-material/Warning';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import useBusinessAutomation from '../hooks/useBusinessAutomation';

const AIInventoryAutomation = () => {
    const {
        loading,
        error,
        metrics,
        automationState,
        actions
    } = useBusinessAutomation();

    const [inventoryState, setInventoryState] = useState({
        stockLevels: [],
        restockOrders: [],
        supplierPerformance: [],
        inventoryAnalytics: {},
        orderFulfillment: [],
        businessHealth: {}
    });

    const [autoActions, setAutoActions] = useState([]);

    useEffect(() => {
        if (metrics) {
            // Process inventory metrics
            const stockLevels = analyzeStockLevels(metrics);
            const restockOrders = generateRestockOrders(metrics);
            const supplierPerformance = analyzeSupplierPerformance(metrics);
            const inventoryAnalytics = generateInventoryAnalytics(metrics);
            const orderFulfillment = optimizeOrderFulfillment(metrics);
            const businessHealth = analyzeBusinessHealth(metrics);

            setInventoryState({
                stockLevels,
                restockOrders,
                supplierPerformance,
                inventoryAnalytics,
                orderFulfillment,
                businessHealth
            });

            // Generate auto actions based on metrics
            const actions = generateAutoActions(metrics);
            setAutoActions(actions);
        }
    }, [metrics]);

    const analyzeStockLevels = (metrics) => {
        return metrics.products.map(product => ({
            id: product.id,
            name: product.name,
            currentStock: product.stock,
            minimumStock: product.minStock,
            maximumStock: product.maxStock,
            reorderPoint: product.reorderPoint,
            status: determineStockStatus(product),
            recommendations: generateStockRecommendations(product)
        }));
    };

    const generateRestockOrders = (metrics) => {
        return metrics.products
            .filter(product => needsRestock(product))
            .map(product => ({
                id: product.id,
                name: product.name,
                currentStock: product.stock,
                orderQuantity: calculateOrderQuantity(product),
                supplier: selectBestSupplier(product),
                priority: determineOrderPriority(product),
                estimatedDelivery: calculateDeliveryTime(product)
            }));
    };

    const analyzeSupplierPerformance = (metrics) => {
        return metrics.suppliers.map(supplier => ({
            id: supplier.id,
            name: supplier.name,
            performance: {
                fulfillmentRate: supplier.fulfillmentRate,
                onTimeDelivery: supplier.onTimeDelivery,
                qualityScore: supplier.qualityScore,
                costEfficiency: supplier.costEfficiency
            },
            recommendations: generateSupplierRecommendations(supplier)
        }));
    };

    const generateInventoryAnalytics = (metrics) => {
        return {
            shrinkage: analyzeShrinkage(metrics),
            expiry: analyzeExpiry(metrics),
            theft: analyzeTheft(metrics),
            waste: analyzeWaste(metrics)
        };
    };

    const optimizeOrderFulfillment = (metrics) => {
        return metrics.orders.map(order => ({
            id: order.id,
            customer: order.customer,
            items: order.items,
            priority: determineOrderPriority(order),
            warehouse: selectBestWarehouse(order),
            route: optimizeDeliveryRoute(order),
            estimatedDelivery: calculateDeliveryTime(order)
        }));
    };

    const analyzeBusinessHealth = (metrics) => {
        return {
            performance: analyzePerformance(metrics),
            costs: analyzeCosts(metrics),
            revenue: analyzeRevenue(metrics),
            recommendations: generateBusinessRecommendations(metrics)
        };
    };

    const determineStockStatus = (product) => {
        const stockPercentage = (product.stock / product.maxStock) * 100;
        if (stockPercentage <= 15) return 'CRITICAL';
        if (stockPercentage <= 30) return 'LOW';
        if (stockPercentage <= 70) return 'NORMAL';
        return 'EXCESS';
    };

    const needsRestock = (product) => {
        return product.stock <= product.reorderPoint;
    };

    const calculateOrderQuantity = (product) => {
        const baseQuantity = product.maxStock - product.stock;
        const demandFactor = product.demandScore || 1;
        const seasonalityFactor = calculateSeasonalityFactor(product);
        return Math.round(baseQuantity * demandFactor * seasonalityFactor);
    };

    const selectBestSupplier = (product) => {
        return product.suppliers
            .sort((a, b) => {
                const scoreA = calculateSupplierScore(a);
                const scoreB = calculateSupplierScore(b);
                return scoreB - scoreA;
            })[0];
    };

    const calculateSupplierScore = (supplier) => {
        return (
            supplier.fulfillmentRate * 0.4 +
            supplier.onTimeDelivery * 0.3 +
            supplier.qualityScore * 0.2 +
            supplier.costEfficiency * 0.1
        );
    };

    const determineOrderPriority = (item) => {
        if (item.stock <= item.minStock) return 'URGENT';
        if (item.demandScore > 1.5) return 'HIGH';
        if (item.demandScore > 1.2) return 'MEDIUM';
        return 'LOW';
    };

    const calculateDeliveryTime = (item) => {
        const baseTime = item.supplier?.averageDeliveryTime || 3;
        const distanceFactor = item.warehouse?.distance || 1;
        return Math.round(baseTime * distanceFactor);
    };

    const analyzeShrinkage = (metrics) => {
        return metrics.products.map(product => ({
            id: product.id,
            name: product.name,
            expectedStock: product.expectedStock,
            actualStock: product.actualStock,
            discrepancy: product.expectedStock - product.actualStock,
            risk: calculateShrinkageRisk(product)
        }));
    };

    const analyzeExpiry = (metrics) => {
        return metrics.products
            .filter(product => product.expiryDate)
            .map(product => ({
                id: product.id,
                name: product.name,
                expiryDate: product.expiryDate,
                daysUntilExpiry: calculateDaysUntilExpiry(product),
                action: determineExpiryAction(product)
            }));
    };

    const analyzeTheft = (metrics) => {
        return metrics.products.map(product => ({
            id: product.id,
            name: product.name,
            theftRisk: calculateTheftRisk(product),
            suspiciousActivity: detectSuspiciousActivity(product)
        }));
    };

    const analyzeWaste = (metrics) => {
        return metrics.products.map(product => ({
            id: product.id,
            name: product.name,
            wasteRate: calculateWasteRate(product),
            recommendations: generateWasteRecommendations(product)
        }));
    };

    const selectBestWarehouse = (order) => {
        return order.warehouses
            .sort((a, b) => {
                const scoreA = calculateWarehouseScore(a, order);
                const scoreB = calculateWarehouseScore(b, order);
                return scoreB - scoreA;
            })[0];
    };

    const calculateWarehouseScore = (warehouse, order) => {
        return (
            warehouse.stockAvailability * 0.4 +
            warehouse.processingSpeed * 0.3 +
            warehouse.distance * 0.3
        );
    };

    const optimizeDeliveryRoute = (order) => {
        // Implementation would use a routing algorithm
        return {
            route: 'Optimal Route',
            distance: '10 miles',
            estimatedTime: '30 minutes',
            stops: 3
        };
    };

    const analyzePerformance = (metrics) => {
        return {
            sales: metrics.sales,
            inventory: metrics.inventory,
            fulfillment: metrics.fulfillment,
            customerSatisfaction: metrics.customerSatisfaction
        };
    };

    const analyzeCosts = (metrics) => {
        return {
            operational: metrics.operationalCosts,
            inventory: metrics.inventoryCosts,
            shipping: metrics.shippingCosts,
            recommendations: generateCostRecommendations(metrics)
        };
    };

    const analyzeRevenue = (metrics) => {
        return {
            total: metrics.totalRevenue,
            byCategory: metrics.revenueByCategory,
            trends: metrics.revenueTrends,
            projections: generateRevenueProjections(metrics)
        };
    };

    const generateAutoActions = (metrics) => {
        const actions = [];

        // Stock Level Monitoring
        metrics.products.forEach(product => {
            if (product.stock <= product.minStock) {
                actions.push({
                    type: 'RESTOCK',
                    title: 'Low Stock Alert',
                    description: `${product.name} stock is at ${product.stock} - Auto-ordering ${calculateOrderQuantity(product)} units`,
                    autoExecute: true,
                    priority: 'URGENT'
                });
            }
        });

        // Expiry Monitoring
        metrics.products
            .filter(product => product.expiryDate)
            .forEach(product => {
                const daysUntilExpiry = calculateDaysUntilExpiry(product);
                if (daysUntilExpiry <= 7) {
                    actions.push({
                        type: 'EXPIRY',
                        title: 'Expiring Product Alert',
                        description: `${product.name} expires in ${daysUntilExpiry} days - Launching clearance sale`,
                        autoExecute: true,
                        priority: 'HIGH'
                    });
                }
            });

        // Supplier Performance
        metrics.suppliers.forEach(supplier => {
            if (supplier.fulfillmentRate < 0.9) {
                actions.push({
                    type: 'SUPPLIER',
                    title: 'Supplier Performance Alert',
                    description: `${supplier.name} has low fulfillment rate - Finding alternative supplier`,
                    autoExecute: true,
                    priority: 'MEDIUM'
                });
            }
        });

        return actions;
    };

    const handleAutoAction = async (action) => {
        try {
            await actions.executeInventoryAction(action.id);
            // Refresh metrics after action
            const updatedMetrics = await actions.getPerformanceMetrics('realtime');
            const newActions = generateAutoActions(updatedMetrics);
            setAutoActions(newActions);
        } catch (error) {
            console.error('Error executing auto action:', error);
        }
    };

    return (
        <div className="ai-inventory-automation">
            <Grid container spacing={3}>
                <Grid item xs={12}>
                    <Typography variant="h4" gutterBottom>
                        <InventoryIcon /> AI Inventory & Supplier Automation
                    </Typography>
                </Grid>

                {/* Stock Levels */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6">
                                Stock Levels
                            </Typography>
                            <Box mt={2}>
                                {inventoryState.stockLevels.map((product, index) => (
                                    <Box key={index} mb={2}>
                                        <Typography variant="subtitle1">
                                            {product.name}
                                        </Typography>
                                        <Typography variant="body2">
                                            Current: {product.currentStock}
                                        </Typography>
                                        <Typography variant="body2">
                                            Min: {product.minimumStock}
                                        </Typography>
                                        <Typography variant="body2">
                                            Max: {product.maximumStock}
                                        </Typography>
                                        <LinearProgress 
                                            variant="determinate" 
                                            value={(product.currentStock / product.maximumStock) * 100}
                                            color={product.status === 'CRITICAL' ? 'error' : 'primary'}
                                        />
                                        <Chip
                                            label={product.status}
                                            color={product.status === 'CRITICAL' ? 'error' : 'primary'}
                                            style={{ margin: '4px' }}
                                        />
                                    </Box>
                                ))}
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Restock Orders */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6">
                                Restock Orders
                            </Typography>
                            <Box mt={2}>
                                {inventoryState.restockOrders.map((order, index) => (
                                    <Box key={index} mb={2}>
                                        <Typography variant="subtitle1">
                                            {order.name}
                                        </Typography>
                                        <Typography variant="body2">
                                            Quantity: {order.orderQuantity}
                                        </Typography>
                                        <Typography variant="body2">
                                            Supplier: {order.supplier.name}
                                        </Typography>
                                        <Typography variant="body2">
                                            Priority: {order.priority}
                                        </Typography>
                                        <Chip
                                            label={`Delivery: ${order.estimatedDelivery} days`}
                                            color="secondary"
                                            style={{ margin: '4px' }}
                                        />
                                    </Box>
                                ))}
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Supplier Performance */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6">
                                Supplier Performance
                            </Typography>
                            <Box mt={2}>
                                {inventoryState.supplierPerformance.map((supplier, index) => (
                                    <Box key={index} mb={2}>
                                        <Typography variant="subtitle1">
                                            {supplier.name}
                                        </Typography>
                                        <Typography variant="body2">
                                            Fulfillment: {supplier.performance.fulfillmentRate}%
                                        </Typography>
                                        <Typography variant="body2">
                                            On-Time: {supplier.performance.onTimeDelivery}%
                                        </Typography>
                                        <Typography variant="body2">
                                            Quality: {supplier.performance.qualityScore}%
                                        </Typography>
                                        <LinearProgress 
                                            variant="determinate" 
                                            value={calculateSupplierScore(supplier)}
                                            color="success"
                                        />
                                    </Box>
                                ))}
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Inventory Analytics */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6">
                                Inventory Analytics
                            </Typography>
                            <Box mt={2}>
                                {Object.entries(inventoryState.inventoryAnalytics).map(([key, value], index) => (
                                    <Box key={index} mb={2}>
                                        <Typography variant="subtitle1">
                                            {key.charAt(0).toUpperCase() + key.slice(1)}
                                        </Typography>
                                        {Array.isArray(value) && value.map((item, itemIndex) => (
                                            <Box key={itemIndex} mt={1}>
                                                <Typography variant="body2">
                                                    {item.name}: {item.value}
                                                </Typography>
                                                {item.risk && (
                                                    <Chip
                                                        label={`Risk: ${item.risk}`}
                                                        color="warning"
                                                        style={{ margin: '4px' }}
                                                    />
                                                )}
                                            </Box>
                                        ))}
                                    </Box>
                                ))}
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Order Fulfillment */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6">
                                Order Fulfillment
                            </Typography>
                            <Box mt={2}>
                                {inventoryState.orderFulfillment.map((order, index) => (
                                    <Box key={index} mb={2}>
                                        <Typography variant="subtitle1">
                                            Order #{order.id}
                                        </Typography>
                                        <Typography variant="body2">
                                            Items: {order.items.length}
                                        </Typography>
                                        <Typography variant="body2">
                                            Priority: {order.priority}
                                        </Typography>
                                        <Typography variant="body2">
                                            Warehouse: {order.warehouse.name}
                                        </Typography>
                                        <Chip
                                            label={`Delivery: ${order.estimatedDelivery} days`}
                                            color="primary"
                                            style={{ margin: '4px' }}
                                        />
                                    </Box>
                                ))}
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Business Health */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6">
                                Business Health
                            </Typography>
                            <Box mt={2}>
                                {Object.entries(inventoryState.businessHealth).map(([key, value], index) => (
                                    <Box key={index} mb={2}>
                                        <Typography variant="subtitle1">
                                            {key.charAt(0).toUpperCase() + key.slice(1)}
                                        </Typography>
                                        {typeof value === 'object' && Object.entries(value).map(([subKey, subValue], subIndex) => (
                                            <Box key={subIndex} mt={1}>
                                                <Typography variant="body2">
                                                    {subKey}: {subValue}
                                                </Typography>
                                            </Box>
                                        ))}
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

export default AIInventoryAutomation; 