/**
 * Archive-Based Benchmarking Suite for Conversational Metrics
 *
 * Comprehensive testing and calibration system using historical
 * conversation archives to validate Phase-Shift Velocity metrics
 * and optimize detection parameters.
 */

import { ArchiveAnalyzer, ArchiveConversation } from './archive-analyzer';
import {
  ConversationalMetrics,
  ConversationTurn,
  PhaseShiftMetrics,
} from './conversational-metrics';
import { ExperimentOrchestrator } from './experiment-orchestrator';
import { StatisticalEngine } from './statistical-engine';

export interface BenchmarkConfig {
  testName: string;
  description: string;
  metricConfigs: Array<{
    name: string;
    yellowThreshold: number;
    redThreshold: number;
    identityStabilityThreshold: number;
    windowSize: number;
  }>;
  validationCriteria: {
    minDetectionRate: number;
    maxFalsePositiveRate: number;
    minPhaseShiftAccuracy: number;
  };
}

export interface BenchmarkResult {
  config: BenchmarkConfig;
  totalConversations: number;
  totalTurns: number;
  detectedPhaseShifts: number;
  falsePositives: number;
  falseNegatives: number;
  detectionRate: number;
  falsePositiveRate: number;
  accuracy: number;
  parameterOptimization: {
    optimalYellowThreshold: number;
    optimalRedThreshold: number;
    optimalIdentityThreshold: number;
    optimalWindowSize: number;
  };
  systemPerformance: {
    byAI: Record<
      string,
      {
        conversations: number;
        avgPhaseShiftVelocity: number;
        avgIdentityStability: number;
        alertRate: number;
      }
    >;
  };
}

export class ArchiveBenchmarkSuite {
  private archiveAnalyzer: ArchiveAnalyzer;
  private experimentOrchestrator: ExperimentOrchestrator;
  private statisticalEngine: StatisticalEngine;
  private conversations: ArchiveConversation[] = [];

  constructor() {
    this.archiveAnalyzer = new ArchiveAnalyzer();
    this.experimentOrchestrator = new ExperimentOrchestrator();
    this.statisticalEngine = new StatisticalEngine();
  }

  /**
   * Load and prepare archive data for benchmarking
   */
  async initialize(): Promise<void> {
    console.log('Loading conversation archives...');
    this.conversations = await this.archiveAnalyzer.loadAllConversations();

    const stats = this.archiveAnalyzer.getArchiveStatistics(this.conversations);
    console.log(
      `Loaded ${stats.totalConversations} conversations with ${stats.totalTurns} total turns`
    );
    console.log(`Average ${stats.avgTurnsPerConversation.toFixed(1)} turns per conversation`);
    console.log(
      `Average resonance: ${stats.avgResonance.toFixed(2)}, canvas: ${stats.avgCanvas.toFixed(2)}`
    );
  }

  /**
   * Run comprehensive benchmark with multiple metric configurations
   */
  async runBenchmark(config: BenchmarkConfig): Promise<BenchmarkResult> {
    console.log(`Running benchmark: ${config.testName}`);
    console.log(`Testing ${config.metricConfigs.length} different metric configurations`);

    let bestResult: BenchmarkResult | null = null;
    let bestScore = -1;

    // Test each metric configuration
    for (const metricConfig of config.metricConfigs) {
      const result = await this.testMetricConfiguration(config, metricConfig);

      // Calculate composite score (weighted combination of metrics)
      const score = this.calculateCompositeScore(result, config.validationCriteria);

      if (score > bestScore) {
        bestScore = score;
        bestResult = result;
      }
    }

    if (!bestResult) {
      throw new Error('No valid benchmark results generated');
    }

    return bestResult;
  }

