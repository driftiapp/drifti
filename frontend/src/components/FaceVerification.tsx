import React, { useState, useRef, useCallback } from 'react';
import {
    Box,
    Button,
    CircularProgress,
    Typography,
    Stepper,
    Step,
    StepLabel,
    Alert,
    Dialog,
    DialogContent,
    IconButton
} from '@mui/material';
import { Camera, CameraOff, Upload, Check, AlertCircle } from 'react-feather';
import Webcam from 'react-webcam';
import axios from '../utils/axios';

interface FaceVerificationProps {
    onVerificationComplete: (result: VerificationResult) => void;
    onError: (error: string) => void;
    requiredGestures?: string[];
}

interface VerificationResult {
    verified: boolean;
    faceMatch: {
        match: boolean;
        similarity: number;
        confidence: number;
    };
    liveness: {
        isLive: boolean;
        detectedGestures: Record<string, { detected: boolean; confidence: number }>;
        confidence: number;
    };
    fraudCheck: {
        isAuthentic: boolean;
        confidence: number;
        quality: {
            brightness: number;
            sharpness: number;
        };
    };
    timestamp: string;
}

const VERIFICATION_STEPS = ['Upload ID', 'Take Selfie', 'Verify Identity'];
const GESTURE_INSTRUCTIONS = {
    blink: 'Blink your eyes slowly',
    nod: 'Nod your head up and down',
    smile: 'Smile naturally'
};

