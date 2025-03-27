export const detectStructuralBreaks = (values, timestamps) => {
    // Perform both Chow test and CUSUM test
    const chowBreaks = performChowTest(values, timestamps);
    const cusumBreaks = performCUSUMTest(values, timestamps);
    
    // Combine and deduplicate breaks
    const allBreaks = [...new Set([...chowBreaks, ...cusumBreaks])].sort((a, b) => a - b);
    
    // Calculate confidence for each break
    const breaks = allBreaks.map(index => ({
        index,
        timestamp: timestamps[index],
        value: values[index],
        confidence: calculateBreakConfidence(values, index),
        detectedBy: {
            chow: chowBreaks.includes(index),
            cusum: cusumBreaks.includes(index)
        }
    }));
    
    // Filter breaks by confidence threshold (e.g., 95%)
    const significantBreaks = breaks.filter(b => b.confidence >= 95);
    
    return {
        breaks: significantBreaks,
        hasBreaks: significantBreaks.length > 0,
        breakCount: significantBreaks.length
    };
};

const performChowTest = (values, timestamps) => {
    const n = values.length;
    const breaks = [];
    
    // Minimum segment size (20% of data)
    const minSegmentSize = Math.floor(n * 0.2);
    
    // Test for breaks at each point
    for (let i = minSegmentSize; i < n - minSegmentSize; i++) {
        // Split data into two segments
        const segment1 = values.slice(0, i);
        const segment2 = values.slice(i);
        
        // Calculate RSS for each segment
        const rss1 = calculateRSS(segment1);
        const rss2 = calculateRSS(segment2);
        
        // Calculate RSS for full dataset
        const rssFull = calculateRSS(values);
        
        // Calculate Chow test statistic
        const k = 2; // Number of parameters (intercept and slope)
        const chowStat = ((rssFull - (rss1 + rss2)) / k) / ((rss1 + rss2) / (n - 2 * k));
        
        // Critical value for F-distribution (95% confidence)
        const criticalValue = 3.84;
        
        if (chowStat > criticalValue) {
            breaks.push(i);
        }
    }
    
    return breaks;
};

const performCUSUMTest = (values, timestamps) => {
    const n = values.length;
    const breaks = [];
    
    // Calculate cumulative sum of residuals
    const residuals = calculateResiduals(values);
    const cusum = new Array(n).fill(0);
    let sum = 0;
    
    for (let i = 0; i < n; i++) {
        sum += residuals[i];
        cusum[i] = sum;
    }
    
    // Calculate critical values
    const criticalValue = 1.36 * Math.sqrt(n);
    
    // Find points where CUSUM exceeds critical value
    for (let i = 0; i < n; i++) {
        if (Math.abs(cusum[i]) > criticalValue) {
            breaks.push(i);
        }
    }
    
    return breaks;
};

const calculateBreakConfidence = (values, breakIndex) => {
    const n = values.length;
    const segment1 = values.slice(0, breakIndex);
    const segment2 = values.slice(breakIndex);
    
    // Calculate mean and variance for each segment
    const mean1 = mean(segment1);
    const mean2 = mean(segment2);
    const var1 = calculateVariance(segment1);
    const var2 = calculateVariance(segment2);
    
    // Calculate t-statistic
    const tStat = Math.abs(mean1 - mean2) / Math.sqrt(var1 / segment1.length + var2 / segment2.length);
    
    // Calculate degrees of freedom
    const df = segment1.length + segment2.length - 2;
    
    // Calculate p-value using t-distribution
    const pValue = 2 * (1 - tCDF(tStat, df));
    
    // Convert to confidence level
    return (1 - pValue) * 100;
};

const calculateRSS = (values) => {
    const n = values.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const y = values;
    
    // Calculate linear regression
    const { slope, intercept } = calculateLinearRegression(x, y);
    
    // Calculate residuals
    const residuals = y.map((yi, i) => yi - (slope * x[i] + intercept));
    
    // Calculate RSS
    return residuals.reduce((sum, r) => sum + r * r, 0);
};

const calculateLinearRegression = (x, y) => {
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    return { slope, intercept };
};

const calculateVariance = (values) => {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    return values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / (values.length - 1);
};

const tCDF = (x, df) => {
    // Approximation of t-distribution CDF
    const a = df / 2;
    const b = 0.5;
    const c = (df + 1) / 2;
    
    return 1 - 0.5 * (1 + Math.sign(x) * (1 - betaRegularized(df / (df + x * x), a, b)));
};

const betaRegularized = (x, a, b) => {
    // Approximation of regularized incomplete beta function
    const eps = 1e-10;
    let result = 0;
    let term = 1;
    let m = 0;
    
    while (Math.abs(term) > eps) {
        result += term;
        m++;
        term *= (a + m - 1) * (b + m - 1) * x / (m * (a + b + m - 1));
    }
    
    return result;
};

const mean = (values) => values.reduce((sum, v) => sum + v, 0) / values.length; 