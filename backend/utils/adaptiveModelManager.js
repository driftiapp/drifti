const { detectStructuralBreaks } = require('./structuralBreakDetection');
const { calculateVolatility } = require('./statistics');
const { ModelOptimizer } = require('./modelOptimizer');

class AdaptiveModelManager {
    constructor({ componentId, data, externalData }) {
        this.componentId = componentId;
        this.data = data;
        this.externalData = externalData;
        this.models = new Map(); // Store models for different segments
        this.breakPoints = [];
        this.featureImportance = [];
        this.performanceHistory = [];
        this.lastRetrainTime = null;
        this.modelOptimizer = new ModelOptimizer();
        
        this.initialize();
    }

    async initialize() {
        try {
            // Detect structural breaks
            this.breakPoints = await detectStructuralBreaks(this.data);
            
            // Train initial models for each segment
            await this.trainSegmentModels();
            
            // Update last retrain time
            this.lastRetrainTime = new Date();
        } catch (error) {
            console.error('Error initializing AdaptiveModelManager:', error);
            throw error;
        }
    }

    async trainSegmentModels() {
        try {
            // Clear existing models
            this.models.clear();
            
            // Sort break points by timestamp
            const sortedBreaks = [...this.breakPoints].sort((a, b) => a.timestamp - b.timestamp);
            
            // Add start and end points
            const segments = [
                { start: this.data[0].timestamp, end: sortedBreaks[0]?.timestamp || this.data[this.data.length - 1].timestamp },
                ...sortedBreaks.map((breakPoint, index) => ({
                    start: breakPoint.timestamp,
                    end: sortedBreaks[index + 1]?.timestamp || this.data[this.data.length - 1].timestamp
                }))
            ];
            
            // Train a model for each segment
            for (const segment of segments) {
                const segmentData = this.getSegmentData(segment);
                
                if (segmentData.data.length >= this.modelOptimizer.config.minDataPoints) {
                    // Find best model for this segment
                    const bestModels = await this.modelOptimizer.findBestModel(
                        segmentData.data,
                        segmentData.timestamps,
                        this.externalData
                    );
                    
                    // Optimize hyperparameters for the best model
                    const optimizedModel = await this.modelOptimizer.optimizeHyperparameters(
                        bestModels[0].model,
                        segmentData.data,
                        segmentData.timestamps,
                        this.externalData
                    );
                    
                    // Store the optimized model
                    this.models.set(segment.start.getTime(), {
                        model: optimizedModel.model,
                        config: optimizedModel.params,
                        metrics: optimizedModel.metrics
                    });
                }
            }
        } catch (error) {
            console.error('Error training segment models:', error);
            throw error;
        }
    }

    getSegmentData(segment) {
        const indices = this.data.map((point, i) => ({
            timestamp: new Date(point.timestamp),
            index: i
        })).filter(({ timestamp }) => 
            timestamp >= segment.start && timestamp <= segment.end
        );
        
        return {
            data: indices.map(({ index }) => this.data[index].value),
            timestamps: indices.map(({ timestamp }) => timestamp)
        };
    }

    async predict(startTime, endTime, horizon) {
        try {
            // Check if retraining is needed
            await this.checkAndRetrain();
            
            // Get predictions from all models
            const predictions = await Promise.all(
                Array.from(this.models.values()).map(({ model }) => 
                    model.predict(startTime, endTime, horizon)
                )
            );
            
            // Combine predictions based on segment weights
            const combinedPredictions = this.combinePredictions(predictions, startTime, endTime);
            
            // Update performance history
            this.updatePerformanceHistory(combinedPredictions);
            
            return combinedPredictions;
        } catch (error) {
            console.error('Error generating predictions:', error);
            throw error;
        }
    }

    combinePredictions(predictions, startTime, endTime) {
        // Weight predictions based on model performance metrics
        const weights = Array.from(this.models.values()).map(({ metrics }) => 
            1 / (1 + metrics.rmse)
        );
        
        const normalizedWeights = weights.map(w => w / weights.reduce((a, b) => a + b, 0));
        
        return predictions[0].map((_, i) => {
            return predictions.reduce((sum, pred, j) => sum + pred[i] * normalizedWeights[j], 0);
        });
    }

