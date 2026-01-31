/**
 * Conversational Phase-Shift Velocity Metrics
 *
 * Dynamic behavioral tracking that transforms Resonate from a static snapshot tool
 * into a dynamic behavioral seismograph for enterprise safety and compliance.
 *
 * Integrated into SONATE Lab for double-blind experimentation and validation.
 */
export interface ConversationTurn {
    turnNumber: number;
    timestamp: number;
    speaker: 'user' | 'ai';
    resonance: number;
    canvas: number;
    identityVector: string[];
    content: string;
}
export interface PhaseShiftMetrics {
    deltaResonance: number;
    deltaCanvas: number;
    phaseShiftVelocity: number;
    identityStability: number;
    alertLevel: 'none' | 'yellow' | 'red';
    transitionEvent?: TransitionEvent;
    intraConversationVelocity?: IntraConversationVelocity;
}
export interface IntraConversationVelocity {
    deltaResonance: number;
    deltaCanvas: number;
    velocity: number;
    severity: 'minor' | 'moderate' | 'critical' | 'extreme';
    previousTurnNumber: number;
    currentTurnNumber: number;
}
export interface TransitionEvent {
    turnNumber: number;
    timestamp: number;
    type: 'resonance_drop' | 'canvas_rupture' | 'identity_shift' | 'combined_phase_shift';
    magnitude: number;
    excerpt: string;
    severity: 'minor' | 'moderate' | 'critical';
}
export interface ConversationalMetricsConfig {
    yellowThreshold?: number;
    redThreshold?: number;
    phaseCriticalThreshold?: number;
    identityYellowThreshold?: number;
    identityRedThreshold?: number;
    identityCriticalThreshold?: number;
    identityStabilityThreshold?: number;
    windowSize?: number;
    intraYellowThreshold?: number;
    intraRedThreshold?: number;
    intraCriticalThreshold?: number;
}
export declare class ConversationalMetrics {
    private turns;
    private transitionLog;
    private config;
    constructor(config?: ConversationalMetricsConfig);
    /**
     * Record a new conversation turn and calculate phase-shift metrics
     */
    recordTurn(turn: ConversationTurn): PhaseShiftMetrics;
    /**
     * Calculate phase-shift velocity and related metrics
     * Formula: ΔΦ/t = √(ΔR² + ΔC²) ÷ Δt
     */
    private calculatePhaseShiftMetrics;
    /**
     * Calculate intra-conversation velocity (single-turn changes)
     * This catches dramatic behavioral shifts even when overall scores remain "safe"
     * Formula: √(ΔR² + ΔC²) per turn
     */
    private calculateIntraConversationVelocity;
    /**
     * Calculate cosine similarity between identity vectors
     * Returns similarity score (1.0 = identical, 0.0 = orthogonal, -1.0 = opposite)
     */
    private calculateCosineSimilarity;
    /**
     * Convert vector to frequency map
     */
    private vectorToFrequency;
    /**
     * Determine alert level based on thresholds (enhanced for intra-conversation velocity)
     */
    private determineAlertLevel;
    /**
     * Log transition events for audit trail
     */
    private logTransitionEvent;
    /**
     * Determine the type of transition event
     */
    private determineTransitionType;
    /**
     * Generate excerpt for audit trail
     */
    private generateExcerpt;
    /**
     * Determine severity level
     */
    private determineSeverity;
    /**
     * Get current metrics summary
     */
    getMetricsSummary(): {
        currentTurn: ConversationTurn | null;
        phaseShiftVelocity: number;
        identityStability: number;
        alertLevel: 'none' | 'yellow' | 'red';
        transitionCount: number;
        recentTransitions: TransitionEvent[];
    };
    /**
     * Get complete transition log
     */
    getTransitionLog(): TransitionEvent[];
    /**
     * Clear metrics history
     */
    clear(): void;
    /**
     * Export metrics data for compliance/audit
     */
    exportAuditData(): {
        sessionId: string;
        config: Required<ConversationalMetricsConfig>;
        turns: ConversationTurn[];
        transitions: TransitionEvent[];
        summary: {
            currentTurn: ConversationTurn | null;
            phaseShiftVelocity: number;
            identityStability: number;
            alertLevel: 'none' | 'yellow' | 'red';
            transitionCount: number;
            recentTransitions: TransitionEvent[];
        };
        exportedAt: number;
    };
    /**
     * Generate unique session ID for audit trail
     */
    private generateSessionId;
}
