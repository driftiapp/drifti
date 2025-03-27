import React, { useState, useEffect } from 'react';
import { HybridTimeSeriesModel } from '../../utils/hybridModel';
import ModelComparison from './ModelComparison';

const handleModelDiagnostics = (metricKey) => {
    const data = metrics?.data || [];
    const model = metricSettings[metricKey]?.model;
    
    if (!model) return;
    
    const diagnostics = calculateModelDiagnostics(data, model.params);
    
    setMetricSettings(prev => ({
        ...prev,
        [metricKey]: {
            ...prev[metricKey],
            modelDiagnostics: diagnostics
        }
    }));
};

const ComponentDetails = ({ componentId }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const modelOptions = [
        { value: 'arima', label: 'ARIMA' },
        { value: 'hybrid', label: 'ARIMA + XGBoost' },
        { value: 'prophet', label: 'Prophet' }
    ];

    const handleModelChange = async (metricKey, modelType) => {
        setLoading(true);
        try {
            let model;
            const data = metrics?.data || [];
            const timestamps = data.map(d => d.timestamp);
            const values = data.map(d => d[metricKey]);

            switch (modelType) {
                case 'hybrid':
                    model = new HybridTimeSeriesModel();
                    await model.fit(values, timestamps);
                    break;
                // ... existing cases ...
            }

            setMetricSettings(prev => ({
                ...prev,
                [metricKey]: {
                    ...prev[metricKey],
                    model: {
                        type: modelType,
                        instance: model,
                        params: model.getModelInfo()
                    }
                }
            }));

            // Generate forecast
            const forecast = await generateForecast(data, metricKey, model);
            
            setMetricSettings(prev => ({
                ...prev,
                [metricKey]: {
                    ...prev[metricKey],
                    forecast
                }
            }));

        } catch (error) {
            console.error('Error training model:', error);
            setError('Failed to train model. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const generateForecast = async (data, metricKey, model) => {
        const forecastSteps = 24; // 24 hours ahead
        const lastTimestamp = data[data.length - 1].timestamp;
        const lastData = data.slice(-10).map(d => d[metricKey]); // Last 10 points for context

        let forecast;
        if (model instanceof HybridTimeSeriesModel) {
            forecast = await model.predict(forecastSteps, lastData, lastTimestamp);
        } else {
            // ... existing forecast generation logic ...
        }

        return {
            timestamp: Array.from({ length: forecastSteps }, (_, i) => {
                const date = new Date(lastTimestamp);
                date.setHours(date.getHours() + i + 1);
                return date.toISOString();
            }),
            forecast
        };
    };

    const renderModelDiagnostics = (metricKey) => {
        if (!metricSettings[metricKey]?.model) {
            return null;
        }

        return (
            <ModelComparison
                key={metricKey}
                metricKey={metricKey}
                metricSettings={metricSettings}
                data={metrics?.data || []}
            />
        );
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box>
            <Paper sx={{ p: 2 }}>
                <FormGroup>
                    <Box>
                        {selectedMetrics.map(metric => (
                            <Box key={metric.key}>
                                <TextField
                                    size="small"
                                    variant="outlined"
                                    label="Color"
                                    type="color"
                                    value={metricSettings[metric.key].color}
                                    onChange={(e) => handleCustomColorChange(metric.key, e.target.value)}
                                    sx={{ width: 60 }}
                                />
                                <FormControl sx={{ ml: 2, minWidth: 120 }}>
                                    <InputLabel>Model</InputLabel>
                                    <Select
                                        value={metricSettings[metric.key]?.model?.type || ''}
                                        onChange={(e) => handleModelChange(metric.key, e.target.value)}
                                        label="Model"
                                        size="small"
                                    >
                                        {modelOptions.map(option => (
                                            <MenuItem key={option.value} value={option.value}>
                                                {option.label}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Box>
                        ))}
                    </Box>
                </FormGroup>

                <Box sx={{ height: 400, width: '100%' }}>{renderChart()}</Box>

                {selectedMetrics.map(metric => renderModelDiagnostics(metric.key))}
            </Paper>

            {activeTab === 2 && (
                <Paper sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom>
                        Alert History
                    </Typography>
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Timestamp</TableCell>
                                    <TableCell>Type</TableCell>
                                    <TableCell>Message</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {alerts.map((alert) => (
                                    <TableRow key={alert._id}>
                                        <TableCell>{format(new Date(alert.timestamp), 'MMM d, yyyy HH:mm:ss')}</TableCell>
                                        <TableCell>
                                            <Chip
                                                label={alert.type}
                                                color={alert.type === 'failure' ? 'error' : 'success'}
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell>{alert.message}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>
            )}

            <Popover
                open={Boolean(settingsAnchorEl)}
                anchorEl={settingsAnchorEl}
                onClose={handleSettingsClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                <MenuItem onClick={() => handleExportPerformanceData('csv')}>
                    <DownloadIcon sx={{ mr: 1 }} />
                    Export CSV
                </MenuItem>
                <MenuItem onClick={() => handleExportPerformanceData('pdf')}>
                    <DownloadIcon sx={{ mr: 1 }} />
                    Export PDF
                </MenuItem>
            </Popover>
        </Box>
    );
};

export default ComponentDetails;
