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
    Alert,
    Chip,
    Tooltip,
    Divider
} from '@mui/material';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    Legend,
    ResponsiveContainer,
    ReferenceLine,
    BarChart,
    Bar
} from 'recharts';
import { format, differenceInHours } from 'date-fns';

const AdaptiveModelView = ({ modelInfo, data, timestamps }) => {
    const [selectedView, setSelectedView] = useState('performance');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const renderPerformanceHistory = () => {
        if (!modelInfo?.performanceHistory?.length) {
            return (
                <Alert severity="info">
                    No performance history available for this model.
                </Alert>
            );
        }

        const chartData = modelInfo.performanceHistory.map(record => ({
            timestamp: new Date(record.timestamp),
            error: record.error,
            prediction: record.prediction,
            actual: record.actual
        }));

        return (
            <Box>
                <Typography variant="h6" gutterBottom>
                    Model Performance History
                </Typography>
                <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                            dataKey="timestamp"
                            tickFormatter={(value) => format(new Date(value), 'PPp')}
                        />
                        <YAxis />
                        <RechartsTooltip
                            labelFormatter={(value) => format(new Date(value), 'PPpp')}
                        />
                        <Legend />
                        <Line
                            type="monotone"
                            dataKey="error"
                            stroke="#ff4444"
                            name="Error"
                        />
                        <Line
                            type="monotone"
                            dataKey="prediction"
                            stroke="#8884d8"
                            name="Prediction"
                        />
                        <Line
                            type="monotone"
                            dataKey="actual"
                            stroke="#82ca9d"
                            name="Actual"
                        />
                    </LineChart>
                </ResponsiveContainer>
            </Box>
        );
    };

    const renderBreakPoints = () => {
        if (!modelInfo?.breakPoints?.length) {
            return (
                <Alert severity="info">
                    No structural breaks detected in this dataset.
                </Alert>
            );
        }

        const chartData = data.map((value, index) => ({
            timestamp: new Date(timestamps[index]),
            value
        }));

        return (
            <Box>
                <Typography variant="h6" gutterBottom>
                    Structural Breaks
                </Typography>
                <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                            dataKey="timestamp"
                            tickFormatter={(value) => format(new Date(value), 'PPp')}
                        />
                        <YAxis />
                        <RechartsTooltip
                            labelFormatter={(value) => format(new Date(value), 'PPpp')}
                        />
                        <Legend />
                        <Line
                            type="monotone"
                            dataKey="value"
                            stroke="#8884d8"
                            name="Time Series"
                        />
                        {modelInfo.breakPoints.map((breakPoint, index) => (
                            <ReferenceLine
                                key={index}
                                x={breakPoint.timestamp}
                                stroke="#ff4444"
                                strokeDasharray="3 3"
                                label={{
                                    value: `Break ${index + 1}`,
                                    position: 'top',
                                    fill: '#ff4444'
                                }}
                            />
                        ))}
                    </LineChart>
                </ResponsiveContainer>
                
                <Grid container spacing={2} sx={{ mt: 2 }}>
                    {modelInfo.breakPoints.map((breakPoint, index) => (
                        <Grid item xs={12} sm={6} md={4} key={index}>
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

    const renderModelStatus = () => {
        if (!modelInfo) {
            return (
                <Alert severity="info">
                    Model status information is not available.
                </Alert>
            );
        }

        const hoursSinceRetrain = modelInfo.lastRetrainTime
            ? differenceInHours(new Date(), new Date(modelInfo.lastRetrainTime))
            : null;

        return (
            <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Model Status
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <Typography>Active Models:</Typography>
                                <Chip
                                    label={modelInfo.modelCount}
                                    color="primary"
                                    size="small"
                                />
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography>Last Retrain:</Typography>
                                <Tooltip title={format(new Date(modelInfo.lastRetrainTime), 'PPpp')}>
                                    <Chip
                                        label={`${hoursSinceRetrain}h ago`}
                                        color={hoursSinceRetrain > 24 ? 'error' : 'success'}
                                        size="small"
                                    />
                                </Tooltip>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
                
                <Grid item xs={12} md={8}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Feature Importance
                            </Typography>
                            <Grid container spacing={1}>
                                {modelInfo.featureImportance?.slice(0, 5).map((feature, index) => (
                                    <Grid item key={index}>
                                        <Tooltip title={`Importance: ${feature.importance.toFixed(4)}`}>
                                            <Chip
                                                label={feature.name}
                                                color="primary"
                                                variant="outlined"
                                            />
                                        </Tooltip>
                                    </Grid>
                                ))}
                            </Grid>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        );
    };

    const renderModelSelection = () => {
        if (!modelInfo?.models?.length) {
            return (
                <Alert severity="info">
                    No model selection information available.
                </Alert>
            );
        }

        return (
            <Box>
                <Typography variant="h6" gutterBottom>
                    Model Selection & Configuration
                </Typography>
                <Grid container spacing={2}>
                    {modelInfo.models.map((model, index) => (
                        <Grid item xs={12} md={6} key={index}>
                            <Card>
                                <CardContent>
                                    <Typography variant="subtitle1" gutterBottom>
                                        Segment {index + 1}
                                    </Typography>
                                    <Typography variant="body2" color="textSecondary">
                                        Start: {format(model.timestamp, 'PPpp')}
                                    </Typography>
                                    
                                    <Box sx={{ mt: 2 }}>
                                        <Typography variant="subtitle2">
                                            Model Configuration
                                        </Typography>
                                        <pre style={{ 
                                            backgroundColor: '#f5f5f5', 
                                            padding: '8px', 
                                            borderRadius: '4px',
                                            fontSize: '0.875rem',
                                            overflow: 'auto'
                                        }}>
                                            {JSON.stringify(model.config, null, 2)}
                                        </pre>
                                    </Box>
                                    
                                    <Box sx={{ mt: 2 }}>
                                        <Typography variant="subtitle2">
                                            Performance Metrics
                                        </Typography>
                                        <Grid container spacing={1}>
                                            <Grid item xs={4}>
                                                <Typography variant="body2">
                                                    RMSE: {model.metrics.rmse.toFixed(4)}
                                                </Typography>
                                            </Grid>
                                            <Grid item xs={4}>
                                                <Typography variant="body2">
                                                    MAE: {model.metrics.mae.toFixed(4)}
                                                </Typography>
                                            </Grid>
                                            <Grid item xs={4}>
                                                <Typography variant="body2">
                                                    MAPE: {model.metrics.mape.toFixed(2)}%
                                                </Typography>
                                            </Grid>
                                        </Grid>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            </Box>
        );
    };

    const renderFeatureImportanceTrend = () => {
        if (!modelInfo?.performanceHistory?.length) {
            return (
                <Alert severity="info">
                    No feature importance history available.
                </Alert>
            );
        }

        const featureData = modelInfo.performanceHistory.map(record => ({
            timestamp: new Date(record.timestamp),
            ...record.featureImportance.reduce((acc, feature) => ({
                ...acc,
                [feature.name]: feature.importance
            }), {})
        }));

        const features = modelInfo.featureImportance
            .slice(0, 5)
            .map(feature => feature.name);

        return (
            <Box>
                <Typography variant="h6" gutterBottom>
                    Feature Importance Trends
                </Typography>
                <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={featureData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                            dataKey="timestamp"
                            tickFormatter={(value) => format(new Date(value), 'PPp')}
                        />
                        <YAxis />
                        <RechartsTooltip
                            labelFormatter={(value) => format(new Date(value), 'PPpp')}
                        />
                        <Legend />
                        {features.map((feature, index) => (
                            <Line
                                key={feature}
                                type="monotone"
                                dataKey={feature}
                                stroke={`hsl(${index * 72}, 70%, 50%)`}
                                name={feature}
                            />
                        ))}
                    </LineChart>
                </ResponsiveContainer>
            </Box>
        );
    };

    const renderOptimizationHistory = () => {
        if (!modelInfo?.models?.length) {
            return (
                <Alert severity="info">
                    No optimization history available.
                </Alert>
            );
        }

        return (
            <Box>
                <Typography variant="h6" gutterBottom>
                    Hyperparameter Optimization History
                </Typography>
                <Grid container spacing={2}>
                    {modelInfo.models.map((model, index) => (
                        <Grid item xs={12} key={index}>
                            <Card>
                                <CardContent>
                                    <Typography variant="subtitle1" gutterBottom>
                                        Segment {index + 1}
                                    </Typography>
                                    
                                    <Box sx={{ mt: 2 }}>
                                        <Typography variant="subtitle2">
                                            Optimization Progress
                                        </Typography>
                                        <ResponsiveContainer width="100%" height={300}>
                                            <LineChart data={model.optimizationHistory}>
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis
                                                    dataKey="index"
                                                    label={{ value: 'Iteration', position: 'bottom' }}
                                                />
                                                <YAxis
                                                    label={{ value: 'RMSE', angle: -90, position: 'insideLeft' }}
                                                />
                                                <RechartsTooltip
                                                    labelFormatter={(value) => `Iteration ${value + 1}`}
                                                    formatter={(value) => [value.toFixed(4), 'RMSE']}
                                                />
                                                <Legend />
                                                <Line
                                                    type="monotone"
                                                    dataKey="value"
                                                    stroke="#8884d8"
                                                    name="RMSE"
                                                />
                                                <ReferenceLine
                                                    y={model.metrics.rmse}
                                                    stroke="#ff4444"
                                                    strokeDasharray="3 3"
                                                    label={{
                                                        value: 'Final RMSE',
                                                        position: 'right',
                                                        fill: '#ff4444'
                                                    }}
                                                />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </Box>
                                    
                                    <Box sx={{ mt: 2 }}>
                                        <Typography variant="subtitle2">
                                            Best Parameters
                                        </Typography>
                                        <pre style={{ 
                                            backgroundColor: '#f5f5f5', 
                                            padding: '8px', 
                                            borderRadius: '4px',
                                            fontSize: '0.875rem',
                                            overflow: 'auto'
                                        }}>
                                            {JSON.stringify(model.config, null, 2)}
                                        </pre>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            </Box>
        );
    };

    const renderContent = () => {
        switch (selectedView) {
            case 'performance':
                return renderPerformanceHistory();
            case 'breaks':
                return renderBreakPoints();
            case 'status':
                return renderModelStatus();
            case 'selection':
                return renderModelSelection();
            case 'features':
                return renderFeatureImportanceTrend();
            case 'optimization':
                return renderOptimizationHistory();
            default:
                return null;
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
                Adaptive Model Analysis
            </Typography>
            
            <FormControl sx={{ mb: 3, minWidth: 200 }}>
                <InputLabel>Select View</InputLabel>
                <Select
                    value={selectedView}
                    onChange={(e) => setSelectedView(e.target.value)}
                    label="Select View"
                >
                    <MenuItem value="performance">
                        Performance History
                    </MenuItem>
                    <MenuItem value="breaks">
                        Structural Breaks
                    </MenuItem>
                    <MenuItem value="status">
                        Model Status
                    </MenuItem>
                    <MenuItem value="selection">
                        Model Selection
                    </MenuItem>
                    <MenuItem value="features">
                        Feature Trends
                    </MenuItem>
                    <MenuItem value="optimization">
                        Optimization History
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

export default AdaptiveModelView; 