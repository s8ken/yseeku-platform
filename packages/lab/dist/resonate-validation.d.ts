import { FlaggedConversation } from './enhanced-archive-analyzer';
export interface ValidationResult {
    feature: string;
    status: 'pass' | 'fail' | 'partial';
    score: number;
    details: string[];
    recommendations: string[];
    flaggedConversations?: FlaggedConversation[];
}
export interface ComprehensiveValidationReport {
    timestamp: number;
    totalFeatures: number;
    passedFeatures: number;
    failedFeatures: number;
    partialFeatures: number;
    overallScore: number;
    results: ValidationResult[];
    recommendations: string[];
}
export declare class ResonateValidationSuite {
    private benchmarkSuite;
    private archiveAnalyzer;
    private experimentOrchestrator;
    private statisticalEngine;
    private enhancedAnalyzer;
    private calibrationTool;
    constructor();
    /**
     * Run comprehensive validation of all resonate features
     */
    validateAllFeatures(): Promise<ComprehensiveValidationReport>;
    /**
     * Validate Phase-Shift Velocity calculation accuracy
     */
    private validatePhaseShiftVelocity;
    /**
     * Validate identity stability detection
     */
    private validateIdentityStabilityDetection;
    /**
     * Validate transition event detection
     */
    private validateTransitionEventDetection;
    /**
     * Validate alert system thresholds
     */
    private validateAlertSystem;
    /**
     * Validate audit trail functionality
     */
    private validateAuditTrail;
    /**
     * Validate double-blind experimentation framework
     */
    private validateDoubleBlindExperimentation;
    /**
     * Validate statistical analysis engine
     */
    private validateStatisticalAnalysis;
    /**
     * Validate archive processing capabilities with enhanced conversation identification
     */
    private validateArchiveProcessing;
    /**
     * Validate parameter calibration
     */
    private validateParameterCalibration;
    /**
     * Validate cross-system consistency
     */
    private validateCrossSystemConsistency;
    /**
     * Generate recommendations based on validation results
     */
    private generateRecommendations;
    /**
     * Generate comprehensive validation report with flagged conversation details
     */
    generateReport(report: ComprehensiveValidationReport): string;
    /**
     * Generate manual archive calibration report with search commands
     */
    generateCalibrationReport(): Promise<string>;
    /**
     * Demonstrate conversation identification with specific examples
     */
    demonstrateConversationIdentification(): Promise<string>;
}
