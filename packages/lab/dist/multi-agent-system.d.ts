/**
 * Multi-Agent System - CONDUCTOR, VARIANT, EVALUATOR, OVERSEER roles
 *
 * Implements the 4-agent architecture from sonate-resonate Lab:
 * - CONDUCTOR: Manages experiment flow
 * - VARIANT: Executes AI model responses
 * - EVALUATOR: Scores outputs
 * - OVERSEER: Monitors for anomalies
 */
import { VariantConfig, TestCase, VariantResult } from './index';
export declare class MultiAgentSystem {
    private detector;
    constructor();
    /**
     * Run a variant through all test cases
     */
    runVariant(variant: VariantConfig, testCases: TestCase[]): Promise<VariantResult>;
    /**
     * Run a single test case with all 4 agent roles
     */
    private runTestCase;
    /**
     * VARIANT role: Execute AI model
     */
    private executeVariant;
    /**
     * OVERSEER role: Monitor for anomalies
     */
    private overseerCheck;
    /**
     * Calculate aggregate scores across test cases
     */
    private calculateAggregates;
    private average;
}
