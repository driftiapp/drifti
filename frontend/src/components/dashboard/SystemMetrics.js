import React from 'react';
import { Box, Grid, Typography, Paper, LinearProgress } from '@mui/material';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';

const SystemMetrics = ({ metrics }) => {
    if (!metrics) return null;

    const getMetricColor = (value, threshold) => {
        if (value >= threshold) return 'error';
        if (value >= threshold * 0.8) return 'warning';
        return 'success';
    };

    const formatValue = (value, unit = '') => {
        return `${value}${unit}`;
    };

    return (
        <Box>
            <Typography variant="h6" gutterBottom>
                System Metrics
            </Typography>
            <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="subtitle1" gutterBottom>
                            CPU Usage
                        </Typography>
                        <Box sx={{ mb: 1 }}>
                            <LinearProgress
                                variant="determinate"
                                value={metrics.cpuUsage}
                                color={getMetricColor(metrics.cpuUsage, 80)}
                                sx={{ height: 10, borderRadius: 5 }}
                            />
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                            {formatValue(metrics.cpuUsage, '%')}
                        </Typography>
                    </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="subtitle1" gutterBottom>
                            Memory Usage
                        </Typography>
                        <Box sx={{ mb: 1 }}>
                            <LinearProgress
                                variant="determinate"
                                value={metrics.memoryUsage}
                                color={getMetricColor(metrics.memoryUsage, 80)}
                                sx={{ height: 10, borderRadius: 5 }}
                            />
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                            {formatValue(metrics.memoryUsage, '%')}
                        </Typography>
                    </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="subtitle1" gutterBottom>
                            Disk Usage
                        </Typography>
                        <Box sx={{ mb: 1 }}>
                            <LinearProgress
                                variant="determinate"
                                value={metrics.diskUsage}
                                color={getMetricColor(metrics.diskUsage, 80)}
                                sx={{ height: 10, borderRadius: 5 }}
                            />
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                            {formatValue(metrics.diskUsage, '%')}
                        </Typography>
                    </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="subtitle1" gutterBottom>
                            Network I/O
                        </Typography>
                        <Box sx={{ mb: 1 }}>
                            <LinearProgress
                                variant="determinate"
                                value={metrics.networkIO}
                                color={getMetricColor(metrics.networkIO, 80)}
                                sx={{ height: 10, borderRadius: 5 }}
                            />
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                            {formatValue(metrics.networkIO, ' MB/s')}
                        </Typography>
                    </Paper>
                </Grid>
                <Grid item xs={12}>
                    <Paper sx={{ p: 2, height: 300 }}>
                        <Typography variant="subtitle1" gutterBottom>
                            Response Time Trend
                        </Typography>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={metrics.responseTimeHistory}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="timestamp" />
                                <YAxis />
                                <Tooltip />
                                <Area
                                    type="monotone"
                                    dataKey="value"
                                    stroke="#8884d8"
                                    fill="#8884d8"
                                    fillOpacity={0.3}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default SystemMetrics; 