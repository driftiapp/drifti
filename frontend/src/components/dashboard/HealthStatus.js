import React from 'react';
import { Box, Grid, Typography, Chip, Tooltip } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';

const HealthStatus = ({ status }) => {
    if (!status) return null;

    const getStatusIcon = (isHealthy) => {
        if (isHealthy) {
            return <CheckCircleIcon color="success" />;
        }
        return <ErrorIcon color="error" />;
    };

    const getStatusChip = (isHealthy) => {
        return (
            <Chip
                icon={getStatusIcon(isHealthy)}
                label={isHealthy ? 'Healthy' : 'Unhealthy'}
                color={isHealthy ? 'success' : 'error'}
                size="small"
            />
        );
    };

    const components = [
        { key: 'mongodb', label: 'MongoDB' },
        { key: 'firebase', label: 'Firebase' },
        { key: 'stripe', label: 'Stripe' },
        { key: 'redis', label: 'Redis' },
        { key: 'api', label: 'API' },
        { key: 'email', label: 'Email Service' },
        { key: 'cdn', label: 'CDN' },
        { key: 'thirdParty', label: 'Third Party Services' },
        { key: 'backups', label: 'Database Backups' }
    ];

    return (
        <Box>
            <Typography variant="h6" gutterBottom>
                System Components Status
            </Typography>
            <Grid container spacing={2}>
                {components.map(({ key, label }) => (
                    <Grid item xs={12} sm={6} md={4} key={key}>
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                p: 1,
                                border: '1px solid',
                                borderColor: 'divider',
                                borderRadius: 1
                            }}
                        >
                            <Typography variant="body1">{label}</Typography>
                            <Tooltip title={status[key] ? 'Component is healthy' : 'Component is unhealthy'}>
                                {getStatusChip(status[key])}
                            </Tooltip>
                        </Box>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
};

export default HealthStatus; 