    async checkAndRetrain() {
        const hoursSinceRetrain = (new Date() - this.lastRetrainTime) / (1000 * 60 * 60);
        
        // Retrain if:
        // 1. More than 24 hours have passed
        // 2. New structural breaks are detected
        // 3. Performance has degraded significantly
        // 4. Feature importance has shifted significantly
        if (hoursSinceRetrain > 24) {
            const newBreaks = await detectStructuralBreaks(this.data);
            const hasNewBreaks = newBreaks.length !== this.breakPoints.length ||
                newBreaks.some((breakPoint, i) => breakPoint.index !== this.breakPoints[i].index);
            
            const performanceDegraded = this.hasPerformanceDegraded();
            const featureShift = await this.modelOptimizer.detectFeatureShift(
                this.featureImportance,
                this.performanceHistory.map(record => record.featureImportance)
            );
            
            if (hasNewBreaks || performanceDegraded || featureShift) {
                // Update break points
                this.breakPoints = newBreaks;
                
                // Retrain models
                await this.trainSegmentModels();
                
                // Update feature importance
                this.featureImportance = await this.calculateFeatureImportance();
                
                this.lastRetrainTime = new Date();
                return true;
            }
        }
        
        return false;
    }

    hasPerformanceDegraded() {
        if (this.performanceHistory.length < 10) return false;
        
        const recentErrors = this.performanceHistory.slice(-10).map(record => record.error);
        const meanError = recentErrors.reduce((a, b) => a + b, 0) / recentErrors.length;
        const stdError = Math.sqrt(
            recentErrors.reduce((sq, n) => sq + Math.pow(n - meanError, 2), 0) / recentErrors.length
        );
        
        return meanError > 2 * stdError;
    }

    updatePerformanceHistory(predictions) {
        const actualValues = this.data.slice(-predictions.length).map(point => point.value);
        const errors = predictions.map((pred, i) => Math.abs(pred - actualValues[i]));
        
        this.performanceHistory.push({
            timestamp: new Date(),
            predictions,
            actual: actualValues,
            error: errors.reduce((a, b) => a + b, 0) / errors.length,
            featureImportance: this.featureImportance
        });
        
        // Keep only last 100 records
        if (this.performanceHistory.length > 100) {
            this.performanceHistory = this.performanceHistory.slice(-100);
        }
    }

    async calculateFeatureImportance() {
        // Calculate feature importance across all models
        const allImportance = await Promise.all(
            Array.from(this.models.values()).map(({ model }) => 
                model.getFeatureImportance()
            )
        );
        
        // Average feature importance across models
        return this.averageFeatureImportance(allImportance);
    }

    averageFeatureImportance(importanceList) {
        if (importanceList.length === 0) return [];
        
        const featureMap = new Map();
        
        // Sum up importance scores for each feature
        importanceList.forEach(importance => {
            importance.forEach(feature => {
                if (!featureMap.has(feature.name)) {
                    featureMap.set(feature.name, { name: feature.name, importance: 0, count: 0 });
                }
                const entry = featureMap.get(feature.name);
                entry.importance += feature.importance;
                entry.count += 1;
            });
        });
        
        // Calculate average importance
        return Array.from(featureMap.values())
            .map(entry => ({
                name: entry.name,
                importance: entry.importance / entry.count
            }))
            .sort((a, b) => b.importance - a.importance);
    }

    getModelInfo() {
        return {
            breakPoints: this.breakPoints,
            featureImportance: this.featureImportance,
            performanceHistory: this.performanceHistory,
            lastRetrainTime: this.lastRetrainTime,
            modelCount: this.models.size,
            models: Array.from(this.models.entries()).map(([timestamp, { config, metrics }]) => ({
                timestamp: new Date(timestamp),
                config,
                metrics
            }))
        };
    }
}

module.exports = { AdaptiveModelManager }; 