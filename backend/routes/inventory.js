const express = require('express');
const router = express.Router();
const { body, query, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const InventoryService = require('../services/InventoryService');
const rateLimit = require('express-rate-limit');

// Rate limiting for inventory updates
const updateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});

// Validation middleware
const validateInventoryItem = [
    body('itemId').isMongoId().withMessage('Invalid item ID'),
    body('quantity').isInt({ min: 0 }).withMessage('Quantity must be a positive number'),
    body('minThreshold').isInt({ min: 0 }).withMessage('Min threshold must be a positive number'),
    body('maxThreshold').isInt({ min: 0 }).withMessage('Max threshold must be a positive number'),
    body('unit').trim().notEmpty().withMessage('Unit is required'),
    body('autoDisable').optional().isBoolean()
];

const validateStockUpdate = [
    body('quantity').isInt({ min: 0 }).withMessage('Quantity must be a positive number'),
    body('reason').trim().notEmpty().withMessage('Reason is required')
];

// Create new inventory item
router.post('/:storeId/items',
    auth,
    validateInventoryItem,
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    error: 'Validation error',
                    details: errors.array()
                });
            }

            // Check if user has permission for this store
            if (!req.user.roles.includes('admin') && req.user.storeId.toString() !== req.params.storeId) {
                return res.status(403).json({
                    error: 'Access denied',
                    message: 'You do not have permission to manage this store\'s inventory'
                });
            }

            const inventory = await InventoryService.createInventoryItem(
                req.params.storeId,
                req.body
            );

            res.status(201).json(inventory);
        } catch (error) {
            console.error('Error creating inventory item:', error);
            res.status(500).json({
                error: 'Internal server error',
                message: 'Failed to create inventory item'
            });
        }
    }
);

// Update stock level
router.patch('/:inventoryId/stock',
    auth,
    updateLimiter,
    validateStockUpdate,
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    error: 'Validation error',
                    details: errors.array()
                });
            }

            const inventory = await InventoryService.updateStock(
                req.params.inventoryId,
                req.body.quantity,
                'manual',
                req.body.reason,
                req.user.id
            );

            res.json(inventory);
        } catch (error) {
            console.error('Error updating stock:', error);
            res.status(500).json({
                error: 'Internal server error',
                message: 'Failed to update stock'
            });
        }
    }
);

// Verify store inventory
router.post('/:storeId/verify',
    auth,
    async (req, res) => {
        try {
            // Check if user has permission for this store
            if (!req.user.roles.includes('admin') && req.user.storeId.toString() !== req.params.storeId) {
                return res.status(403).json({
                    error: 'Access denied',
                    message: 'You do not have permission to verify this store\'s inventory'
                });
            }

            const inventory = await InventoryService.verifyStoreInventory(
                req.params.storeId,
                req.user.id
            );

            res.json({
                message: 'Inventory verification completed',
                inventory
            });
        } catch (error) {
            console.error('Error verifying inventory:', error);
            res.status(500).json({
                error: 'Internal server error',
                message: 'Failed to verify inventory'
            });
        }
    }
);

// Get store inventory
router.get('/:storeId',
    auth,
    async (req, res) => {
        try {
            const inventory = await InventoryService.getStoreInventory(req.params.storeId);
            res.json(inventory);
        } catch (error) {
            console.error('Error fetching inventory:', error);
            res.status(500).json({
                error: 'Internal server error',
                message: 'Failed to fetch inventory'
            });
        }
    }
);

// Get inventory analytics
router.get('/:storeId/analytics',
    auth,
    async (req, res) => {
        try {
            const period = parseInt(req.query.period) || 30;
            const analytics = await InventoryService.getInventoryAnalytics(
                req.params.storeId,
                period
            );
            res.json(analytics);
        } catch (error) {
            console.error('Error fetching inventory analytics:', error);
            res.status(500).json({
                error: 'Internal server error',
                message: 'Failed to fetch inventory analytics'
            });
        }
    }
);

// Get low stock items
router.get('/:storeId/low-stock',
    auth,
    async (req, res) => {
        try {
            const items = await InventoryService.getLowStockItems(req.params.storeId);
            res.json(items);
        } catch (error) {
            console.error('Error fetching low stock items:', error);
            res.status(500).json({
                error: 'Internal server error',
                message: 'Failed to fetch low stock items'
            });
        }
    }
);

// Get out of stock items
router.get('/:storeId/out-of-stock',
    auth,
    async (req, res) => {
        try {
            const items = await InventoryService.getOutOfStockItems(req.params.storeId);
            res.json(items);
        } catch (error) {
            console.error('Error fetching out of stock items:', error);
            res.status(500).json({
                error: 'Internal server error',
                message: 'Failed to fetch out of stock items'
            });
        }
    }
);

// Check store inventory compliance
router.get('/:storeId/compliance',
    auth,
    async (req, res) => {
        try {
            const compliance = await InventoryService.checkStoreInventoryCompliance(
                req.params.storeId
            );
            res.json(compliance);
        } catch (error) {
            console.error('Error checking inventory compliance:', error);
            res.status(500).json({
                error: 'Internal server error',
                message: 'Failed to check inventory compliance'
            });
        }
    }
);

module.exports = router; 