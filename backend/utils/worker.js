const { parentPort, workerData } = require('worker_threads');
const { HybridTimeSeriesModel } = require('./hybridTimeSeriesModel');
const { ARIMAModel } = require('./arimaModel');
const { XGBoostModel } = require('./xgboostModel');
const { LSTMModel } = require('./lstmModel');
const { calculateRMSE, calculateMAE, calculateMAPE } = require('./statistics');

class ModelWorker {
    constructor() {
        this.models = {
            Hybrid: HybridTimeSeriesModel,
            ARIMA: ARIMAModel,
            XGBoost: XGBoostModel,
            LSTM: LSTMModel
        };
    }

    async evaluateModel(modelInfo, data, timestamps, externalData, validationSize) {
        try {
            // Split data into training and validation sets
            const splitIndex = Math.floor(data.length * (1 - validationSize));
            const trainData = data.slice(0, splitIndex);
            const trainTimestamps = timestamps.slice(0, splitIndex);
            const valData = data.slice(splitIndex);
            const valTimestamps = timestamps.slice(splitIndex);

            // Initialize and train model
            const model = new this.models[modelInfo.name]();
            const startTime = Date.now();
            await model.fit(trainData, trainTimestamps, externalData);
            const trainingTime = (Date.now() - startTime) / 1000;

            // Generate predictions
            const predictions = await model.predict(valTimestamps, externalData);

            // Calculate metrics
            const metrics = {
                rmse: calculateRMSE(predictions, valData),
                mae: calculateMAE(predictions, valData),
                mape: calculateMAPE(predictions, valData),
                trainingTime,
                modelSize: this.calculateModelSize(model)
            };

            return {
                name: modelInfo.name,
                metrics,
                config: model.getConfig()
            };
        } catch (error) {
            console.error(`Error evaluating ${modelInfo.name} model:`, error);
            return null;
        }
    }

    calculateModelSize(model) {
        if (model instanceof LSTMModel) {
            let totalParams = 0;
            model.model.layers.forEach(layer => {
                if (layer instanceof tf.layers.LSTM) {
                    const units = layer.units;
                    const inputShape = layer.inputShape[1];
                    totalParams += 4 * (inputShape * units + units * units + units);
                }
            });
            return totalParams;
        } else if (model instanceof XGBoostModel) {
            return model.model.getNumTrees();
        } else if (model instanceof ARIMAModel) {
            const { p, d, q } = model.config;
            return p + d + q;
        } else {
            return this.calculateModelSize(model.arimaModel) + this.calculateModelSize(model.xgbModel);
        }
    }

    async optimizeHyperparameters(modelName, params, data, timestamps, externalData) {
        try {
            const modelClass = this.models[modelName];
            const model = new modelClass(params);
            const startTime = Date.now();
            
            await model.fit(data, timestamps, externalData);
            const trainingTime = (Date.now() - startTime) / 1000;
            
            const predictions = await model.predict(timestamps, externalData);
            const modelSize = this.calculateModelSize(model);
            
            return {
                rmse: calculateRMSE(predictions, data),
                trainingTime,
                modelSize
            };
        } catch (error) {
            console.error('Error in hyperparameter optimization:', error);
            return {
                rmse: Infinity,
                trainingTime: Infinity,
                modelSize: Infinity
            };
        }
    }
}

// Initialize worker
const worker = new ModelWorker();

// Handle messages from main thread
parentPort.on('message', async (message) => {
    try {
        let result;
        switch (message.type) {
            case 'evaluate':
                result = await worker.evaluateModel(
                    message.modelInfo,
                    message.data,
                    message.timestamps,
                    message.externalData,
                    message.validationSize
                );
                break;
            case 'optimize':
                result = await worker.optimizeHyperparameters(
                    message.modelName,
                    message.params,
                    message.data,
                    message.timestamps,
                    message.externalData
                );
                break;
            default:
                throw new Error(`Unknown message type: ${message.type}`);
        }
        parentPort.postMessage({ success: true, result });
    } catch (error) {
        parentPort.postMessage({ success: false, error: error.message });
    }
}); 