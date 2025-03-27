import React, { useState, useEffect } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Grid,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    CircularProgress,
    Alert
} from '@mui/material';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';
import { format } from 'date-fns';

const ModelInsights = ({ modelInfo, data, timestamps }) => {
    const [selectedMetric, setSelectedMetric] = useState('featureImportance');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const renderFeatureImportance = () => {
        if (!modelInfo?.performance?.featureImportance) {
            return (
                <Alert severity="info">
                    Feature importance data is not available for this model.
                </Alert>
            );
        }

        const chartData = modelInfo.performance.featureImportance.map(feature => ({
            name: feature.name,
            importance: feature.importance
        }));

        return (
            <ResponsiveContainer width="100%" height={400}>
                <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                        dataKey="name"
                        angle={-45}
                        textAnchor="end"
                        height={100}
                        interval={0}
                    />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar
                        dataKey="importance"
                        fill="#8884d8"
                        name="Feature Importance"
                    />
                </BarChart>
            </ResponsiveContainer>
        );
    };

    const renderStructuralBreaks = () => {
        if (!modelInfo?.performance?.structuralBreaks?.length) {
            return (
                <Alert severity="info">
                    No structural breaks detected in this dataset.
                </Alert>
            );
        }

        const breakData = modelInfo.performance.structuralBreaks.map(breakPoint => ({
            timestamp: new Date(breakPoint.timestamp),
            type: breakPoint.type,
            magnitude: breakPoint.magnitude
        }));

        return (
            <Box>
                <Typography variant="h6" gutterBottom>
                    Detected Structural Breaks
                </Typography>
                <Grid container spacing={2}>
                    {breakData.map((breakPoint, index) => (
                        <Grid item xs={12} key={index}>
                            <Card>
                                <CardContent>
                                    <Typography variant="subtitle1">
                                        Break Point {index + 1}
                                    </Typography>
                                    <Typography>
                                        Time: {format(breakPoint.timestamp, 'PPpp')}
                                    </Typography>
                                    <Typography>
                                        Type: {breakPoint.type}
                                    </Typography>
                                    <Typography>
                                        Magnitude: {breakPoint.magnitude.toFixed(2)}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            </Box>
        );
    };

    const renderModelPerformance = () => {
        if (!modelInfo?.performance) {
            return (
                <Alert severity="info">
                    Performance metrics are not available for this model.
                </Alert>
            );
        }

        const metrics = [
            {
                name: 'Residual Mean',
                value: modelInfo.performance.residualMean.toFixed(4)
            },
            {
                name: 'Residual Std',
                value: modelInfo.performance.residualStd.toFixed(4)
            },
            {
                name: 'Cross-Validation RMSE',
                value: modelInfo.performance.crossValidationScores
                    .slice(-1)[0]?.score.toFixed(4) || 'N/A'
            }
        ];

        return (
            <Grid container spacing={2}>
                {metrics.map((metric, index) => (
                    <Grid item xs={12} sm={4} key={index}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    {metric.name}
                                </Typography>
                                <Typography variant="h4">
                                    {metric.value}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        );
    };

    const renderContent = () => {
        switch (selectedMetric) {
            case 'featureImportance':
                return renderFeatureImportance();
            case 'structuralBreaks':
                return renderStructuralBreaks();
            case 'performance':
                return renderModelPerformance();
            default:
                return null;
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
                Model Insights
            </Typography>
            
            <FormControl sx={{ mb: 3, minWidth: 200 }}>
                <InputLabel>Select Metric</InputLabel>
                <Select
                    value={selectedMetric}
                    onChange={(e) => setSelectedMetric(e.target.value)}
                    label="Select Metric"
                >
                    <MenuItem value="featureImportance">
                        Feature Importance
                    </MenuItem>
                    <MenuItem value="structuralBreaks">
                        Structural Breaks
                    </MenuItem>
                    <MenuItem value="performance">
                        Model Performance
                    </MenuItem>
                </Select>
            </FormControl>

            {loading ? (
                <Box display="flex" justifyContent="center" p={3}>
                    <CircularProgress />
                </Box>
            ) : error ? (
                <Alert severity="error">{error}</Alert>
            ) : (
                renderContent()
            )}
        </Box>
    );
};

export default ModelInsights; 