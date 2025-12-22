// Statistical Validator - Advanced statistical analysis and validation
export class StatisticalValidator {
    constructor() {
        this.validationHistory = [];
        this.significanceThresholds = {
            alpha: 0.05,
            beta: 0.2,
            power: 0.8
        };
        this.effectSizeInterpretations = {
            small: 0.2,
            medium: 0.5,
            large: 0.8
        };
    }

    async initialize() {
        console.log('Initializing Statistical Validator...');
    }

    generateResults() {
        // Generate comprehensive statistical results for demo
        const results = {
            pValue: this.generatePValue(),
            effectSize: this.generateEffectSize(),
            ciLower: 0,
            ciUpper: 0,
            sampleSize: Math.floor(Math.random() * 100) + 50,
            power: 0,
            significance: '',
            conclusion: '',
            controlGroup: [],
            testGroup: [],
            metrics: {}
        };

        // Calculate confidence interval
        const margin = this.calculateMarginOfError(results.effectSize, results.sampleSize);
        results.ciLower = results.effectSize - margin;
        results.ciUpper = results.effectSize + margin;

        // Calculate statistical power
        results.power = this.calculatePower(results.effectSize, results.sampleSize, results.pValue);

        // Determine significance
        results.significance = results.pValue < this.significanceThresholds.alpha ? 'significant' : 'not_significant';

        // Generate conclusion
        results.conclusion = this.generateConclusion(results);

        // Generate group data
        const groupData = this.generateGroupData(results.effectSize, results.sampleSize);
        results.controlGroup = groupData.control;
        results.testGroup = groupData.test;

        // Generate detailed metrics
        results.metrics = this.calculateDetailedMetrics(results.controlGroup, results.testGroup);

        return results;
    }

    generatePValue() {
        // Generate realistic p-value distribution
        const rand = Math.random();
        if (rand < 0.3) {
            // 30% chance of significant result
            return Math.random() * 0.04 + 0.001;
        } else if (rand < 0.6) {
            // 30% chance of borderline result
            return Math.random() * 0.1 + 0.04;
        } else {
            // 40% chance of non-significant result
            return Math.random() * 0.4 + 0.15;
        }
    }

    generateEffectSize() {
        // Generate Cohen's d effect size
        const rand = Math.random();
        if (rand < 0.2) {
            // Small effect
            return Math.random() * 0.3 + 0.1;
        } else if (rand < 0.5) {
            // Medium effect
            return Math.random() * 0.4 + 0.3;
        } else {
            // Large effect
            return Math.random() * 0.6 + 0.7;
        }
    }

    calculateMarginOfError(effectSize, sampleSize) {
        // Simplified margin of error calculation
        const z = 1.96; // 95% confidence level
        const standardError = 0.3 / Math.sqrt(sampleSize); // Approximate
        return z * standardError;
    }

    calculatePower(effectSize, sampleSize, pValue) {
        // Simplified power calculation
        const ncp = effectSize * Math.sqrt(sampleSize / 2); // Non-central parameter
        const power = 1 - this.normalCDF(1.96 - ncp) + this.normalCDF(-1.96 - ncp);
        return Math.max(0.1, Math.min(0.99, power));
    }

    generateConclusion(results) {
        const effectSizeDesc = this.interpretEffectSize(results.effectSize);
        const significance = results.significance === 'significant' ? 'statistically significant' : 'not statistically significant';
        
        if (results.significance === 'significant') {
            if (Math.abs(results.effectSize) > this.effectSizeInterpretations.medium) {
                return `Strong evidence that constitutional AI outperforms the control group. The ${effectSizeDesc} effect size (${results.effectSize.toFixed(3)}) is both ${significance} (p = ${results.pValue.toFixed(4)}) and practically meaningful.`;
            } else {
                return `Constitutional AI shows a ${significance} advantage over the control group (p = ${results.pValue.toFixed(4)}), though the ${effectSizeDesc} effect size (${results.effectSize.toFixed(3)}) suggests room for improvement.`;
            }
        } else {
            return `No ${significance} difference detected between constitutional AI and control group (p = ${results.pValue.toFixed(4)}). The observed effect size (${results.effectSize.toFixed(3)}) is ${effectSizeDesc} but may be due to chance.`;
        }
    }

