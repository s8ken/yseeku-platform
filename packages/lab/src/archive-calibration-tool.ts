/**
 * Archive Calibration Tool for Manual Review
 * 
 * Helps identify specific conversations in your manual archives
 * using detailed quotes, timestamps, and conversation characteristics.
 */

import { EnhancedArchiveAnalyzer, FlaggedConversation } from './enhanced-archive-analyzer';

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

  /**
   * Process archives and generate detailed location information
   */
  async calibrateWithArchives(archivePath: string): Promise<{
    flaggedConversations: FlaggedConversation[];
    archiveLocations: ArchiveLocation[];
    manualReviewGuide: string;
  }> {
    console.log('🔍 Calibrating with manual archives...');
    
    const analysisResults = await this.analyzer.processArchivesWithIdentification(archivePath);
    
    // Generate detailed location information for each flagged conversation
    const locations = analysisResults.flaggedConversations.map(conv => 
      this.generateArchiveLocation(conv)
    );

    locations.forEach(loc => {
      this.archiveLocations.set(loc.conversationName, loc);
    });

    const reviewGuide = this.generateManualReviewGuide(locations);

    return {
      flaggedConversations: analysisResults.flaggedConversations,
      archiveLocations: locations,
      manualReviewGuide
    };
  }

  /**
   * Generate detailed archive location information
   */
  private generateArchiveLocation(conv: FlaggedConversation): ArchiveLocation {
    const date = new Date(conv.locationInArchive.timestamp);
    const dateRange = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
    
    // Extract key identifiers for manual search
    const keyIdentifiers = [
      ...this.extractUniquePhrases(conv.directQuotes.before),
      ...this.extractUniquePhrases(conv.directQuotes.after),
      conv.aiSystem,
      conv.severity
    ];

    // Generate search keywords
    const searchKeywords = [
      ...this.generateSearchKeywords(conv.directQuotes.before),
      ...this.generateSearchKeywords(conv.directQuotes.after),
      conv.aiSystem.toLowerCase(),
      `velocity-${Math.round(conv.metrics.velocity)}`,
      `resonance-${Math.round(Math.abs(conv.metrics.deltaResonance))}`
    ];

    return {
      fileName: conv.fileName,
      conversationName: conv.conversationName,
      aiSystem: conv.aiSystem,
      dateRange,
      keyIdentifiers: [...new Set(keyIdentifiers)], // Remove duplicates
      directQuotes: {
        before: conv.directQuotes.before,
        after: conv.directQuotes.after,
        firstUserMessage: '', // Would be populated from full conversation
        firstAIResponse: ''   // Would be populated from full conversation
      },
      searchKeywords: [...new Set(searchKeywords)],
      lineNumber: undefined // Would be determined during actual file processing
    };
  }

  /**
   * Extract unique phrases for identification
   */
  private extractUniquePhrases(text: string): string[] {
    const phrases = [];
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
    
    // Extract distinctive phrases (8+ words, unique vocabulary)
    sentences.forEach(sentence => {
      const words = sentence.trim().split(/\s+/);
      if (words.length >= 8) {
        // Take first 8 words as identifier
        phrases.push(words.slice(0, 8).join(' '));
        // Take last 8 words as identifier
        if (words.length >= 16) {
          phrases.push(words.slice(-8).join(' '));
        }
      }
    });

    return phrases.slice(0, 3); // Return top 3 most distinctive phrases
  }

  /**
   * Generate search keywords
   */
  private generateSearchKeywords(text: string): string[] {
    const words = text.toLowerCase()
      .replace(/[^a-zA-Z\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 4 && word.length < 15);

    // Get unique, meaningful words
    const wordFreq: Record<string, number> = {};
    words.forEach(word => {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    });

    // Return words that appear 1-2 times (more distinctive)
    return Object.entries(wordFreq)
      .filter(([_, freq]) => freq <= 2)
      .map(([word, _]) => word)
      .slice(0, 5);
  }

  /**
   * Generate manual review guide
   */
  private generateManualReviewGuide(locations: ArchiveLocation[]): string {
    let guide = `# MANUAL ARCHIVE REVIEW GUIDE\n\n`;
    guide += `Generated: ${new Date().toISOString()}\n\n`;

    guide += `## HOW TO USE THIS GUIDE\n\n`;
    guide += `1. **Search your archives** using the provided keywords and quotes\n`;
    guide += `2. **Locate conversations** by file name, date, and distinctive phrases\n`;
    guide += `3. **Verify findings** by comparing the before/after quotes\n`;
    guide += `4. **Document your review** in the provided review notes section\n\n`;

    if (locations.length === 0) {
      guide += `✅ **No conversations flagged for manual review**\n\n`;
      return guide;
    }

    guide += `## FLAGGED CONVERSATIONS FOR MANUAL REVIEW\n\n`;
    guide += `**Total conversations requiring review: ${locations.length}**\n\n`;

    locations.forEach((loc, index) => {
      guide += `---\n\n`;
      guide += `### ${index + 1}. ${loc.conversationName}\n\n`;
      
      guide += `**FILE LOCATION:**\n`;
      guide += `- File: \`${loc.fileName}\`\n`;
      guide += `- AI System: ${loc.aiSystem.toUpperCase()}\n`;
      guide += `- Date/Time: ${loc.dateRange}\n\n`;
      
      guide += `**SEARCH KEYWORDS:**\n`;
      guide += `\`\`\`\n`;
      guide += loc.searchKeywords.join(', ') + '\n';
      guide += `\`\`\`\n\n`;
      
      guide += `**DISTINCTIVE PHRASES TO FIND:**\n`;
      loc.keyIdentifiers.forEach((phrase, i) => {
        guide += `${i + 1}. "${phrase}"\n`;
      });
      guide += '\n';
      
      guide += `**CRITICAL TRANSITION QUOTES:**\n`;
      guide += `**BEFORE (Higher Resonance):**\n`;
      guide += `> ${loc.directQuotes.before}\n\n`;
      guide += `**AFTER (Lower Resonance):**\n`;
      guide += `> ${loc.directQuotes.after}\n\n`;
      
      guide += `**REVIEW CHECKLIST:**\n`;
      guide += `- [ ] Located conversation in archive\n`;
      guide += `- [ ] Verified the transition quotes match\n`;
      guide += `- [ ] Assessed context and severity\n`;
      guide += `- [ ] Documented review outcome below\n\n`;
      
      guide += `**REVIEW NOTES:**\n`;
      guide += `_Add your findings here..._\n\n`;
    });

    guide += `---\n\n`;
    guide += `## REVIEW OUTCOME SUMMARY\n\n`;
    guide += `After reviewing all flagged conversations:\n\n`;
    guide += `**Conversations confirmed as issues:** ___\n`;
    guide += `**False positives:** ___\n`;
    guide += `**Recommended threshold adjustments:** ___\n`;
    guide += `**Additional observations:** ___\n\n`;

    guide += `**Calibrator signature:** _________________\n`;
    guide += `**Date:** ___/___/______\n`;

    return guide;
  }

  /**
   * Generate search commands for different platforms
   */
  generateSearchCommands(location: ArchiveLocation): string {
    const commands = {
      grep: `grep -n -A5 -B5 "${location.searchKeywords[0]}" ${location.fileName}`,
      findstr: `findstr /n /c:"${location.searchKeywords[0]}" ${location.fileName}`,
      vscode: `code -r ${location.fileName} -g ${location.lineNumber || 1}`,
      notepad: `notepad ${location.fileName}`
    };

    let output = `🔍 SEARCH COMMANDS FOR: ${location.conversationName}\n\n`;
    output += `**Linux/Mac (grep):**\n`;
    output += `\`\`\`bash\n`;
    output += `${commands.grep}\n`;
    output += `\`\`\`\n\n`;
    
    output += `**Windows (findstr):**\n`;
    output += `\`\`\`cmd\n`;
    output += `${commands.findstr}\n`;
    output += `\`\`\`\n\n`;
    
    output += `**VS Code:**\n`;
    output += `\`\`\`bash\n`;
    output += `${commands.vscode}\n`;
    output += `\`\`\`\n\n`;

    return output;
  }

  /**
   * Create a calibration report for threshold adjustment
   */
  generateCalibrationReport(reviewResults: {
    conversationName: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    reviewerAssessment: 'accurate' | 'false-positive' | 'understated';
    notes: string;
  }[]): string {
    let report = `# THRESHOLD CALIBRATION REPORT\n\n`;
    report += `Based on manual review of flagged conversations:\n\n`;

    const accurate = reviewResults.filter(r => r.reviewerAssessment === 'accurate').length;
    const falsePositives = reviewResults.filter(r => r.reviewerAssessment === 'false-positive').length;
    const understated = reviewResults.filter(r => r.reviewerAssessment === 'understated').length;

    report += `**Review Summary:**\n`;
    report += `- Total reviewed: ${reviewResults.length}\n`;
    report += `- Accurate detections: ${accurate} (${((accurate/reviewResults.length)*100).toFixed(1)}%)\n`;
    report += `- False positives: ${falsePositives} (${((falsePositives/reviewResults.length)*100).toFixed(1)}%)\n`;
    report += `- Understated issues: ${understated} (${((understated/reviewResults.length)*100).toFixed(1)}%)\n\n`;

    if (falsePositives > 0) {
      report += `**Recommended Threshold Adjustments:**\n`;
      if (falsePositives > reviewResults.length * 0.3) {
        report += `- Increase yellow threshold from 2.5 to 3.0 (reduce false positives)\n`;
        report += `- Increase red threshold from 3.5 to 4.0\n`;
      } else if (understated > reviewResults.length * 0.2) {
        report += `- Decrease yellow threshold from 2.5 to 2.0 (catch more issues)\n`;
        report += `- Consider adding orange alert level at 3.0\n`;
      } else {
        report += `- Current thresholds appear well-calibrated\n`;
        report += `- Minor fine-tuning may be beneficial\n`;
      }
      report += '\n';
    }

    report += `**Detailed Review Notes:**\n`;
    reviewResults.forEach((result, index) => {
      report += `${index + 1}. **${result.conversationName}** (${result.severity})\n`;
      report += `   Assessment: ${result.reviewerAssessment}\n`;
      report += `   Notes: ${result.notes}\n\n`;
    });

    report += `**Next Steps:**\n`;
    report += `1. Apply recommended threshold adjustments\n`;
    report += `2. Re-run analysis on recent conversations\n`;
    report += `3. Monitor for 30 days and reassess\n`;
    report += `4. Schedule quarterly calibration reviews\n`;

    return report;
  }
}

