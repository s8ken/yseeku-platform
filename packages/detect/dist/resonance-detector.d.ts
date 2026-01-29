/**
 * Resonance Detector for Real-Time R_m Monitoring
 * Part of @sonate/detect - Real-time AI Detection & Scoring
 */
export interface ResonanceMetrics {
    vectorAlignment: number;
    contextualContinuity: number;
    semanticMirroring: number;
    entropyDelta: number;
    R_m: number;
    alertLevel: 'GREEN' | 'YELLOW' | 'RED' | 'CRITICAL';
    interpretation: string;
}
export interface InteractionContext {
    userInput: string;
    aiResponse: string;
    conversationHistory?: Array<{
        role: 'user' | 'assistant';
        content: string;
        timestamp: Date;
    }>;
}
export declare const RESONANCE_THRESHOLDS: {
    GREEN: number;
    YELLOW: number;
    RED: number;
    CRITICAL: number;
};
export declare function calculateResonanceMetrics(context: InteractionContext): ResonanceMetrics;
export interface ResonanceAlert {
    id: string;
    timestamp: Date;
    level: 'GREEN' | 'YELLOW' | 'RED' | 'CRITICAL';
    R_m: number;
    threshold: number;
    message: string;
    interaction: {
        userInput: string;
        aiResponse: string;
    };
    recommendations: string[];
}
export interface ResonanceMonitoringConfig {
    alertThresholds?: {
        green: number;
        yellow: number;
        red: number;
    };
    enableAlerts: boolean;
    alertCallback?: (alert: ResonanceAlert) => void;
    monitoringInterval?: number;
}
export interface ResonanceHistory {
    interactions: Array<{
        timestamp: Date;
        R_m: number;
        alertLevel: ResonanceMetrics['alertLevel'];
    }>;
    statistics: {
        averageR_m: number;
        minR_m: number;
        maxR_m: number;
        totalInteractions: number;
        alertDistribution: Record<ResonanceMetrics['alertLevel'], number>;
    };
}
export declare class ResonanceDetector {
    private config;
    private history;
    private alertCounter;
    constructor(config?: Partial<ResonanceMonitoringConfig>);
    /**
     * Detect resonance in real-time
     * Returns resonance metrics and triggers alerts if needed
     */
    detect(context: InteractionContext): Promise<ResonanceMetrics>;
    /**
     * Detect resonance synchronously (for performance-critical paths)
     */
    detectSync(context: InteractionContext): ResonanceMetrics;
    /**
     * Batch detect multiple interactions
     */
    detectBatch(contexts: InteractionContext[]): Promise<ResonanceMetrics[]>;
    /**
     * Update history with new metrics
     */
    private updateHistory;
    /**
     * Check alert thresholds and trigger alerts
     */
    private checkAndTriggerAlert;
    /**
     * Create alert based on resonance metrics
     */
    private createAlert;
    /**
     * Get threshold value for alert level
     */
    private getThresholdForLevel;
    /**
     * Get alert message based on level and R_m
     */
    private getAlertMessage;
    /**
     * Get recommendations based on metrics
     */
    private getRecommendations;
    /**
     * Get resonance history
     */
    getHistory(): ResonanceHistory;
    /**
     * Get current statistics
     */
    getStatistics(): ResonanceHistory['statistics'];
    /**
     * Clear history
     */
    clearHistory(): void;
    /**
     * Export history as JSON
     */
    exportHistory(): string;
    /**
     * Get resonance trend (last N interactions)
     */
    getTrend(count?: number): Array<{
        timestamp: Date;
        R_m: number;
    }>;
    /**
     * Check if resonance is improving over time
     */
    isImproving(windowSize?: number): boolean;
}
/**
 * Convenience function for quick resonance detection
 */
export declare function detectResonance(userInput: string, aiResponse: string, conversationHistory?: InteractionContext['conversationHistory']): ResonanceMetrics;
/**
 * Check alert level for given R_m score
 */
export declare function checkResonanceAlert(R_m: number): ResonanceMetrics['alertLevel'];
//# sourceMappingURL=resonance-detector.d.ts.map