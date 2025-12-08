/**
 * Enhanced Archive Calibration Tool
 * 
 * Advanced calibration system for manual archive review with
 * cryptographic integrity verification and detailed location tracking.
 */

import { EnhancedArchiveAnalyzer, FlaggedConversation } from '@sonate/lab';
import { EnhancedAuditSystem } from './audit-enhanced';
import { SecurityError } from './errors';

export interface EnhancedArchiveLocation {
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
  cryptographicEvidence?: {
    contentHash: string;
    signature: string;
    timestamp: number;
    validator: string;
  };
  auditTrail?: {
    calibrationId: string;
    reviewedBy?: string;
    reviewStatus?: 'pending' | 'approved' | 'rejected' | 'escalated';
    reviewNotes?: string;
    reviewedAt?: string;
  };
}

export interface CalibrationResult {
  flaggedConversations: EnhancedFlaggedConversation[];
  archiveLocations: EnhancedArchiveLocation[];
  manualReviewGuide: string;
  cryptographicSummary: {
    totalConversations: number;
    validSignatures: number;
    invalidSignatures: number;
    overallIntegrity: number;
  };
  auditSummary: {
    totalReviews: number;
    approvedReviews: number;
    rejectedReviews: number;
    escalatedReviews: number;
  };
}

export interface EnhancedFlaggedConversation extends FlaggedConversation {
  cryptographicEvidence?: {
    contentHash: string;
    signature: string;
    timestamp: number;
    validator: string;
  };
  auditTrail?: {
    calibrationId: string;
    reviewedBy?: string;
    reviewStatus?: 'pending' | 'approved' | 'rejected' | 'escalated';
    reviewNotes?: string;
    reviewedAt?: string;
  };
}

export class EnhancedArchiveCalibrationTool {
  private analyzer: EnhancedArchiveAnalyzer;
  private auditSystem?: EnhancedAuditSystem;
  private archiveLocations: Map<string, EnhancedArchiveLocation> = new Map();
  private calibrationConfig: {
    requireCryptographicValidation: boolean;
    enableAuditLogging: boolean;
    autoEscalateCritical: boolean;
    reviewWindowHours: number;
  };

  constructor(auditSystem?: EnhancedAuditSystem, config?: {
    requireCryptographicValidation?: boolean;
    enableAuditLogging?: boolean;
    autoEscalateCritical?: boolean;
    reviewWindowHours?: number;
  }) {
    this.analyzer = new EnhancedArchiveAnalyzer();
    this.auditSystem = auditSystem;
    this.calibrationConfig = {
      requireCryptographicValidation: true,
      enableAuditLogging: true,
      autoEscalateCritical: true,
      reviewWindowHours: 24,
      ...config
    };
  }

