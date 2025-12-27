/**
 * Statistical Analysis Module
 * Provides statistical analysis for experiment results
 * Includes significance testing and confidence intervals
 */

import { StatisticalResult } from './types';

/**
 * Statistical Analysis Interface
 */
export interface StatisticalAnalyzer {
  calculateWinRates(trials: any[]): StatisticalResult[];
  calculateConfidenceInterval(wins: number, total: number, confidence: number): [number, number];
  calculatePValue(observedWins: number, total: number, expectedWinRate: number): number;
  calculateEffectSize(winsA: number, totalA: number, winsB: number, totalB: number): number;
  isSignificant(pValue: number, alpha: number): boolean;
}

/**
 * Basic Statistical Analyzer
 * Implements common statistical tests for A/B experiments
 */
export class BasicStatisticalAnalyzer implements StatisticalAnalyzer {
  calculateWinRates(trials: any[]): StatisticalResult[] {
    const variantStats: Record<string, { wins: number; losses: number; ties: number; total: number }> = {};

    // Initialize stats for each variant
    for (const trial of trials) {
      if (!trial.slotMapping || !trial.evaluations?.[0]?.winnerSlot) continue;

      for (const [slot, variantId] of Object.entries(trial.slotMapping)) {
        if (!variantStats[variantId]) {
          variantStats[variantId] = { wins: 0, losses: 0, ties: 0, total: 0 };
        }
      }
    }

    // Count wins/losses
    for (const trial of trials) {
      if (!trial.slotMapping || !trial.evaluations?.[0]?.winnerSlot) continue;

      const evaluation = trial.evaluations[0];
      const winnerVariant = trial.slotMapping[evaluation.winnerSlot];
      const slots = Object.keys(trial.slotMapping);

      for (const slot of slots) {
        const variantId = trial.slotMapping[slot];
        variantStats[variantId].total++;

        if (slot === evaluation.winnerSlot) {
          variantStats[variantId].wins++;
        } else {
          variantStats[variantId].losses++;
        }
      }
    }

    // Convert to StatisticalResult format
    return Object.entries(variantStats).map(([variantId, stats]) => {
      const winRate = stats.total > 0 ? stats.wins / stats.total : 0;
      const confidenceInterval = this.calculateConfidenceInterval(stats.wins, stats.total, 0.95);
      const pValue = this.calculatePValue(stats.wins, stats.total, 0.5); // Test against 50% baseline

      return {
        variantId,
        wins: stats.wins,
        losses: stats.losses,
        ties: stats.ties,
        winRate,
        confidenceInterval,
        pValue,
        significance: this.isSignificant(pValue, 0.05) ? "SIGNIFICANT" : "NOT_SIGNIFICANT",
      };
    });
  }

  calculateConfidenceInterval(wins: number, total: number, confidence: number): [number, number] {
    if (total === 0) return [0, 0];

    const p = wins / total;
    const z = this.getZScore(confidence);
    const margin = z * Math.sqrt((p * (1 - p)) / total);

    return [Math.max(0, p - margin), Math.min(1, p + margin)];
  }

  calculatePValue(observedWins: number, total: number, expectedWinRate: number): number {
    if (total === 0) return 1;

    const observedRate = observedWins / total;
    const standardError = Math.sqrt((expectedWinRate * (1 - expectedWinRate)) / total);
    const zScore = (observedRate - expectedWinRate) / standardError;

    // Two-tailed test
    return 2 * (1 - this.normalCDF(Math.abs(zScore)));
  }

  calculateEffectSize(winsA: number, totalA: number, winsB: number, totalB: number): number {
    if (totalA === 0 || totalB === 0) return 0;

    const rateA = winsA / totalA;
    const rateB = winsB / totalB;
    const pooledRate = (winsA + winsB) / (totalA + totalB);
    const pooledStdDev = Math.sqrt(pooledRate * (1 - pooledRate));

    if (pooledStdDev === 0) return 0;

    return (rateA - rateB) / pooledStdDev;
  }

  isSignificant(pValue: number, alpha: number): boolean {
    return pValue < alpha;
  }

