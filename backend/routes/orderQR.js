const express = require('express');
const router = express.Router();
const { body, query, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const OrderQRService = require('../services/OrderQRService');
const rateLimit = require('express-rate-limit');

// Rate limiting for QR code generation and verification
const qrLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});

// Validation middleware
const validateLocation = [
    body('location.latitude')
        .isFloat({ min: -90, max: 90 })
        .withMessage('Invalid latitude'),
    body('location.longitude')
        .isFloat({ min: -180, max: 180 })
        .withMessage('Invalid longitude')
];

// Generate QR code for order
router.post('/generate/:orderId',
    auth,
    qrLimiter,
    async (req, res) => {
        try {
            const orderQR = await OrderQRService.generateQRCode(req.params.orderId);
            res.status(201).json(orderQR.toPublicJSON());
        } catch (error) {
            console.error('Error generating QR code:', error);
            res.status(500).json({
                error: 'Internal server error',
                message: 'Failed to generate QR code'
            });
        }
    }
);

// Assign driver to pickup
router.post('/:qrId/assign/:driverId',
    auth,
    async (req, res) => {
        try {
            // Check if user has permission
            if (!req.user.roles.includes('admin')) {
                return res.status(403).json({
                    error: 'Access denied',
                    message: 'Only admins can assign drivers'
                });
            }

            const orderQR = await OrderQRService.assignDriver(
                req.params.qrId,
                req.params.driverId
            );

            res.json(orderQR.toPublicJSON());
        } catch (error) {
            console.error('Error assigning driver:', error);
            res.status(500).json({
                error: 'Internal server error',
                message: 'Failed to assign driver'
            });
        }
    }
);

// Verify pickup code
router.post('/verify',
    auth,
    validateLocation,
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    error: 'Validation error',
                    details: errors.array()
                });
            }

            const { code, role } = req.body;
            const orderQR = await OrderQRService.verifyPickup(
                code,
                req.user.id,
                role,
                req.body.location
            );

            res.json(orderQR.toPublicJSON());
        } catch (error) {
            console.error('Error verifying pickup:', error);
            res.status(500).json({
                error: 'Internal server error',
                message: 'Failed to verify pickup'
            });
        }
    }
);

// Cancel pickup
router.post('/:qrId/cancel',
    auth,
    body('reason').trim().notEmpty().withMessage('Reason is required'),
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    error: 'Validation error',
                    details: errors.array()
                });
            }

            const orderQR = await OrderQRService.cancelPickup(
                req.params.qrId,
                req.body.reason
            );

            res.json(orderQR.toPublicJSON());
        } catch (error) {
            console.error('Error cancelling pickup:', error);
            res.status(500).json({
                error: 'Internal server error',
                message: 'Failed to cancel pickup'
            });
        }
    }
);

// Get pending pickups for store
router.get('/store/:storeId/pending',
    auth,
    async (req, res) => {
        try {
            // Check if user has permission for this store
            if (!req.user.roles.includes('admin') && req.user.storeId.toString() !== req.params.storeId) {
                return res.status(403).json({
                    error: 'Access denied',
                    message: 'You do not have permission to view this store\'s pickups'
                });
            }

            const pickups = await OrderQRService.getPendingPickups(req.params.storeId);
            res.json(pickups.map(qr => qr.toPublicJSON()));
        } catch (error) {
            console.error('Error fetching pending pickups:', error);
            res.status(500).json({
                error: 'Internal server error',
                message: 'Failed to fetch pending pickups'
            });
        }
    }
);

// Get driver's pickups
router.get('/driver/:driverId/pickups',
    auth,
    async (req, res) => {
        try {
            // Check if user has permission
            if (!req.user.roles.includes('admin') && req.user.id.toString() !== req.params.driverId) {
                return res.status(403).json({
                    error: 'Access denied',
                    message: 'You do not have permission to view these pickups'
                });
            }

            const pickups = await OrderQRService.getDriverPickups(req.params.driverId);
            res.json(pickups.map(qr => qr.toPublicJSON()));
        } catch (error) {
            console.error('Error fetching driver pickups:', error);
            res.status(500).json({
                error: 'Internal server error',
                message: 'Failed to fetch driver pickups'
            });
        }
    }
);

module.exports = router; 