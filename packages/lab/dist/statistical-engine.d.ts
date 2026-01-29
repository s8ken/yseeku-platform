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
export declare class StatisticalEngine {
    /**
     * Analyze experiment results for statistical significance
     *
     * Compares variant A vs variant B (first two variants)
     */
    analyze(variantResults: VariantResult[]): Promise<StatisticalAnalysis>;
    /**
     * Two-sample t-test
     */
    private tTest;
    /**
     * Bootstrap confidence interval (95%)
     */
    private bootstrapCI;
    /**
     * Cohen's d effect size
     */
    private cohensD;
    private mean;
    private variance;
    private resample;
    private tDistributionPValue;
    private normalCDF;
    private erf;
}
//# sourceMappingURL=statistical-engine.d.ts.map