export const FaceVerification: React.FC<FaceVerificationProps> = ({
    onVerificationComplete,
    onError,
    requiredGestures = ['blink', 'nod', 'smile']
}) => {
    const [activeStep, setActiveStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [idPhoto, setIdPhoto] = useState<string | null>(null);
    const [selfie, setSelfie] = useState<string | null>(null);
    const [verificationVideo, setVerificationVideo] = useState<Blob | null>(null);
    const [cameraEnabled, setCameraEnabled] = useState(false);
    const [currentGesture, setCurrentGesture] = useState(0);
    const [gestureRecordings, setGestureRecordings] = useState<Blob[]>([]);

    const webcamRef = useRef<Webcam>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<BlobPart[]>([]);

    const handleIdUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            const reader = new FileReader();
            reader.onload = (e) => {
                setIdPhoto(e.target?.result as string);
                setActiveStep(1);
            };
            reader.readAsDataURL(event.target.files[0]);
        }
    };

    const startCamera = async () => {
        try {
            setCameraEnabled(true);
        } catch (err) {
            setError('Failed to access camera. Please check permissions.');
            onError('Camera access denied');
        }
    };

    const startRecording = useCallback(() => {
        chunksRef.current = [];
        if (webcamRef.current?.stream) {
            mediaRecorderRef.current = new MediaRecorder(webcamRef.current.stream);
            mediaRecorderRef.current.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    chunksRef.current.push(event.data);
                }
            };
            mediaRecorderRef.current.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'video/webm' });
                setGestureRecordings(prev => [...prev, blob]);
                if (currentGesture < requiredGestures.length - 1) {
                    setCurrentGesture(prev => prev + 1);
                } else {
                    // Combine all recordings
                    const finalBlob = new Blob(chunksRef.current, { type: 'video/webm' });
                    setVerificationVideo(finalBlob);
                    setActiveStep(2);
                }
            };
            mediaRecorderRef.current.start();
        }
    }, [currentGesture, requiredGestures.length]);

    const stopRecording = useCallback(() => {
        mediaRecorderRef.current?.stop();
    }, []);

    const captureSelfie = useCallback(() => {
        if (webcamRef.current) {
            const imageSrc = webcamRef.current.getScreenshot();
            setSelfie(imageSrc);
            startRecording();
        }
    }, [startRecording]);

    const verifyIdentity = async () => {
        if (!idPhoto || !selfie || !verificationVideo) return;

        setLoading(true);
        setError(null);

        try {
            // Convert base64 to blob
            const selfieBlob = await fetch(selfie).then(r => r.blob());
            const idPhotoBlob = await fetch(idPhoto).then(r => r.blob());

            // Create form data
            const formData = new FormData();
            formData.append('selfie', selfieBlob);
            formData.append('idPhoto', idPhotoBlob);
            formData.append('verificationVideo', verificationVideo);
            formData.append('requiredGestures', JSON.stringify(requiredGestures));

            const { data } = await axios.post<VerificationResult>(
                '/api/verification/verify',
                formData,
                {
                    headers: { 'Content-Type': 'multipart/form-data' }
                }
            );

            if (data.verified) {
                onVerificationComplete(data);
            } else {
                throw new Error('Verification failed');
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Verification failed';
            setError(message);
            onError(message);
        } finally {
            setLoading(false);
        }
    };

    const renderStepContent = () => {
        switch (activeStep) {
            case 0:
                return (
                    <Box sx={{ textAlign: 'center', p: 3 }}>
                        <input
                            accept="image/*"
                            style={{ display: 'none' }}
                            id="id-photo-upload"
                            type="file"
                            onChange={handleIdUpload}
                        />
                        <label htmlFor="id-photo-upload">
                            <Button
                                variant="contained"
                                component="span"
                                startIcon={<Upload />}
                            >
                                Upload ID Photo
                            </Button>
                        </label>
                        {idPhoto && (
                            <Box sx={{ mt: 2 }}>
                                <img
                                    src={idPhoto}
                                    alt="ID"
                                    style={{
                                        maxWidth: '100%',
                                        maxHeight: '200px',
                                        objectFit: 'contain'
                                    }}
                                />
                            </Box>
                        )}
                    </Box>
                );

            case 1:
                return (
                    <Box sx={{ textAlign: 'center', p: 3 }}>
                        {!cameraEnabled ? (
                            <Button
                                variant="contained"
                                onClick={startCamera}
                                startIcon={<Camera />}
                            >
                                Start Camera
                            </Button>
                        ) : (
                            <Box>
                                <Webcam
                                    ref={webcamRef}
                                    audio={false}
                                    screenshotFormat="image/jpeg"
                                    videoConstraints={{
                                        width: 720,
                                        height: 480,
                                        facingMode: 'user'
                                    }}
                                />
                                <Typography variant="h6" sx={{ mt: 2 }}>
                                    {GESTURE_INSTRUCTIONS[requiredGestures[currentGesture]]}
                                </Typography>
                                <Button
                                    variant="contained"
                                    onClick={captureSelfie}
                                    disabled={!!selfie}
                                    sx={{ mt: 2 }}
                                >
                                    Capture & Start Recording
                                </Button>
                            </Box>
                        )}
                    </Box>
                );

            case 2:
                return (
                    <Box sx={{ textAlign: 'center', p: 3 }}>
                        {loading ? (
                            <CircularProgress />
                        ) : (
                            <Button
                                variant="contained"
                                onClick={verifyIdentity}
                                startIcon={<Check />}
                            >
                                Complete Verification
                            </Button>
                        )}
                    </Box>
                );

            default:
                return null;
        }
    };

    return (
        <Dialog open maxWidth="md" fullWidth>
            <DialogContent>
                <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
                    {VERIFICATION_STEPS.map((label) => (
                        <Step key={label}>
                            <StepLabel>{label}</StepLabel>
                        </Step>
                    ))}
                </Stepper>

                {error && (
                    <Alert
                        severity="error"
                        sx={{ mb: 2 }}
                        action={
                            <IconButton
                                color="inherit"
                                size="small"
                                onClick={() => setError(null)}
                            >
                                <AlertCircle />
                            </IconButton>
                        }
                    >
                        {error}
                    </Alert>
                )}

                {renderStepContent()}
            </DialogContent>
        </Dialog>
    );
}; 