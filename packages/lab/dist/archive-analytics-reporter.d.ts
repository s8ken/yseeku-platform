/**
 * Archive Analytics Reporter
 *
 * Overseer AI system for analyzing conversation archives and generating
 * comprehensive reports on drift, emergent patterns, and velocity metrics.
 *
 * This acts as the AI overseer providing detailed analytics to human workers
 * for manual review and calibration decisions.
 */
export interface ConversationAnalysis {
    conversationId: string;
    fileName: string;
    totalTurns: number;
    duration: number;
    avgResonance: number;
    avgCanvas: number;
    maxResonance: number;
    minResonance: number;
    maxPhaseShiftVelocity: number;
    maxIntraConversationVelocity: number;
    alertLevel: 'none' | 'yellow' | 'red';
    transitions: number;
    identityShifts: number;
    keyThemes: string[];
    requiresReview: boolean;
    reviewReason?: string;
    criticalExcerpts: string[];
    velocitySpikes: VelocitySpike[];
}
export interface VelocitySpike {
    turnNumber: number;
    velocity: number;
    type: 'phase-shift' | 'intra-conversation';
    severity: 'minor' | 'moderate' | 'critical' | 'extreme';
    excerpt: string;
    context: string;
}
export interface ArchiveReport {
    analysisDate: string;
    totalConversations: number;
    totalTurns: number;
    conversationsAnalyzed: ConversationAnalysis[];
    summary: {
        highRiskConversations: number;
        mediumRiskConversations: number;
        lowRiskConversations: number;
        avgConversationLength: number;
        avgResonanceScore: number;
        avgCanvasScore: number;
        totalTransitions: number;
        totalIdentityShifts: number;
        keyThemes: {
            theme: string;
            frequency: number;
            conversations: string[];
        }[];
        velocityPatterns: {
            extremeVelocityEvents: number;
            criticalVelocityEvents: number;
            moderateVelocityEvents: number;
            avgMaxVelocity: number;
        };
    };
    recommendations: {
        calibration: string[];
        manualReview: string[];
        systemTuning: string[];
    };
}
export declare class ArchiveAnalyticsReporter {
    private archiveAnalyzer;
    private conversationalMetrics;
    private archivesPath;
    constructor(archivesPath?: string);
    /**
     * Analyze all conversations in the archives and generate comprehensive report
     */
    analyzeArchives(): Promise<ArchiveReport>;
    /**
     * Analyze a single conversation file
     */
    private analyzeConversation;
    /**
     * Generate comprehensive report from all analyses
     */
    private generateReport;
    /**
     * Generate detailed recommendations based on analysis
     */
    private generateRecommendations;
    /**
     * Get conversation files from archives directory
     */
    private getConversationFiles;
    /**
     * Extract identity vector from content (fallback method)
     */
    private extractIdentityVector;
    /**
     * Determine velocity severity
     */
    private determineVelocitySeverity;
    /**
     * Generate excerpt from content
     */
    private generateExcerpt;
    /**
     * Get context around a turn
     */
    private getContext;
    /**
     * Extract key themes from conversation
     */
    private extractKeyThemes;
    /**
     * Check if word is a stop word
     */
    private isStopWord;
    /**
     * Assess if manual review is required
     */
    private assessReviewRequirement;
    /**
     * Calculate conversation duration
     */
    private calculateDuration;
    /**
     * Count identity shifts
     */
    private countIdentityShifts;
    /**
     * Generate conversation ID from filename
     */
    private generateConversationId;
    /**
     * Export report to file
     */
    exportReport(report: ArchiveReport, outputPath?: string): Promise<void>;
    /**
     * Generate human-readable summary for overseer
     */
    generateOverseerSummary(report: ArchiveReport): string;
}
export declare class OverseerAI {
    private reporter;
    private currentReport?;
    constructor(archivesPath?: string);
    /**
     * Initialize analysis and prepare for worker interaction
     */
    initializeAnalysis(): Promise<void>;
    /**
     * Respond to worker queries about the analysis
     */
    respondToWorker(query: string): Promise<string>;
    private getHighRiskConversations;
    private getVelocityAnalysis;
    private getThemeAnalysis;
    private getCalibrationRecommendations;
}
export declare const overseer: OverseerAI;
//# sourceMappingURL=archive-analytics-reporter.d.ts.map