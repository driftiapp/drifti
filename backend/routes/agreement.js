const express = require('express');
const { body, param } = require('express-validator');
const router = express.Router();
const AgreementService = require('../services/AgreementService');
const { authenticate, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { ValidationError } = require('../utils/errors');

// Create new agreement version (admin only)
router.post('/',
    authenticate,
    authorize(['admin']),
    [
        body('type').isIn(['general', 'liquor_store', 'restaurant', 'pharmacy', 'grocery']),
        body('version').isString().notEmpty(),
        body('content').isString().notEmpty(),
        body('effectiveDate').isISO8601(),
        body('requiredFields').isArray(),
        body('metadata').optional().isObject()
    ],
    validate,
    async (req, res, next) => {
        try {
            const agreement = await AgreementService.createAgreement(req.body);
            res.status(201).json(agreement);
        } catch (error) {
            next(error);
        }
    }
);

// Get active agreements by types
router.get('/active',
    authenticate,
    async (req, res, next) => {
        try {
            const types = req.query.types ? req.query.types.split(',') : [];
            const agreements = await AgreementService.getActiveAgreements(types);
            res.json(agreements);
        } catch (error) {
            next(error);
        }
    }
);

// Get agreement content by ID
router.get('/:agreementId',
    authenticate,
    param('agreementId').isMongoId(),
    validate,
    async (req, res, next) => {
        try {
            const agreement = await AgreementService.getAgreementContent(req.params.agreementId);
            res.json(agreement);
        } catch (error) {
            next(error);
        }
    }
);

// Record agreement acceptance
router.post('/:agreementId/accept',
    authenticate,
    [
        param('agreementId').isMongoId(),
        body('ipAddress').isIP(),
        body('userAgent').isString().notEmpty(),
        body('providedFields').isObject(),
        body('signature').isString().notEmpty(),
        body('metadata').optional().isObject()
    ],
    validate,
    async (req, res, next) => {
        try {
            const acceptance = await AgreementService.recordAcceptance(
                req.user.id,
                req.params.agreementId,
                {
                    ipAddress: req.body.ipAddress,
                    userAgent: req.body.userAgent,
                    providedFields: new Map(Object.entries(req.body.providedFields)),
                    signature: req.body.signature,
                    metadata: req.body.metadata
                }
            );
            res.status(201).json(acceptance);
        } catch (error) {
            next(error);
        }
    }
);

// Check required agreements for user
router.get('/required',
    authenticate,
    async (req, res, next) => {
        try {
            const businessTypes = req.query.businessTypes 
                ? req.query.businessTypes.split(',')
                : ['general'];
            
            const required = await AgreementService.checkRequiredAgreements(
                req.user.id,
                businessTypes
            );
            res.json(required);
        } catch (error) {
            next(error);
        }
    }
);

// Get user's agreement acceptance history
router.get('/history',
    authenticate,
    async (req, res, next) => {
        try {
            const history = await AgreementService.getUserAcceptanceHistory(req.user.id);
            res.json(history);
        } catch (error) {
            next(error);
        }
    }
);

// Invalidate agreement acceptance (admin only)
router.post('/acceptance/:acceptanceId/invalidate',
    authenticate,
    authorize(['admin']),
    [
        param('acceptanceId').isMongoId(),
        body('reason').isString().notEmpty()
    ],
    validate,
    async (req, res, next) => {
        try {
            const acceptance = await AgreementService.invalidateAcceptance(
                req.params.acceptanceId,
                req.body.reason
            );
            res.json(acceptance);
        } catch (error) {
            next(error);
        }
    }
);

// Get required agreements for store type
router.get('/store-type/:type/required',
    authenticate,
    param('type').isString(),
    validate,
    async (req, res, next) => {
        try {
            const required = await AgreementService.getRequiredAgreementsForStoreType(
                req.params.type
            );
            res.json(required);
        } catch (error) {
            next(error);
        }
    }
);

module.exports = router; 