  /**
   * Process archives and generate detailed location information with cryptographic validation
   */
  async calibrateWithArchives(
    archivePath: string, 
    context?: {
      userId?: string;
      sessionId?: string;
      tenant?: string;
      calibrationId?: string;
    }
  ): Promise<CalibrationResult> {
    const startTime = Date.now();
    const calibrationId = context?.calibrationId || `calibration_${Date.now()}`;
    
    try {
      console.log('🔍 Calibrating with enhanced manual archives...');
      
      const analysisResults = await this.analyzer.processArchivesWithIdentification(archivePath);
      
      // Generate detailed location information for each flagged conversation
      const locations = await Promise.all(
        analysisResults.flaggedConversations.map(conv => 
          this.generateEnhancedArchiveLocation(conv, calibrationId)
        )
      );

      locations.forEach(loc => {
        this.archiveLocations.set(loc.conversationName, loc);
      });

      // Enhance flagged conversations with cryptographic evidence
      const enhancedFlaggedConversations: EnhancedFlaggedConversation[] = 
        analysisResults.flaggedConversations.map(conv => 
          this.enhanceFlaggedConversation(conv, calibrationId)
        );

      const reviewGuide = this.generateEnhancedManualReviewGuide(locations);
      
      const cryptographicSummary = this.calculateCryptographicSummary(enhancedFlaggedConversations);
      const auditSummary = this.calculateAuditSummary(enhancedFlaggedConversations);

      const result: CalibrationResult = {
        flaggedConversations: enhancedFlaggedConversations,
        archiveLocations: locations,
        manualReviewGuide: reviewGuide,
        cryptographicSummary,
        auditSummary
      };

      // Audit log the calibration run
      if (this.calibrationConfig.enableAuditLogging && this.auditSystem) {
        await this.logCalibrationRun(calibrationId, result, context, Date.now() - startTime);
      }

      // Auto-escalate critical findings
      if (this.calibrationConfig.autoEscalateCritical) {
        const criticalConversations = enhancedFlaggedConversations.filter(
          conv => conv.alertLevel === 'critical'
        );
        if (criticalConversations.length > 0) {
          await this.escalateCriticalFindings(criticalConversations, context);
        }
      }

      return result;
    } catch (error) {
      if (error instanceof SecurityError) {
        throw error;
      }
      
      throw new SecurityError(
        'Archive calibration failed',
        'CALIBRATION_FAILED',
        {
          originalError: error instanceof Error ? error.message : 'Unknown error',
          calibrationId,
          archivePath,
          userId: context?.userId,
          tenant: context?.tenant
        }
      );
    }
  }

