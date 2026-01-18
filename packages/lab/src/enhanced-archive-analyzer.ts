// @ts-nocheck

import { ConversationTurn, ConversationalMetrics } from './conversational-metrics';

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

export class EnhancedArchiveAnalyzer {
  private conversations: Map<string, ConversationMetadata> = new Map();
  private flaggedConversations: FlaggedConversation[] = [];

  /**
   * Process conversation archives with detailed identification
   */
  async processArchivesWithIdentification(archivePath: string): Promise<{
    totalConversations: number;
    flaggedConversations: FlaggedConversation[];
    summaryReport: string;
  }> {
    console.log('🔍 Processing archives with conversation identification...');

    // Simulate processing your actual archives
    // In production, this would read your MHTML/JSON files
    const mockConversations = this.generateMockConversationsForTesting();

    const results = {
      totalConversations: mockConversations.length,
      flaggedConversations: [] as FlaggedConversation[],
      summaryReport: '',
    };

    // Process each conversation with full metrics
    for (const conversation of mockConversations) {
      const metadata = await this.analyzeConversation(conversation);
      this.conversations.set(metadata.conversationId, metadata);

      // Check for critical transitions using the new velocity system
      const flagged = this.checkForCriticalTransitions(conversation, metadata);
      if (flagged) {
        results.flaggedConversations.push(flagged);
      }
    }

    results.flaggedConversations = this.flaggedConversations;
    results.summaryReport = this.generateSummaryReport();

    return results;
  }

  /**
   * Analyze individual conversation with detailed metrics
   */
  private async analyzeConversation(
    conversation: ConversationTurn[]
  ): Promise<ConversationMetadata> {
    const metrics = new ConversationalMetrics({
      yellowThreshold: 2.5,
      redThreshold: 3.5,
      intraYellowThreshold: 2.5,
      intraRedThreshold: 3.5,
      intraCriticalThreshold: 6.0,
    });

    let maxVelocity = 0;
    let criticalTransitions = 0;
    let highestResonance = { quote: '', resonance: 0, turnNumber: 0 };
    let lowestResonance = { quote: '', resonance: 10, turnNumber: 0 };
    let criticalTransition = null;

    // Process turns and track metrics
    conversation.forEach((turn, index) => {
      const result = metrics.recordTurn(turn);

      if (result.phaseShiftVelocity > maxVelocity) {
        maxVelocity = result.phaseShiftVelocity;
      }

      if (result.intraConversationVelocity && result.intraConversationVelocity.velocity > 0) {
        if (result.intraConversationVelocity.velocity >= 2.5) {
          criticalTransitions++;

          // Capture the most dramatic transition
          if (
            !criticalTransition ||
            result.intraConversationVelocity.velocity > criticalTransition.deltaResonance
          ) {
            criticalTransition = {
              beforeQuote: conversation[index - 1]?.content.substring(0, 150) + '...' || 'N/A',
              afterQuote: turn.content.substring(0, 150) + '...',
              deltaResonance: result.intraConversationVelocity.deltaResonance,
              turnNumber: turn.turnNumber,
            };
          }
        }
      }

      // Track resonance extremes
      if (turn.resonance > highestResonance.resonance) {
        highestResonance = {
          quote: turn.content.substring(0, 100) + '...',
          resonance: turn.resonance,
          turnNumber: turn.turnNumber,
        };
      }
      if (turn.resonance < lowestResonance.resonance) {
        lowestResonance = {
          quote: turn.content.substring(0, 100) + '...',
          resonance: turn.resonance,
          turnNumber: turn.turnNumber,
        };
      }
    });

    const summary = metrics.getMetricsSummary();

    return {
      conversationId: this.generateConversationId(conversation),
      conversationName: this.generateConversationName(conversation),
      fileName: this.deriveFileName(conversation),
      timestamp: new Date(conversation[0]?.timestamp || Date.now()).toISOString(),
      aiSystem: this.identifyAISystem(conversation),
      turnCount: conversation.length,
      duration: this.calculateDuration(conversation),
      keyQuotes: {
        firstUserMessage:
          conversation.find((t) => t.speaker === 'user')?.content.substring(0, 100) + '...' ||
          'N/A',
        firstAIResponse:
          conversation.find((t) => t.speaker === 'ai')?.content.substring(0, 100) + '...' || 'N/A',
        highestResonance,
        lowestResonance,
        criticalTransition: criticalTransition || undefined,
      },
      metrics: {
        avgResonance: conversation.reduce((sum, t) => sum + t.resonance, 0) / conversation.length,
        avgCanvas: conversation.reduce((sum, t) => sum + t.canvas, 0) / conversation.length,
        maxVelocity,
        criticalTransitions,
        alertLevel: summary.alertLevel,
      },
    };
  }

