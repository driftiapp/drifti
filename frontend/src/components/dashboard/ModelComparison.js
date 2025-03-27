import React, { useState } from 'react';
import {
    Box,
    Paper,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    Tabs,
    Tab,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Grid,
    Tooltip
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
    ScatterChart,
    Scatter,
    BarChart,
    Bar
} from 'recharts';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import InfoIcon from '@mui/icons-material/Info';

const ModelComparison = ({ metricKey, metricSettings, data }) => {
    const [activeTab, setActiveTab] = useState(0);
    const modelPerformance = metricSettings[metricKey]?.model?.params?.performance || {};
    const forecast = metricSettings[metricKey]?.forecast;
    const crossValidationScores = modelPerformance.crossValidationScores || [];
    const bestParams = modelPerformance.bestParams || {};

    const formatMetric = (value) => {
        return typeof value === 'number' ? value.toFixed(4) : 'N/A';
    };

    const getModelColor = (modelType) => {
        switch (modelType) {
            case 'arima':
                return '#2196f3';
            case 'hybrid':
                return '#4caf50';
            case 'prophet':
                return '#ff9800';
            default:
                return '#9e9e9e';
        }
    };

    const prepareChartData = () => {
        if (!data || !forecast) return [];

        // Get last 48 actual data points
        const actualData = data.slice(-48).map(d => ({
            timestamp: new Date(d.timestamp).toLocaleString(),
            actual: d[metricKey],
            lower: null,
            upper: null
        }));

        // Add forecast data with confidence intervals
        const forecastData = forecast.timestamp.map((ts, i) => {
            const value = forecast.forecast[i];
            const std = modelPerformance.residualStd || 0;
            return {
                timestamp: new Date(ts).toLocaleString(),
                forecast: value,
                lower: value - 1.96 * std,
                upper: value + 1.96 * std
            };
        });

        return [...actualData, ...forecastData];
    };

    const prepareCrossValidationData = () => {
        return crossValidationScores.map((cv, index) => ({
            fold: `Fold ${index + 1}`,
            rmse: cv.score,
            params: JSON.stringify(cv.params)
        }));
    };

    const prepareResidualPlot = () => {
        if (!forecast || !data) return [];

        const actualValues = data.slice(-forecast.forecast.length).map(d => d[metricKey]);
        return forecast.forecast.map((pred, i) => ({
            predicted: pred,
            residual: actualValues[i] - pred
        }));
    };

    const renderPerformanceMetrics = () => (
        <TableContainer>
            <Table size="small">
                <TableHead>
                    <TableRow>
                        <TableCell>Metric</TableCell>
                        <TableCell align="right">Value</TableCell>
                        <TableCell align="right">
                            <Tooltip title="Click for more information">
                                <InfoIcon fontSize="small" />
                            </Tooltip>
                        </TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    <TableRow>
                        <TableCell>RMSE</TableCell>
                        <TableCell align="right">{formatMetric(modelPerformance.rmse)}</TableCell>
                        <TableCell align="right">
                            <Tooltip title="Root Mean Square Error - Lower is better">
                                <InfoIcon fontSize="small" />
                            </Tooltip>
                        </TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell>MAE</TableCell>
                        <TableCell align="right">{formatMetric(modelPerformance.mae)}</TableCell>
                        <TableCell align="right">
                            <Tooltip title="Mean Absolute Error - Lower is better">
                                <InfoIcon fontSize="small" />
                            </Tooltip>
                        </TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell>MAPE</TableCell>
                        <TableCell align="right">{formatMetric(modelPerformance.mape)}%</TableCell>
                        <TableCell align="right">
                            <Tooltip title="Mean Absolute Percentage Error - Lower is better">
                                <InfoIcon fontSize="small" />
                            </Tooltip>
                        </TableCell>
                    </TableRow>
                    {metricSettings[metricKey]?.model?.type === 'hybrid' && (
                        <>
                            <TableRow>
                                <TableCell>Residual Mean</TableCell>
                                <TableCell align="right">
                                    {formatMetric(modelPerformance.residualMean)}
                                </TableCell>
                                <TableCell align="right">
                                    <Tooltip title="Average prediction error - Closer to 0 is better">
                                        <InfoIcon fontSize="small" />
                                    </Tooltip>
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell>Residual Std</TableCell>
                                <TableCell align="right">
                                    {formatMetric(modelPerformance.residualStd)}
                                </TableCell>
                                <TableCell align="right">
                                    <Tooltip title="Standard deviation of prediction errors">
                                        <InfoIcon fontSize="small" />
                                    </Tooltip>
                                </TableCell>
                            </TableRow>
                        </>
                    )}
                </TableBody>
            </Table>
        </TableContainer>
    );

    const renderForecastPlot = () => (
        <ResponsiveContainer width="100%" height={300}>
            <LineChart data={prepareChartData()} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                    dataKey="timestamp"
                    angle={-45}
                    textAnchor="end"
                    height={70}
                    tick={{ fontSize: 12 }}
                />
                <YAxis />
                <RechartsTooltip />
                <Legend />
                <Line
                    type="monotone"
                    dataKey="actual"
                    stroke="#8884d8"
                    name="Actual"
                    dot={false}
                />
                <Line
                    type="monotone"
                    dataKey="forecast"
                    stroke={getModelColor(metricSettings[metricKey]?.model?.type)}
                    strokeDasharray="5 5"
                    name="Forecast"
                    dot={false}
                />
                <Line
                    type="monotone"
                    dataKey="upper"
                    stroke="#ff9800"
                    strokeDasharray="3 3"
                    name="95% CI Upper"
                    dot={false}
                />
                <Line
                    type="monotone"
                    dataKey="lower"
                    stroke="#ff9800"
                    strokeDasharray="3 3"
                    name="95% CI Lower"
                    dot={false}
                />
            </LineChart>
        </ResponsiveContainer>
    );

    const renderResidualPlot = () => (
        <ResponsiveContainer width="100%" height={300}>
            <ScatterChart margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                    dataKey="predicted"
                    name="Predicted Values"
                    label={{ value: 'Predicted Values', position: 'bottom' }}
                />
                <YAxis
                    dataKey="residual"
                    name="Residuals"
                    label={{ value: 'Residuals', angle: -90, position: 'left' }}
                />
                <RechartsTooltip cursor={{ strokeDasharray: '3 3' }} />
                <Scatter name="Residuals" data={prepareResidualPlot()} fill="#8884d8" />
            </ScatterChart>
        </ResponsiveContainer>
    );

    const renderCrossValidationPlot = () => (
        <ResponsiveContainer width="100%" height={300}>
            <BarChart data={prepareCrossValidationData()} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="fold" />
                <YAxis />
                <RechartsTooltip />
                <Bar dataKey="rmse" fill="#8884d8" name="RMSE" />
            </BarChart>
        </ResponsiveContainer>
    );

    return (
        <Box sx={{ mt: 3 }}>
            <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                    Model Performance Analysis
                </Typography>

                <Tabs
                    value={activeTab}
                    onChange={(e, newValue) => setActiveTab(newValue)}
                    sx={{ mb: 2 }}
                >
                    <Tab label="Overview" />
                    <Tab label="Diagnostics" />
                    <Tab label="Cross Validation" />
                </Tabs>

                {activeTab === 0 && (
                    <>
                        {renderPerformanceMetrics()}
                        <Box sx={{ mt: 3 }}>
                            <Typography variant="subtitle1" gutterBottom>
                                Forecast with Confidence Intervals
                            </Typography>
                            {renderForecastPlot()}
                        </Box>
                    </>
                )}

                {activeTab === 1 && (
                    <>
                        <Typography variant="subtitle1" gutterBottom>
                            Residual Analysis
                        </Typography>
                        {renderResidualPlot()}
                        
                        <Accordion sx={{ mt: 2 }}>
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                <Typography>Model Parameters</Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Grid container spacing={2}>
                                    {bestParams.arima && (
                                        <Grid item xs={12} md={6}>
                                            <Typography variant="subtitle2">ARIMA Parameters</Typography>
                                            <TableContainer>
                                                <Table size="small">
                                                    <TableBody>
                                                        {Object.entries(bestParams.arima).map(([key, value]) => (
                                                            <TableRow key={key}>
                                                                <TableCell>{key}</TableCell>
                                                                <TableCell align="right">{value}</TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </TableContainer>
                                        </Grid>
                                    )}
                                    {bestParams.xgb && (
                                        <Grid item xs={12} md={6}>
                                            <Typography variant="subtitle2">XGBoost Parameters</Typography>
                                            <TableContainer>
                                                <Table size="small">
                                                    <TableBody>
                                                        {Object.entries(bestParams.xgb).map(([key, value]) => (
                                                            <TableRow key={key}>
                                                                <TableCell>{key}</TableCell>
                                                                <TableCell align="right">{value}</TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </TableContainer>
                                        </Grid>
                                    )}
                                </Grid>
                            </AccordionDetails>
                        </Accordion>
                    </>
                )}

                {activeTab === 2 && (
                    <>
                        <Typography variant="subtitle1" gutterBottom>
                            Cross Validation Results
                        </Typography>
                        {renderCrossValidationPlot()}
                        
                        <TableContainer sx={{ mt: 2 }}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Fold</TableCell>
                                        <TableCell>RMSE</TableCell>
                                        <TableCell>Parameters</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {prepareCrossValidationData().map((row, index) => (
                                        <TableRow key={index}>
                                            <TableCell>{row.fold}</TableCell>
                                            <TableCell>{formatMetric(row.rmse)}</TableCell>
                                            <TableCell>
                                                <Tooltip title={row.params}>
                                                    <InfoIcon fontSize="small" />
                                                </Tooltip>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </>
                )}

                <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                        Model Type:{' '}
                        <Chip
                            label={metricSettings[metricKey]?.model?.type || 'None'}
                            size="small"
                            color="primary"
                        />
                    </Typography>
                </Box>
            </Paper>
        </Box>
    );
};

export default ModelComparison; 