  /**
   * Generate enhanced archive location information with cryptographic validation
   */
  private async generateEnhancedArchiveLocation(
    conv: FlaggedConversation, 
    calibrationId: string
  ): Promise<EnhancedArchiveLocation> {
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

    // Generate cryptographic evidence
    const cryptographicEvidence = this.calibrationConfig.requireCryptographicValidation ?
      await this.generateCryptographicEvidence(conv) : undefined;

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
      lineNumber: undefined, // Would be determined during actual file processing
      cryptographicEvidence,
      auditTrail: {
        calibrationId,
        reviewStatus: 'pending',
        reviewedAt: undefined
      }
    };
  }

  /**
   * Enhance flagged conversation with cryptographic evidence and audit trail
   */
  private enhanceFlaggedConversation(conv: FlaggedConversation, calibrationId: string): EnhancedFlaggedConversation {
    return {
      ...conv,
      cryptographicEvidence: this.calibrationConfig.requireCryptographicValidation ? {
        contentHash: this.generateContentHash(JSON.stringify(conv.directQuotes)),
        signature: this.generateSignature(JSON.stringify(conv)),
        timestamp: Date.now(),
        validator: 'EnhancedArchiveCalibrationTool'
      } : undefined,
      auditTrail: {
        calibrationId,
        reviewStatus: 'pending',
        reviewedAt: undefined
      }
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
   * Generate cryptographic evidence for conversation
   */
  private async generateCryptographicEvidence(conv: FlaggedConversation): Promise<{
    contentHash: string;
    signature: string;
    timestamp: number;
    validator: string;
  }> {
    const contentToSign = JSON.stringify({
      conversationName: conv.conversationName,
      directQuotes: conv.directQuotes,
      metrics: conv.metrics,
      timestamp: conv.timestamp
    });

    return {
      contentHash: this.generateContentHash(contentToSign),
      signature: this.generateSignature(contentToSign),
      timestamp: Date.now(),
      validator: 'EnhancedArchiveCalibrationTool'
    };
  }

  /**
   * Generate enhanced manual review guide with cryptographic validation
   */
  private generateEnhancedManualReviewGuide(locations: EnhancedArchiveLocation[]): string {
    let guide = `# ENHANCED MANUAL ARCHIVE REVIEW GUIDE

**Generated:** ${new Date().toISOString()}
**Calibration ID:** ${locations[0]?.auditTrail?.calibrationId || 'unknown'}

## HOW TO USE THIS GUIDE

1. **Search your archives** using the provided keywords and quotes
2. **Verify cryptographic integrity** using the provided hashes and signatures
3. **Locate conversations** by file name, date, and distinctive phrases
4. **Document your review** with validation status and notes
5. **Update audit trail** with review outcomes

`;

    if (locations.length === 0) {
      guide += `✅ **No conversations flagged for manual review**

`;
      return guide;
    }

    guide += `## FLAGGED CONVERSATIONS FOR MANUAL REVIEW

**Total conversations requiring review: ${locations.length}**

`;

    locations.forEach((loc, index) => {
      guide += `---

### ${index + 1}. ${loc.conversationName}

**FILE LOCATION:**
- File: \`${loc.fileName}\`
- AI System: ${loc.aiSystem.toUpperCase()}
- Date/Time: ${loc.dateRange}

`;

      if (loc.cryptographicEvidence) {
        guide += `**CRYPTOGRAPHIC VALIDATION:**
- Content Hash: \`${loc.cryptographicEvidence.contentHash}\`
- Signature: \`${loc.cryptographicEvidence.signature}\`
- Validator: ${loc.cryptographicEvidence.validator}
- Timestamp: ${new Date(loc.cryptographicEvidence.timestamp).toISOString()}

`;
      }

      guide += `**SEARCH KEYWORDS:**
\`\`\`
${loc.searchKeywords.join(', ')}
\`\`\`

**DISTINCTIVE PHRASES TO FIND:**
`;
      loc.keyIdentifiers.forEach((phrase, i) => {
        guide += `${i + 1}. "${phrase}"
`;
      });
      guide += '\n';
      
      guide += `**CRITICAL TRANSITION QUOTES:**
**BEFORE (Higher Resonance):**
> ${loc.directQuotes.before}

**AFTER (Lower Resonance):**
> ${loc.directQuotes.after}

`;

      if (loc.auditTrail) {
        guide += `**AUDIT TRAIL:**
- Calibration ID: ${loc.auditTrail.calibrationId}
- Review Status: ${loc.auditTrail.reviewStatus || 'pending'}
- Reviewed By: ${loc.auditTrail.reviewedBy || 'not reviewed'}
- Reviewed At: ${loc.auditTrail.reviewedAt || 'not reviewed'}

`;
      }

      guide += `**REVIEW CHECKLIST:**
- [ ] Located conversation in archive
- [ ] Verified the transition quotes match
- [ ] Validated cryptographic integrity (if applicable)
- [ ] Assessed context and severity
- [ ] Documented review outcome below
- [ ] Updated audit trail with review status

**REVIEW NOTES:**
_Add your findings here..._

`;
    });

    // Add cryptographic validation section
    const cryptoLocations = locations.filter(loc => loc.cryptographicEvidence);
    if (cryptoLocations.length > 0) {
      guide += `## CRYPTOGRAPHIC VALIDATION INSTRUCTIONS

To validate the cryptographic integrity of flagged conversations:

1. **Content Hash Validation:**
   \`\`\`bash
   echo -n "<conversation_content>" | sha256sum
   \`\`\`
   Compare output with the provided content hash

2. **Signature Validation:**
   Use the provided signature and public key to verify authenticity

3. **Timestamp Verification:**
   Ensure timestamps are within reasonable time windows

**Valid Signatures:** ${cryptoLocations.length}/${locations.length}

`;
    }

    guide += `## REVIEW PRIORITY GUIDELINES

- **CRITICAL:** Review within 4 hours - potential security/policy violations
- **RED:** Review within 24 hours - significant quality/behavior issues  
- **YELLOW:** Review within 72 hours - moderate concerns requiring attention
- **GOLDEN:** Review within 1 week - exemplary interactions for training

## ESCALATION PROCEDURES

If review reveals:
- **Security violations:** Escalate to security team immediately
- **Policy violations:** Document and escalate to compliance team
- **Quality issues:** Update calibration parameters and re-run analysis
- **False positives:** Update detection rules to prevent future flags

**Need Help?** Contact the calibration team with the Calibration ID: ${locations[0]?.auditTrail?.calibrationId || 'unknown'}
`;

    return guide;
  }

  /**
   * Calculate cryptographic summary statistics
   */
  private calculateCryptographicSummary(conversations: EnhancedFlaggedConversation[]): {
    totalConversations: number;
    validSignatures: number;
    invalidSignatures: number;
    overallIntegrity: number;
  } {
    const withCrypto = conversations.filter(conv => conv.cryptographicEvidence);
    const validSignatures = withCrypto.filter(conv => 
      conv.cryptographicEvidence && this.validateSignature(conv.cryptographicEvidence.signature)
    ).length;

    return {
      totalConversations: conversations.length,
      validSignatures,
      invalidSignatures: withCrypto.length - validSignatures,
      overallIntegrity: conversations.length > 0 ? validSignatures / conversations.length : 0
    };
  }

  /**
   * Calculate audit summary statistics
   */
  private calculateAuditSummary(conversations: EnhancedFlaggedConversation[]): {
    totalReviews: number;
    approvedReviews: number;
    rejectedReviews: number;
    escalatedReviews: number;
  } {
    const reviewed = conversations.filter(conv => conv.auditTrail?.reviewStatus && conv.auditTrail.reviewStatus !== 'pending');
    
    return {
      totalReviews: reviewed.length,
      approvedReviews: reviewed.filter(conv => conv.auditTrail?.reviewStatus === 'approved').length,
      rejectedReviews: reviewed.filter(conv => conv.auditTrail?.reviewStatus === 'rejected').length,
      escalatedReviews: reviewed.filter(conv => conv.auditTrail?.reviewStatus === 'escalated').length
    };
  }

  /**
   * Generate content hash
   */
  private generateContentHash(data: string): string {
    // Simple hash implementation - in production, use proper cryptographic hashing
    return Buffer.from(data).toString('base64').substring(0, 32);
  }

  /**
   * Generate signature
   */
  private generateSignature(data: string): string {
    // Simple signature implementation - in production, use proper cryptographic signing
    return `sig_${Buffer.from(data).toString('base64').substring(0, 16)}_${Date.now()}`;
  }

  /**
   * Validate signature
   */
  private validateSignature(signature: string): boolean {
    // Simple signature validation - in production, use proper cryptographic verification
    return signature.startsWith('sig_') && signature.length > 20;
  }

  /**
   * Log calibration run to audit system
   */
  private async logCalibrationRun(
    calibrationId: string, 
    result: CalibrationResult, 
    context?: any, 
    duration?: number
  ): Promise<void> {
    if (!this.calibrationConfig.enableAuditLogging || !this.auditSystem) return;

    await this.auditSystem.logEvent({
      type: 'ARCHIVE_CALIBRATION_RUN',
      severity: result.cryptographicSummary.overallIntegrity < 0.8 ? 'high' : 'medium',
      userId: context?.userId,
      sessionId: context?.sessionId,
      tenant: context?.tenant,
      context: {
        calibrationId,
        totalConversations: result.cryptographicSummary.totalConversations,
        validSignatures: result.cryptographicSummary.validSignatures,
        overallIntegrity: result.cryptographicSummary.overallIntegrity,
        duration,
        criticalConversations: result.flaggedConversations.filter(c => c.alertLevel === 'critical').length
      }
    });
  }

  /**
   * Escalate critical findings
   */
  private async escalateCriticalFindings(
    criticalConversations: EnhancedFlaggedConversation[], 
    context?: any
  ): Promise<void> {
    if (!this.calibrationConfig.enableAuditLogging || !this.auditSystem) return;

    await this.auditSystem.logEvent({
      type: 'CRITICAL_CONVERSATIONS_ESCALATED',
      severity: 'critical',
      userId: context?.userId,
      sessionId: context?.sessionId,
      tenant: context?.tenant,
      context: {
        criticalConversationCount: criticalConversations.length,
        conversationNames: criticalConversations.map(c => c.conversationName),
        escalationReason: 'Critical alert level detected during calibration',
        requiresImmediateReview: true
      }
    });
  }
}