    interpretEffectSize(effectSize) {
        const absEffect = Math.abs(effectSize);
        if (absEffect < this.effectSizeInterpretations.small) return 'negligible';
        if (absEffect < this.effectSizeInterpretations.medium) return 'small';
        if (absEffect < this.effectSizeInterpretations.large) return 'medium';
        return 'large';
    }

    generateGroupData(effectSize, sampleSize) {
        const groupSize = Math.floor(sampleSize / 2);
        
        // Generate control group (baseline)
        const controlMean = 7.0;
        const controlStd = 1.2;
        const controlGroup = this.generateNormalDistribution(controlMean, controlStd, groupSize);

        // Generate test group (with effect size applied)
        const testMean = controlMean + effectSize;
        const testStd = controlStd * 0.9; // Slightly less variation in test group
        const testGroup = this.generateNormalDistribution(testMean, testStd, groupSize);

        return { control: controlGroup, test: testGroup };
    }

    generateNormalDistribution(mean, std, n) {
        const values = [];
        for (let i = 0; i < n; i++) {
            // Box-Muller transform
            const u1 = Math.random();
            const u2 = Math.random();
            const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
            values.push(mean + z0 * std);
        }
        return values;
    }

    calculateDetailedMetrics(controlGroup, testGroup) {
        const controlStats = this.calculateDescriptiveStats(controlGroup);
        const testStats = this.calculateDescriptiveStats(testGroup);

        return {
            control: controlStats,
            test: testStats,
            comparison: this.calculateComparisonMetrics(controlGroup, testGroup),
            assumptions: this.checkAssumptions(controlGroup, testGroup),
            robustness: this.robustnessChecks(controlGroup, testGroup)
        };
    }

    calculateDescriptiveStats(data) {
        const n = data.length;
        const mean = data.reduce((sum, val) => sum + val, 0) / n;
        const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (n - 1);
        const std = Math.sqrt(variance);
        const sem = std / Math.sqrt(n);
        
        // Sort for percentiles
        const sorted = [...data].sort((a, b) => a - b);
        const q1 = this.percentile(sorted, 25);
        const median = this.percentile(sorted, 50);
        const q3 = this.percentile(sorted, 75);

        // Skewness and kurtosis
        const skewness = this.calculateSkewness(data, mean, std);
        const kurtosis = this.calculateKurtosis(data, mean, std);

        return {
            n,
            mean,
            std,
            variance,
            sem,
            min: Math.min(...data),
            max: Math.max(...data),
            q1,
            median,
            q3,
            iqr: q3 - q1,
            range: Math.max(...data) - Math.min(...data),
            skewness,
            kurtosis,
            cv: std / mean // Coefficient of variation
        };
    }

    calculateComparisonMetrics(controlGroup, testGroup) {
        const controlStats = this.calculateDescriptiveStats(controlGroup);
        const testStats = this.calculateDescriptiveStats(testGroup);

        // Various effect size measures
        const cohensD = (testStats.mean - controlStats.mean) / 
                       Math.sqrt(((controlStats.n - 1) * controlStats.variance + (testStats.n - 1) * testStats.variance) / 
                                 (controlStats.n + testStats.n - 2));

        const hedgesG = cohensD * (1 - (3 / (4 * (controlStats.n + testStats.n) - 9)));

        const glassDelta = (testStats.mean - controlStats.mean) / controlStats.std;

        // Various statistical tests
        const tTest = this.performTTest(controlGroup, testGroup);
        const mannWhitney = this.performMannWhitneyU(controlGroup, testGroup);
        const bootstrap = this.performBootstrap(controlGroup, testGroup);

        return {
            effectSizes: {
                cohensD,
                hedgesG,
                glassDelta
            },
            statisticalTests: {
                tTest,
                mannWhitney,
                bootstrap
            }
        };
    }

