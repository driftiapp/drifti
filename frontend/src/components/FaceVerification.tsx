import React, { useState, useRef, useCallback } from 'react';
import {
    Box,
    Button,
    Typography,
    CircularProgress,
    Paper,
    IconButton
} from '@mui/material';
import { Camera, Upload, Check, AlertCircle } from 'react-feather';
import Webcam from 'react-webcam';
import axios from '../utils/axios';

interface FaceVerificationProps {
    onVerificationComplete: (result: { success: boolean; message: string }) => void;
    onError: (error: Error) => void;
    requiredGestures?: Array<'blink' | 'nod' | 'smile'>;
}

const VERIFICATION_STEPS = ['Upload ID', 'Take Selfie', 'Verify Identity'] as const;

type GestureType = 'blink' | 'nod' | 'smile';

const GESTURE_INSTRUCTIONS: Record<GestureType, string> = {
    blink: 'Blink your eyes slowly',
    nod: 'Nod your head up and down',
    smile: 'Smile naturally'
};

export const FaceVerification: React.FC<FaceVerificationProps> = ({
    onVerificationComplete,
    onError,
    requiredGestures = ['blink', 'nod', 'smile']
}) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [idImage, setIdImage] = useState<string | null>(null);
    const [selfieImage, setSelfieImage] = useState<string | null>(null);
    const [currentGesture, setCurrentGesture] = useState(0);
    const [verificationStatus, setVerificationStatus] = useState<'pending' | 'success' | 'error'>('pending');
    const webcamRef = useRef<Webcam>(null);
    const [isCameraOn, setIsCameraOn] = useState(false);

    const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            setIsLoading(true);
            setError(null);

            const formData = new FormData();
            formData.append('file', file);

            const response = await axios.post('/api/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            if (currentStep === 0) {
                setIdImage(response.data.url);
            } else if (currentStep === 1) {
                setSelfieImage(response.data.url);
            }

            setCurrentStep(prev => prev + 1);
        } catch (err) {
            setError('Failed to upload file. Please try again.');
            onError(err instanceof Error ? err : new Error('Upload failed'));
        } finally {
            setIsLoading(false);
        }
    }, [currentStep, onError]);

    const handleCameraCapture = useCallback(async () => {
        if (!webcamRef.current) return;

        try {
            setIsLoading(true);
            setError(null);

            const imageSrc = webcamRef.current.getScreenshot();
            if (!imageSrc) throw new Error('Failed to capture image');

            const response = await fetch(imageSrc);
            const blob = await response.blob();
            const file = new File([blob], 'selfie.jpg', { type: 'image/jpeg' });

            const formData = new FormData();
            formData.append('file', file);

            const uploadResponse = await axios.post('/api/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            setSelfieImage(uploadResponse.data.url);
            setCurrentStep(prev => prev + 1);
            setIsCameraOn(false);
        } catch (err) {
            setError('Failed to capture image. Please try again.');
            onError(err instanceof Error ? err : new Error('Capture failed'));
        } finally {
            setIsLoading(false);
        }
    }, [onError]);

    const handleVerification = useCallback(async () => {
        if (!idImage || !selfieImage) return;

        try {
            setIsLoading(true);
            setError(null);

            const response = await axios.post('/api/verify', {
                idImage,
                selfieImage,
                gestures: requiredGestures
            });

            if (response.data.success) {
                setVerificationStatus('success');
                onVerificationComplete({
                    success: true,
                    message: 'Verification completed successfully'
                });
            } else {
                setVerificationStatus('error');
                setError(response.data.message || 'Verification failed');
                onError(new Error(response.data.message || 'Verification failed'));
            }
        } catch (err) {
            setVerificationStatus('error');
            setError('Verification failed. Please try again.');
            onError(err instanceof Error ? err : new Error('Verification failed'));
        } finally {
            setIsLoading(false);
        }
    }, [idImage, selfieImage, requiredGestures, onVerificationComplete, onError]);

    const handleGestureComplete = useCallback(() => {
        if (currentGesture < requiredGestures.length - 1) {
            setCurrentGesture(prev => prev + 1);
        } else {
            handleVerification();
        }
    }, [currentGesture, requiredGestures.length, handleVerification]);

    const renderStepContent = () => {
        switch (currentStep) {
            case 0:
                return (
                    <Box sx={{ textAlign: 'center' }}>
                        <input
                            accept="image/*"
                            style={{ display: 'none' }}
                            id="id-upload"
                            type="file"
                            onChange={handleFileUpload}
                        />
                        <label htmlFor="id-upload">
                            <Button
                                variant="contained"
                                component="span"
                                startIcon={<Upload />}
                                disabled={isLoading}
                            >
                                Upload ID
                            </Button>
                        </label>
                        {idImage && (
                            <Box sx={{ mt: 2 }}>
                                <img
                                    src={idImage}
                                    alt="ID"
                                    style={{ maxWidth: '100%', maxHeight: '300px' }}
                                />
                                <Button
                                    variant="contained"
                                    color="primary"
                                    onClick={() => setCurrentStep(prev => prev + 1)}
                                    sx={{ mt: 2 }}
                                >
                                    Next
                                </Button>
                            </Box>
                        )}
                    </Box>
                );

            case 1:
                return (
                    <Box sx={{ textAlign: 'center' }}>
                        {!isCameraOn ? (
                            <>
                                <input
                                    accept="image/*"
                                    style={{ display: 'none' }}
                                    id="selfie-upload"
                                    type="file"
                                    onChange={handleFileUpload}
                                />
                                <label htmlFor="selfie-upload">
                                    <Button
                                        variant="contained"
                                        component="span"
                                        startIcon={<Upload />}
                                        disabled={isLoading}
                                    >
                                        Upload Selfie
                                    </Button>
                                </label>
                                <Button
                                    variant="outlined"
                                    startIcon={<Camera />}
                                    onClick={() => setIsCameraOn(true)}
                                    sx={{ ml: 2 }}
                                >
                                    Take Photo
                                </Button>
                            </>
                        ) : (
                            <Box>
                                <Webcam
                                    ref={webcamRef}
                                    screenshotFormat="image/jpeg"
                                    style={{ maxWidth: '100%', maxHeight: '300px' }}
                                />
                                <Box sx={{ mt: 2 }}>
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        onClick={handleCameraCapture}
                                        disabled={isLoading}
                                    >
                                        Capture
                                    </Button>
                                    <IconButton
                                        onClick={() => setIsCameraOn(false)}
                                        sx={{ ml: 2 }}
                                    >
                                        <Camera />
                                    </IconButton>
                                </Box>
                            </Box>
                        )}
                        {selfieImage && (
                            <Box sx={{ mt: 2 }}>
                                <img
                                    src={selfieImage}
                                    alt="Selfie"
                                    style={{ maxWidth: '100%', maxHeight: '300px' }}
                                />
                                <Button
                                    variant="contained"
                                    color="primary"
                                    onClick={() => setCurrentStep(prev => prev + 1)}
                                    sx={{ mt: 2 }}
                                >
                                    Next
                                </Button>
                            </Box>
                        )}
                    </Box>
                );

            case 2:
                return (
                    <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h6" gutterBottom>
                            Perform the following gesture:
                        </Typography>
                        <Typography variant="h6" sx={{ mt: 2 }}>
                            {GESTURE_INSTRUCTIONS[requiredGestures[currentGesture]]}
                        </Typography>
                        <Box sx={{ mt: 4 }}>
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={handleGestureComplete}
                                disabled={isLoading}
                            >
                                Gesture Complete
                            </Button>
                        </Box>
                    </Box>
                );

            default:
                return null;
        }
    };

    return (
        <Paper elevation={3} sx={{ p: 4, maxWidth: 600, mx: 'auto' }}>
            <Typography variant="h5" gutterBottom>
                Face Verification
            </Typography>

            {/* Progress Steps */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
                {VERIFICATION_STEPS.map((step, index) => (
                    <Box
                        key={step}
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            flex: 1
                        }}
                    >
                        <Box
                            sx={{
                                width: 40,
                                height: 40,
                                borderRadius: '50%',
                                bgcolor: index <= currentStep ? 'primary.main' : 'grey.300',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                mb: 1
                            }}
                        >
                            {index + 1}
                        </Box>
                        <Typography variant="caption">{step}</Typography>
                    </Box>
                ))}
            </Box>

            {/* Step Content */}
            <Box sx={{ minHeight: 300 }}>
                {isLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                        <CircularProgress />
                    </Box>
                ) : error ? (
                    <Box sx={{ textAlign: 'center', color: 'error.main' }}>
                        <AlertCircle size={48} style={{ margin: '0 auto 16px' }} />
                        <Typography>{error}</Typography>
                    </Box>
                ) : verificationStatus === 'success' ? (
                    <Box sx={{ textAlign: 'center', color: 'success.main' }}>
                        <Check size={48} style={{ margin: '0 auto 16px' }} />
                        <Typography>Verification completed successfully!</Typography>
                    </Box>
                ) : (
                    renderStepContent()
                )}
            </Box>
        </Paper>
    );
}; 