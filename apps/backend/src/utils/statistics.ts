/**
 * Statistical Analysis Utilities
 * Provides statistical tests and calculations for A/B testing experiments
 */

/**
 * Calculate mean of an array of numbers
 */
export function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, val) => sum + val, 0) / values.length;
}

/**
 * Calculate variance of an array of numbers
 */
export function variance(values: number[]): number {
  if (values.length === 0) return 0;
  const avg = mean(values);
  return values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / values.length;
}

/**
 * Calculate standard deviation
 */
export function stdDev(values: number[]): number {
  return Math.sqrt(variance(values));
}

/**
 * Calculate standard error
 */
export function standardError(values: number[]): number {
  if (values.length === 0) return 0;
  return stdDev(values) / Math.sqrt(values.length);
}

/**
 * Calculate Cohen's d (effect size) for two samples
 * Small effect: 0.2, Medium effect: 0.5, Large effect: 0.8
 */
export function cohensD(
  mean1: number,
  mean2: number,
  std1: number,
  std2: number,
  n1: number,
  n2: number
): number {
  // Pooled standard deviation
  const pooledStd = Math.sqrt(
    ((n1 - 1) * std1 * std1 + (n2 - 1) * std2 * std2) / (n1 + n2 - 2)
  );

  if (pooledStd === 0) return 0;
  return (mean1 - mean2) / pooledStd;
}

/**
 * Calculate t-statistic for independent two-sample t-test
 */
export function tStatistic(
  mean1: number,
  mean2: number,
  std1: number,
  std2: number,
  n1: number,
  n2: number
): number {
  const se1 = (std1 * std1) / n1;
  const se2 = (std2 * std2) / n2;
  const pooledSE = Math.sqrt(se1 + se2);

  if (pooledSE === 0) return 0;
  return (mean1 - mean2) / pooledSE;
}

/**
 * Calculate degrees of freedom for Welch's t-test (unequal variances)
 */
export function welchDegreesOfFreedom(
  std1: number,
  std2: number,
  n1: number,
  n2: number
): number {
  const s1 = (std1 * std1) / n1;
  const s2 = (std2 * std2) / n2;
  const numerator = Math.pow(s1 + s2, 2);
  const denominator = (s1 * s1) / (n1 - 1) + (s2 * s2) / (n2 - 1);

  if (denominator === 0) return n1 + n2 - 2;
  return numerator / denominator;
}

/**
 * Approximate p-value from t-statistic using normal approximation
 * For large samples (n > 30), t-distribution approaches normal distribution
 * This is a simplified approximation - for production, use a proper library
 */
export function tTestPValue(tStat: number, df: number): number {
  // Use normal approximation for large df (> 30)
  if (df > 30) {
    return 2 * (1 - normalCDF(Math.abs(tStat)));
  }

  // For smaller samples, use t-distribution approximation
  // This is a rough approximation - not as accurate as proper t-tables
  const x = df / (df + tStat * tStat);
  const p = 0.5 * betaApprox(x, df / 2, 0.5);
  return 2 * Math.min(p, 1 - p);
}

/**
 * Standard normal cumulative distribution function (CDF)
 * Approximation using error function
 */
export function normalCDF(x: number): number {
  // Constants for approximation
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.3989423 * Math.exp(-x * x / 2);
  const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));

  return x > 0 ? 1 - p : p;
}

/**
 * Beta function approximation (simplified)
 * Used for t-distribution p-value calculation
 */
function betaApprox(x: number, a: number, b: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;

  // Use incomplete beta function approximation
  // This is a very simplified version - for production use a proper library
  const logBeta = logGamma(a) + logGamma(b) - logGamma(a + b);

  // Series expansion (simplified)
  let sum = 0;
  let term = 1;
  for (let n = 0; n < 100; n++) {
    term *= (x * (n + b)) / (n + a);
    sum += term / (n + a);
    if (Math.abs(term) < 1e-10) break;
  }

  return Math.exp(a * Math.log(x) + b * Math.log(1 - x) - logBeta) * sum;
}

/**
 * Log-gamma function approximation (Lanczos approximation)
 */
