const express = require('express');
const router = express.Router();
const { body, param, validationResult } = require('express-validator');
const { getComponentData, getExternalData } = require('../utils/db');
const { AdaptiveModelManager } = require('../utils/adaptiveModelManager');

// Validation middleware
const validateComponentId = param('componentId')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Component ID is required');

const validateTimeRange = [
    body('startTime')
        .optional()
        .isISO8601()
        .withMessage('Start time must be a valid ISO 8601 date'),
    body('endTime')
        .optional()
        .isISO8601()
        .withMessage('End time must be a valid ISO 8601 date')
];

// Error handling middleware
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

// Get component data
router.get('/:componentId',
    validateComponentId,
    handleValidationErrors,
    async (req, res) => {
        try {
            const { componentId } = req.params;
            const { startTime, endTime } = req.query;

            const data = await getComponentData(componentId, startTime, endTime);
            res.json(data);
        } catch (error) {
            console.error('Error fetching component data:', error);
            res.status(500).json({ message: 'Failed to fetch component data' });
        }
    }
);

// Get model info
router.get('/:componentId/model-info',
    validateComponentId,
    handleValidationErrors,
    async (req, res) => {
        try {
            const { componentId } = req.params;
            
            // Get component data
            const data = await getComponentData(componentId);
            
            // Get external data
            const externalData = await getExternalData(componentId);
            
            // Initialize adaptive model manager
            const modelManager = new AdaptiveModelManager({
                componentId,
                data,
                externalData
            });
            
            // Get model info
            const modelInfo = {
                breakPoints: modelManager.breakPoints,
                featureImportance: modelManager.featureImportance,
                performanceHistory: modelManager.performanceHistory,
                modelCount: modelManager.models.length,
                lastRetrainTime: modelManager.lastRetrainTime
            };
            
            res.json(modelInfo);
        } catch (error) {
            console.error('Error fetching model info:', error);
            res.status(500).json({ message: 'Failed to fetch model info' });
        }
    }
);

// Get structural breaks
router.get('/:componentId/structural-breaks',
    validateComponentId,
    handleValidationErrors,
    async (req, res) => {
        try {
            const { componentId } = req.params;
            const data = await getComponentData(componentId);
            
            const modelManager = new AdaptiveModelManager({
                componentId,
                data
            });
            
            const breaks = modelManager.breakPoints;
            res.json(breaks);
        } catch (error) {
            console.error('Error fetching structural breaks:', error);
            res.status(500).json({ message: 'Failed to fetch structural breaks' });
        }
    }
);

// Get feature importance
router.get('/:componentId/feature-importance',
    validateComponentId,
    handleValidationErrors,
    async (req, res) => {
        try {
            const { componentId } = req.params;
            const data = await getComponentData(componentId);
            
            const modelManager = new AdaptiveModelManager({
                componentId,
                data
            });
            
            const importance = modelManager.featureImportance;
            res.json(importance);
        } catch (error) {
            console.error('Error fetching feature importance:', error);
            res.status(500).json({ message: 'Failed to fetch feature importance' });
        }
    }
);

// Get model predictions
router.post('/:componentId/predict',
    validateComponentId,
    validateTimeRange,
    handleValidationErrors,
    async (req, res) => {
        try {
            const { componentId } = req.params;
            const { startTime, endTime, horizon } = req.body;
            
            const data = await getComponentData(componentId);
            const externalData = await getExternalData(componentId);
            
            const modelManager = new AdaptiveModelManager({
                componentId,
                data,
                externalData
            });
            
            const predictions = await modelManager.predict(startTime, endTime, horizon);
            res.json(predictions);
        } catch (error) {
            console.error('Error generating predictions:', error);
            res.status(500).json({ message: 'Failed to generate predictions' });
        }
    }
);

module.exports = router; 