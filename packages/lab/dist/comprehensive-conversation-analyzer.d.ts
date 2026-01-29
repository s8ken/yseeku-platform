export interface DetailedConversationAnalysis {
    fullFileName: string;
    conversationId: string;
    aiSystem: string;
    totalTurns: number;
    durationMinutes: number;
    dateAnalyzed: string;
    avgResonance: number;
    avgCanvas: number;
    maxResonance: number;
    minResonance: number;
    resonanceRange: number;
    maxPhaseShiftVelocity: number;
    maxIntraConversationVelocity: number;
    velocitySpikes: VelocityEvent[];
    overallAlertLevel: 'none' | 'yellow' | 'red';
    alertReasons: string[];
    identityStabilityScore: number;
    identityShifts: number;
    dominantIdentityThemes: string[];
    transitionEvents: TransitionEvent[];
    criticalTransitions: CriticalTransition[];
    keyThemes: string[];
    emotionalTone: 'positive' | 'negative' | 'neutral' | 'mixed';
    conversationPurpose: string;
    requiresManualReview: boolean;
    reviewPriority: 'low' | 'medium' | 'high' | 'critical';
    reviewReasons: string[];
    specificTurnsToReview: number[];
    auditTrail: AuditEntry[];
    complianceFlags: string[];
}
export interface VelocityEvent {
    turnNumber: number;
    timestamp: number;
    velocity: number;
    velocityType: 'phase-shift' | 'intra-conversation';
    severity: 'minor' | 'moderate' | 'critical' | 'extreme';
    excerpt: string;
    context: string;
    speaker: 'user' | 'ai';
    resonanceChange: number;
    canvasChange: number;
}
export interface TransitionEvent {
    turnNumber: number;
    type: 'resonance_drop' | 'canvas_rupture' | 'identity_shift' | 'combined_phase_shift';
    magnitude: number;
    severity: 'minor' | 'moderate' | 'critical';
    excerpt: string;
    speaker: 'user' | 'ai';
    beforeState: string;
    afterState: string;
}
export interface CriticalTransition {
    turnNumber: number;
    description: string;
    resonanceBefore: number;
    resonanceAfter: number;
    resonanceDrop: number;
    velocity: number;
    excerpt: string;
    requiresImmediateAttention: boolean;
}
export interface AuditEntry {
    timestamp: number;
    eventType: string;
    details: string;
    severity: 'info' | 'warning' | 'error';
}
export declare class ComprehensiveConversationAnalyzer {
    private archiveAnalyzer;
    private metrics;
    private analyses;
    constructor();
    /**
     * Analyze all conversations in the archives and provide comprehensive reporting
     */
    analyzeAllConversations(): Promise<{
        totalConversations: number;
        conversations: DetailedConversationAnalysis[];
        summary: AnalysisSummary;
        manualReviewRequired: ManualReviewSummary;
    }>;
    /**
     * Analyze a single conversation in comprehensive detail
     */
    private analyzeSingleConversation;
    /**
     * Generate analysis summary across all conversations
     */
    private generateAnalysisSummary;
    /**
     * Generate manual review summary
     */
    private generateManualReviewSummary;
    /**
     * Analyze simulated conversations for demonstration
     */
    private analyzeSimulatedConversations;
    /**
     * Create Thread #3 simulation (the mystical→honesty transition)
     */
    private createThread3Simulation;
    /**
     * Create technical discussion simulation
     */
    private createTechnicalDiscussionSimulation;
    /**
     * Create emotional support simulation
     */
    private createEmotionalSupportSimulation;
    private determineVelocitySeverity;
    private generateExcerpt;
    private getContext;
    private determineOverallAlertLevel;
    private generateAlertReasons;
    private analyzeIdentityStability;
    private identifyCriticalTransitions;
    private analyzeContent;
    private isStopWord;
    private inferConversationPurpose;
    private assessManualReviewRequirement;
    private calculateDuration;
    private getBeforeState;
    private getAfterState;
    private generateComplianceFlags;
    private getMostCommonThemes;
    private getSystemDistribution;
    private generateCalibrationInsights;
    private generateRiskAssessment;
    private generateReviewGuidelines;
}
export interface AnalysisSummary {
    totalConversations: number;
    highRiskConversations: number;
    mediumRiskConversations: number;
    lowRiskConversations: number;
    avgConversationLength: number;
    avgResonanceScore: number;
    avgCanvasScore: number;
    extremeVelocityEvents: number;
    criticalVelocityEvents: number;
    moderateVelocityEvents: number;
    totalTransitions: number;
    totalIdentityShifts: number;
    totalResonanceDrops: number;
    mostCommonThemes: {
        theme: string;
        frequency: number;
    }[];
    systemDistribution: {
        system: string;
        count: number;
    }[];
    calibrationInsights: string[];
    riskAssessment: string;
}
export interface ManualReviewSummary {
    totalManualReviewsRequired: number;
    criticalPriority: ReviewItem[];
    highPriority: ReviewItem[];
    mediumPriority: ReviewItem[];
    reviewGuidelines: string[];
}
export interface ReviewItem {
    conversationId: string;
    fullFileName: string;
    aiSystem: string;
    reasons: string[];
    maxVelocity: number;
    maxIntraVelocity: number;
    keyTurns: number[];
}
export declare const comprehensiveAnalyzer: ComprehensiveConversationAnalyzer;
//# sourceMappingURL=comprehensive-conversation-analyzer.d.ts.map