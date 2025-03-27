import React from 'react';
import { Box, Grid, Typography, Paper } from '@mui/material';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';

const AlertStats = ({ stats }) => {
    if (!stats) return null;

    const chartData = [
        { name: 'Failures', value: stats.failures },
        { name: 'Recoveries', value: stats.recoveries },
        { name: 'Warnings', value: stats.warnings }
    ];

    return (
        <Box>
            <Typography variant="h6" gutterBottom>
                Alert Statistics
            </Typography>
            <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h4" color="error">
                            {stats.failures}
                        </Typography>
                        <Typography variant="subtitle1">Failures (24h)</Typography>
                    </Paper>
                </Grid>
                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h4" color="success">
                            {stats.recoveries}
                        </Typography>
                        <Typography variant="subtitle1">Recoveries (24h)</Typography>
                    </Paper>
                </Grid>
                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h4" color="warning.main">
                            {stats.warnings}
                        </Typography>
                        <Typography variant="subtitle1">Warnings (24h)</Typography>
                    </Paper>
                </Grid>
                <Grid item xs={12}>
                    <Paper sx={{ p: 2, height: 300 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Line
                                    type="monotone"
                                    dataKey="value"
                                    stroke="#8884d8"
                                    activeDot={{ r: 8 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default AlertStats; 