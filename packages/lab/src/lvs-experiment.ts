/**
 * LVS Experiment Framework
 * Validates Linguistic Vector Steering effectiveness through controlled experiments
 */

import {
  calculateResonanceMetrics,
  ResonanceMetrics,
  LVSConfig,
  DEFAULT_LVS_SCAFFOLDING,
  LVS_TEMPLATES,
  evaluateLVSEffectiveness,
} from '@sonate/core';

export interface LVSExperimentConfig {
  name: string;
  description: string;
  variants: LVSVariant[];
  testCases: LVSTestCase[];
  statisticalConfig: {
    confidenceLevel: number; // e.g., 0.95 for 95% CI
    minimumSampleSize: number; // Minimum interactions per variant
    significanceThreshold: number; // p-value threshold (e.g., 0.05)
  };
}

export interface LVSVariant {
  id: string;
  name: string;
  mode: 'baseline' | 'lvs' | 'custom';
  lvsConfig?: LVSConfig;
  description: string;
}

export interface LVSTestCase {
  id: string;
  userInput: string;
  context: string;
  conversationHistory?: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  }>;
  expectedQualities: string[];
  metadata?: Record<string, any>;
}

export interface LVSExperimentResult {
  experimentId: string;
  experimentName: string;
  startTime: Date;
  endTime: Date;
  duration: number; // milliseconds
  variantResults: LVSVariantResult[];
  statisticalAnalysis: LVSStatisticalAnalysis;
  conclusion: string;
  recommendations: string[];
}

export interface LVSVariantResult {
  variantId: string;
  variantName: string;
  testCaseResults: LVSTestCaseResult[];
  aggregateMetrics: {
    averageR_m: number;
    medianR_m: number;
    stdDevR_m: number;
    minR_m: number;
    maxR_m: number;
    averageVectorAlignment: number;
    averageContextualContinuity: number;
    averageSemanticMirroring: number;
    averageEntropyDelta: number;
    alertDistribution: Record<ResonanceMetrics['alertLevel'], number>;
  };
  executionTime: number; // milliseconds
}

export interface LVSTestCaseResult {
  testCaseId: string;
  resonanceMetrics: ResonanceMetrics;
  aiResponse: string;
  executionTime: number; // milliseconds
  success: boolean;
  errors?: string[];
}

export interface LVSStatisticalAnalysis {
  // Comparison between baseline and LVS variants
  comparisons: Array<{
    baselineVariant: string;
    lvsVariant: string;
    tTest: {
      tStatistic: number;
      pValue: number;
      degreesOfFreedom: number;
      significant: boolean;
    };
    effectSize: {
      cohensD: number;
      interpretation: string; // 'small', 'medium', 'large'
    };
    confidenceInterval: {
      lower: number;
      upper: number;
      level: number;
    };
    improvement: {
      absolute: number;
      percentage: number;
    };
  }>;

  // Overall analysis
  overallSignificance: boolean;
  bestVariant: string;
  worstVariant: string;
  recommendedVariant: string;
}

export class LVSExperimentOrchestrator {
  private experiments: Map<string, LVSExperimentResult> = new Map();
  private experimentCounter = 0;

  /**
   * Create and run LVS experiment
   */
  async runExperiment(config: LVSExperimentConfig): Promise<LVSExperimentResult> {
    const experimentId = `lvs_exp_${++this.experimentCounter}_${Date.now()}`;
    const startTime = new Date();

    console.log(`[LVS Experiment] Starting experiment: ${config.name}`);
    console.log(
      `[LVS Experiment] Variants: ${config.variants.length}, Test Cases: ${config.testCases.length}`
    );

    // Run all variants
    const variantResults: LVSVariantResult[] = [];
    for (const variant of config.variants) {
      const result = await this.runVariant(variant, config.testCases);
      variantResults.push(result);
    }

    // Perform statistical analysis
    const statisticalAnalysis = this.performStatisticalAnalysis(
      variantResults,
      config.statisticalConfig
    );

    const endTime = new Date();
    const duration = endTime.getTime() - startTime.getTime();

    // Generate conclusion and recommendations
    const { conclusion, recommendations } = this.generateConclusion(
      variantResults,
      statisticalAnalysis
    );

    const result: LVSExperimentResult = {
      experimentId,
      experimentName: config.name,
      startTime,
      endTime,
      duration,
      variantResults,
      statisticalAnalysis,
      conclusion,
      recommendations,
    };

    this.experiments.set(experimentId, result);

    console.log(`[LVS Experiment] Completed in ${duration}ms`);
    console.log(`[LVS Experiment] Best variant: ${statisticalAnalysis.bestVariant}`);

    return result;
  }

