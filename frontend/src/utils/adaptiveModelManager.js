import { HybridTimeSeriesModel } from './hybridModel';
import { mean, std } from 'mathjs';

export class AdaptiveModelManager {
    constructor(config = {}) {
        this.config = {
            performanceWindow: config.performanceWindow || 7, // days
            errorThreshold: config.errorThreshold || 0.1, // 10% increase in error
            minDataPoints: config.minDataPoints || 100,
            retrainInterval: config.retrainInterval || 24, // hours
            ...config
        };
        
        this.models = new Map(); // Store models for different segments
        this.breakPoints = [];
        this.featureImportance = null;
        this.performanceHistory = [];
        this.lastRetrainTime = null;
    }

    async initialize(data, timestamps, externalData = {}) {
        // Detect initial structural breaks
        this.breakPoints = await this.detectBreaks(data, timestamps);
        
        // Train initial models for each segment
        await this.trainSegmentModels(data, timestamps, externalData);
        
        // Calculate initial feature importance
        this.featureImportance = await this.calculateFeatureImportance(data, timestamps, externalData);
        
        this.lastRetrainTime = new Date();
    }

    async detectBreaks(data, timestamps) {
        // Use the existing structural break detection
        const breaks = await detectStructuralBreaks(data, timestamps);
        return breaks.map(breakPoint => ({
            timestamp: new Date(breakPoint.timestamp),
            type: breakPoint.type,
            magnitude: breakPoint.magnitude
        }));
    }

    async trainSegmentModels(data, timestamps, externalData = {}) {
        // Clear existing models
        this.models.clear();
        
        // Sort break points by timestamp
        const sortedBreaks = [...this.breakPoints].sort((a, b) => a.timestamp - b.timestamp);
        
        // Add start and end points
        const segments = [
            { start: timestamps[0], end: sortedBreaks[0]?.timestamp || timestamps[timestamps.length - 1] },
            ...sortedBreaks.map((breakPoint, index) => ({
                start: breakPoint.timestamp,
                end: sortedBreaks[index + 1]?.timestamp || timestamps[timestamps.length - 1]
            }))
        ];
        
        // Train a model for each segment
        for (const segment of segments) {
            const segmentData = this.getSegmentData(data, timestamps, segment);
            
            if (segmentData.data.length >= this.config.minDataPoints) {
                const model = new HybridTimeSeriesModel({
                    ...this.getModelConfig(segment),
                    features: this.getFeatureConfig(segment)
                });
                
                await model.fit(segmentData.data, segmentData.timestamps, externalData);
                this.models.set(segment.start.getTime(), model);
            }
        }
    }

    getSegmentData(data, timestamps, segment) {
        const indices = timestamps.map((t, i) => ({
            timestamp: new Date(t),
            index: i
        })).filter(({ timestamp }) => 
            timestamp >= segment.start && timestamp <= segment.end
        );
        
        return {
            data: indices.map(({ index }) => data[index]),
            timestamps: indices.map(({ timestamp }) => timestamp)
        };
    }

    getModelConfig(segment) {
        // Adjust model configuration based on segment characteristics
        const volatility = this.calculateVolatility(segment);
        
        return {
            arima: {
                p: volatility > 0.5 ? 2 : 1,
                d: volatility > 0.7 ? 2 : 1,
                q: volatility > 0.5 ? 2 : 1,
                P: 0,
                D: 0,
                Q: 0,
                s: 0
            },
            xgb: {
                maxDepth: volatility > 0.5 ? 8 : 6,
                learningRate: volatility > 0.7 ? 0.05 : 0.1,
                nEstimators: volatility > 0.5 ? 150 : 100,
                objective: 'reg:squarederror',
                validationSize: 0.2,
                batchSize: 32
            }
        };
    }

