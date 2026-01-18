/**
 * Statistical Engine - Significance testing and analysis
 *
 * Provides statistical validation for experiment results:
 * - t-tests
 * - Mann-Whitney U
 * - Bootstrap confidence intervals
 * - Effect size calculations (Cohen's d)
 */

import { VariantResult, StatisticalAnalysis } from './index';

export class StatisticalEngine {
  /**
   * Analyze experiment results for statistical significance
   *
   * Compares variant A vs variant B (first two variants)
   */
  async analyze(variantResults: VariantResult[]): Promise<StatisticalAnalysis> {
    if (variantResults.length < 2) {
      throw new Error('Need at least 2 variants for statistical analysis');
    }

    const variantA = variantResults[0];
    const variantB = variantResults[1];

    // Extract reality_index scores for comparison
    const scoresA = variantA.test_case_results.map((tc) => tc.detection_result.reality_index);
    const scoresB = variantB.test_case_results.map((tc) => tc.detection_result.reality_index);

    // Calculate t-test
    const p_value = this.tTest(scoresA, scoresB);

    // Calculate confidence interval
    const confidence_interval = this.bootstrapCI(scoresA, scoresB);

    // Calculate effect size (Cohen's d)
    const effect_size = this.cohensD(scoresA, scoresB);

    // Significance threshold: p < 0.05
    const significant = p_value < 0.05;

    return {
      p_value,
      confidence_interval,
      effect_size,
      significant,
    };
  }

  /**
   * Two-sample t-test
   */
  private tTest(groupA: number[], groupB: number[]): number {
    const meanA = this.mean(groupA);
    const meanB = this.mean(groupB);
    const varA = this.variance(groupA);
    const varB = this.variance(groupB);
    const nA = groupA.length;
    const nB = groupB.length;

    // Pooled standard deviation
    const pooledSD = Math.sqrt(((nA - 1) * varA + (nB - 1) * varB) / (nA + nB - 2));

    // T-statistic
    const t = (meanA - meanB) / (pooledSD * Math.sqrt(1 / nA + 1 / nB));

    // Convert to p-value (simplified - use proper t-distribution in production)
    const p_value = this.tDistributionPValue(t, nA + nB - 2);

    return p_value;
  }

  /**
   * Bootstrap confidence interval (95%)
   */
  private bootstrapCI(groupA: number[], groupB: number[]): [number, number] {
    const diffs: number[] = [];
    const iterations = 1000;

    for (let i = 0; i < iterations; i++) {
      const sampleA = this.resample(groupA);
      const sampleB = this.resample(groupB);
      diffs.push(this.mean(sampleA) - this.mean(sampleB));
    }

    diffs.sort((a, b) => a - b);

    // 95% CI: 2.5th and 97.5th percentiles
    const lower = diffs[Math.floor(iterations * 0.025)];
    const upper = diffs[Math.floor(iterations * 0.975)];

    return [lower, upper];
  }

  /**
   * Cohen's d effect size
   */
  private cohensD(groupA: number[], groupB: number[]): number {
    const meanA = this.mean(groupA);
    const meanB = this.mean(groupB);
    const varA = this.variance(groupA);
    const varB = this.variance(groupB);
    const nA = groupA.length;
    const nB = groupB.length;

    // Pooled standard deviation
    const pooledSD = Math.sqrt(((nA - 1) * varA + (nB - 1) * varB) / (nA + nB - 2));

    return (meanA - meanB) / pooledSD;
  }

  // Helper functions
  private mean(arr: number[]): number {
    return arr.reduce((sum, val) => sum + val, 0) / arr.length;
  }

  private variance(arr: number[]): number {
    const m = this.mean(arr);
    return arr.reduce((sum, val) => sum + Math.pow(val - m, 2), 0) / (arr.length - 1);
  }

  private resample(arr: number[]): number[] {
    const sample: number[] = [];
    for (let i = 0; i < arr.length; i++) {
      sample.push(arr[Math.floor(Math.random() * arr.length)]);
    }
    return sample;
  }

  private tDistributionPValue(t: number, df: number): number {
    // Simplified p-value calculation (use proper t-distribution in production)
    // For now, use approximation
    const z = Math.abs(t);
    return 2 * (1 - this.normalCDF(z));
  }

  private normalCDF(z: number): number {
    // Standard normal CDF approximation
    return 0.5 * (1 + this.erf(z / Math.sqrt(2)));
  }

  private erf(x: number): number {
    // Error function approximation
    const sign = x >= 0 ? 1 : -1;
    x = Math.abs(x);

    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;

    const t = 1 / (1 + p * x);
    const y = 1 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

    return sign * y;
  }
}
