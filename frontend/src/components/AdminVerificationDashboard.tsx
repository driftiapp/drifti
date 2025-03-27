import React, { useEffect, useState } from 'react';
import {
    Box,
    CircularProgress,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Button,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    useTheme,
    Alert,
    Tabs,
    Tab,
    TextField
} from '@mui/material';
import { format } from 'date-fns';
import axios from 'axios';

interface VerificationRequest {
    _id: string;
    userId: string;
    type: 'business' | 'driver';
    status: string;
    currentStep: string;
    verificationDetails: Record<string, any>;
    progress: Record<string, any>;
    metadata: Record<string, any>;
    createdAt: string;
    updatedAt: string;
    completedAt?: string;
    expiresAt?: string;
}

const AdminVerificationDashboard: React.FC = () => {
    const theme = useTheme();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [pendingVerifications, setPendingVerifications] = useState<VerificationRequest[]>([]);
    const [expiringVerifications, setExpiringVerifications] = useState<VerificationRequest[]>([]);
    const [selectedRequest, setSelectedRequest] = useState<VerificationRequest | null>(null);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [rejectionNotes, setRejectionNotes] = useState('');
    const [activeTab, setActiveTab] = useState(0);

    const fetchVerifications = async () => {
        try {
            setLoading(true);
            const [pendingRes, expiringRes] = await Promise.all([
                axios.get('/api/verification/pending'),
                axios.get('/api/verification/expiring')
            ]);

            setPendingVerifications(pendingRes.data);
            setExpiringVerifications(expiringRes.data);
            setError(null);
        } catch (err: any) {
            const message = err?.response?.data?.message || 'Failed to fetch verifications';
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVerifications();
        // Refresh data every minute
        const interval = setInterval(fetchVerifications, 60000);
        return () => clearInterval(interval);
    }, []);

    const handleApprove = async (id: string, notes?: string) => {
        try {
            await axios.post(`/api/verification/${id}/approve`, { notes });
            await fetchVerifications();
            setDetailsOpen(false);
        } catch (err: any) {
            const message = err?.response?.data?.message || 'Failed to approve verification';
            setError(message);
        }
    };

    const handleReject = async (id: string) => {
        try {
            if (!rejectionReason.trim()) {
                setError('Rejection reason is required');
                return;
            }

            await axios.post(`/api/verification/${id}/reject`, {
                reason: rejectionReason,
                notes: rejectionNotes
            });
            await fetchVerifications();
            setRejectDialogOpen(false);
            setDetailsOpen(false);
            setRejectionReason('');
            setRejectionNotes('');
        } catch (err: any) {
            const message = err?.response?.data?.message || 'Failed to reject verification';
            setError(message);
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

    const renderRejectionDialog = () => {
        if (!selectedRequest) return null;

        return (
            <Dialog
                open={rejectDialogOpen}
                onClose={() => setRejectDialogOpen(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>
                    Reject Verification - {selectedRequest.type.toUpperCase()}
                </DialogTitle>
                <DialogContent dividers>
                    <Box mb={2}>
                        <Typography variant="subtitle2" gutterBottom>
                            User ID: {selectedRequest.userId}
                        </Typography>
                        <Typography variant="subtitle2" gutterBottom>
                            Current Step: {selectedRequest.currentStep.replace('_', ' ')}
                        </Typography>
                    </Box>

                    <TextField
                        label="Rejection Reason"
                        required
                        fullWidth
                        multiline
                        rows={3}
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        error={error?.includes('reason')}
                        helperText={error?.includes('reason') ? error : ''}
                        sx={{ mb: 2 }}
                    />

                    <TextField
                        label="Additional Notes"
                        fullWidth
                        multiline
                        rows={3}
                        value={rejectionNotes}
                        onChange={(e) => setRejectionNotes(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setRejectDialogOpen(false)}>Cancel</Button>
                    <Button
                        color="error"
                        variant="contained"
                        onClick={() => handleReject(selectedRequest._id)}
                    >
                        Reject Verification
                    </Button>
                </DialogActions>
            </Dialog>
        );
    };

    const renderVerificationDetails = () => {
        if (!selectedRequest) return null;

        return (
            <Dialog
                open={detailsOpen}
                onClose={() => setDetailsOpen(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    Verification Details - {selectedRequest.type.toUpperCase()}
                </DialogTitle>
                <DialogContent dividers>
                    <Box mb={2}>
                        <Typography variant="subtitle1" gutterBottom>
                            Basic Information
                        </Typography>
                        <Typography>User ID: {selectedRequest.userId}</Typography>
                        <Typography>
                            Submitted: {format(new Date(selectedRequest.createdAt), 'PPp')}
                        </Typography>
                        <Typography>
                            Current Step: {selectedRequest.currentStep.replace('_', ' ')}
                        </Typography>
                    </Box>

                    <Box mb={2}>
                        <Typography variant="subtitle1" gutterBottom>
                            Verification Details
                        </Typography>
                        <pre style={{ whiteSpace: 'pre-wrap' }}>
                            {JSON.stringify(selectedRequest.verificationDetails, null, 2)}
                        </pre>
                    </Box>

                    <Box mb={2}>
                        <Typography variant="subtitle1" gutterBottom>
                            Progress Details
                        </Typography>
                        {Object.entries(selectedRequest.progress).map(([step, details]) => (
                            <Box key={step} mb={1}>
                                <Typography variant="body2">
                                    {step.replace('_', ' ')}:{' '}
                                    <Chip
                                        size="small"
                                        label={details.status.toUpperCase()}
                                        sx={{
                                            backgroundColor: getStatusColor(details.status),
                                            color: 'white'
                                        }}
                                    />
                                </Typography>
                                {details.error && (
                                    <Typography variant="body2" color="error">
                                        Error: {details.error}
                                    </Typography>
                                )}
                            </Box>
                        ))}
                    </Box>

                    {selectedRequest.metadata && Object.keys(selectedRequest.metadata).length > 0 && (
                        <Box mb={2}>
                            <Typography variant="subtitle1" gutterBottom>
                                Additional Metadata
                            </Typography>
                            <pre style={{ whiteSpace: 'pre-wrap' }}>
                                {JSON.stringify(selectedRequest.metadata, null, 2)}
                            </pre>
                        </Box>
                    )}

                    {selectedRequest.status === 'manual_review' && (
                        <Box mt={2}>
                            <TextField
                                label="Approval Notes"
                                fullWidth
                                multiline
                                rows={3}
                                value={rejectionNotes}
                                onChange={(e) => setRejectionNotes(e.target.value)}
                            />
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDetailsOpen(false)}>Close</Button>
                    {selectedRequest.status === 'manual_review' && (
                        <>
                            <Button
                                color="error"
                                variant="contained"
                                onClick={() => {
                                    setRejectDialogOpen(true);
                                }}
                            >
                                Reject
                            </Button>
                            <Button
                                color="success"
                                variant="contained"
                                onClick={() => handleApprove(selectedRequest._id, rejectionNotes)}
                            >
                                Approve
                            </Button>
                        </>
                    )}
                </DialogActions>
            </Dialog>
        );
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" p={4}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
                Verification Dashboard
            </Typography>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            <Tabs
                value={activeTab}
                onChange={(_, newValue) => setActiveTab(newValue)}
                sx={{ mb: 3 }}
            >
                <Tab label={`Pending Review (${pendingVerifications.length})`} />
                <Tab label={`Expiring Soon (${expiringVerifications.length})`} />
            </Tabs>

            <TableContainer>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Type</TableCell>
                            <TableCell>User ID</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Submitted</TableCell>
                            <TableCell>Current Step</TableCell>
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {(activeTab === 0 ? pendingVerifications : expiringVerifications).map(
                            (request) => (
                                <TableRow key={request._id}>
                                    <TableCell>{request.type}</TableCell>
                                    <TableCell>{request.userId}</TableCell>
                                    <TableCell>
                                        <Chip
                                            size="small"
                                            label={request.status.replace('_', ' ').toUpperCase()}
                                            sx={{
                                                backgroundColor: getStatusColor(request.status),
                                                color: 'white'
                                            }}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        {format(new Date(request.createdAt), 'PP')}
                                    </TableCell>
                                    <TableCell>{request.currentStep.replace('_', ' ')}</TableCell>
                                    <TableCell>
                                        <Button
                                            variant="outlined"
                                            size="small"
                                            onClick={() => {
                                                setSelectedRequest(request);
                                                setDetailsOpen(true);
                                            }}
                                        >
                                            View Details
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            )
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {renderVerificationDetails()}
            {renderRejectionDialog()}
        </Paper>
    );
};

export default AdminVerificationDashboard; 