function logGamma(z: number): number {
  const g = 7;
  const c = [
    0.99999999999980993,
    676.5203681218851,
    -1259.1392167224028,
    771.32342877765313,
    -176.61502916214059,
    12.507343278686905,
    -0.13857109526572012,
    9.9843695780195716e-6,
    1.5056327351493116e-7,
  ];

  if (z < 0.5) {
    return Math.log(Math.PI) - Math.log(Math.sin(Math.PI * z)) - logGamma(1 - z);
  }

  z -= 1;
  let x = c[0];
  for (let i = 1; i < g + 2; i++) {
    x += c[i] / (z + i);
  }

  const t = z + g + 0.5;
  return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x);
}

/**
 * Calculate 95% confidence interval for the difference in means
 */
export function confidenceInterval(
  mean1: number,
  mean2: number,
  std1: number,
  std2: number,
  n1: number,
  n2: number,
  confidenceLevel: number = 0.95
): { lower: number; upper: number } {
  const diff = mean1 - mean2;
  const se1 = (std1 * std1) / n1;
  const se2 = (std2 * std2) / n2;
  const pooledSE = Math.sqrt(se1 + se2);

  // Use z-score for large samples (n > 30), t-score for small samples
  const criticalValue = n1 + n2 > 60 ? 1.96 : 2.0; // Approximate

  const margin = criticalValue * pooledSE;

  return {
    lower: diff - margin,
    upper: diff + margin,
  };
}

/**
 * Perform two-sample t-test
 * Returns: { tStat, pValue, effectSize, significant, confidenceInterval }
 */
export function twoSampleTTest(
  sample1: { mean: number; std: number; n: number },
  sample2: { mean: number; std: number; n: number },
  alpha: number = 0.05
): {
  tStat: number;
  pValue: number;
  effectSize: number;
  significant: boolean;
  confidenceInterval: { lower: number; upper: number };
  degreesOfFreedom: number;
} {
  const tStat = tStatistic(
    sample1.mean,
    sample2.mean,
    sample1.std,
    sample2.std,
    sample1.n,
    sample2.n
  );

  const df = welchDegreesOfFreedom(
    sample1.std,
    sample2.std,
    sample1.n,
    sample2.n
  );

  const pValue = tTestPValue(tStat, df);

  const effectSize = cohensD(
    sample1.mean,
    sample2.mean,
    sample1.std,
    sample2.std,
    sample1.n,
    sample2.n
  );

  const ci = confidenceInterval(
    sample1.mean,
    sample2.mean,
    sample1.std,
    sample2.std,
    sample1.n,
    sample2.n
  );

  return {
    tStat,
    pValue,
    effectSize,
    significant: pValue < alpha,
    confidenceInterval: ci,
    degreesOfFreedom: df,
  };
}

/**
 * Calculate minimum sample size needed to detect an effect
 * Based on desired power (typically 0.8) and significance level (typically 0.05)
 */
export function minimumSampleSize(
  effectSize: number,
  power: number = 0.8,
  alpha: number = 0.05
): number {
  // Simplified calculation using normal approximation
  // z_alpha/2 for two-tailed test
  const zAlpha = 1.96; // for alpha = 0.05
  // z_beta for power = 0.8
  const zBeta = 0.84;

  const n = 2 * Math.pow((zAlpha + zBeta) / effectSize, 2);
  return Math.ceil(n);
}

/**
 * Calculate statistical power given sample sizes and effect size
 */
export function calculatePower(
  effectSize: number,
  n1: number,
  n2: number,
  alpha: number = 0.05
): number {
  const zAlpha = 1.96;
  const nHarmonic = (2 * n1 * n2) / (n1 + n2);
  const zBeta = effectSize * Math.sqrt(nHarmonic / 2) - zAlpha;

  // Convert z-score to power
  const power = normalCDF(zBeta);
  return Math.max(0, Math.min(1, power));
}

export default {
  mean,
  variance,
  stdDev,
  standardError,
  cohensD,
  tStatistic,
  tTestPValue,
  normalCDF,
  confidenceInterval,
  twoSampleTTest,
  minimumSampleSize,
  calculatePower,
};
