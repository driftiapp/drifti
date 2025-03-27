const { calculateRMSE } = require('./statistics');

class TPEOptimizer {
    constructor(config = {}) {
        this.config = {
            maxIterations: config.maxIterations || 50,
            nInitialPoints: config.nInitialPoints || 10,
            gamma: config.gamma || 0.25, // Fraction of observations to use for l(x)
            ...config
        };
        this.observations = [];
        this.bestValue = Infinity;
        this.bestParams = null;
    }

    // Fit a Gaussian mixture model to the observations
    fitGMM(observations, isGood) {
        const values = observations.map(obs => obs.value);
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const std = Math.sqrt(
            values.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / values.length
        );
        return { mean, std };
    }

    // Calculate the ratio of good to bad observations
    calculateRatio(x, goodObs, badObs) {
        const goodGMM = this.fitGMM(goodObs, true);
        const badGMM = this.fitGMM(badObs, false);

        const goodPDF = this.gaussianPDF(x, goodGMM.mean, goodGMM.std);
        const badPDF = this.gaussianPDF(x, badGMM.mean, badGMM.std);

        return goodPDF / (goodPDF + badPDF);
    }

    // Calculate Gaussian probability density
    gaussianPDF(x, mean, std) {
        return Math.exp(-0.5 * Math.pow((x - mean) / std, 2));
    }

    // Sample from the good observations distribution
    sampleFromGood(goodObs) {
        const gmm = this.fitGMM(goodObs, true);
        return gmm.mean + gmm.std * this.boxMuller();
    }

    // Box-Muller transform for normal distribution sampling
    boxMuller() {
        const u1 = Math.random();
        const u2 = Math.random();
        return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    }

    // Select next point to evaluate
    selectNextPoint(paramRanges) {
        if (this.observations.length < this.config.nInitialPoints) {
            return this.sampleRandomPoint(paramRanges);
        }

        // Sort observations by value
        const sortedObs = [...this.observations].sort((a, b) => a.value - b.value);
        const nGood = Math.max(1, Math.floor(this.config.gamma * sortedObs.length));
        
        const goodObs = sortedObs.slice(0, nGood);
        const badObs = sortedObs.slice(nGood);

        // Sample new points
        const candidates = [];
        const numCandidates = 1000;

        for (let i = 0; i < numCandidates; i++) {
            const candidate = this.sampleCandidate(paramRanges, goodObs, badObs);
            candidates.push(candidate);
        }

        // Select best candidate based on expected improvement
        let bestCandidate = null;
        let bestScore = -Infinity;

        for (const candidate of candidates) {
            const score = this.calculateExpectedImprovement(candidate, goodObs, badObs);
            if (score > bestScore) {
                bestScore = score;
                bestCandidate = candidate;
            }
        }

        return bestCandidate;
    }

    // Sample a random point from parameter ranges
    sampleRandomPoint(paramRanges) {
        return Object.entries(paramRanges).map(([key, range]) => {
            if (Array.isArray(range)) {
                const idx = Math.floor(Math.random() * range.length);
                return range[idx];
            } else {
                return range.min + Math.random() * (range.max - range.min);
            }
        });
    }

    // Sample a candidate point using TPE
    sampleCandidate(paramRanges, goodObs, badObs) {
        return Object.entries(paramRanges).map(([key, range]) => {
            if (Array.isArray(range)) {
                // Discrete parameter
                const idx = Math.floor(Math.random() * range.length);
                return range[idx];
            } else {
                // Continuous parameter
                const value = this.sampleFromGood(goodObs);
                return Math.max(range.min, Math.min(range.max, value));
            }
        });
    }

    // Calculate expected improvement for a candidate
    calculateExpectedImprovement(candidate, goodObs, badObs) {
        const bestValue = Math.min(...goodObs.map(obs => obs.value));
        const ratio = this.calculateRatio(candidate, goodObs, badObs);
        return ratio * (bestValue - this.bestValue);
    }

    // Optimize hyperparameters
    async optimize(objectiveFn, paramRanges) {
        // Initial random points
        for (let i = 0; i < this.config.nInitialPoints; i++) {
            const params = this.sampleRandomPoint(paramRanges);
            const value = await objectiveFn(params);
            this.observations.push({ params, value });
            
            if (value < this.bestValue) {
                this.bestValue = value;
                this.bestParams = params;
            }
        }
        
        // TPE optimization loop
        for (let i = 0; i < this.config.maxIterations; i++) {
            const nextPoint = this.selectNextPoint(paramRanges);
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

module.exports = { TPEOptimizer }; 