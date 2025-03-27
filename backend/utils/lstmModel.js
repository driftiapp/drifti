const tf = require('@tensorflow/tfjs-node');
const { calculateRMSE } = require('./statistics');

class LSTMModel {
    constructor(config = {}) {
        this.config = {
            hiddenLayers: config.hiddenLayers || [32],
            learningRate: config.learningRate || 0.01,
            batchSize: config.batchSize || 32,
            epochs: config.epochs || 100,
            dropout: config.dropout || 0.2,
            sequenceLength: config.sequenceLength || 10,
            ...config
        };
        this.model = null;
        this.scaler = null;
    }

    // Normalize data
    normalizeData(data) {
        const mean = data.reduce((a, b) => a + b, 0) / data.length;
        const std = Math.sqrt(
            data.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / data.length
        );
        this.scaler = { mean, std };
        return data.map(x => (x - mean) / std);
    }

    // Denormalize data
    denormalizeData(data) {
        return data.map(x => x * this.scaler.std + this.scaler.mean);
    }

    // Create sequences for LSTM
    createSequences(data) {
        const sequences = [];
        const targets = [];
        
        for (let i = 0; i < data.length - this.config.sequenceLength; i++) {
            sequences.push(data.slice(i, i + this.config.sequenceLength));
            targets.push(data[i + this.config.sequenceLength]);
        }
        
        return {
            sequences: tf.tensor2d(sequences),
            targets: tf.tensor1d(targets)
        };
    }

    // Build LSTM model
    buildModel() {
        const model = tf.sequential();
        
        // Add LSTM layers
        this.config.hiddenLayers.forEach((units, index) => {
            if (index === 0) {
                model.add(tf.layers.lstm({
                    units,
                    returnSequences: this.config.hiddenLayers.length > 1,
                    inputShape: [this.config.sequenceLength, 1]
                }));
            } else {
                model.add(tf.layers.lstm({
                    units,
                    returnSequences: index < this.config.hiddenLayers.length - 1
                }));
            }
            
            // Add dropout after each LSTM layer
            model.add(tf.layers.dropout({ rate: this.config.dropout }));
        });
        
        // Add dense output layer
        model.add(tf.layers.dense({ units: 1 }));
        
        // Compile model
        model.compile({
            optimizer: tf.train.adam(this.config.learningRate),
            loss: 'meanSquaredError'
        });
        
        return model;
    }

    // Fit model to data
    async fit(data, timestamps, externalData = {}) {
        try {
            // Normalize data
            const normalizedData = this.normalizeData(data);
            
            // Create sequences
            const { sequences, targets } = this.createSequences(normalizedData);
            
            // Reshape sequences for LSTM input
            const reshapedSequences = sequences.reshape([
                sequences.shape[0],
                sequences.shape[1],
                1
            ]);
            
            // Build and train model
            this.model = this.buildModel();
            
            await this.model.fit(reshapedSequences, targets, {
                batchSize: this.config.batchSize,
                epochs: this.config.epochs,
                validationSplit: 0.2,
                callbacks: {
                    onEpochEnd: (epoch, logs) => {
                        console.log(`Epoch ${epoch + 1} of ${this.config.epochs}`);
                        console.log(`Loss: ${logs.loss.toFixed(4)}`);
                        if (logs.val_loss) {
                            console.log(`Validation Loss: ${logs.val_loss.toFixed(4)}`);
                        }
                    }
                }
            });
            
            // Clean up tensors
            sequences.dispose();
            targets.dispose();
            reshapedSequences.dispose();
            
            return true;
        } catch (error) {
            console.error('Error fitting LSTM model:', error);
            throw error;
        }
    }

    // Generate predictions
    async predict(timestamps, externalData = {}) {
        try {
            if (!this.model || !this.scaler) {
                throw new Error('Model not fitted');
            }
            
            // Create sequences for prediction
            const lastSequence = this.normalizeData(
                data.slice(-this.config.sequenceLength)
            );
            
            // Reshape for LSTM input
            const input = tf.tensor2d([lastSequence]).reshape([
                1,
                this.config.sequenceLength,
                1
            ]);
            
            // Generate predictions
            const predictions = this.model.predict(input);
            const denormalizedPredictions = this.denormalizeData(
                await predictions.data()
            );
            
            // Clean up tensors
            input.dispose();
            predictions.dispose();
            
            return denormalizedPredictions;
        } catch (error) {
            console.error('Error generating predictions:', error);
            throw error;
        }
    }

    // Get model configuration
    getConfig() {
        return {
            ...this.config,
            modelType: 'LSTM'
        };
    }
}

module.exports = { LSTMModel }; 