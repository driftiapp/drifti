import React, { useEffect, useState } from 'react';
import {
    Box,
    CircularProgress,
    Step,
    StepLabel,
    Stepper,
    Typography,
    Paper,
    Alert,
    Button,
    Chip,
    useTheme,
    LinearProgress
} from '@mui/material';
import { Check, Error, Pending, Warning } from '@mui/icons-material';
import axios from 'axios';
import { format } from 'date-fns';

interface VerificationStep {
    completed: boolean;
    status: 'pending' | 'in_progress' | 'completed' | 'failed';
    error?: string;
    completedAt?: string;
}

interface VerificationDetails {
    verificationDetails: Record<string, any>;
    retryCount: number;
    nextRetryAt?: string;
    expiresAt?: string;
    completedAt?: string;
}

interface VerificationProgressProps {
    type: 'business' | 'driver';
    onComplete?: () => void;
    onError?: (error: string) => void;
}

const VerificationProgress: React.FC<VerificationProgressProps> = ({
    type,
    onComplete,
    onError
}) => {
    const theme = useTheme();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [progress, setProgress] = useState<number>(0);
    const [status, setStatus] = useState<string>('pending');
    const [currentStep, setCurrentStep] = useState<string>('');
    const [completedSteps, setCompletedSteps] = useState<string[]>([]);
    const [details, setDetails] = useState<VerificationDetails | null>(null);
    const [stepDetails, setStepDetails] = useState<Record<string, VerificationStep>>({});

    const fetchProgress = async () => {
        try {
            const response = await axios.get('/api/verification/progress', {
                params: { type }
            });

            const {
                status,
                currentStep,
                progress: progressPercentage,
                completedSteps,
                details,
                stepDetails: steps
            } = response.data;

            setStatus(status);
            setCurrentStep(currentStep);
            setProgress(progressPercentage);
            setCompletedSteps(completedSteps);
            setDetails(details);
            setStepDetails(steps);
            setError(null);

            if (status === 'approved' && onComplete) {
                onComplete();
            }
        } catch (err: any) {
            const message = err?.response?.data?.message || 'Failed to fetch verification progress';
            setError(message);
            if (onError) onError(message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProgress();
        // Poll for updates every 10 seconds if verification is in progress
        const interval = setInterval(() => {
            if (status !== 'approved' && status !== 'rejected') {
                fetchProgress();
            }
        }, 10000);

        return () => clearInterval(interval);
    }, [type]);

    const getStepIcon = (stepStatus: string) => {
        switch (stepStatus) {
            case 'completed':
                return <Check style={{ color: theme.palette.success.main }} />;
            case 'failed':
                return <Error style={{ color: theme.palette.error.main }} />;
            case 'in_progress':
                return <CircularProgress size={20} />;
            default:
                return <Pending style={{ color: theme.palette.grey[500] }} />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'approved':
                return theme.palette.success.main;
            case 'rejected':
                return theme.palette.error.main;
            case 'manual_review':
                return theme.palette.warning.main;
            default:
                return theme.palette.info.main;
        }
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" p={4}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
            <Box mb={3}>
                <Typography variant="h6" gutterBottom>
                    {type === 'business' ? 'Business Verification' : 'Driver Verification'}
                </Typography>
                <Chip
                    label={status.replace('_', ' ').toUpperCase()}
                    sx={{
                        backgroundColor: getStatusColor(status),
                        color: 'white',
                        mb: 2
                    }}
                />
                <LinearProgress
                    variant="determinate"
                    value={progress}
                    sx={{ height: 10, borderRadius: 5 }}
                />
                <Typography variant="body2" color="textSecondary" align="right" mt={1}>
                    {progress}% Complete
                </Typography>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            <Stepper orientation="vertical">
                {Object.entries(stepDetails).map(([step, details]) => (
                    <Step key={step} completed={details.completed}>
                        <StepLabel
                            icon={getStepIcon(details.status)}
                            error={details.status === 'failed'}
                        >
                            <Typography
                                variant="subtitle1"
                                color={currentStep === step ? 'primary' : 'textPrimary'}
                                fontWeight={currentStep === step ? 'bold' : 'normal'}
                            >
                                {step.replace('_', ' ').toUpperCase()}
                            </Typography>
                            {details.error && (
                                <Typography variant="body2" color="error">
                                    {details.error}
                                </Typography>
                            )}
                            {details.completedAt && (
                                <Typography variant="caption" color="textSecondary">
                                    Completed: {format(new Date(details.completedAt), 'PPp')}
                                </Typography>
                            )}
                        </StepLabel>
                    </Step>
                ))}
            </Stepper>

            {details && (
                <Box mt={3}>
                    {details.retryCount > 0 && (
                        <Alert severity="info" sx={{ mb: 2 }}>
                            Retry attempt {details.retryCount}
                            {details.nextRetryAt && (
                                <> - Next retry available at {format(new Date(details.nextRetryAt), 'PPp')}</>
                            )}
                        </Alert>
                    )}

                    {details.expiresAt && (
                        <Alert
                            severity={
                                new Date(details.expiresAt).getTime() - Date.now() < 30 * 24 * 60 * 60 * 1000
                                    ? 'warning'
                                    : 'info'
                            }
                            sx={{ mb: 2 }}
                        >
                            Verification expires on {format(new Date(details.expiresAt), 'PPp')}
                        </Alert>
                    )}

                    {status === 'rejected' && (
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={fetchProgress}
                            sx={{ mt: 2 }}
                        >
                            Retry Verification
                        </Button>
                    )}
                </Box>
            )}
        </Paper>
    );
};

export default VerificationProgress; 