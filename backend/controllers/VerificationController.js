const VerificationService = require('../services/VerificationService');
const { validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');
const config = require('../config');

// Configure multer for file upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/temp');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
        cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
});

const upload = multer({
    storage,
    limits: {
        fileSize: config.documents.upload.maxSize
    },
    fileFilter: (req, file, cb) => {
        if (config.documents.upload.allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type'), false);
        }
    }
});

class VerificationController {
    async verifyBusiness(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const businessData = req.body;
            const documents = req.files;

            // Validate required documents
            const missingDocs = config.verification.business.documentTypes.required.filter(
                docType => !documents[docType]
            );

            if (missingDocs.length > 0) {
                return res.status(400).json({
                    error: 'Missing required documents',
                    missingDocuments: missingDocs
                });
            }

            const result = await VerificationService.verifyBusiness(businessData, documents);

            // Return appropriate response based on verification result
            switch (result.status) {
                case 'approved':
                    return res.status(200).json({
                        status: 'approved',
                        message: 'Business verification successful',
                        trustScore: result.trustScore,
                        verificationDetails: result.verificationDetails
                    });

                case 'rejected':
                    return res.status(400).json({
                        status: 'rejected',
                        message: 'Business verification failed',
                        flags: result.flags,
                        verificationDetails: result.verificationDetails
                    });

                case 'manual_review':
                    return res.status(202).json({
                        status: 'manual_review',
                        message: 'Business verification requires manual review',
                        trustScore: result.trustScore,
                        flags: result.flags,
                        verificationDetails: result.verificationDetails
                    });

                default:
                    throw new Error('Invalid verification status');
            }
        } catch (error) {
            console.error('Business verification error:', error);
            return res.status(500).json({
                error: 'Internal server error',
                message: 'Failed to process business verification'
            });
        }
    }

    async verifyDriver(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const driverData = req.body;
            const documents = req.files;

            // Validate required documents
            const missingDocs = config.verification.driver.documentTypes.required.filter(
                docType => !documents[docType]
            );

            if (missingDocs.length > 0) {
                return res.status(400).json({
                    error: 'Missing required documents',
                    missingDocuments: missingDocs
                });
            }

            const result = await VerificationService.verifyDriver(driverData, documents);

            // Return appropriate response based on verification result
            switch (result.status) {
                case 'approved':
                    return res.status(200).json({
                        status: 'approved',
                        message: 'Driver verification successful',
                        verificationDetails: result.verificationDetails
                    });

                case 'rejected':
                    return res.status(400).json({
                        status: 'rejected',
                        message: 'Driver verification failed',
                        reason: result.reason,
                        flags: result.flags,
                        verificationDetails: result.verificationDetails
                    });

                case 'manual_review':
                    return res.status(202).json({
                        status: 'manual_review',
                        message: 'Driver verification requires manual review',
                        flags: result.flags,
                        verificationDetails: result.verificationDetails
                    });

                default:
                    throw new Error('Invalid verification status');
            }
        } catch (error) {
            console.error('Driver verification error:', error);
            return res.status(500).json({
                error: 'Internal server error',
                message: 'Failed to process driver verification'
            });
        }
    }

    async verifyDriverInterview(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const interviewData = req.body;
            const result = await VerificationService.verifyDriverInterview(interviewData);

            if (result.interviewPassed) {
                return res.status(200).json({
                    status: 'passed',
                    message: 'Interview verification successful',
                    confidenceScore: result.confidenceScore,
                    details: result.details
                });
            } else {
                return res.status(400).json({
                    status: 'failed',
                    message: 'Interview verification failed',
                    confidenceScore: result.confidenceScore,
                    details: result.details
                });
            }
        } catch (error) {
            console.error('Interview verification error:', error);
            return res.status(500).json({
                error: 'Internal server error',
                message: 'Failed to process interview verification'
            });
        }
    }

    // Middleware for handling file uploads
    static uploadBusinessDocs = upload.fields([
        { name: 'business_license', maxCount: 1 },
        { name: 'tax_certificate', maxCount: 1 },
        { name: 'insurance_certificate', maxCount: 1 },
        { name: 'health_permit', maxCount: 1 }
    ]);

    static uploadDriverDocs = upload.fields([
        { name: 'drivers_license', maxCount: 1 },
        { name: 'vehicle_insurance', maxCount: 1 },
        { name: 'vehicle_registration', maxCount: 1 },
        { name: 'medical_certificate', maxCount: 1 }
    ]);
}

module.exports = new VerificationController(); 