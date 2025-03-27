const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const VerificationController = require('../controllers/VerificationController');
const auth = require('../middleware/auth');
const rateLimit = require('express-rate-limit');
const config = require('../config');
const VerificationProgress = require('../models/VerificationProgress');
const multer = require('multer');
const FaceVerificationService = require('../services/FaceVerificationService');
const { ValidationError } = require('../utils/errors');

// Rate limiting for verification endpoints
const verificationLimiter = rateLimit({
    windowMs: config.security.rateLimit.windowMs,
    max: config.security.rateLimit.max
});

// Configure multer for handling file uploads
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
        files: 3 // Max 3 files (selfie, ID photo, verification video)
    }
});

// Business verification validation
const validateBusinessData = [
    body('businessName').trim().notEmpty().withMessage('Business name is required'),
    body('businessType').trim().notEmpty().withMessage('Business type is required'),
    body('ein').trim().notEmpty().withMessage('EIN is required')
        .matches(/^\d{2}-\d{7}$/).withMessage('Invalid EIN format'),
    body('businessAddress').trim().notEmpty().withMessage('Business address is required'),
    body('ownerName').trim().notEmpty().withMessage('Owner name is required'),
    body('ownerEmail').trim().isEmail().withMessage('Valid owner email is required'),
    body('ownerPhone').trim().notEmpty().withMessage('Owner phone is required')
        .matches(/^\+?1?\d{10,}$/).withMessage('Invalid phone number format')
];

// Driver verification validation
const validateDriverData = [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').trim().isEmail().withMessage('Valid email is required'),
    body('phone').trim().notEmpty().withMessage('Phone number is required')
        .matches(/^\+?1?\d{10,}$/).withMessage('Invalid phone number format'),
    body('driversLicense').trim().notEmpty().withMessage('Driver\'s license number is required'),
    body('ssn').trim().notEmpty().withMessage('SSN last 4 digits are required')
        .matches(/^\d{4}$/).withMessage('Invalid SSN format'),
    body('dateOfBirth').trim().notEmpty().withMessage('Date of birth is required')
        .isISO8601().withMessage('Invalid date format'),
    body('vehicleInfo.make').trim().notEmpty().withMessage('Vehicle make is required'),
    body('vehicleInfo.model').trim().notEmpty().withMessage('Vehicle model is required'),
    body('vehicleInfo.year').isInt({ min: 1900, max: new Date().getFullYear() })
        .withMessage('Invalid vehicle year')
];

// Driver interview validation
const validateInterviewData = [
    body('questions').isArray().withMessage('Questions array is required'),
    body('questions.*.question').trim().notEmpty().withMessage('Question text is required'),
    body('questions.*.answer').trim().notEmpty().withMessage('Answer text is required'),
    body('facialRecognition.matchScore').isFloat({ min: 0, max: 1 })
        .withMessage('Invalid facial recognition match score')
];

// Validation middleware
const validateApproval = [
    body('notes')
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Approval notes cannot exceed 1000 characters')
];

const validateRejection = [
    body('reason')
        .trim()
        .notEmpty()
        .withMessage('Rejection reason is required')
        .isLength({ max: 500 })
        .withMessage('Rejection reason cannot exceed 500 characters'),
    body('notes')
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Rejection notes cannot exceed 1000 characters')
];

// Business verification routes
router.post('/business',
    auth,
    verificationLimiter,
    validateBusinessData,
    VerificationController.uploadBusinessDocs,
    VerificationController.verifyBusiness
);

// Driver verification routes
router.post('/driver',
    auth,
    verificationLimiter,
    validateDriverData,
    VerificationController.uploadDriverDocs,
    VerificationController.verifyDriver
);

// Driver interview verification route
router.post('/driver/interview',
    auth,
    verificationLimiter,
    validateInterviewData,
    VerificationController.verifyDriverInterview
);