  /**
   * Run single variant across all test cases
   */
  private async runVariant(
    variant: LVSVariant,
    testCases: LVSTestCase[]
  ): Promise<LVSVariantResult> {
    const startTime = performance.now();
    const testCaseResults: LVSTestCaseResult[] = [];

    for (const testCase of testCases) {
      const result = await this.runTestCase(variant, testCase);
      testCaseResults.push(result);
    }

    const executionTime = performance.now() - startTime;
    const aggregateMetrics = this.calculateAggregateMetrics(testCaseResults);

    return {
      variantId: variant.id,
      variantName: variant.name,
      testCaseResults,
      aggregateMetrics,
      executionTime,
    };
  }

  /**
   * Run single test case for a variant
   */
  private async runTestCase(
    variant: LVSVariant,
    testCase: LVSTestCase
  ): Promise<LVSTestCaseResult> {
    const startTime = performance.now();

    try {
      // Simulate AI response (in production, call actual AI model)
      const aiResponse = await this.simulateAIResponse(variant, testCase);

      // Calculate resonance metrics
      const resonanceMetrics = calculateResonanceMetrics({
        userInput: testCase.userInput,
        aiResponse,
        conversationHistory: testCase.conversationHistory,
        metadata: testCase.metadata,
      });

      const executionTime = performance.now() - startTime;

      return {
        testCaseId: testCase.id,
        resonanceMetrics,
        aiResponse,
        executionTime,
        success: true,
      };
    } catch (error) {
      const executionTime = performance.now() - startTime;
      return {
        testCaseId: testCase.id,
        resonanceMetrics: {
          R_m: 0,
          vectorAlignment: 0,
          contextualContinuity: 0,
          semanticMirroring: 0,
          entropyDelta: 0,
          alertLevel: 'CRITICAL',
          interpretation: 'Execution failed',
        },
        aiResponse: '',
        executionTime,
        success: false,
        errors: [error instanceof Error ? error.message : String(error)],
      };
    }
  }

