import React, { useState } from 'react';
import { Box, Grid, Typography, Paper, Tooltip, IconButton, Menu, MenuItem, Dialog, DialogTitle, DialogContent } from '@mui/material';
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip as RechartsTooltip,
    Legend,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid
} from 'recharts';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { exportToCSV, exportToPDF, formatAlertDataForExport, formatMetricsDataForExport } from '../../utils/exportUtils';
import ComponentDetails from './ComponentDetails';

const COLORS = ['#FF8042', '#00C49F', '#FFBB28', '#FF8042', '#0088FE'];

const AdvancedVisualizations = ({ alerts, metrics }) => {
    const [anchorEl, setAnchorEl] = useState(null);
    const [selectedComponent, setSelectedComponent] = useState(null);
    const [chartType, setChartType] = useState('pie');
    const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
    const [visibleComponents, setVisibleComponents] = useState(new Set());

    if (!alerts || !metrics) return null;

    // Prepare data for failure distribution pie chart
    const failureDistribution = alerts.reduce((acc, alert) => {
        if (alert.type === 'failure') {
            acc[alert.component] = (acc[alert.component] || 0) + 1;
        }
        return acc;
    }, {});

    const pieData = Object.entries(failureDistribution)
        .filter(([name]) => visibleComponents.size === 0 || visibleComponents.has(name))
        .map(([name, value]) => ({
            name,
            value,
            percentage: ((value / alerts.filter(a => a.type === 'failure').length) * 100).toFixed(1)
        }));

    // Prepare data for resource usage heatmap
    const resourceUsage = [
        { name: 'CPU', value: metrics.cpuUsage, threshold: 80 },
        { name: 'Memory', value: metrics.memoryUsage, threshold: 80 },
        { name: 'Disk', value: metrics.diskUsage, threshold: 80 },
        { name: 'Network', value: metrics.networkIO, threshold: 80 }
    ];

    const handleMenuClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleExport = (format) => {
        if (format === 'csv') {
            exportToCSV(formatAlertDataForExport(alerts), 'alert_data');
        } else if (format === 'pdf') {
            exportToPDF(formatAlertDataForExport(alerts), 'alert_data', 'Alert History Report');
        }
        handleMenuClose();
    };

    const handleComponentClick = (component) => {
        setSelectedComponent(component);
        setDetailsDialogOpen(true);
    };

    const handleDetailsDialogClose = () => {
        setDetailsDialogOpen(false);
        setSelectedComponent(null);
    };

    const toggleComponentVisibility = (component) => {
        const newVisibleComponents = new Set(visibleComponents);
        if (newVisibleComponents.has(component)) {
            newVisibleComponents.delete(component);
        } else {
            newVisibleComponents.add(component);
        }
        setVisibleComponents(newVisibleComponents);
    };

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <Paper sx={{ p: 1, bgcolor: 'rgba(255, 255, 255, 0.9)' }}>
                    <Typography variant="body2">
                        {data.name}: {data.value} ({data.percentage}%)
                    </Typography>
                    <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
                        Click to view details
                    </Typography>
                </Paper>
            );
        }
        return null;
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Advanced Analytics</Typography>
                <IconButton onClick={handleMenuClick}>
                    <MoreVertIcon />
                </IconButton>
                <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={handleMenuClose}
                >
                    <MenuItem onClick={() => handleExport('csv')}>Export as CSV</MenuItem>
                    <MenuItem onClick={() => handleExport('pdf')}>Export as PDF</MenuItem>
                    <MenuItem onClick={() => setChartType(chartType === 'pie' ? 'bar' : 'pie')}>
                        Switch to {chartType === 'pie' ? 'Bar' : 'Pie'} Chart
                    </MenuItem>
                </Menu>
            </Box>
            <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2, height: 300 }}>
                        <Typography variant="subtitle1" gutterBottom>
                            Failure Distribution by Component
                        </Typography>
                        <ResponsiveContainer width="100%" height="100%">
                            {chartType === 'pie' ? (
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="value"
                                        onClick={(data) => handleComponentClick(data.name)}
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={COLORS[index % COLORS.length]}
                                                style={{
                                                    cursor: 'pointer',
                                                    filter: selectedComponent && selectedComponent !== entry.name ? 'grayscale(100%)' : 'none'
                                                }}
                                            />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip content={<CustomTooltip />} />
                                    <Legend
                                        onClick={(data) => toggleComponentVisibility(data.value)}
                                        style={{ cursor: 'pointer' }}
                                    />
                                </PieChart>
                            ) : (
                                <BarChart data={pieData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <RechartsTooltip content={<CustomTooltip />} />
                                    <Bar dataKey="value" fill="#8884d8">
                                        {pieData.map((entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={COLORS[index % COLORS.length]}
                                                style={{
                                                    cursor: 'pointer',
                                                    filter: selectedComponent && selectedComponent !== entry.name ? 'grayscale(100%)' : 'none'
                                                }}
                                                onClick={() => handleComponentClick(entry.name)}
                                            />
                                        ))}
                                    </Bar>
                                </BarChart>
                            )}
                        </ResponsiveContainer>
                    </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2, height: 300 }}>
                        <Typography variant="subtitle1" gutterBottom>
                            Resource Usage Heatmap
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            {resourceUsage.map((resource) => (
                                <Tooltip
                                    key={resource.name}
                                    title={`${resource.name} usage: ${resource.value}% (Threshold: ${resource.threshold}%)`}
                                >
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <Typography sx={{ width: 100 }}>{resource.name}</Typography>
                                        <Box
                                            sx={{
                                                flex: 1,
                                                height: 20,
                                                backgroundColor: resource.value >= resource.threshold
                                                    ? '#ff4444'
                                                    : resource.value >= resource.threshold * 0.8
                                                        ? '#ffbb33'
                                                        : '#00C851',
                                                borderRadius: 1,
                                                transition: 'all 0.3s',
                                                '&:hover': {
                                                    height: 24,
                                                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                                                }
                                            }}
                                        />
                                        <Typography>{resource.value}%</Typography>
                                    </Box>
                                </Tooltip>
                            ))}
                        </Box>
                    </Paper>
                </Grid>
            </Grid>

            <Dialog
                open={detailsDialogOpen}
                onClose={handleDetailsDialogClose}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    Component Details: {selectedComponent}
                </DialogTitle>
                <DialogContent>
                    <ComponentDetails
                        component={selectedComponent}
                        onClose={handleDetailsDialogClose}
                    />
                </DialogContent>
            </Dialog>
        </Box>
    );
};

export default AdvancedVisualizations; 