    getFeatureConfig(segment) {
        // Adjust feature configuration based on segment characteristics
        const volatility = this.calculateVolatility(segment);
        
        return {
            useHolidays: true,
            useWeather: volatility > 0.5,
            useExternalFactors: volatility > 0.7,
            maxLags: volatility > 0.5 ? 48 : 24,
            autoLagSelection: true,
            holidayWindow: 24,
            weatherWindow: 24
        };
    }

    calculateVolatility(segment) {
        const segmentData = this.getSegmentData(this.data, this.timestamps, segment);
        const values = segmentData.data;
        
        if (values.length < 2) return 0;
        
        const returns = values.slice(1).map((v, i) => (v - values[i]) / values[i]);
        return std(returns) / mean(returns);
    }

    async calculateFeatureImportance(data, timestamps, externalData = {}) {
        // Train a temporary model on the entire dataset
        const tempModel = new HybridTimeSeriesModel();
        await tempModel.fit(data, timestamps, externalData);
        
        // Get feature importance from the model
        return tempModel.getModelInfo().performance.featureImportance;
    }

    async predict(steps, lastData, lastTimestamp, externalData = {}) {
        // Find the appropriate model for the current segment
        const currentModel = this.getModelForTimestamp(lastTimestamp);
        
        if (!currentModel) {
            throw new Error('No suitable model found for the given timestamp');
        }
        
        // Generate predictions
        return await currentModel.predict(steps, lastData, lastTimestamp, externalData);
    }

    getModelForTimestamp(timestamp) {
        const time = new Date(timestamp);
        
        // Find the most recent break point before the timestamp
        const breakPoint = this.breakPoints
            .filter(bp => bp.timestamp <= time)
            .sort((a, b) => b.timestamp - a.timestamp)[0];
        
        // Get the model for this segment
        return this.models.get(breakPoint?.timestamp.getTime() || 0);
    }

    async checkAndRetrain(data, timestamps, externalData = {}) {
        const now = new Date();
        const hoursSinceLastRetrain = (now - this.lastRetrainTime) / (1000 * 60 * 60);
        
        // Check if retraining is needed
        if (hoursSinceLastRetrain >= this.config.retrainInterval) {
            // Detect new structural breaks
            const newBreaks = await this.detectBreaks(data, timestamps);
            
            // Check if there are new break points
            const hasNewBreaks = newBreaks.some(newBreak => 
                !this.breakPoints.some(existingBreak => 
                    existingBreak.timestamp.getTime() === newBreak.timestamp.getTime()
                )
            );
            
            // Check model performance
            const performanceDegraded = await this.checkPerformanceDegradation();
            
            if (hasNewBreaks || performanceDegraded) {
                // Update break points
                this.breakPoints = newBreaks;
                
                // Retrain models
                await this.trainSegmentModels(data, timestamps, externalData);
                
                // Update feature importance
                this.featureImportance = await this.calculateFeatureImportance(data, timestamps, externalData);
                
                this.lastRetrainTime = now;
                return true;
            }
        }
        
        return false;
    }

    async checkPerformanceDegradation() {
        if (this.performanceHistory.length < this.config.performanceWindow) {
            return false;
        }
        
        const recentPerformance = this.performanceHistory.slice(-this.config.performanceWindow);
        const currentError = recentPerformance[recentPerformance.length - 1].error;
        const previousError = recentPerformance[0].error;
        
        return (currentError - previousError) / previousError > this.config.errorThreshold;
    }

    updatePerformanceHistory(prediction, actual) {
        const error = Math.abs(prediction - actual);
        
        this.performanceHistory.push({
            timestamp: new Date(),
            error,
            prediction,
            actual
        });
        
        // Keep only the last performance window
        if (this.performanceHistory.length > this.config.performanceWindow) {
            this.performanceHistory.shift();
        }
    }

    getModelInfo() {
        return {
            breakPoints: this.breakPoints,
            featureImportance: this.featureImportance,
            performanceHistory: this.performanceHistory,
            lastRetrainTime: this.lastRetrainTime,
            modelCount: this.models.size
        };
    }
} 