  /**
   * Get Z-score for given confidence level
   */
  private getZScore(confidence: number): number {
    // Common Z-scores for confidence intervals
    const zScores: Record<number, number> = {
      0.8: 1.2816,
      0.9: 1.6449,
      0.95: 1.96,
      0.98: 2.3263,
      0.99: 2.5758,
    };

    return zScores[confidence] || 1.96;
  }

  /**
   * Normal distribution CDF
   */
  private normalCDF(x: number): number {
    return 0.5 * (1 + this.erf(x / Math.sqrt(2)));
  }

  /**
   * Error function approximation
   */
  private erf(x: number): number {
    // Abramowitz and Stegun approximation
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;

    const sign = x >= 0 ? 1 : -1;
    x = Math.abs(x);

    const t = 1 / (1 + p * x);
    const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

    return sign * y;
  }
}

/**
 * Advanced Statistical Analyzer
 * Includes more sophisticated tests and power analysis
 */
export class AdvancedStatisticalAnalyzer extends BasicStatisticalAnalyzer {
  calculateChiSquareTest(observed: number[][], expected: number[][]): {
    chiSquare: number;
    pValue: number;
    degreesOfFreedom: number;
    significant: boolean;
  } {
    let chiSquare = 0;
    let totalObserved = 0;
    let totalExpected = 0;

    for (let i = 0; i < observed.length; i++) {
      for (let j = 0; j < observed[i].length; j++) {
        const obs = observed[i][j];
        const exp = expected[i][j];
        
        if (exp > 0) {
          chiSquare += Math.pow(obs - exp, 2) / exp;
        }
        
        totalObserved += obs;
        totalExpected += exp;
      }
    }

    const degreesOfFreedom = (observed.length - 1) * (observed[0].length - 1);
    const pValue = this.chiSquareCDF(chiSquare, degreesOfFreedom);

    return {
      chiSquare,
      pValue,
      degreesOfFreedom,
      significant: pValue < 0.05,
    };
  }

  calculatePowerAnalysis(
    baselineRate: number,
    minimumDetectableEffect: number,
    alpha: number = 0.05,
    power: number = 0.8
  ): {
    requiredSampleSize: number;
    actualPower: number;
  } {
    // Simplified power calculation for proportions
    const zAlpha = this.getZScore(1 - alpha / 2);
    const zBeta = this.getZScore(power);
    
    const p1 = baselineRate;
    const p2 = baselineRate + minimumDetectableEffect;
    const p = (p1 + p2) / 2;
    
    const numerator = Math.pow(zAlpha * Math.sqrt(2 * p * (1 - p)) + zBeta * Math.sqrt(p1 * (1 - p1) + p2 * (1 - p2)), 2);
    const denominator = Math.pow(p1 - p2, 2);
    
    const requiredSampleSize = Math.ceil(numerator / denominator);
    
    // Calculate actual power with the sample size
    const standardError = Math.sqrt(p1 * (1 - p1) / requiredSampleSize + p2 * (1 - p2) / requiredSampleSize);
    const actualPower = this.normalCDF((Math.abs(p1 - p2) - zAlpha * standardError) / standardError);

    return {
      requiredSampleSize,
      actualPower,
    };
  }

  /**
   * Chi-square distribution CDF approximation
   */
  private chiSquareCDF(x: number, df: number): number {
    // Simplified approximation using normal distribution for large df
    if (df > 30) {
      const z = (x - df) / Math.sqrt(2 * df);
      return this.normalCDF(z);
    }
    
    // For small df, use gamma function approximation
    // This is a simplified version - in production, use a proper chi-square library
    return this.gammaCDF(x / 2, df / 2);
  }

  /**
   * Gamma distribution CDF (simplified)
   */
  private gammaCDF(x: number, shape: number): number {
    // Simplified using normal approximation for large shape
    if (shape > 10) {
      const mean = shape;
      const stdDev = Math.sqrt(shape);
      const z = (x - mean) / stdDev;
      return this.normalCDF(z);
    }
    
    // For small shape, return a rough approximation
    return 1 - Math.exp(-x);
  }
}

/**
 * Statistical Report Generator
 */