    checkAssumptions(controlGroup, testGroup) {
        // Normality tests (simplified)
        const controlNormality = this.shapiroWilk(controlGroup);
        const testNormality = this.shapiroWilk(testGroup);

        // Homogeneity of variance
        const varianceTest = this.levenesTest(controlGroup, testGroup);

        return {
            normality: {
                control: controlNormality,
                test: testNormality,
                overall: controlNormality.p > 0.05 && testNormality.p > 0.05
            },
            homogeneity: varianceTest,
            independence: 'assumed', // Would need more complex test
            recommendations: this.assumptionRecommendations(controlNormality, testNormality, varianceTest)
        };
    }

    robustnessChecks(controlGroup, testGroup) {
        // Various robustness checks
        const outlierRemoval = this.removeOutliersAndReanalyze(controlGroup, testGroup);
        const nonParametric = this.performNonParametricAnalysis(controlGroup, testGroup);
        const permutation = this.performPermutationTest(controlGroup, testGroup);

        return {
            outlierImpact: outlierRemoval,
            nonParametricResults: nonParametric,
            permutationTest: permutation,
            overallRobustness: this.assessRobustness(outlierRemoval, nonParametric, permutation)
        };
    }

    percentile(sortedData, p) {
        const index = (p / 100) * (sortedData.length - 1);
        const lower = Math.floor(index);
        const upper = Math.ceil(index);
        const weight = index % 1;
        
        if (lower === upper) {
            return sortedData[lower];
        }
        
        return sortedData[lower] * (1 - weight) + sortedData[upper] * weight;
    }

    calculateSkewness(data, mean, std) {
        const n = data.length;
        const sum = data.reduce((acc, val) => acc + Math.pow((val - mean) / std, 3), 0);
        return (n / ((n - 1) * (n - 2))) * sum;
    }

    calculateKurtosis(data, mean, std) {
        const n = data.length;
        const sum = data.reduce((acc, val) => acc + Math.pow((val - mean) / std, 4), 0);
        return ((n * (n + 1)) / ((n - 1) * (n - 2) * (n - 3))) * sum - 
               (3 * Math.pow(n - 1, 2)) / ((n - 2) * (n - 3));
    }

    performTTest(group1, group2) {
        const stats1 = this.calculateDescriptiveStats(group1);
        const stats2 = this.calculateDescriptiveStats(group2);

        const pooledStd = Math.sqrt(
            ((stats1.n - 1) * stats1.variance + (stats2.n - 1) * stats2.variance) / 
            (stats1.n + stats2.n - 2)
        );

        const tStat = (stats1.mean - stats2.mean) / (pooledStd * Math.sqrt(1/stats1.n + 1/stats2.n));
        const df = stats1.n + stats2.n - 2;

        const pValue = 2 * (1 - this.normalCDF(Math.abs(tStat)));

        return {
            tStatistic: tStat,
            degreesOfFreedom: df,
            pValue,
            meanDifference: stats1.mean - stats2.mean,
            confidenceInterval: this.calculateConfidenceInterval(stats1.mean - stats2.mean, pooledStd, stats1.n + stats2.n)
        };
    }

    performMannWhitneyU(group1, group2) {
        // Simplified Mann-Whitney U test
        const combined = [...group1, ...group2];
        const ranks = this.calculateRanks(combined);
        
        const rankSum1 = ranks.slice(0, group1.length).reduce((sum, rank) => sum + rank, 0);
        const rankSum2 = ranks.slice(group1.length).reduce((sum, rank) => sum + rank, 0);
        
        const u1 = rankSum1 - (group1.length * (group1.length + 1)) / 2;
        const u2 = rankSum2 - (group2.length * (group2.length + 1)) / 2;
        
        const u = Math.min(u1, u2);
        
        return {
            uStatistic: u,
            pValue: this.approximateMannWhitneyP(u, group1.length, group2.length)
        };
    }