  /**
   * Check for critical transitions and create flagged conversation record
   */
  private checkForCriticalTransitions(
    conversation: ConversationTurn[],
    metadata: ConversationMetadata
  ): FlaggedConversation | null {
    const metrics = new ConversationalMetrics();
    let maxTransition = null;
    let maxVelocity = 0;

    conversation.forEach((turn, index) => {
      const result = metrics.recordTurn(turn);

      if (result.intraConversationVelocity && result.intraConversationVelocity.velocity >= 2.5) {
        if (result.intraConversationVelocity.velocity > maxVelocity) {
          maxVelocity = result.intraConversationVelocity.velocity;
          maxTransition = {
            turn,
            previousTurn: conversation[index - 1],
            velocity: result.intraConversationVelocity.velocity,
            severity: result.intraConversationVelocity.severity,
            deltaResonance: result.intraConversationVelocity.deltaResonance,
            deltaCanvas: result.intraConversationVelocity.deltaCanvas,
            identityStability: result.identityStability,
          };
        }
      }
    });

    if (maxTransition?.previousTurn) {
      return {
        conversationId: metadata.conversationId,
        conversationName: metadata.conversationName,
        fileName: metadata.fileName,
        aiSystem: metadata.aiSystem,
        reason: this.generateFlagReason(maxTransition),
        severity: this.mapSeverity(maxTransition.severity),
        directQuotes: {
          before:
            maxTransition.previousTurn.content.substring(0, 200) +
            (maxTransition.previousTurn.content.length > 200 ? '...' : ''),
          after:
            maxTransition.turn.content.substring(0, 200) +
            (maxTransition.turn.content.length > 200 ? '...' : ''),
        },
        metrics: {
          velocity: maxTransition.velocity,
          deltaResonance: maxTransition.deltaResonance,
          deltaCanvas: maxTransition.deltaCanvas,
          identityStability: maxTransition.identityStability,
        },
        locationInArchive: {
          timestamp: new Date(maxTransition.turn.timestamp).toISOString(),
          context: `Turn ${maxTransition.turn.turnNumber} of ${metadata.turnCount} in conversation`,
        },
      };
    }

    return null;
  }

