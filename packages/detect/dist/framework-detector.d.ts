/**
 * SonateFrameworkDetector - Core 5-dimension detection engine
 *
 * This is the production-grade detector that scores AI interactions
 * in real-time across all 5 SONATE Framework dimensions.
 *
 * Use case: Live production monitoring (< 100ms latency requirement)
 */
import { AIInteraction, DetectionResult } from './index';
export declare class SonateFrameworkDetector {
    private realityCalc;
    private trustValidator;
    private ethicalScorer;
    private resonanceMeasurer;
    private canvasCalc;
    constructor();
    /**
     * Detect and score an AI interaction across all 5 dimensions
     *
     * This is the main entry point for SONATE Detect module.
     * Call this for every AI interaction in production.
     */
    detect(interaction: AIInteraction): Promise<DetectionResult>;
    /**
     * Generate Trust Receipt for this detection
     */
    private generateReceipt;
    /**
     * Calculate clarity score (0-1)
     */
    private calculateClarity;
}
//# sourceMappingURL=framework-detector.d.ts.map