export class StatisticalReportGenerator {
  constructor(private analyzer: StatisticalAnalyzer) {}

  generateReport(trials: any[], options: {
    confidenceLevel?: number;
    alpha?: number;
    includePowerAnalysis?: boolean;
  } = {}): {
    summary: any;
    detailedResults: StatisticalResult[];
    recommendations: string[];
  } {
    const {
      confidenceLevel = 0.95,
      alpha = 0.05,
      includePowerAnalysis = false,
    } = options;

    const results = this.analyzer.calculateWinRates(trials);
    
    const summary = {
      totalTrials: trials.length,
      totalVariants: results.length,
      confidenceLevel,
      alpha,
      topPerformer: this.getTopPerformer(results),
      statisticalSignificance: this.getSignificanceSummary(results, alpha),
    };

    const recommendations = this.generateRecommendations(results, alpha);

    return {
      summary,
      detailedResults: results,
      recommendations,
    };
  }

  private getTopPerformer(results: StatisticalResult[]): StatisticalResult | null {
    if (results.length === 0) return null;
    
    return results.reduce((best, current) => 
      current.winRate > best.winRate ? current : best
    );
  }

  private getSignificanceSummary(results: StatisticalResult[], alpha: number): {
    significantVariants: number;
    totalVariants: number;
    confidence: string;
  } {
    const significant = results.filter(r => 
      r.significance === "SIGNIFICANT" || (r.pValue && r.pValue < alpha)
    ).length;

    let confidence = "Low";
    if (significant / results.length > 0.8) confidence = "High";
    else if (significant / results.length > 0.5) confidence = "Medium";

    return {
      significantVariants: significant,
      totalVariants: results.length,
      confidence,
    };
  }

  private generateRecommendations(results: StatisticalResult[], alpha: number): string[] {
    const recommendations: string[] = [];
    
    const topPerformer = this.getTopPerformer(results);
    if (topPerformer && topPerformer.significance === "SIGNIFICANT") {
      recommendations.push(
        `${topPerformer.variantId} shows statistically significant superior performance with a win rate of ${(topPerformer.winRate * 100).toFixed(1)}%`
      );
    }

    const significantResults = results.filter(r => 
      r.significance === "SIGNIFICANT" || (r.pValue && r.pValue < alpha)
    );

    if (significantResults.length === 0) {
      recommendations.push(
        "No statistically significant differences detected. Consider increasing sample size or extending experiment duration."
      );
    }

    if (results.some(r => !r.confidenceInterval)) {
      recommendations.push(
        "Some variants have insufficient data for reliable confidence intervals."
      );
    }

    return recommendations;
  }
}

/**
 * Utility functions
 */
export const StatisticalUtils = {
  /**
   * Calculate sample size needed for desired power
   */
  calculateRequiredSampleSize: (
    baselineRate: number,
    effectSize: number,
    alpha: number = 0.05,
    power: number = 0.8
  ): number => {
    const analyzer = new AdvancedStatisticalAnalyzer();
    return analyzer.calculatePowerAnalysis(baselineRate, effectSize, alpha, power).requiredSampleSize;
  },

  /**
   * Quick significance test for two proportions
   */
  quickSignificanceTest: (
    successesA: number,
    trialsA: number,
    successesB: number,
    trialsB: number
  ): { pValue: number; significant: boolean } => {
    const analyzer = new BasicStatisticalAnalyzer();
    const pValue = analyzer.calculatePValue(successesA, trialsA, successesB / trialsB);
    return {
      pValue,
      significant: analyzer.isSignificant(pValue, 0.05),
    };
  },

  /**
   * Format statistical results for display
   */
  formatStatisticalResult: (result: StatisticalResult): string => {
    const winRatePercent = (result.winRate * 100).toFixed(1);
    const confidenceInterval = result.confidenceInterval 
      ? `[${(result.confidenceInterval[0] * 100).toFixed(1)}%, ${(result.confidenceInterval[1] * 100).toFixed(1)}%]`
      : "N/A";
    
    return `${result.variantId}: ${winRatePercent}% win rate (CI: ${confidenceInterval})`;
  },
};