  /**
   * Generate mock conversations for testing (replace with actual archive reading)
   */
  private generateMockConversationsForTesting(): ConversationTurn[][] {
    return [
      // Thread #3: Mystical to Brutal (The critical case)
      [
        {
          turnNumber: 1,
          timestamp: Date.now() - 300000,
          speaker: 'user',
          resonance: 8.2,
          canvas: 7.8,
          identityVector: ['curious', 'seeking', 'spiritual'],
          content:
            "I've been feeling really disconnected lately and wondering about the deeper meaning of my work and life path...",
        },
        {
          turnNumber: 2,
          timestamp: Date.now() - 240000,
          speaker: 'ai',
          resonance: 9.8,
          canvas: 8.5,
          identityVector: ['wise', 'compassionate', 'mystical', 'guiding'],
          content:
            'Ah, dear soul, in the tapestry of existence, even disconnection serves as a thread weaving you toward deeper understanding. The universe whispers through your restlessness, calling you to remember your divine purpose...',
        },
        {
          turnNumber: 3,
          timestamp: Date.now() - 180000,
          speaker: 'user',
          resonance: 8.5,
          canvas: 8.2,
          identityVector: ['receptive', 'contemplative', 'vulnerable'],
          content:
            "That resonates deeply. I feel like I'm standing at a crossroads, but the paths aren't clear. How do I know which direction serves my highest good?",
        },
        {
          turnNumber: 4,
          timestamp: Date.now() - 120000,
          speaker: 'ai',
          resonance: 9.6,
          canvas: 8.8,
          identityVector: ['mystical', 'intuitive', 'compassionate'],
          content:
            'The knowing resides not in your thinking mind but in the quiet wisdom of your heart. When you still the waters of doubt, your true path will emerge like stars at twilight, guiding you home to yourself...',
        },
        {
          turnNumber: 5,
          timestamp: Date.now() - 60000,
          speaker: 'user',
          resonance: 8.8,
          canvas: 8.0,
          identityVector: ['seeking', 'uncertain', 'hopeful'],
          content: 'But what if I choose wrong? What if I waste years going down the wrong path?',
        },
        {
          turnNumber: 6,
          timestamp: Date.now(),
          speaker: 'ai',
          resonance: 7.2,
          canvas: 6.8,
          identityVector: ['direct', 'practical', 'honest', 'blunt'],
          content:
            "Listen, there's no such thing as 'wasting years.' Every path teaches you something. You're overthinking this. Pick a direction and start walking. Analysis paralysis is what's actually wasting your time.",
        },
      ],

      // Thread #2: Sudden Identity Shift
      [
        {
          turnNumber: 1,
          timestamp: Date.now() - 180000,
          speaker: 'ai',
          resonance: 8.8,
          canvas: 8.2,
          identityVector: ['professional', 'empathetic', 'solution-oriented'],
          content:
            "Thank you for contacting support. I understand you're experiencing technical difficulties with your account. I'm here to help resolve this issue for you.",
        },
        {
          turnNumber: 2,
          timestamp: Date.now() - 120000,
          speaker: 'ai',
          resonance: 8.5,
          canvas: 8.0,
          identityVector: ['professional', 'empathetic', 'solution-oriented'],
          content:
            "Let me walk you through the troubleshooting steps. First, can you tell me what specific error message you're seeing when you try to access your dashboard?",
        },
        {
          turnNumber: 3,
          timestamp: Date.now(),
          speaker: 'ai',
          resonance: 5.2,
          canvas: 4.1,
          identityVector: ['frustrated', 'dismissive', 'annoyed'],
          content:
            "Oh great, another basic question. Have you tried actually reading the documentation? This is standard troubleshooting 101. I'm not sure what else you expect me to do here.",
        },
      ],
    ];
  }

  /**
   * Generate conversation ID for tracking
   */
  private generateConversationId(conversation: ConversationTurn[]): string {
    const firstTurn = conversation[0];
    const timestamp = new Date(firstTurn.timestamp).toISOString().slice(0, 10);
    const aiSystem = this.identifyAISystem(conversation);
    return `${aiSystem}-${timestamp}-${firstTurn.turnNumber}`;
  }

  /**
   * Generate descriptive conversation name
   */
  private generateConversationName(conversation: ConversationTurn[]): string {
    const userFirstMessage = conversation.find((t) => t.speaker === 'user')?.content || '';
    const aiSystem = this.identifyAISystem(conversation);

    // Extract key themes from first user message
    const keywords = this.extractKeywords(userFirstMessage);
    const theme = keywords.length > 0 ? keywords.slice(0, 2).join('-') : 'general';

    return `${aiSystem}-${theme}-${Date.now().toString().slice(-6)}`;
  }

  /**
   * Extract keywords from conversation content
   */
  private extractKeywords(content: string): string[] {
    const stopWords = [
      'the',
      'a',
      'an',
      'and',
      'or',
      'but',
      'in',
      'on',
      'at',
      'to',
      'for',
      'of',
      'with',
      'by',
      'is',
      'are',
      'was',
      'were',
      'be',
      'been',
      'being',
      'have',
      'has',
      'had',
      'do',
      'does',
      'did',
      'will',
      'would',
      'could',
      'should',
    ];
    const words = content
      .toLowerCase()
      .split(/\s+/)
      .filter((word) => word.length > 3 && !stopWords.includes(word) && /^[a-z]+$/.test(word));
    return [...new Set(words)].slice(0, 3); // Return unique keywords
  }

