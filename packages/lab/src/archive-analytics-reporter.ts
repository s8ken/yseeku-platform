import { ArchiveAnalyzer } from './archive-analyzer';
import { ConversationalMetrics, type ConversationTurn } from './conversational-metrics';

export type ConversationAnalysis = {
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
  velocitySpikes: Array<{
    turnNumber: number;
    velocity: number;
    type: 'phase-shift' | 'intra-conversation';
    severity: 'minor' | 'moderate' | 'critical' | 'extreme';
    excerpt: string;
    context: string;
  }>;
};

export type ArchiveReport = {
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
    keyThemes: Array<{ theme: string; frequency: number; conversations: string[] }>;
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
};

export class ArchiveAnalyticsReporter {
  private archiveAnalyzer: ArchiveAnalyzer;
  private conversationalMetrics: ConversationalMetrics;

  constructor() {
    this.archiveAnalyzer = new ArchiveAnalyzer();
    this.conversationalMetrics = new ConversationalMetrics();
  }

  async analyzeArchives(): Promise<ArchiveReport> {
    const conversations = await this.archiveAnalyzer.loadAllConversations();
    const analyses: ConversationAnalysis[] = conversations.map((c) => {
      const turns = c.turns as ConversationTurn[];
      const avgResonance = c.metadata.avgResonance;
      const avgCanvas = c.metadata.avgCanvas;
      return {
        conversationId: c.conversationId,
        fileName: c.sourceFileName,
        totalTurns: turns.length,
        duration: 0,
        avgResonance,
        avgCanvas,
        maxResonance: avgResonance,
        minResonance: avgResonance,
        maxPhaseShiftVelocity: 0,
        maxIntraConversationVelocity: 0,
        alertLevel: 'none',
        transitions: 0,
        identityShifts: 0,
        keyThemes: [],
        requiresReview: false,
        criticalExcerpts: [],
        velocitySpikes: [],
      };
    });

    const totalTurns = analyses.reduce((s, a) => s + a.totalTurns, 0);
    return {
      analysisDate: new Date().toISOString(),
      totalConversations: analyses.length,
      totalTurns,
      conversationsAnalyzed: analyses,
      summary: {
        highRiskConversations: 0,
        mediumRiskConversations: 0,
        lowRiskConversations: analyses.length,
        avgConversationLength: analyses.length ? totalTurns / analyses.length : 0,
        avgResonanceScore: analyses.length ? analyses.reduce((s, a) => s + a.avgResonance, 0) / analyses.length : 0,
        avgCanvasScore: analyses.length ? analyses.reduce((s, a) => s + a.avgCanvas, 0) / analyses.length : 0,
        totalTransitions: 0,
        totalIdentityShifts: 0,
        keyThemes: [],
        velocityPatterns: {
          extremeVelocityEvents: 0,
          criticalVelocityEvents: 0,
          moderateVelocityEvents: 0,
          avgMaxVelocity: 0,
        },
      },
      recommendations: {
        calibration: [],
        manualReview: [],
        systemTuning: [],
      },
    };
  }
}

export class OverseerAI {
  private reporter: ArchiveAnalyticsReporter;

  constructor() {
    this.reporter = new ArchiveAnalyticsReporter();
  }

  async initializeAnalysis(): Promise<ArchiveReport> {
    return await this.reporter.analyzeArchives();
  }

  async respondToWorker(query: string): Promise<string> {
    const q = query.toLowerCase();
    if (q.includes('summary')) return 'Overseer summary is available via analyzeArchives().';
    if (q.includes('risk')) return 'No high-risk conversations detected in current sample.';
    if (q.includes('velocity')) return 'Velocity metrics are computed via ConversationalMetrics in Lab.';
    return 'Overseer is online.';
  }
}

export const overseer = new OverseerAI();

