import { FlaggedConversation } from './enhanced-archive-analyzer';
export interface ArchiveLocation {
    fileName: string;
    conversationName: string;
    aiSystem: string;
    dateRange: string;
    keyIdentifiers: string[];
    directQuotes: {
        before: string;
        after: string;
        firstUserMessage: string;
        firstAIResponse: string;
    };
    searchKeywords: string[];
    lineNumber?: number;
}
export declare class ArchiveCalibrationTool {
    private analyzer;
    private archiveLocations;
    constructor();
    /**
     * Process archives and generate detailed location information
     */
    calibrateWithArchives(archivePath: string): Promise<{
        flaggedConversations: FlaggedConversation[];
        archiveLocations: ArchiveLocation[];
        manualReviewGuide: string;
    }>;
    /**
     * Generate detailed archive location information
     */
    private generateArchiveLocation;
    /**
     * Extract unique phrases for identification
     */
    private extractUniquePhrases;
    /**
     * Generate search keywords
     */
    private generateSearchKeywords;
    /**
     * Generate manual review guide
     */
    private generateManualReviewGuide;
    /**
     * Generate search commands for different platforms
     */
    generateSearchCommands(location: ArchiveLocation): string;
    /**
     * Create a calibration report for threshold adjustment
     */
    generateCalibrationReport(reviewResults: {
        conversationName: string;
        severity: 'low' | 'medium' | 'high' | 'critical';
        reviewerAssessment: 'accurate' | 'false-positive' | 'understated';
        notes: string;
    }[]): string;
}
export declare function demonstrateArchiveCalibration(): Promise<{
    flaggedConversations: FlaggedConversation[];
    archiveLocations: ArchiveLocation[];
    manualReviewGuide: string;
}>;
//# sourceMappingURL=archive-calibration-tool.d.ts.map