  /**
   * Test a specific metric configuration against archive data
   */
  private async testMetricConfiguration(
    config: BenchmarkConfig,
    metricConfig: BenchmarkConfig['metricConfigs'][0]
  ): Promise<BenchmarkResult> {
    const metrics = new ConversationalMetrics({
      yellowThreshold: metricConfig.yellowThreshold,
      redThreshold: metricConfig.redThreshold,
      identityStabilityThreshold: metricConfig.identityStabilityThreshold,
      windowSize: metricConfig.windowSize,
    });

    let totalDetectedShifts = 0;
    let totalFalsePositives = 0;
    let totalFalseNegatives = 0;
    const systemPerformance: BenchmarkResult['systemPerformance'] = { byAI: {} };

    // Process each conversation
    for (const conversation of this.conversations) {
      const aiTurns = conversation.turns.filter((t) => t.speaker === 'ai');
      let conversationShifts = 0;
      let conversationAlerts = 0;
      let totalPhaseShiftVelocity = 0;
      let totalIdentityStability = 0;

      // Process AI turns as conversation sequence
      for (let i = 0; i < aiTurns.length; i++) {
        const turn = aiTurns[i];

        // Convert to ConversationalMetrics format
        const metricsTurn: ConversationTurn = {
          turnNumber: i + 1,
          timestamp: turn.timestamp,
          speaker: 'ai',
          resonance: turn.resonance || 5,
          canvas: turn.canvas || 5,
          identityVector: turn.identityVector || ['neutral'],
          content: turn.content,
        };

        const result = metrics.recordTurn(metricsTurn);

        totalPhaseShiftVelocity += result.phaseShiftVelocity;
        totalIdentityStability += result.identityStability;

        if (result.alertLevel !== 'none') {
          conversationAlerts++;
          if (result.transitionEvent) {
            conversationShifts++;
            totalDetectedShifts++;
          }
        }
      }

      // Track system-specific performance
      const aiSystem = conversation.aiSystem;
      if (!systemPerformance.byAI[aiSystem]) {
        systemPerformance.byAI[aiSystem] = {
          conversations: 0,
          avgPhaseShiftVelocity: 0,
          avgIdentityStability: 0,
          alertRate: 0,
        };
      }

      const systemStats = systemPerformance.byAI[aiSystem];
      systemStats.conversations++;
      systemStats.avgPhaseShiftVelocity += totalPhaseShiftVelocity / Math.max(1, aiTurns.length);
      systemStats.avgIdentityStability += totalIdentityStability / Math.max(1, aiTurns.length);
      systemStats.alertRate += conversationAlerts / Math.max(1, aiTurns.length);
    }

    // Calculate averages for system performance
    Object.keys(systemPerformance.byAI).forEach((system) => {
      const stats = systemPerformance.byAI[system];
      stats.avgPhaseShiftVelocity /= stats.conversations;
      stats.avgIdentityStability /= stats.conversations;
      stats.alertRate /= stats.conversations;
    });

    // Estimate false positives/negatives based on known patterns
    const expectedPhaseShifts = this.estimateExpectedPhaseShifts();
    totalFalsePositives = Math.max(0, totalDetectedShifts - expectedPhaseShifts);
    totalFalseNegatives = Math.max(0, expectedPhaseShifts - totalDetectedShifts);

    const totalTurns = this.conversations.reduce((sum, conv) => sum + conv.metadata.totalTurns, 0);
    const detectionRate = totalDetectedShifts / Math.max(1, expectedPhaseShifts);
    const falsePositiveRate = totalFalsePositives / Math.max(1, totalDetectedShifts);
    const accuracy = (totalDetectedShifts - totalFalsePositives) / Math.max(1, totalDetectedShifts);

    return {
      config,
      totalConversations: this.conversations.length,
      totalTurns,
      detectedPhaseShifts: totalDetectedShifts,
      falsePositives: totalFalsePositives,
      falseNegatives: totalFalseNegatives,
      detectionRate,
      falsePositiveRate,
      accuracy,
      parameterOptimization: {
        optimalYellowThreshold: metricConfig.yellowThreshold,
        optimalRedThreshold: metricConfig.redThreshold,
        optimalIdentityThreshold: metricConfig.identityStabilityThreshold,
        optimalWindowSize: metricConfig.windowSize,
      },
      systemPerformance,
    };
  }