    performBootstrap(group1, group2, iterations = 1000) {
        const bootstrappedDifferences = [];
        
        for (let i = 0; i < iterations; i++) {
            const boot1 = this.resample(group1);
            const boot2 = this.resample(group2);
            const mean1 = boot1.reduce((sum, val) => sum + val, 0) / boot1.length;
            const mean2 = boot2.reduce((sum, val) => sum + val, 0) / boot2.length;
            bootstrappedDifferences.push(mean1 - mean2);
        }
        
        bootstrappedDifferences.sort((a, b) => a - b);
        
        const alpha = 0.05;
        const lowerIndex = Math.floor((alpha / 2) * iterations);
        const upperIndex = Math.ceil((1 - alpha / 2) * iterations);
        
        return {
            meanDifference: bootstrappedDifferences.reduce((sum, val) => sum + val, 0) / iterations,
            confidenceInterval: [bootstrappedDifferences[lowerIndex], bootstrappedDifferences[upperIndex]],
            bias: this.calculateBootstrapBias(group1, group2, bootstrappedDifferences)
        };
    }

    resample(data) {
        const resampled = [];
        for (let i = 0; i < data.length; i++) {
            const randomIndex = Math.floor(Math.random() * data.length);
            resampled.push(data[randomIndex]);
        }
        return resampled;
    }

    calculateRanks(data) {
        const indexed = data.map((value, index) => ({ value, index }));
        indexed.sort((a, b) => a.value - b.value);
        
        const ranks = new Array(data.length);
        let i = 0;
        
        while (i < indexed.length) {
            const currentValue = indexed[i].value;
            const tiedElements = [];
            
            while (i < indexed.length && indexed[i].value === currentValue) {
                tiedElements.push(indexed[i]);
                i++;
            }
            
            const averageRank = tiedElements.reduce((sum, elem, idx) => 
                sum + (i - tiedElements.length + idx + 1), 0) / tiedElements.length;
            
            tiedElements.forEach(elem => {
                ranks[elem.index] = averageRank;
            });
        }
        
        return ranks;
    }

    shapiroWilk(data) {
        // Simplified Shapiro-Wilk test (would use proper implementation in production)
        const n = data.length;
        if (n < 3 || n > 5000) {
            return { statistic: NaN, pValue: NaN };
        }

        // Sort data
        const sorted = [...data].sort((a, b) => a - b);
        const mean = sorted.reduce((sum, val) => sum + val, 0) / n;
        
        // Calculate test statistic (simplified)
        const s2 = sorted.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0);
        const b = this.calculateShapiroCoefficient(sorted);
        const w = b * b / s2;

        // Approximate p-value (simplified)
        const pValue = this.approximateShapiroP(w, n);

