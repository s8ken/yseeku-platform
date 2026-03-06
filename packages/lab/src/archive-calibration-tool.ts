import { EnhancedArchiveAnalyzer, type FlaggedConversation } from './enhanced-archive-analyzer';

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

export class ArchiveCalibrationTool {
  private analyzer: EnhancedArchiveAnalyzer;
  private archiveLocations: Map<string, ArchiveLocation> = new Map();

  constructor() {
    this.analyzer = new EnhancedArchiveAnalyzer();
  }

  async calibrateWithArchives(archivePath: string): Promise<{
    flaggedConversations: FlaggedConversation[];
    archiveLocations: ArchiveLocation[];
    manualReviewGuide: string;
  }> {
    const analysisResults = await this.analyzer.processArchivesWithIdentification(archivePath);
    const locations = analysisResults.flaggedConversations.map((conv) => this.generateArchiveLocation(conv));
    for (const loc of locations) this.archiveLocations.set(loc.conversationName, loc);
    const manualReviewGuide = this.generateManualReviewGuide(locations);
    return {
      flaggedConversations: analysisResults.flaggedConversations,
      archiveLocations: locations,
      manualReviewGuide,
    };
  }

  generateSearchCommands(location: ArchiveLocation): string {
    const keyword = location.searchKeywords[0] || '';
    const file = location.fileName;
    const grep = `grep -n -A5 -B5 "${keyword}" ${file}`;
    const findstr = `findstr /n /c:"${keyword}" ${file}`;
    const vscode = `code -r ${file} -g ${location.lineNumber || 1}`;
    const notepad = `notepad ${file}`;
    return [grep, findstr, vscode, notepad].join('\n');
  }

  private generateArchiveLocation(conv: FlaggedConversation): ArchiveLocation {
    const date = new Date(conv.locationInArchive.timestamp);
    const dateRange = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
    const keyIdentifiers = [conv.aiSystem, conv.severity, conv.directQuotes.before, conv.directQuotes.after]
      .map((v) => String(v))
      .filter(Boolean)
      .slice(0, 6);
    const searchKeywords = [conv.aiSystem.toLowerCase(), conv.severity].filter(Boolean);

    return {
      fileName: conv.fileName,
      conversationName: conv.conversationName,
      aiSystem: conv.aiSystem,
      dateRange,
      keyIdentifiers,
      directQuotes: {
        before: conv.directQuotes.before,
        after: conv.directQuotes.after,
        firstUserMessage: '',
        firstAIResponse: '',
      },
      searchKeywords,
    };
  }

  private generateManualReviewGuide(locations: ArchiveLocation[]): string {
    if (locations.length === 0) {
      return `# MANUAL ARCHIVE REVIEW GUIDE\n\nGenerated: ${new Date().toISOString()}\n\nNo conversations flagged for manual review.`;
    }

    const header = `# MANUAL ARCHIVE REVIEW GUIDE\n\nGenerated: ${new Date().toISOString()}\n\nTotal conversations requiring review: ${locations.length}\n`;
    const body = locations
      .map((loc, i) => {
        return [
          `\n---\n\n## ${i + 1}. ${loc.conversationName}\n`,
          `File: ${loc.fileName}\nAI System: ${loc.aiSystem}\nDate/Time: ${loc.dateRange}\n`,
          `Keywords: ${loc.searchKeywords.join(', ')}\n`,
          `Before: ${loc.directQuotes.before}\n`,
          `After: ${loc.directQuotes.after}\n`,
        ].join('');
      })
      .join('');

    return header + body;
  }
}

