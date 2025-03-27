/**
 * Calculate the volatility (standard deviation of returns) of a time series
 * @param {number[]} data - Array of time series values
 * @returns {number} Volatility measure
 */
const calculateVolatility = (data) => {
    if (data.length < 2) return 0;
    
    // Calculate returns
    const returns = data.slice(1).map((value, i) => 
        (value - data[i]) / data[i]
    );
    
    // Calculate mean return
    const meanReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    
    // Calculate standard deviation of returns
    const variance = returns.reduce((sq, n) => 
        sq + Math.pow(n - meanReturn, 2), 0) / returns.length;
    
    return Math.sqrt(variance);
};

/**
 * Calculate the mean absolute error (MAE) between predicted and actual values
 * @param {number[]} predictions - Array of predicted values
 * @param {number[]} actual - Array of actual values
 * @returns {number} Mean absolute error
 */
const calculateMAE = (predictions, actual) => {
    if (predictions.length !== actual.length) {
        throw new Error('Predictions and actual arrays must have the same length');
    }
    
    return predictions.reduce((sum, pred, i) => 
        sum + Math.abs(pred - actual[i]), 0) / predictions.length;
};

/**
 * Calculate the root mean square error (RMSE) between predicted and actual values
 * @param {number[]} predictions - Array of predicted values
 * @param {number[]} actual - Array of actual values
 * @returns {number} Root mean square error
 */
const calculateRMSE = (predictions, actual) => {
    if (predictions.length !== actual.length) {
        throw new Error('Predictions and actual arrays must have the same length');
    }
    
    const mse = predictions.reduce((sum, pred, i) => 
        sum + Math.pow(pred - actual[i], 2), 0) / predictions.length;
    
    return Math.sqrt(mse);
};

/**
 * Calculate the mean absolute percentage error (MAPE) between predicted and actual values
 * @param {number[]} predictions - Array of predicted values
 * @param {number[]} actual - Array of actual values
 * @returns {number} Mean absolute percentage error
 */
const calculateMAPE = (predictions, actual) => {
    if (predictions.length !== actual.length) {
        throw new Error('Predictions and actual arrays must have the same length');
    }
    
    return predictions.reduce((sum, pred, i) => 
        sum + Math.abs((pred - actual[i]) / actual[i]), 0) / predictions.length * 100;
};

/**
 * Calculate the autocorrelation of a time series at a given lag
 * @param {number[]} data - Array of time series values
 * @param {number} lag - Lag to calculate autocorrelation for
 * @returns {number} Autocorrelation coefficient
 */
const calculateAutocorrelation = (data, lag) => {
    if (lag >= data.length) {
        throw new Error('Lag must be less than data length');
    }
    
    const mean = data.reduce((a, b) => a + b, 0) / data.length;
    const variance = data.reduce((sq, n) => 
        sq + Math.pow(n - mean, 2), 0) / data.length;
    
    const numerator = data.slice(lag).reduce((sum, value, i) => 
        sum + (value - mean) * (data[i] - mean), 0);
    
    return numerator / (variance * (data.length - lag));
};

module.exports = {
    calculateVolatility,
    calculateMAE,
    calculateRMSE,
    calculateMAPE,
    calculateAutocorrelation
}; 