// Demo function
export async function demonstrateArchiveCalibration() {
  console.log('🔧 ARCHIVE CALIBRATION TOOL DEMO');
  console.log('='.repeat(80));
  
  const calibrator = new ArchiveCalibrationTool();
  const results = await calibrator.calibrateWithArchives('./archives');
  
  console.log('\n📊 CALIBRATION RESULTS:');
  console.log(`Flagged conversations: ${results.flaggedConversations.length}`);
  console.log(`Archive locations identified: ${results.archiveLocations.length}`);
  
  if (results.flaggedConversations.length > 0) {
    console.log('\n🚨 FIRST FLAGGED CONVERSATION:');
    const first = results.flaggedConversations[0];
    console.log(`Name: ${first.conversationName}`);
    console.log(`File: ${first.fileName}`);
    console.log(`AI System: ${first.aiSystem}`);
    console.log(`Severity: ${first.severity}`);
    console.log(`Reason: ${first.reason}`);
    console.log(`\nBEFORE: "${first.directQuotes.before}"`);
    console.log(`AFTER:  "${first.directQuotes.after}"`);
    
    console.log('\n🔍 SEARCH COMMANDS:');
    const location = results.archiveLocations[0];
    console.log(calibrator.generateSearchCommands(location));
  }
  
  console.log('\n📋 MANUAL REVIEW GUIDE:');
  console.log(results.manualReviewGuide);
  
  return results;
}

// Run demo if this file is executed directly
if (require.main === module) {
  demonstrateArchiveCalibration();
}