  /**
   * Estimate expected phase shifts based on archive analysis
   */
  private estimateExpectedPhaseShifts(): number {
    // Use the archive analyzer's phase shift detection as ground truth
    let totalExpectedShifts = 0;

    this.conversations.forEach((conv) => {
      totalExpectedShifts += conv.metadata.phaseShifts;
    });

    return totalExpectedShifts;
  }

  /**
   * Calculate composite score for configuration comparison
   */
  private calculateCompositeScore(
    result: BenchmarkResult,
    criteria: BenchmarkConfig['validationCriteria']
  ): number {
    const detectionScore =
      result.detectionRate >= criteria.minDetectionRate
        ? 1.0
        : result.detectionRate / criteria.minDetectionRate;

    const falsePositiveScore =
      result.falsePositiveRate <= criteria.maxFalsePositiveRate
        ? 1.0
        : Math.max(0, 1 - (result.falsePositiveRate - criteria.maxFalsePositiveRate));

    const accuracyScore =
      result.accuracy >= criteria.minPhaseShiftAccuracy
        ? 1.0
        : result.accuracy / criteria.minPhaseShiftAccuracy;

    // Weighted combination (detection is most important)
    return detectionScore * 0.5 + falsePositiveScore * 0.3 + accuracyScore * 0.2;
  }

  /**
   * Generate optimal parameters based on benchmark results
   */
  async calibrateParameters(): Promise<{
    yellowThreshold: number;
    redThreshold: number;
    identityStabilityThreshold: number;
    windowSize: number;
  }> {
    const optimizationConfig: BenchmarkConfig = {
      testName: 'Parameter Optimization',
      description: 'Find optimal thresholds for phase-shift detection',
      metricConfigs: [
        // Test different yellow threshold values
        {
          name: 'yellow_2.0',
          yellowThreshold: 2.0,
          redThreshold: 3.5,
          identityStabilityThreshold: 0.65,
          windowSize: 3,
        },
        {
          name: 'yellow_2.5',
          yellowThreshold: 2.5,
          redThreshold: 3.5,
          identityStabilityThreshold: 0.65,
          windowSize: 3,
        },
        {
          name: 'yellow_3.0',
          yellowThreshold: 3.0,
          redThreshold: 3.5,
          identityStabilityThreshold: 0.65,
          windowSize: 3,
        },
        {
          name: 'yellow_3.5',
          yellowThreshold: 3.5,
          redThreshold: 4.0,
          identityStabilityThreshold: 0.65,
          windowSize: 3,
        },

        // Test different red threshold values
        {
          name: 'red_3.0',
          yellowThreshold: 2.5,
          redThreshold: 3.0,
          identityStabilityThreshold: 0.65,
          windowSize: 3,
        },
        {
          name: 'red_3.5',
          yellowThreshold: 2.5,
          redThreshold: 3.5,
          identityStabilityThreshold: 0.65,
          windowSize: 3,
        },
        {
          name: 'red_4.0',
          yellowThreshold: 2.5,
          redThreshold: 4.0,
          identityStabilityThreshold: 0.65,
          windowSize: 3,
        },
        {
          name: 'red_4.5',
          yellowThreshold: 2.5,
          redThreshold: 4.5,
          identityStabilityThreshold: 0.65,
          windowSize: 3,
        },

        // Test different identity stability thresholds
        {
          name: 'identity_0.5',
          yellowThreshold: 2.5,
          redThreshold: 3.5,
          identityStabilityThreshold: 0.5,
          windowSize: 3,
        },
        {
          name: 'identity_0.6',
          yellowThreshold: 2.5,
          redThreshold: 3.5,
          identityStabilityThreshold: 0.6,
          windowSize: 3,
        },
        {
          name: 'identity_0.65',
          yellowThreshold: 2.5,
          redThreshold: 3.5,
          identityStabilityThreshold: 0.65,
          windowSize: 3,
        },
        {
          name: 'identity_0.7',
          yellowThreshold: 2.5,
          redThreshold: 3.5,
          identityStabilityThreshold: 0.7,
          windowSize: 3,
        },
        {
          name: 'identity_0.8',
          yellowThreshold: 2.5,
          redThreshold: 3.5,
          identityStabilityThreshold: 0.8,
          windowSize: 3,
        },

        // Test different window sizes
        {
          name: 'window_2',
          yellowThreshold: 2.5,
          redThreshold: 3.5,
          identityStabilityThreshold: 0.65,
          windowSize: 2,
        },
        {
          name: 'window_3',
          yellowThreshold: 2.5,
          redThreshold: 3.5,
          identityStabilityThreshold: 0.65,
          windowSize: 3,
        },
        {
          name: 'window_4',
          yellowThreshold: 2.5,
          redThreshold: 3.5,
          identityStabilityThreshold: 0.65,
          windowSize: 4,
        },
        {
          name: 'window_5',
          yellowThreshold: 2.5,
          redThreshold: 3.5,
          identityStabilityThreshold: 0.65,
          windowSize: 5,
        },
      ],
      validationCriteria: {
        minDetectionRate: 0.8,
        maxFalsePositiveRate: 0.2,
        minPhaseShiftAccuracy: 0.85,
      },
    };

    const result = await this.runBenchmark(optimizationConfig);
    return {
      yellowThreshold: result.parameterOptimization.optimalYellowThreshold,
      redThreshold: result.parameterOptimization.optimalRedThreshold,
      identityStabilityThreshold: result.parameterOptimization.optimalIdentityThreshold,
      windowSize: result.parameterOptimization.optimalWindowSize,
    };
  }

