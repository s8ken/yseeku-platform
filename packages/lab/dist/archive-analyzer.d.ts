/**
 * Archive Analysis Utilities for Conversational Metrics
 *
 * Extracts conversation data from .mhtml and JSON archives for testing
 * and calibration of the Phase-Shift Velocity metrics within SONATE Lab.
 */
import { ConversationTurn } from './conversational-metrics';
export interface ArchiveConversation {
    aiSystem: string;
    conversationId: string;
    timestamp: number;
    sourceFileName: string;
    turns: ConversationTurn[];
    metadata: {
        totalTurns: number;
        avgResonance: number;
        avgCanvas: number;
        phaseShifts: number;
        alertEvents: number;
    };
}
export interface ParsedConversationTurn {
    turnNumber: number;
    timestamp: number;
    speaker: 'user' | 'ai';
    content: string;
    resonance?: number;
    canvas?: number;
    identityVector?: string[];
}
export declare class ArchiveAnalyzer {
    private archivesPath;
    constructor(archivesPath?: string);
    /**
     * Load all available conversations from archives
     */
    loadAllConversations(): Promise<ArchiveConversation[]>;
    /**
     * Load conversations from a specific AI system
     */
    private loadSystemConversations;
    /**
     * Parse MHTML file and extract conversation data
     */
    private parseMhtmlFile;
    /**
     * Parse JSON file and extract conversation data
     */
    private parseJsonFile;
    /**
     * Extract conversation turns from MHTML content
     */
    private extractTurnsFromMhtml;
    /**
     * Extract conversation turns from JSON data
     */
    private extractTurnsFromJson;
    /**
     * Enhance turns with resonance and canvas scores based on content analysis
     */
    private enhanceTurnsWithMetrics;
    /**
     * Calculate conversation metadata
     */
    private calculateMetadata;
    /**
     * Clean HTML content
     */
    private cleanHtmlContent;
    /**
     * Generate conversation ID
     */
    private generateConversationId;
    /**
     * Extract timestamp from filename (if possible)
     */
    private extractTimestampFromFilename;
    /**
     * Get statistics about loaded conversations
     */
    getArchiveStatistics(conversations: ArchiveConversation[]): {
        totalConversations: number;
        bySystem: Record<string, number>;
        totalTurns: number;
        avgTurnsPerConversation: number;
        totalPhaseShifts: number;
        totalAlertEvents: number;
        avgResonance: number;
        avgCanvas: number;
    };
}
