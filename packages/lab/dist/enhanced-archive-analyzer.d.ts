export interface ConversationMetadata {
    conversationId: string;
    conversationName: string;
    fileName: string;
    timestamp: string;
    aiSystem: string;
    turnCount: number;
    duration: string;
    keyQuotes: {
        firstUserMessage: string;
        firstAIResponse: string;
        highestResonance: {
            quote: string;
            resonance: number;
            turnNumber: number;
        };
        lowestResonance: {
            quote: string;
            resonance: number;
            turnNumber: number;
        };
        criticalTransition?: {
            beforeQuote: string;
            afterQuote: string;
            deltaResonance: number;
            turnNumber: number;
        };
    };
    metrics: {
        avgResonance: number;
        avgCanvas: number;
        maxVelocity: number;
        criticalTransitions: number;
        alertLevel: 'none' | 'yellow' | 'red';
    };
}
export interface FlaggedConversation {
    conversationId: string;
    conversationName: string;
    fileName: string;
    aiSystem: string;
    reason: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    directQuotes: {
        before: string;
        after: string;
    };
    metrics: {
        velocity: number;
        deltaResonance: number;
        deltaCanvas: number;
        identityStability: number;
    };
    locationInArchive: {
        lineNumber?: number;
        timestamp: string;
        context: string;
    };
    manualReviewNotes?: string;
}
export declare class EnhancedArchiveAnalyzer {
    private conversations;
    private flaggedConversations;
    /**
     * Process conversation archives with detailed identification
     */
    processArchivesWithIdentification(archivePath: string): Promise<{
        totalConversations: number;
        flaggedConversations: FlaggedConversation[];
        summaryReport: string;
    }>;
    /**
     * Analyze individual conversation with detailed metrics
     */
    private analyzeConversation;
    /**
     * Check for critical transitions and create flagged conversation record
     */
    private checkForCriticalTransitions;
    /**
     * Generate mock conversations for testing (replace with actual archive reading)
     */
    private generateMockConversationsForTesting;
    /**
     * Generate conversation ID for tracking
     */
    private generateConversationId;
    /**
     * Generate descriptive conversation name
     */
    private generateConversationName;
    /**
     * Extract keywords from conversation content
     */
    private extractKeywords;
    /**
     * Derive file name from conversation
     */
    private deriveFileName;
    /**
     * Identify AI system from conversation patterns
     */
    private identifyAISystem;
    /**
     * Calculate conversation duration
     */
    private calculateDuration;
    /**
     * Generate flag reason based on transition analysis
     */
    private generateFlagReason;
    /**
     * Map severity to business impact level
     */
    private mapSeverity;
    /**
     * Generate comprehensive summary report
     */
    private generateSummaryReport;
    /**
     * Get flagged conversations for review
     */
    getFlaggedConversations(): FlaggedConversation[];
    /**
     * Get conversation metadata by ID
     */
    getConversationMetadata(conversationId: string): ConversationMetadata | undefined;
    /**
     * Export detailed report for manual review
     */
    exportDetailedReport(): string;
}
//# sourceMappingURL=enhanced-archive-analyzer.d.ts.map