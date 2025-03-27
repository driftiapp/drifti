const { calculateRMSE } = require('./statistics');

class MultiObjectiveTPE {
    constructor(config = {}) {
        this.config = {
            maxIterations: config.maxIterations || 50,
            nInitialPoints: config.nInitialPoints || 10,
            gamma: config.gamma || 0.25,
            objectives: config.objectives || [
                { name: 'rmse', weight: 1.0, minimize: true },
                { name: 'trainingTime', weight: 0.5, minimize: true },
                { name: 'modelSize', weight: 0.3, minimize: true }
            ],
            acquisitionFunction: config.acquisitionFunction || 'ei',
            ...config
        };
        this.observations = [];
        this.paretoFront = [];
    }

    // Calculate Pareto dominance
    dominates(point1, point2) {
        let betterInAny = false;
        let worseInAny = false;

        for (const objective of this.config.objectives) {
            const value1 = point1.objectives[objective.name];
            const value2 = point2.objectives[objective.name];
            
            if (objective.minimize) {
                if (value1 < value2) betterInAny = true;
                if (value1 > value2) worseInAny = true;
            } else {
                if (value1 > value2) betterInAny = true;
                if (value1 < value2) worseInAny = true;
            }
        }

        return betterInAny && !worseInAny;
    }

    // Update Pareto front
    updateParetoFront(newPoint) {
        // Remove dominated points
        this.paretoFront = this.paretoFront.filter(point => !this.dominates(newPoint, point));
        
        // Add new point if it's not dominated
        if (!this.paretoFront.some(point => this.dominates(point, newPoint))) {
            this.paretoFront.push(newPoint);
        }
    }

    // Expected Improvement acquisition function
    calculateEI(x, goodObs, badObs) {
        const bestValue = Math.min(...goodObs.map(obs => obs.value));
        const ratio = this.calculateRatio(x, goodObs, badObs);
        return ratio * (bestValue - this.bestValue);
    }

    // Upper Confidence Bound acquisition function
    calculateUCB(x, goodObs, badObs) {
        const gmm = this.fitGMM(goodObs, true);
        const mean = gmm.mean;
        const std = gmm.std;
        const kappa = 1.96; // 95% confidence interval
        return mean + kappa * std;
    }

    // Entropy Search acquisition function
    calculateEntropy(x, goodObs, badObs) {
        const gmm = this.fitGMM(goodObs, true);
        const std = gmm.std;
        return Math.log(std);
    }

    // Calculate acquisition function value
    calculateAcquisition(x, goodObs, badObs) {
        switch (this.config.acquisitionFunction) {
            case 'ei':
                return this.calculateEI(x, goodObs, badObs);
            case 'ucb':
                return this.calculateUCB(x, goodObs, badObs);
            case 'entropy':
                return this.calculateEntropy(x, goodObs, badObs);
            default:
                return this.calculateEI(x, goodObs, badObs);
        }
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

        // Sort observations by weighted objective value
        const sortedObs = [...this.observations].sort((a, b) => {
            const valueA = this.calculateWeightedObjective(a.objectives);
            const valueB = this.calculateWeightedObjective(b.objectives);
            return valueA - valueB;
        });

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

        // Select best candidate based on acquisition function
        let bestCandidate = null;
        let bestScore = -Infinity;

        for (const candidate of candidates) {
            const score = this.calculateAcquisition(candidate, goodObs, badObs);
            if (score > bestScore) {
                bestScore = score;
                bestCandidate = candidate;
            }
        }

        return bestCandidate;
    }

    // Calculate weighted objective value
    calculateWeightedObjective(objectives) {
        return this.config.objectives.reduce((sum, obj) => {
            const value = objectives[obj.name];
            return sum + obj.weight * (obj.minimize ? value : -value);
        }, 0);
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

    // Optimize hyperparameters
    async optimize(objectiveFn, paramRanges) {
        // Initial random points
        for (let i = 0; i < this.config.nInitialPoints; i++) {
            const params = this.sampleRandomPoint(paramRanges);
            const objectives = await objectiveFn(params);
            const observation = { params, objectives };
            this.observations.push(observation);
            this.updateParetoFront(observation);
        }
        
        // TPE optimization loop
        for (let i = 0; i < this.config.maxIterations; i++) {
            const nextPoint = this.selectNextPoint(paramRanges);
            const objectives = await objectiveFn(nextPoint);
            const observation = { params: nextPoint, objectives };
            this.observations.push(observation);
            this.updateParetoFront(observation);
        }
        
        return {
            paretoFront: this.paretoFront,
            observations: this.observations
        };
    }
}

module.exports = { MultiObjectiveTPE }; 