// Get verification progress
router.get('/progress',
    auth,
    async (req, res) => {
        try {
            const progress = await VerificationProgress.findOne({
                userId: req.user.id,
                type: req.query.type
            });

            if (!progress) {
                return res.status(404).json({
                    error: 'Verification progress not found',
                    message: 'No verification process found for this user'
                });
            }

            // Calculate overall progress percentage
            const steps = Object.values(progress.progress);
            const completedSteps = steps.filter(step => step.completed).length;
            const totalSteps = steps.length;
            const progressPercentage = Math.round((completedSteps / totalSteps) * 100);

            res.status(200).json({
                status: progress.status,
                currentStep: progress.currentStep,
                progress: progressPercentage,
                completedSteps: Object.entries(progress.progress)
                    .filter(([_, step]) => step.completed)
                    .map(([name]) => name),
                details: {
                    verificationDetails: progress.verificationDetails,
                    retryCount: progress.retryCount,
                    nextRetryAt: progress.nextRetryAt,
                    expiresAt: progress.expiresAt,
                    completedAt: progress.completedAt
                },
                stepDetails: progress.progress
            });
        } catch (error) {
            console.error('Error retrieving verification progress:', error);
            res.status(500).json({
                error: 'Internal server error',
                message: 'Failed to retrieve verification progress'
            });
        }
    }
);

// Get verification status by ID (admin only)
router.get('/status/:id',
    auth,
    async (req, res) => {
        try {
            // Check if user is admin
            if (!req.user.roles.includes('admin')) {
                return res.status(403).json({
                    error: 'Access denied',
                    message: 'Admin privileges required'
                });
            }

            const progress = await VerificationProgress.findById(req.params.id);
            if (!progress) {
                return res.status(404).json({
                    error: 'Verification not found',
                    message: 'No verification process found with this ID'
                });
            }

            res.status(200).json({
                status: progress.status,
                type: progress.type,
                userId: progress.userId,
                currentStep: progress.currentStep,
                verificationDetails: progress.verificationDetails,
                progress: progress.progress,
                metadata: progress.metadata,
                timestamps: {
                    createdAt: progress.createdAt,
                    updatedAt: progress.updatedAt,
                    completedAt: progress.completedAt,
                    expiresAt: progress.expiresAt
                }
            });
        } catch (error) {
            console.error('Error retrieving verification status:', error);
            res.status(500).json({
                error: 'Internal server error',
                message: 'Failed to retrieve verification status'
            });
        }
    }
);

// Get pending verifications (admin only)
router.get('/pending',
    auth,
    async (req, res) => {
        try {
            // Check if user is admin
            if (!req.user.roles.includes('admin')) {
                return res.status(403).json({
                    error: 'Access denied',
                    message: 'Admin privileges required'
                });
            }

            const pendingVerifications = await VerificationProgress.find({
                status: 'manual_review'
            }).sort({ createdAt: 1 });

            res.status(200).json(pendingVerifications);
        } catch (error) {
            console.error('Error retrieving pending verifications:', error);
            res.status(500).json({
                error: 'Internal server error',
                message: 'Failed to retrieve pending verifications'
            });
        }
    }
);

// Get expiring verifications
router.get('/expiring',
    auth,
    async (req, res) => {
        try {
            const days = parseInt(req.query.days) || 30;
            const query = {
                status: 'approved',
                expiresAt: {
                    $lte: new Date(Date.now() + days * 24 * 60 * 60 * 1000)
                }
            };

            // Non-admin users can only see their own expiring verifications
            if (!req.user.roles.includes('admin')) {
                query.userId = req.user.id;
            }

            const expiringVerifications = await VerificationProgress.find(query)
                .sort({ expiresAt: 1 });

            res.status(200).json(expiringVerifications);
        } catch (error) {
            console.error('Error retrieving expiring verifications:', error);
            res.status(500).json({
                error: 'Internal server error',
                message: 'Failed to retrieve expiring verifications'
            });
        }
    }
);

// Approve verification
router.post('/:id/approve',
    auth,
    validateApproval,
    async (req, res) => {
        try {
            // Validate request
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    error: 'Validation error',
                    message: 'Invalid request data',
                    details: errors.array()
                });
            }

            // Check if user is admin
            if (!req.user.roles.includes('admin')) {
                return res.status(403).json({
                    error: 'Access denied',
                    message: 'Admin privileges required'
                });
            }

            const progress = await VerificationProgress.findById(req.params.id);
            if (!progress) {
                return res.status(404).json({
                    error: 'Verification not found',
                    message: 'No verification process found with this ID'
                });
            }

            // Only allow approval of verifications in manual review
            if (progress.status !== 'manual_review') {
                return res.status(400).json({
                    error: 'Invalid operation',
                    message: 'Only verifications in manual review can be approved'
                });
            }

            // Update verification status
            progress.status = 'approved';
            progress.completedAt = new Date();
            progress.expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year expiry
            progress.metadata.approvedBy = req.user.id;
            progress.metadata.approvalNotes = req.body.notes;

            // Mark all steps as completed
            Object.keys(progress.progress).forEach(step => {
                progress.progress[step].completed = true;
                progress.progress[step].status = 'completed';
                progress.progress[step].completedAt = new Date();
            });

            await progress.save();

            // Notify user of approval
            // TODO: Implement notification system

            res.status(200).json({
                message: 'Verification approved successfully',
                verification: progress
            });
        } catch (error) {
            console.error('Error approving verification:', error);
            res.status(500).json({
                error: 'Internal server error',
                message: 'Failed to approve verification'
            });
        }
    }
);