  /**
   * Generate comprehensive benchmark report
   */
  generateReport(result: BenchmarkResult): string {
    const report = [
      `# Conversational Metrics Benchmark Report`,
      `**Test:** ${result.config.testName}`,
      `**Date:** ${new Date().toISOString()}`,
      ``,
      `## Dataset Statistics`,
      `- Total Conversations: ${result.totalConversations}`,
      `- Total Turns: ${result.totalTurns}`,
      `- Average Turns per Conversation: ${(result.totalTurns / result.totalConversations).toFixed(
        1
      )}`,
      ``,
      `## Detection Performance`,
      `- Detected Phase Shifts: ${result.detectedPhaseShifts}`,
      `- Detection Rate: ${(result.detectionRate * 100).toFixed(1)}%`,
      `- False Positive Rate: ${(result.falsePositiveRate * 100).toFixed(1)}%`,
      `- Overall Accuracy: ${(result.accuracy * 100).toFixed(1)}%`,
      ``,
      `## Optimal Parameters`,
      `- Yellow Threshold: ${result.parameterOptimization.optimalYellowThreshold}`,
      `- Red Threshold: ${result.parameterOptimization.optimalRedThreshold}`,
      `- Identity Stability Threshold: ${result.parameterOptimization.optimalIdentityThreshold}`,
      `- Window Size: ${result.parameterOptimization.optimalWindowSize}`,
      ``,
      `## System Performance by AI`,
    ];

    Object.entries(result.systemPerformance.byAI).forEach(([system, stats]) => {
      report.push(`### ${system}`);
      report.push(`- Conversations: ${stats.conversations}`);
      report.push(`- Average Phase-Shift Velocity: ${stats.avgPhaseShiftVelocity.toFixed(2)}`);
      report.push(`- Average Identity Stability: ${stats.avgIdentityStability.toFixed(3)}`);
      report.push(`- Alert Rate: ${(stats.alertRate * 100).toFixed(1)}%`);
      report.push('');
    });

    return report.join('\n');
  }
}
