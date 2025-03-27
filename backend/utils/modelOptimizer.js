const { calculateRMSE, calculateMAE, calculateMAPE } = require('./statistics');
const { HybridTimeSeriesModel } = require('./hybridTimeSeriesModel');
const { ARIMAModel } = require('./arimaModel');
const { XGBoostModel } = require('./xgboostModel');
const { LSTMModel } = require('./lstmModel');
const { MultiObjectiveTPE } = require('./multiObjectiveTPE');
const { WorkerPool } = require('./workerPool');

class ModelOptimizer {
    constructor(config = {}) {
        this.config = {
            validationSize: config.validationSize || 0.2,
            maxModels: config.maxModels || 3,
            minDataPoints: config.minDataPoints || 100,
            objectives: config.objectives || [
                { name: 'rmse', weight: 1.0, minimize: true },
                { name: 'trainingTime', weight: 0.5, minimize: true },
                { name: 'modelSize', weight: 0.3, minimize: true }
            ],
            ...config
        };
        this.multiObjectiveTPE = new MultiObjectiveTPE({
            maxIterations: 50,
            nInitialPoints: 10,
            gamma: 0.25,
            objectives: this.config.objectives
        });
        this.workerPool = new WorkerPool({
            maxWorkers: config.maxWorkers || Math.max(1, require('os').cpus().length - 1)
        });
    }

    async initialize() {
        await this.workerPool.initialize();
    }

    async findBestModel(data, timestamps, externalData = {}) {
        const models = [
            { name: 'Hybrid', class: HybridTimeSeriesModel },
            { name: 'ARIMA', class: ARIMAModel },
            { name: 'XGBoost', class: XGBoostModel },
            { name: 'LSTM', class: LSTMModel }
        ];

        // Evaluate models in parallel using worker pool
        const evaluationTasks = models.map(model => ({
            type: 'evaluate',
            modelInfo: model,
            data,
            timestamps,
            externalData,
            validationSize: this.config.validationSize
        }));

        const results = await Promise.all(
            evaluationTasks.map(task => this.workerPool.executeTask(task))
        );

        // Sort by weighted objective value and return top models
        return results
            .filter(result => result !== null)
            .sort((a, b) => this.calculateWeightedObjective(a.metrics) - this.calculateWeightedObjective(b.metrics))
            .slice(0, this.config.maxModels);
    }

    calculateWeightedObjective(metrics) {
        return this.config.objectives.reduce((sum, obj) => {
            const value = metrics[obj.name];
            return sum + obj.weight * (obj.minimize ? value : -value);
        }, 0);
    }

    async optimizeHyperparameters(model, data, timestamps, externalData) {
        const paramRanges = this.getParameterRanges(model.constructor.name);
        
        // Define objective function for Multi-Objective Optimization
        const objectiveFn = async (params) => {
            const task = {
                type: 'optimize',
                modelName: model.constructor.name,
                params,
                data,
                timestamps,
                externalData
            };
            return this.workerPool.executeTask(task);
        };

        // Run Multi-Objective Optimization
        const result = await this.multiObjectiveTPE.optimize(objectiveFn, paramRanges);
        
        // Select best model from Pareto front based on weighted objective
        const bestModel = result.paretoFront.reduce((best, current) => {
            const bestScore = this.calculateWeightedObjective(best.objectives);
            const currentScore = this.calculateWeightedObjective(current.objectives);
            return currentScore < bestScore ? current : best;
        });

        // Create optimized model with best parameters
        const optimizedModel = new model.constructor(bestModel.params);
        await optimizedModel.fit(data, timestamps, externalData);
        
        const predictions = await optimizedModel.predict(timestamps, externalData);
        const metrics = {
            rmse: calculateRMSE(predictions, data),
            mae: calculateMAE(predictions, data),
            mape: calculateMAPE(predictions, data),
            trainingTime: bestModel.objectives.trainingTime,
            modelSize: bestModel.objectives.modelSize
        };

        return {
            params: bestModel.params,
            metrics,
            model: optimizedModel,
            optimizationHistory: result.observations,
            paretoFront: result.paretoFront
        };
    }

    getParameterRanges(modelName) {
        switch (modelName) {
            case 'HybridTimeSeriesModel':
                return {
                    arimaOrder: [
                        [1, 1, 1],
                        [2, 1, 2],
                        [3, 1, 3]
                    ],
                    xgbParams: {
                        maxDepth: { min: 3, max: 10 },
                        learningRate: { min: 0.01, max: 0.3 },
                        nEstimators: { min: 50, max: 300 }
                    }
                };
            case 'ARIMAModel':
                return {
                    p: { min: 0, max: 5 },
                    d: { min: 0, max: 2 },
                    q: { min: 0, max: 5 }
                };
            case 'XGBoostModel':
                return {
                    maxDepth: { min: 3, max: 10 },
                    learningRate: { min: 0.01, max: 0.3 },
                    nEstimators: { min: 50, max: 300 },
                    minChildWeight: { min: 1, max: 7 },
                    subsample: { min: 0.6, max: 1.0 }
                };
            case 'LSTMModel':
                return {
                    hiddenLayers: [
                        [32],
                        [64],
                        [32, 16],
                        [64, 32]
                    ],
                    learningRate: { min: 0.001, max: 0.1 },
                    batchSize: { min: 16, max: 128 },
                    epochs: { min: 50, max: 200 },
                    dropout: { min: 0.1, max: 0.5 }
                };
            default:
                return {};
        }
    }

    async detectFeatureShift(currentImportance, historicalImportance) {
        if (!historicalImportance || historicalImportance.length === 0) {
            return false;
        }

        const threshold = 0.2; // 20% change threshold
        const recentImportance = historicalImportance[historicalImportance.length - 1];

        // Compare top features
        const topFeatures = currentImportance.slice(0, 5);
        const recentTopFeatures = recentImportance.slice(0, 5);

        const hasShift = topFeatures.some((feature, index) => {
            const recentFeature = recentTopFeatures.find(f => f.name === feature.name);
            if (!recentFeature) return true;
            
            const importanceChange = Math.abs(feature.importance - recentFeature.importance);
            return importanceChange > threshold;
        });

        return hasShift;
    }

    async terminate() {
        await this.workerPool.terminate();
    }

    getStatus() {
        return this.workerPool.getStatus();
    }
}

module.exports = { ModelOptimizer }; 