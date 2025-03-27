const express = require('express');
const router = express.Router();
const { HybridTimeSeriesModel } = require('../models/hybridModel');
const { detectStructuralBreaks } = require('../utils/structuralBreakUtils');
const { validateComponentId } = require('../middleware/validation');

// Get component data with model insights
router.get('/components/:componentId', validateComponentId, async (req, res) => {
    try {
        const { componentId } = req.params;
        const { data, timestamps } = await getComponentData(componentId);
        
        // Initialize and fit model
        const model = new HybridTimeSeriesModel();
        await model.fit(data, timestamps);
        
        // Get model info
        const modelInfo = model.getModelInfo();
        
        res.json({
            data,
            timestamps,
            modelInfo
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get model predictions
router.post('/components/:componentId/predict', validateComponentId, async (req, res) => {
    try {
        const { componentId } = req.params;
        const { steps, externalData } = req.body;
        
        const { data, timestamps } = await getComponentData(componentId);
        const model = new HybridTimeSeriesModel();
        await model.fit(data, timestamps);
        
        const predictions = await model.predict(steps, data, timestamps[timestamps.length - 1], externalData);
        
        res.json({ predictions });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get model insights
router.get('/components/:componentId/insights', validateComponentId, async (req, res) => {
    try {
        const { componentId } = req.params;
        const { data, timestamps } = await getComponentData(componentId);
        
        const model = new HybridTimeSeriesModel();
        await model.fit(data, timestamps);
        
        const modelInfo = model.getModelInfo();
        
        res.json({
            featureImportance: modelInfo.performance.featureImportance,
            structuralBreaks: modelInfo.performance.structuralBreaks,
            performance: {
                residualMean: modelInfo.performance.residualMean,
                residualStd: modelInfo.performance.residualStd,
                crossValidationScores: modelInfo.performance.crossValidationScores
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get structural breaks
router.get('/components/:componentId/structural-breaks', validateComponentId, async (req, res) => {
    try {
        const { componentId } = req.params;
        const { data, timestamps } = await getComponentData(componentId);
        
        const breaks = await detectStructuralBreaks(data, timestamps);
        
        res.json({ breaks });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get feature importance
router.get('/components/:componentId/feature-importance', validateComponentId, async (req, res) => {
    try {
        const { componentId } = req.params;
        const { data, timestamps } = await getComponentData(componentId);
        
        const model = new HybridTimeSeriesModel();
        await model.fit(data, timestamps);
        
        const modelInfo = model.getModelInfo();
        
        res.json({
            featureImportance: modelInfo.performance.featureImportance
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get model comparison
router.get('/components/:componentId/model-comparison', validateComponentId, async (req, res) => {
    try {
        const { componentId } = req.params;
        const { data, timestamps } = await getComponentData(componentId);
        
        // Initialize different model configurations
        const models = {
            hybrid: new HybridTimeSeriesModel(),
            arima: new HybridTimeSeriesModel({ useXGBoost: false }),
            xgb: new HybridTimeSeriesModel({ useARIMA: false })
        };
        
        // Fit all models
        const results = {};
        for (const [name, model] of Object.entries(models)) {
            await model.fit(data, timestamps);
            results[name] = model.getModelInfo().performance;
        }
        
        res.json({ results });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Helper function to get component data
async function getComponentData(componentId) {
    // TODO: Implement actual data fetching from database
    // This is a placeholder implementation
    const data = [/* ... */];
    const timestamps = [/* ... */];
    return { data, timestamps };
}

module.exports = router; 