const { calculateRMSE } = require('./statistics');

class BayesianOptimizer {
    constructor(config = {}) {
        this.config = {
            maxIterations: config.maxIterations || 50,
            acquisitionFunction: config.acquisitionFunction || 'expected_improvement',
            noise: config.noise || 0.1,
            ...config
        };
        this.observations = [];
        this.bestValue = Infinity;
        this.bestParams = null;
    }

    // Gaussian Process kernel (RBF)
    kernel(x1, x2, lengthScale = 1.0) {
        const squaredDist = x1.reduce((sum, val, i) => 
            sum + Math.pow(val - x2[i], 2), 0);
        return Math.exp(-0.5 * squaredDist / (lengthScale * lengthScale));
    }

    // Build covariance matrix
    buildCovarianceMatrix(X, lengthScale) {
        const n = X.length;
        const K = Array(n).fill().map(() => Array(n).fill(0));
        
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                K[i][j] = this.kernel(X[i], X[j], lengthScale);
            }
        }
        
        // Add noise to diagonal
        for (let i = 0; i < n; i++) {
            K[i][i] += this.config.noise;
        }
        
        return K;
    }

    // Expected Improvement acquisition function
    expectedImprovement(mu, sigma, bestValue) {
        const z = (bestValue - mu) / sigma;
        const pdf = Math.exp(-0.5 * z * z) / Math.sqrt(2 * Math.PI);
        const cdf = 0.5 * (1 + Math.erf(z / Math.sqrt(2)));
        return (bestValue - mu) * cdf + sigma * pdf;
    }

    // Upper Confidence Bound acquisition function
    upperConfidenceBound(mu, sigma, kappa = 1.96) {
        return mu + kappa * sigma;
    }

    // Select next point to evaluate
    selectNextPoint(candidatePoints, lengthScale) {
        const X = this.observations.map(obs => obs.params);
        const y = this.observations.map(obs => obs.value);
        
        // Build covariance matrix
        const K = this.buildCovarianceMatrix(X, lengthScale);
        
        // Calculate best acquisition value
        let bestAcquisition = -Infinity;
        let bestPoint = null;
        
        for (const point of candidatePoints) {
            // Calculate mean and variance for this point
            const k = X.map(x => this.kernel(x, point, lengthScale));
            const k_star = this.kernel(point, point, lengthScale);
            
            // Solve K * alpha = y
            const alpha = this.solveLinearSystem(K, y);
            
            // Calculate mean
            const mu = k.reduce((sum, ki, i) => sum + ki * alpha[i], 0);
            
            // Calculate variance
            const v = k_star - k.reduce((sum, ki, i) => 
                sum + ki * this.solveLinearSystem(K, k)[i], 0);
            const sigma = Math.sqrt(Math.max(0, v));
            
            // Calculate acquisition value
            let acquisition;
            if (this.config.acquisitionFunction === 'expected_improvement') {
                acquisition = this.expectedImprovement(mu, sigma, this.bestValue);
            } else {
                acquisition = this.upperConfidenceBound(mu, sigma);
            }
            
            if (acquisition > bestAcquisition) {
                bestAcquisition = acquisition;
                bestPoint = point;
            }
        }
        
        return bestPoint;
    }

    // Solve linear system using Gaussian elimination
    solveLinearSystem(A, b) {
        const n = A.length;
        const augmented = A.map((row, i) => [...row, b[i]]);
        
        // Forward elimination
        for (let i = 0; i < n; i++) {
            const pivot = augmented[i][i];
            for (let j = i; j <= n; j++) {
                augmented[i][j] /= pivot;
            }
            
            for (let k = 0; k < n; k++) {
                if (k !== i) {
                    const factor = augmented[k][i];
                    for (let j = i; j <= n; j++) {
                        augmented[k][j] -= factor * augmented[i][j];
                    }
                }
            }
        }
        
        return augmented.map(row => row[n]);
    }

    // Generate candidate points
    generateCandidatePoints(paramRanges) {
        const candidates = [];
        const numCandidates = 1000;
        
        for (let i = 0; i < numCandidates; i++) {
            const point = Object.entries(paramRanges).map(([key, range]) => {
                if (Array.isArray(range)) {
                    // Discrete parameter
                    const idx = Math.floor(Math.random() * range.length);
                    return range[idx];
                } else {
                    // Continuous parameter
                    return range.min + Math.random() * (range.max - range.min);
                }
            });
            candidates.push(point);
        }
        
        return candidates;
    }

    // Optimize hyperparameters
    async optimize(objectiveFn, paramRanges) {
        // Initial random points
        const numInitial = 5;
        for (let i = 0; i < numInitial; i++) {
            const params = Object.entries(paramRanges).map(([key, range]) => {
                if (Array.isArray(range)) {
                    const idx = Math.floor(Math.random() * range.length);
                    return range[idx];
                } else {
                    return range.min + Math.random() * (range.max - range.min);
                }
            });
            
            const value = await objectiveFn(params);
            this.observations.push({ params, value });
            
            if (value < this.bestValue) {
                this.bestValue = value;
                this.bestParams = params;
            }
        }
        
        // Bayesian Optimization loop
        for (let i = 0; i < this.config.maxIterations; i++) {
            const candidatePoints = this.generateCandidatePoints(paramRanges);
            const nextPoint = this.selectNextPoint(candidatePoints, 1.0);
            
            const value = await objectiveFn(nextPoint);
            this.observations.push({ params: nextPoint, value });
            
            if (value < this.bestValue) {
                this.bestValue = value;
                this.bestParams = nextPoint;
            }
        }
        
        return {
            bestParams: this.bestParams,
            bestValue: this.bestValue,
            observations: this.observations
        };
    }
}

module.exports = { BayesianOptimizer }; 