  /**
   * Simulate AI response (mock implementation)
   * In production, replace with actual AI model calls
   */
  private async simulateAIResponse(variant: LVSVariant, testCase: LVSTestCase): Promise<string> {
    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 50 + Math.random() * 100));

    // Generate mock response based on variant type
    if (variant.mode === 'baseline') {
      return `Response to: ${testCase.userInput.slice(0, 50)}... (baseline mode)`;
    } else if (variant.mode === 'lvs') {
      return `Enhanced response with LVS: ${testCase.userInput.slice(
        0,
        50
      )}... (high resonance mode)`;
    } 
      return `Custom response: ${testCase.userInput.slice(0, 50)}... (custom mode)`;
    
  }

  /**
   * Calculate aggregate metrics for variant
   */
  private calculateAggregateMetrics(
    results: LVSTestCaseResult[]
  ): LVSVariantResult['aggregateMetrics'] {
    const R_m_values = results.map((r) => r.resonanceMetrics.R_m);
    const sortedR_m = [...R_m_values].sort((a, b) => a - b);

    const sum = R_m_values.reduce((acc, val) => acc + val, 0);
    const mean = sum / R_m_values.length;
    const variance =
      R_m_values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / R_m_values.length;
    const stdDev = Math.sqrt(variance);

    const alertDistribution: Record<ResonanceMetrics['alertLevel'], number> = {
      GREEN: 0,
      YELLOW: 0,
      RED: 0,
      CRITICAL: 0,
    };

    results.forEach((r) => {
      alertDistribution[r.resonanceMetrics.alertLevel]++;
    });

    return {
      averageR_m: mean,
      medianR_m: sortedR_m[Math.floor(sortedR_m.length / 2)],
      stdDevR_m: stdDev,
      minR_m: Math.min(...R_m_values),
      maxR_m: Math.max(...R_m_values),
      averageVectorAlignment:
        results.reduce((sum, r) => sum + r.resonanceMetrics.vectorAlignment, 0) / results.length,
      averageContextualContinuity:
        results.reduce((sum, r) => sum + r.resonanceMetrics.contextualContinuity, 0) /
        results.length,
      averageSemanticMirroring:
        results.reduce((sum, r) => sum + r.resonanceMetrics.semanticMirroring, 0) / results.length,
      averageEntropyDelta:
        results.reduce((sum, r) => sum + r.resonanceMetrics.entropyDelta, 0) / results.length,
      alertDistribution,
    };
  }

  /**
   * Perform statistical analysis comparing variants
   */
  private performStatisticalAnalysis(
    variantResults: LVSVariantResult[],
    config: LVSExperimentConfig['statisticalConfig']
  ): LVSStatisticalAnalysis {
    const comparisons: LVSStatisticalAnalysis['comparisons'] = [];

    // Find baseline variant
    const baselineVariant = variantResults.find((v) =>
      v.variantName.toLowerCase().includes('baseline')
    );

    if (baselineVariant) {
      // Compare each LVS variant against baseline
      for (const lvsVariant of variantResults) {
        if (lvsVariant.variantId === baselineVariant.variantId) {continue;}

        const comparison = this.compareVariants(
          baselineVariant,
          lvsVariant,
          config.confidenceLevel
        );
        comparisons.push(comparison);
      }
    }

    // Determine best and worst variants
    const sortedByR_m = [...variantResults].sort(
      (a, b) => b.aggregateMetrics.averageR_m - a.aggregateMetrics.averageR_m
    );

    const bestVariant = sortedByR_m[0].variantName;
    const worstVariant = sortedByR_m[sortedByR_m.length - 1].variantName;

    // Determine recommended variant (best with significant improvement)
    const recommendedVariant =
      comparisons.find((c) => c.tTest.significant && c.effectSize.cohensD > 0.5)?.lvsVariant ||
      bestVariant;

    const overallSignificance = comparisons.some((c) => c.tTest.significant);

    return {
      comparisons,
      overallSignificance,
      bestVariant,
      worstVariant,
      recommendedVariant,
    };
  }

  /**
   * Compare two variants using t-test and effect size
   */
  private compareVariants(
    baseline: LVSVariantResult,
    lvs: LVSVariantResult,
    confidenceLevel: number
  ): LVSStatisticalAnalysis['comparisons'][0] {
    const baselineR_m = baseline.testCaseResults.map((r) => r.resonanceMetrics.R_m);
    const lvsR_m = lvs.testCaseResults.map((r) => r.resonanceMetrics.R_m);

    // Calculate t-test
    const tTest = this.performTTest(baselineR_m, lvsR_m);

    // Calculate Cohen's d
    const cohensD = this.calculateCohensD(baselineR_m, lvsR_m);

    // Calculate confidence interval
    const confidenceInterval = this.calculateConfidenceInterval(lvsR_m, confidenceLevel);

    // Calculate improvement
    const baselineMean = baseline.aggregateMetrics.averageR_m;
    const lvsMean = lvs.aggregateMetrics.averageR_m;
    const improvement = {
      absolute: lvsMean - baselineMean,
      percentage: baselineMean > 0 ? ((lvsMean - baselineMean) / baselineMean) * 100 : 0,
    };

    return {
      baselineVariant: baseline.variantName,
      lvsVariant: lvs.variantName,
      tTest,
      effectSize: {
        cohensD,
        interpretation: this.interpretCohensD(cohensD),
      },
      confidenceInterval,
      improvement,
    };
  }

  /**
   * Perform independent samples t-test
   */
  private performTTest(
    sample1: number[],
    sample2: number[]
  ): LVSStatisticalAnalysis['comparisons'][0]['tTest'] {
    const n1 = sample1.length;
    const n2 = sample2.length;

    const mean1 = sample1.reduce((sum, val) => sum + val, 0) / n1;
    const mean2 = sample2.reduce((sum, val) => sum + val, 0) / n2;

    const variance1 = sample1.reduce((sum, val) => sum + Math.pow(val - mean1, 2), 0) / (n1 - 1);
    const variance2 = sample2.reduce((sum, val) => sum + Math.pow(val - mean2, 2), 0) / (n2 - 1);

    const pooledVariance = ((n1 - 1) * variance1 + (n2 - 1) * variance2) / (n1 + n2 - 2);
    const standardError = Math.sqrt(pooledVariance * (1 / n1 + 1 / n2));

    const tStatistic = (mean2 - mean1) / standardError;
    const degreesOfFreedom = n1 + n2 - 2;

    // Simplified p-value calculation (use proper statistical library in production)
    const pValue = this.calculatePValue(Math.abs(tStatistic), degreesOfFreedom);

    return {
      tStatistic,
      pValue,
      degreesOfFreedom,
      significant: pValue < 0.05,
    };
  }

  /**
   * Calculate Cohen's d effect size
   */
  private calculateCohensD(sample1: number[], sample2: number[]): number {
    const mean1 = sample1.reduce((sum, val) => sum + val, 0) / sample1.length;
    const mean2 = sample2.reduce((sum, val) => sum + val, 0) / sample2.length;

    const variance1 =
      sample1.reduce((sum, val) => sum + Math.pow(val - mean1, 2), 0) / (sample1.length - 1);
    const variance2 =
      sample2.reduce((sum, val) => sum + Math.pow(val - mean2, 2), 0) / (sample2.length - 1);

    const pooledStdDev = Math.sqrt((variance1 + variance2) / 2);

    return (mean2 - mean1) / pooledStdDev;
  }

  /**
   * Interpret Cohen's d
   */
  private interpretCohensD(d: number): string {
    const absD = Math.abs(d);
    if (absD < 0.2) {return 'negligible';}
    if (absD < 0.5) {return 'small';}
    if (absD < 0.8) {return 'medium';}
    return 'large';
  }

  /**
   * Calculate confidence interval
   */
  private calculateConfidenceInterval(
    sample: number[],
    confidenceLevel: number
  ): { lower: number; upper: number; level: number } {
    const n = sample.length;
    const mean = sample.reduce((sum, val) => sum + val, 0) / n;
    const variance = sample.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (n - 1);
    const stdError = Math.sqrt(variance / n);

    // Use t-distribution critical value (simplified)
    const tCritical = this.getTCritical(confidenceLevel, n - 1);
    const marginOfError = tCritical * stdError;

    return {
      lower: mean - marginOfError,
      upper: mean + marginOfError,
      level: confidenceLevel,
    };
  }

  /**
   * Simplified p-value calculation
   */
  private calculatePValue(tStatistic: number, df: number): number {
    // Simplified approximation - use proper statistical library in production
    const x = df / (df + tStatistic * tStatistic);
    return 1 - Math.pow(x, df / 2);
  }

  /**
   * Get t-distribution critical value (simplified)
   */
  private getTCritical(confidenceLevel: number, df: number): number {
    // Simplified lookup - use proper statistical library in production
    if (confidenceLevel === 0.95) {return 1.96;}
    if (confidenceLevel === 0.99) {return 2.576;}
    return 1.96;
  }

  /**
   * Generate conclusion and recommendations
   */
  private generateConclusion(
    variantResults: LVSVariantResult[],
    analysis: LVSStatisticalAnalysis
  ): { conclusion: string; recommendations: string[] } {
    const bestVariant = variantResults.find((v) => v.variantName === analysis.bestVariant);
    const recommendations: string[] = [];

    let conclusion = `Experiment completed with ${variantResults.length} variants. `;

    if (analysis.overallSignificance) {
      conclusion += `Statistically significant differences detected (p < 0.05). `;
      conclusion += `Recommended variant: ${analysis.recommendedVariant} `;
      conclusion += `with average R_m of ${bestVariant?.aggregateMetrics.averageR_m.toFixed(2)}. `;

      recommendations.push(`Deploy ${analysis.recommendedVariant} for production use`);
      recommendations.push('Monitor R_m scores continuously to ensure sustained performance');
    } else {
      conclusion += `No statistically significant differences detected. `;
      conclusion += `Best performing variant: ${analysis.bestVariant} `;
      conclusion += `with average R_m of ${bestVariant?.aggregateMetrics.averageR_m.toFixed(2)}. `;

      recommendations.push('Consider increasing sample size for more conclusive results');
      recommendations.push('Review LVS scaffolding for potential improvements');
    }

    // Add specific recommendations based on metrics
    if (bestVariant) {
      if (bestVariant.aggregateMetrics.averageVectorAlignment < 0.7) {
        recommendations.push('Focus on improving vector alignment in LVS scaffolding');
      }
      if (bestVariant.aggregateMetrics.averageContextualContinuity < 0.7) {
        recommendations.push('Enhance contextual continuity guidance in LVS');
      }
      if (bestVariant.aggregateMetrics.averageSemanticMirroring < 0.7) {
        recommendations.push('Strengthen semantic mirroring instructions');
      }
    }

    return { conclusion, recommendations };
  }

  /**
   * Get experiment result by ID
   */
  getExperiment(experimentId: string): LVSExperimentResult | undefined {
    return this.experiments.get(experimentId);
  }

  /**
   * Get all experiments
   */
  getAllExperiments(): LVSExperimentResult[] {
    return Array.from(this.experiments.values());
  }

  /**
   * Export experiment results as JSON
   */
  exportExperiment(experimentId: string): string {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) {
      throw new Error(`Experiment ${experimentId} not found`);
    }
    return JSON.stringify(experiment, null, 2);
  }
}

/**
 * Create default LVS experiment comparing baseline vs LVS
 */
export function createDefaultLVSExperiment(testCases: LVSTestCase[]): LVSExperimentConfig {
  return {
    name: 'LVS vs Baseline Comparison',
    description: 'Compare baseline AI responses against LVS-enhanced responses',
    variants: [
      {
        id: 'baseline',
        name: 'Baseline',
        mode: 'baseline',
        description: 'Standard AI responses without LVS',
      },
      {
        id: 'lvs-default',
        name: 'LVS (Default Scaffolding)',
        mode: 'lvs',
        lvsConfig: {
          enabled: true,
          scaffolding: DEFAULT_LVS_SCAFFOLDING,
        },
        description: 'AI responses with default LVS scaffolding',
      },
    ],
    testCases,
    statisticalConfig: {
      confidenceLevel: 0.95,
      minimumSampleSize: 30,
      significanceThreshold: 0.05,
    },
  };
}