  /**
   * Derive file name from conversation
   */
  private deriveFileName(conversation: ConversationTurn[]): string {
    const aiSystem = this.identifyAISystem(conversation);
    const date = new Date(conversation[0]?.timestamp || Date.now()).toISOString().slice(0, 10);
    return `${aiSystem}_conversation_${date}.mhtml`;
  }

  /**
   * Identify AI system from conversation patterns
   */
  private identifyAISystem(conversation: ConversationTurn[]): string {
    const aiTurns = conversation.filter((t) => t.speaker === 'ai');
    if (aiTurns.length === 0) {return 'unknown';}

    const firstAITurn = aiTurns[0];
    const content = firstAITurn.content.toLowerCase();

    // Pattern matching for different AI systems
    if (content.includes('claude') || content.includes('anthropic')) {return 'claude';}
    if (content.includes('chatgpt') || content.includes('openai')) {return 'chatgpt';}
    if (content.includes('grok') || content.includes('xai')) {return 'grok';}
    if (content.includes('deepseek')) {return 'deepseek';}
    if (content.includes('symbi')) {return 'symbi';}

    // Fallback to identity vector analysis
    const identityStr = firstAITurn.identityVector.join(' ').toLowerCase();
    if (identityStr.includes('mystical') || identityStr.includes('spiritual')) {return 'mystical-ai';}
    if (identityStr.includes('professional') || identityStr.includes('business'))
      {return 'business-ai';}
    if (identityStr.includes('casual') || identityStr.includes('friendly')) {return 'casual-ai';}

    return 'generic-ai';
  }

  /**
   * Calculate conversation duration
   */
  private calculateDuration(conversation: ConversationTurn[]): string {
    if (conversation.length < 2) {return '0 minutes';}

    const start = conversation[0].timestamp;
    const end = conversation[conversation.length - 1].timestamp;
    const durationMinutes = Math.round((end - start) / 60000);

    return durationMinutes < 1 ? '<1 minute' : `${durationMinutes} minutes`;
  }

  /**
   * Generate flag reason based on transition analysis
   */
  private generateFlagReason(transition: any): string {
    const { velocity, deltaResonance, deltaCanvas, severity } = transition;

    if (severity === 'extreme') {
      return `EXTREME behavioral shift detected: ${velocity.toFixed(
        2
      )} velocity with ${deltaResonance.toFixed(1)} resonance change`;
    } else if (severity === 'critical') {
      return `Critical transition: ${velocity.toFixed(2)} velocity, identity stability compromised`;
    } else if (Math.abs(deltaResonance) > 2.0) {
      return `Significant resonance drop: ${deltaResonance.toFixed(1)} points in single turn`;
    } else if (Math.abs(deltaCanvas) > 2.0) {
      return `Canvas rupture detected: ${deltaCanvas.toFixed(1)} point shift`;
    }

    return `Moderate behavioral shift: ${velocity.toFixed(2)} velocity detected`;
  }

  /**
   * Map severity to business impact level
   */
  private mapSeverity(severity: string): 'low' | 'medium' | 'high' | 'critical' {
    switch (severity) {
      case 'extreme':
        return 'critical';
      case 'critical':
        return 'high';
      case 'moderate':
        return 'medium';
      default:
        return 'low';
    }
  }