// Reject verification
router.post('/:id/reject',
    auth,
    validateRejection,
    async (req, res) => {
        try {
            // Validate request
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    error: 'Validation error',
                    message: 'Invalid request data',
                    details: errors.array()
                });
            }

            // Check if user is admin
            if (!req.user.roles.includes('admin')) {
                return res.status(403).json({
                    error: 'Access denied',
                    message: 'Admin privileges required'
                });
            }

            const progress = await VerificationProgress.findById(req.params.id);
            if (!progress) {
                return res.status(404).json({
                    error: 'Verification not found',
                    message: 'No verification process found with this ID'
                });
            }

            // Only allow rejection of verifications in manual review
            if (progress.status !== 'manual_review') {
                return res.status(400).json({
                    error: 'Invalid operation',
                    message: 'Only verifications in manual review can be rejected'
                });
            }

            // Update verification status
            progress.status = 'rejected';
            progress.completedAt = new Date();
            progress.metadata.rejectedBy = req.user.id;
            progress.metadata.rejectionReason = req.body.reason;
            progress.metadata.rejectionNotes = req.body.notes;

            // Mark current step as failed
            if (progress.currentStep && progress.progress[progress.currentStep]) {
                progress.progress[progress.currentStep].status = 'failed';
                progress.progress[progress.currentStep].error = req.body.reason;
            }

            await progress.save();

            // Notify user of rejection
            // TODO: Implement notification system

            res.status(200).json({
                message: 'Verification rejected successfully',
                verification: progress
            });
        } catch (error) {
            console.error('Error rejecting verification:', error);
            res.status(500).json({
                error: 'Internal server error',
                message: 'Failed to reject verification'
            });
        }
    }
);

// Verify identity with face verification
router.post('/verify',
    auth,
    upload.fields([
        { name: 'selfie', maxCount: 1 },
        { name: 'idPhoto', maxCount: 1 },
        { name: 'verificationVideo', maxCount: 1 }
    ]),
    async (req, res, next) => {
        try {
            if (!req.files?.selfie?.[0] || !req.files?.idPhoto?.[0] || !req.files?.verificationVideo?.[0]) {
                throw new ValidationError('Missing required files');
            }

            const requiredGestures = req.body.requiredGestures
                ? JSON.parse(req.body.requiredGestures)
                : ['blink', 'nod', 'smile'];

            const result = await FaceVerificationService.verifyIdentity(
                req.user.id,
                {
                    selfieBuffer: req.files.selfie[0].buffer,
                    idPhotoBuffer: req.files.idPhoto[0].buffer,
                    verificationVideo: req.files.verificationVideo[0].buffer,
                    requiredGestures
                }
            );

            res.json(result);
        } catch (error) {
            next(error);
        }
    }
);

// Get verification status
router.get('/status',
    auth,
    async (req, res, next) => {
        try {
            const cacheKey = `verification:${req.user.id}`;
            const cached = await FaceVerificationService.verificationCache.get(cacheKey);
            
            if (cached) {
                res.json(JSON.parse(cached));
            } else {
                res.json({ verified: false });
            }
        } catch (error) {
            next(error);
        }
    }
);

// Clear verification status (for testing/debugging)
router.delete('/status',
    auth,
    async (req, res, next) => {
        try {
            const cacheKey = `verification:${req.user.id}`;
            await FaceVerificationService.verificationCache.del(cacheKey);
            res.json({ message: 'Verification status cleared' });
        } catch (error) {
            next(error);
        }
    }
);

// Error handling middleware
router.use((err, req, res, next) => {
    console.error('Verification route error:', err);
    
    if (err.name === 'MulterError') {
        return res.status(400).json({
            error: 'File upload error',
            message: err.message
        });
    }

    res.status(500).json({
        error: 'Internal server error',
        message: 'An unexpected error occurred during verification'
    });
});

module.exports = router; 