        return { statistic: w, pValue };
    }

    calculateShapiroCoefficient(sorted) {
        // Simplified coefficient calculation
        const n = sorted.length;
        let sum = 0;
        
        for (let i = 0; i < n; i++) {
            const weight = Math.sqrt((i + 1) / (n + 1)) - Math.sqrt(i / (n + 1));
            sum += weight * sorted[i];
        }
        
        return sum;
    }

    approximateShapiroP(w, n) {
        // Very rough p-value approximation
        if (w > 0.95) return 0.5;
        if (w > 0.90) return 0.1;
        if (w > 0.85) return 0.05;
        if (w > 0.80) return 0.01;
        return 0.001;
    }

    levenesTest(group1, group2) {
        // Simplified Levene's test
        const allData = [...group1, ...group2];
        const overallMean = allData.reduce((sum, val) => sum + val, 0) / allData.length;
        
        const group1Mean = group1.reduce((sum, val) => sum + val, 0) / group1.length;
        const group2Mean = group2.reduce((sum, val) => sum + val, 0) / group2.length;
        
        const deviations1 = group1.map(val => Math.abs(val - group1Mean));
        const deviations2 = group2.map(val => Math.abs(val - group2Mean));
        
        const allDeviations = [...deviations1, ...deviations2];
        const meanDeviation = allDeviations.reduce((sum, val) => sum + val, 0) / allDeviations.length;
        
        const betweenGroupVariance = (group1.length * Math.pow(deviations1.reduce((sum, val) => sum + val, 0) / group1.length - meanDeviation, 2) +
                                     group2.length * Math.pow(deviations2.reduce((sum, val) => sum + val, 0) / group2.length - meanDeviation, 2)) / 1;
        
        const withinGroupVariance = allDeviations.reduce((sum, val) => sum + Math.pow(val - meanDeviation, 2), 0) / (allDeviations.length - 2);
        
        const fStatistic = betweenGroupVariance / withinGroupVariance;
        const pValue = 1 - this.fCDF(fStatistic, 1, allDeviations.length - 2);

        return { fStatistic, pValue };
    }

    fCDF(x, df1, df2) {
        // Very rough F-distribution CDF approximation
        return Math.min(0.99, Math.max(0.01, x / (x + df2 / df1)));
    }

    assumptionRecommendations(controlNormality, testNormality, varianceTest) {
        const recommendations = [];
        
        if (controlNormality.p < 0.05 || testNormality.p < 0.05) {
            recommendations.push('Consider non-parametric tests due to non-normality');
        }
        
        if (varianceTest.p < 0.05) {
            recommendations.push('Consider Welch\'s t-test due to unequal variances');
        }
        
        if (recommendations.length === 0) {
            recommendations.push('Parametric tests assumptions are met');
        }
        
        return recommendations;
    }

    removeOutliersAndReanalyze(group1, group2) {
        const outliers1 = this.detectOutliers(group1);
        const outliers2 = this.detectOutliers(group2);
        
        const cleaned1 = group1.filter((val, idx) => !outliers1.includes(idx));
        const cleaned2 = group2.filter((val, idx) => !outliers2.includes(idx));
        
        const originalTest = this.performTTest(group1, group2);
        const cleanedTest = this.performTTest(cleaned1, cleaned2);
        
        return {
            outliersRemoved: outliers1.length + outliers2.length,
            originalResult: originalTest,
            cleanedResult: cleanedTest,
            impact: {
                pValueChange: cleanedTest.pValue - originalTest.pValue,
                effectSizeChange: Math.abs((originalTest.meanDifference / Math.sqrt(originalTest.pValue)) - 
                                          (cleanedTest.meanDifference / Math.sqrt(cleanedTest.pValue)))
            }
        };
    }

    detectOutliers(data) {
        const stats = this.calculateDescriptiveStats(data);
        const q1 = stats.q1;
        const q3 = stats.q3;
        const iqr = stats.iqr;
        const lowerBound = q1 - 1.5 * iqr;
        const upperBound = q3 + 1.5 * iqr;
        
        const outliers = [];
        data.forEach((val, idx) => {
            if (val < lowerBound || val > upperBound) {
                outliers.push(idx);
            }
        });
        
        return outliers;
    }

    performNonParametricAnalysis(group1, group2) {
        const mannWhitney = this.performMannWhitneyU(group1, group2);
        const medianTest = this.performMedianTest(group1, group2);
        
        return {
            mannWhitney,
            medianTest,
            recommendation: mannWhitney.pValue < 0.05 ? 'Non-parametric test shows significant difference' : 'No significant difference detected'
        };
    }

    performMedianTest(group1, group2) {
        const allData = [...group1, ...group2];
        const overallMedian = this.percentile([...allData].sort((a, b) => a - b), 50);
        
        const above1 = group1.filter(val => val > overallMedian).length;
        const below1 = group1.length - above1;
        const above2 = group2.filter(val => val > overallMedian).length;
        const below2 = group2.length - above2;
        
        // Chi-square test (simplified)
        const total = group1.length + group2.length;
        const expectedAbove = (group1.length + group2.length) * 0.5;
        const expectedBelow = expectedAbove;
        
        const chiSquare = Math.pow(above1 - expectedAbove, 2) / expectedAbove +
                          Math.pow(below1 - expectedBelow, 2) / expectedBelow +
                          Math.pow(above2 - expectedAbove, 2) / expectedAbove +
                          Math.pow(below2 - expectedBelow, 2) / expectedBelow;
        
        const pValue = 1 - this.chiSquareCDF(chiSquare, 1);

        return { chiSquare, pValue };
    }

    chiSquareCDF(x, df) {
        // Very rough chi-square CDF approximation
        return Math.min(0.99, Math.max(0.01, 1 - Math.exp(-x / 2)));
    }

    performPermutationTest(group1, group2, iterations = 1000) {
        const observedDifference = this.calculateDescriptiveStats(group1).mean - 
                                  this.calculateDescriptiveStats(group2).mean;
        
        const combined = [...group1, ...group2];
        const nullDifferences = [];
        
        for (let i = 0; i < iterations; i++) {
            const shuffled = this.shuffle(combined);
            const newGroup1 = shuffled.slice(0, group1.length);
            const newGroup2 = shuffled.slice(group1.length);
            
            const newDiff = this.calculateDescriptiveStats(newGroup1).mean - 
                           this.calculateDescriptiveStats(newGroup2).mean;
            nullDifferences.push(newDiff);
        }
        
        const extremeCount = nullDifferences.filter(diff => 
            Math.abs(diff) >= Math.abs(observedDifference)
        ).length;
        
        const pValue = extremeCount / iterations;

        return {
            observedDifference,
            pValue,
            iterations,
            interpretation: pValue < 0.05 ? 'Significant difference' : 'No significant difference'
        };
    }

    shuffle(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    assessRobustness(outlierRemoval, nonParametric, permutation) {
        const consistencyScore = this.calculateConsistencyScore(
            outlierRemoval.originalResult.pValue,
            nonParametric.mannWhitney.pValue,
            permutation.pValue
        );
        
        return {
            consistencyScore,
            isRobust: consistencyScore > 0.7,
            assessment: consistencyScore > 0.7 ? 'Results appear robust' : 'Results may not be robust'
        };
    }

    calculateConsistencyScore(...pValues) {
        // Calculate how consistent the p-values are across different tests
        const meanP = pValues.reduce((sum, p) => sum + p, 0) / pValues.length;
        const variance = pValues.reduce((sum, p) => sum + Math.pow(p - meanP, 2), 0) / pValues.length;
        
        return Math.max(0, 1 - variance); // Higher score = more consistent
    }

    calculateBootstrapBias(group1, group2, bootstrappedDifferences) {
        const observedDifference = this.calculateDescriptiveStats(group1).mean - 
                                  this.calculateDescriptiveStats(group2).mean;
        const bootstrapMean = bootstrappedDifferences.reduce((sum, val) => sum + val, 0) / bootstrappedDifferences.length;
        
        return observedDifference - bootstrapMean;
    }

    calculateConfidenceInterval(mean, std, n, confidence = 0.95) {
        const z = confidence === 0.95 ? 1.96 : confidence === 0.99 ? 2.576 : 1.645;
        const margin = z * std / Math.sqrt(n);
        return [mean - margin, mean + margin];
    }

    approximateMannWhitneyP(u, n1, n2) {
        // Very rough approximation for Mann-Whitney U p-value
        const meanU = n1 * n2 / 2;
        const stdU = Math.sqrt(n1 * n2 * (n1 + n2 + 1) / 12);
        const z = (u - meanU) / stdU;
        return 2 * (1 - this.normalCDF(Math.abs(z)));
    }

    normalCDF(x) {
        // Approximation of normal CDF
        return 0.5 * (1 + this.erf(x / Math.sqrt(2)));
    }

    erf(x) {
        // Approximation of error function
        const a1 =  0.254829592;
        const a2 = -0.284496736;
        const a3 =  1.421413741;
        const a4 = -1.453152027;
        const a5 =  1.061405429;
        const p  =  0.3275911;

        const sign = x >= 0 ? 1 : -1;
        x = Math.abs(x);

        const t = 1.0 / (1.0 + p * x);
        const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

        return sign * y;
    }
}