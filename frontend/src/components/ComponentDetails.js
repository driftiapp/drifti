import React, { useState, useEffect } from 'react';
import {
    Box,
    Grid,
    Typography,
    Paper,
    CircularProgress,
    Alert,
    Tabs,
    Tab,
    Divider
} from '@mui/material';
import ModelInsights from './ModelInsights';
import TimeSeriesChart from './TimeSeriesChart';
import ModelComparison from './ModelComparison';
import AdaptiveModelView from './AdaptiveModelView';
import { useParams } from 'react-router-dom';
import { fetchComponentData } from '../utils/api';

const ComponentDetails = () => {
    const { componentId } = useParams();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [data, setData] = useState(null);
    const [timestamps, setTimestamps] = useState([]);
    const [modelInfo, setModelInfo] = useState(null);
    const [selectedTab, setSelectedTab] = useState(0);

    useEffect(() => {
        const loadComponentData = async () => {
            try {
                setLoading(true);
                const response = await fetchComponentData(componentId);
                setData(response.data);
                setTimestamps(response.timestamps);
                setModelInfo(response.modelInfo);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        loadComponentData();
    }, [componentId]);

    const handleTabChange = (event, newValue) => {
        setSelectedTab(newValue);
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box p={3}>
                <Alert severity="error">{error}</Alert>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
                Component Details
            </Typography>
            
            <Paper sx={{ mb: 3 }}>
                <Tabs
                    value={selectedTab}
                    onChange={handleTabChange}
                    indicatorColor="primary"
                    textColor="primary"
                    variant="fullWidth"
                >
                    <Tab label="Time Series" />
                    <Tab label="Model Insights" />
                    <Tab label="Model Comparison" />
                    <Tab label="Adaptive Model" />
                </Tabs>
                
                <Divider />
                
                <Box sx={{ p: 3 }}>
                    {selectedTab === 0 && (
                        <TimeSeriesChart
                            data={data}
                            timestamps={timestamps}
                            modelInfo={modelInfo}
                        />
                    )}
                    
                    {selectedTab === 1 && (
                        <ModelInsights
                            modelInfo={modelInfo}
                            data={data}
                            timestamps={timestamps}
                        />
                    )}
                    
                    {selectedTab === 2 && (
                        <ModelComparison
                            modelInfo={modelInfo}
                            data={data}
                            timestamps={timestamps}
                        />
                    )}

                    {selectedTab === 3 && (
                        <AdaptiveModelView
                            modelInfo={modelInfo}
                            data={data}
                            timestamps={timestamps}
                        />
                    )}
                </Box>
            </Paper>
        </Box>
    );
};

export default ComponentDetails; 