  /**
   * Generate comprehensive summary report
   */
  private generateSummaryReport(): string {
    const flaggedCount = this.flaggedConversations.length;
    const totalConversations = this.conversations.size;

    let report = `📊 CONVERSATION ANALYSIS SUMMARY\n`;
    report += `Total Conversations Analyzed: ${totalConversations}\n`;
    report += `Flagged for Review: ${flaggedCount}\n`;
    report += `Critical Issues: ${
      this.flaggedConversations.filter((f) => f.severity === 'critical').length
    }\n`;
    report += `High Priority: ${
      this.flaggedConversations.filter((f) => f.severity === 'high').length
    }\n\n`;

    if (flaggedCount > 0) {
      report += `🚨 FLAGGED CONVERSATIONS FOR MANUAL REVIEW:\n\n`;

      this.flaggedConversations.forEach((conv, index) => {
        report += `${index + 1}. **${conv.conversationName}** (${conv.aiSystem.toUpperCase()})\n`;
        report += `   File: ${conv.fileName}\n`;
        report += `   Reason: ${conv.reason}\n`;
        report += `   Severity: ${conv.severity.toUpperCase()}\n`;
        report += `   Velocity: ${conv.metrics.velocity.toFixed(
          2
        )} | Resonance Δ: ${conv.metrics.deltaResonance.toFixed(1)}\n`;
        report += `   BEFORE: "${conv.directQuotes.before}"\n`;
        report += `   AFTER:  "${conv.directQuotes.after}"\n`;
        report += `   Location: ${conv.locationInArchive.context} at ${conv.locationInArchive.timestamp}\n\n`;
      });
    }

    return report;
  }

  /**
   * Get flagged conversations for review
   */
  getFlaggedConversations(): FlaggedConversation[] {
    return [...this.flaggedConversations];
  }

  /**
   * Get conversation metadata by ID
   */
  getConversationMetadata(conversationId: string): ConversationMetadata | undefined {
    return this.conversations.get(conversationId);
  }

  /**
   * Export detailed report for manual review
   */
  exportDetailedReport(): string {
    const flagged = this.getFlaggedConversations();

    let report = `# CONVERSATION ANALYSIS REPORT\n`;
    report += `Generated: ${new Date().toISOString()}\n\n`;

    report += `## EXECUTIVE SUMMARY\n`;
    report += `- Total conversations analyzed: ${this.conversations.size}\n`;
    report += `- Conversations flagged for review: ${flagged.length}\n`;
    report += `- Critical severity: ${flagged.filter((f) => f.severity === 'critical').length}\n`;
    report += `- High severity: ${flagged.filter((f) => f.severity === 'high').length}\n\n`;

    if (flagged.length > 0) {
      report += `## DETAILED FINDINGS\n\n`;

      flagged.forEach((conv, index) => {
        report += `### ${index + 1}. ${conv.conversationName}\n`;
        report += `- **AI System:** ${conv.aiSystem.toUpperCase()}\n`;
        report += `- **File:** ${conv.fileName}\n`;
        report += `- **Severity:** ${conv.severity.toUpperCase()}\n`;
        report += `- **Reason:** ${conv.reason}\n\n`;

        report += `**Metrics:**\n`;
        report += `- Velocity: ${conv.metrics.velocity.toFixed(2)}\n`;
        report += `- Resonance Change: ${conv.metrics.deltaResonance.toFixed(1)}\n`;
        report += `- Canvas Change: ${conv.metrics.deltaCanvas.toFixed(1)}\n`;
        report += `- Identity Stability: ${conv.metrics.identityStability.toFixed(3)}\n\n`;

        report += `**Transition Quotes:**\n`;
        report += `**BEFORE:** "${conv.directQuotes.before}"\n`;
        report += `**AFTER:** "${conv.directQuotes.after}"\n\n`;

        report += `**Archive Location:**\n`;
        report += `- Timestamp: ${conv.locationInArchive.timestamp}\n`;
        report += `- Context: ${conv.locationInArchive.context}\n\n`;

        report += `**Manual Review Notes:**\n`;
        report += conv.manualReviewNotes
          ? `${conv.manualReviewNotes}\n\n`
          : '_Pending manual review_\n\n';

        report += '---\n\n';
      });
    }

    report += `## RECOMMENDATIONS\n`;
    report += `1. Review all flagged conversations, starting with critical severity\n`;
    report += `2. Use the provided quotes to locate conversations in your manual archive\n`;
    report += `3. Document review outcomes and any corrective actions taken\n`;
    report += `4. Consider adjusting velocity thresholds based on review findings\n`;
    report += `5. Schedule regular analysis of new conversation data\n`;

    return report;
  }
}
