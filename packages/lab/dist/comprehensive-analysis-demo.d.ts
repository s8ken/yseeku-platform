/**
 * Comprehensive Analysis Demonstration
 *
 * Runs the complete conversation analysis system and generates
 * detailed reports for human manual review and calibration.
 */
/**
 * Run comprehensive analysis and generate detailed report
 */
declare function runComprehensiveAnalysis(): Promise<{
    totalConversations: number;
    conversations: import("./comprehensive-conversation-analyzer").DetailedConversationAnalysis[];
    summary: import("./comprehensive-conversation-analyzer").AnalysisSummary;
    manualReviewRequired: import("./comprehensive-conversation-analyzer").ManualReviewSummary;
}>;
/**
 * Generate detailed conversation analysis for specific conversations
 */
declare function generateDetailedConversationReport(conversation: any): void;
export { runComprehensiveAnalysis, generateDetailedConversationReport };
