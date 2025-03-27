import React, { useState, useEffect, useRef } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box,
    CircularProgress,
    Checkbox,
    FormControlLabel,
    TextField,
    Alert
} from '@mui/material';
import { useAuth } from '../hooks/useAuth';
import { useGeolocation } from '../hooks/useGeolocation';
import axios from '../utils/axios';

interface AgreementModalProps {
    open: boolean;
    onClose: () => void;
    businessType?: string;
    onAccept: () => void;
}

interface Agreement {
    _id: string;
    type: string;
    version: string;
    content: string;
    requiredFields: string[];
}

export const AgreementModal: React.FC<AgreementModalProps> = ({
    open,
    onClose,
    businessType = 'general',
    onAccept
}) => {
    const { user } = useAuth();
    const { location } = useGeolocation();
    const contentRef = useRef<HTMLDivElement>(null);
    
    const [agreements, setAgreements] = useState<Agreement[]>([]);
    const [currentAgreementIndex, setCurrentAgreementIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [hasScrolled, setHasScrolled] = useState(false);
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [formData, setFormData] = useState<Record<string, string>>({});
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        const fetchAgreements = async () => {
            try {
                setLoading(true);
                const response = await axios.get('/api/agreements/required', {
                    params: { businessTypes: businessType }
                });
                setAgreements(response.data);
            } catch (err) {
                setError('Failed to load agreements. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        if (open) {
            fetchAgreements();
        }
    }, [open, businessType]);

    const handleScroll = () => {
        if (contentRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
            if (scrollTop + clientHeight >= scrollHeight - 10) {
                setHasScrolled(true);
            }
        }
    };

    const validateForm = () => {
        const errors: Record<string, string> = {};
        const currentAgreement = agreements[currentAgreementIndex];
        
        currentAgreement.requiredFields.forEach(field => {
            if (!formData[field]?.trim()) {
                errors[field] = 'This field is required';
            }
        });

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleAccept = async () => {
        if (!validateForm()) return;

        const currentAgreement = agreements[currentAgreementIndex];
        try {
            await axios.post(`/api/agreements/${currentAgreement._id}/accept`, {
                ipAddress: await fetch('https://api.ipify.org?format=json')
                    .then(res => res.json())
                    .then(data => data.ip),
                userAgent: navigator.userAgent,
                providedFields: formData,
                signature: `${user?.name} - ${new Date().toISOString()}`,
                metadata: {
                    deviceInfo: {
                        platform: navigator.platform,
                        language: navigator.language,
                        screenResolution: `${window.screen.width}x${window.screen.height}`
                    },
                    geoLocation: location,
                    additionalInfo: {
                        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                        acceptedAt: new Date().toISOString()
                    }
                }
            });

            if (currentAgreementIndex < agreements.length - 1) {
                setCurrentAgreementIndex(prev => prev + 1);
                setHasScrolled(false);
                setAcceptedTerms(false);
                setFormData({});
            } else {
                onAccept();
            }
        } catch (err) {
            setError('Failed to record agreement acceptance. Please try again.');
        }
    };

    const currentAgreement = agreements[currentAgreementIndex];

    if (loading) {
        return (
            <Dialog open={open} maxWidth="md" fullWidth>
                <Box sx={{ p: 4, textAlign: 'center' }}>
                    <CircularProgress />
                    <Typography sx={{ mt: 2 }}>Loading agreements...</Typography>
                </Box>
            </Dialog>
        );
    }

    return (
        <Dialog open={open} maxWidth="md" fullWidth>
            <DialogTitle>
                {currentAgreement?.type === 'general' ? 'Terms of Service' : `${businessType} Agreement`}
                <Typography variant="subtitle2" color="textSecondary">
                    Version {currentAgreement?.version}
                </Typography>
            </DialogTitle>
            
            <DialogContent>
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                
                <Box
                    ref={contentRef}
                    onScroll={handleScroll}
                    sx={{
                        maxHeight: '400px',
                        overflowY: 'auto',
                        mb: 2,
                        p: 2,
                        border: '1px solid #ddd',
                        borderRadius: 1
                    }}
                >
                    <Typography>
                        {currentAgreement?.content}
                    </Typography>
                </Box>

                {currentAgreement?.requiredFields.map(field => (
                    <TextField
                        key={field}
                        label={field.replace('_', ' ').toUpperCase()}
                        fullWidth
                        margin="normal"
                        value={formData[field] || ''}
                        onChange={(e) => setFormData(prev => ({
                            ...prev,
                            [field]: e.target.value
                        }))}
                        error={!!formErrors[field]}
                        helperText={formErrors[field]}
                    />
                ))}

                <FormControlLabel
                    control={
                        <Checkbox
                            checked={acceptedTerms}
                            onChange={(e) => setAcceptedTerms(e.target.checked)}
                            disabled={!hasScrolled}
                        />
                    }
                    label="I have read and agree to these terms"
                />
            </DialogContent>

            <DialogActions>
                <Button onClick={onClose} color="inherit">
                    Cancel
                </Button>
                <Button
                    onClick={handleAccept}
                    variant="contained"
                    disabled={!acceptedTerms || !hasScrolled}
                >
                    Accept & Continue
                </Button>
            </DialogActions>
        </Dialog>
    );
}; 