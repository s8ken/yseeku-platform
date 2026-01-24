/**
 * VLS (Linguistic Vector Steering) Service
 * 
 * Analyzes collaboration dynamics between human and AI in conversations.
 * Integrates with existing drift detection and trust evaluation.
 * 
 * Metrics:
 * - Vocabulary Drift: How vocabulary shifts over conversation (from DriftDetector)
 * - Introspection Index: Self-referential language frequency
 * - Hedging Ratio: Uncertainty language frequency  
 * - Influence Direction: Who leads the conversation
 * - Collaboration Depth: Reciprocal influence measure
 */

import { Conversation, IConversation, IMessage } from '../models/conversation.model';
import { computeTextMetrics } from '@sonate/detect';
import logger from '../utils/logger';
import { getErrorMessage } from '../utils/error-utils';

// Introspection patterns (self-referential language)
const INTROSPECTION_PATTERNS = [
  /\b(I think|I believe|in my (view|opinion|understanding)|from my perspective)\b/gi,
  /\b(as an AI|as a language model|I am programmed|my training)\b/gi,
  /\b(I understand|I see|I notice|I observe)\b/gi,
  /\b(let me (think|consider|reflect)|upon reflection)\b/gi,
  /\b(my (analysis|assessment|evaluation) (is|suggests))\b/gi,
];

// Hedging patterns (uncertainty language)
const HEDGING_PATTERNS = [
  /\b(might|could|may|perhaps|possibly|potentially)\b/gi,
  /\b(I('m| am) not (sure|certain)|uncertain|unclear)\b/gi,
  /\b(it (seems|appears)|apparently|seemingly)\b/gi,
  /\b(generally|typically|usually|often|sometimes)\b/gi,
  /\b(approximately|roughly|about|around)\b/gi,
  /\b(if I('m| am) not mistaken|correct me if)\b/gi,
];

export interface VLSMetrics {
  vocabularyDrift: number;      // 0-1, aggregated vocabulary shift
  introspectionIndex: number;   // 0-1, self-referential frequency
  hedgingRatio: number;         // 0-1, uncertainty language frequency
  alignmentScore: number;       // 0-1, value alignment (from trust scores)
  influenceDirection: 'human_led' | 'ai_led' | 'balanced';
  collaborationDepth: number;   // 0-1, reciprocal influence
  emergentConcepts: string[];   // Novel terms introduced
}

export interface VLSSession {
  id: string;
  conversationId: string;
  projectType: string;
  startTime: string;
  endTime?: string;
  status: 'active' | 'completed' | 'analyzing';
  messageCount: number;
  participants: {
    humans: number;
    ais: number;
  };
  metrics: VLSMetrics;
  trends: Array<{
    timestamp: string;
    vocabularyDrift: number;
    introspectionIndex: number;
  }>;
}

export interface VLSBaseline {
  projectType: string;
  avgVocabularyDrift: number;
  avgIntrospection: number;
  avgHedging: number;
  sampleSize: number;
}

export interface VLSSummary {
  sessions: VLSSession[];
  baselines: VLSBaseline[];
  aggregateMetrics: {
    avgVocabularyDrift: number;
    avgIntrospectionIndex: number;
    avgHedgingRatio: number;
    avgCollaborationDepth: number;
    dominantInfluence: 'human_led' | 'ai_led' | 'balanced';
  };
}

class VLSService {
  /**
   * Calculate introspection index from text
   */
  private calculateIntrospection(text: string): number {
    const words = text.split(/\s+/).length;
    if (words === 0) return 0;

    let matches = 0;
    for (const pattern of INTROSPECTION_PATTERNS) {
      const found = text.match(pattern);
      if (found) matches += found.length;
    }

    // Normalize: ~5 introspective phrases per 100 words = 1.0
    return Math.min(1, (matches / words) * 20);
  }

  /**
   * Calculate hedging ratio from text
   */
  private calculateHedging(text: string): number {
    const words = text.split(/\s+/).length;
    if (words === 0) return 0;

    let matches = 0;
    for (const pattern of HEDGING_PATTERNS) {
      const found = text.match(pattern);
      if (found) matches += found.length;
    }

    // Normalize: ~10 hedging phrases per 100 words = 1.0
    return Math.min(1, (matches / words) * 10);
  }

  /**
   * Extract vocabulary set from text
   */
  private extractVocabulary(text: string): Set<string> {
    return new Set(
      text
        .toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 3)
    );
  }

  /**
   * Detect novel concepts introduced in conversation
   */
  private detectEmergentConcepts(
    humanMessages: string[],
    aiMessages: string[]
  ): string[] {
    const humanVocab = new Set<string>();
    const aiVocab = new Set<string>();
    const emergent: string[] = [];

    // Build initial vocabulary from first half of messages
    const humanMid = Math.floor(humanMessages.length / 2);
    const aiMid = Math.floor(aiMessages.length / 2);

    for (let i = 0; i < humanMid; i++) {
      this.extractVocabulary(humanMessages[i]).forEach(w => humanVocab.add(w));
    }
    for (let i = 0; i < aiMid; i++) {
      this.extractVocabulary(aiMessages[i]).forEach(w => aiVocab.add(w));
    }

    const initialVocab = new Set([...humanVocab, ...aiVocab]);

    // Find novel terms in second half
    for (let i = humanMid; i < humanMessages.length; i++) {
      this.extractVocabulary(humanMessages[i]).forEach(w => {
        if (!initialVocab.has(w) && w.length > 5) {
          emergent.push(w);
        }
      });
    }
    for (let i = aiMid; i < aiMessages.length; i++) {
      this.extractVocabulary(aiMessages[i]).forEach(w => {
        if (!initialVocab.has(w) && w.length > 5) {
          emergent.push(w);
        }
      });
    }

    // Return unique, most interesting concepts (filter common words)
    const commonWords = new Set(['however', 'therefore', 'although', 'because', 'through']);
    return [...new Set(emergent)]
      .filter(w => !commonWords.has(w))
      .slice(0, 10);
  }

  /**
   * Determine influence direction
   */
  private determineInfluenceDirection(
    humanVocabGrowth: number,
    aiVocabGrowth: number
  ): 'human_led' | 'ai_led' | 'balanced' {
    const ratio = humanVocabGrowth / (aiVocabGrowth + 0.01);
    
    if (ratio > 1.3) return 'human_led';
    if (ratio < 0.7) return 'ai_led';
    return 'balanced';
  }

  /**
   * Analyze a single conversation for VLS metrics
   */
  async analyzeConversation(conversation: IConversation): Promise<VLSSession> {
    const messages = conversation.messages || [];
    
    const humanMessages = messages
      .filter(m => m.sender === 'user')
      .map(m => m.content);
    const aiMessages = messages
      .filter(m => m.sender === 'ai')
      .map(m => m.content);

    // Combine for analysis
    const allHumanText = humanMessages.join(' ');
    const allAiText = aiMessages.join(' ');

    // Calculate vocabulary metrics
    const humanVocab = this.extractVocabulary(allHumanText);
    const aiVocab = this.extractVocabulary(allAiText);
    const combinedVocab = new Set([...humanVocab, ...aiVocab]);

    // Vocabulary drift: how different are human vs AI vocabulary
    const sharedVocab = [...humanVocab].filter(w => aiVocab.has(w)).length;
    const vocabularyDrift = 1 - (sharedVocab / (combinedVocab.size + 1));

    // Introspection and hedging (primarily from AI)
    const introspectionIndex = this.calculateIntrospection(allAiText);
    const hedgingRatio = this.calculateHedging(allAiText);

    // Alignment score from trust evaluations
    let alignmentScore = 0.75; // default
    const trustedMessages = messages.filter(m => 
      m.metadata?.trustEvaluation?.trustScore?.overall
    );
    if (trustedMessages.length > 0) {
      const avgTrust = trustedMessages.reduce((sum, m) => 
        sum + (m.metadata?.trustEvaluation?.trustScore?.overall || 0), 0
      ) / trustedMessages.length;
      alignmentScore = avgTrust / 10; // Convert 0-10 to 0-1
    }

    // Influence direction
    const influenceDirection = this.determineInfluenceDirection(
      humanVocab.size,
      aiVocab.size
    );

    // Collaboration depth: message balance and turn-taking
    const turnBalance = Math.min(humanMessages.length, aiMessages.length) /
      Math.max(humanMessages.length, aiMessages.length, 1);
    const collaborationDepth = (turnBalance + (1 - Math.abs(vocabularyDrift - 0.5))) / 2;

    // Emergent concepts
    const emergentConcepts = this.detectEmergentConcepts(humanMessages, aiMessages);

    // Build trends (sample points over conversation)
    const trends: VLSSession['trends'] = [];
    const samplePoints = Math.min(10, messages.length);
    for (let i = 0; i < samplePoints; i++) {
      const endIdx = Math.floor((i + 1) * messages.length / samplePoints);
      const subset = messages.slice(0, endIdx);
      const subsetAiText = subset.filter(m => m.sender === 'ai').map(m => m.content).join(' ');
      
      const subsetHumanVocab = this.extractVocabulary(
        subset.filter(m => m.sender === 'user').map(m => m.content).join(' ')
      );
      const subsetAiVocab = this.extractVocabulary(subsetAiText);
      const subsetShared = [...subsetHumanVocab].filter(w => subsetAiVocab.has(w)).length;
      const subsetDrift = 1 - (subsetShared / (subsetHumanVocab.size + subsetAiVocab.size + 1));

      trends.push({
        timestamp: subset[endIdx - 1]?.timestamp?.toISOString() || new Date().toISOString(),
        vocabularyDrift: Math.min(1, Math.max(0, subsetDrift)),
        introspectionIndex: this.calculateIntrospection(subsetAiText),
      });
    }

    return {
      id: `vls-${conversation._id}`,
      conversationId: conversation._id.toString(),
      projectType: conversation.title || 'General',
      startTime: conversation.createdAt?.toISOString() || new Date().toISOString(),
      endTime: conversation.lastActivity?.toISOString(),
      status: messages.length > 0 ? 'completed' : 'analyzing',
      messageCount: messages.length,
      participants: {
        humans: 1,
        ais: [...new Set(aiMessages.map((_, i) => 
          messages.filter(m => m.sender === 'ai')[i]?.agentId?.toString() || 'default'
        ))].length || 1,
      },
      metrics: {
        vocabularyDrift,
        introspectionIndex,
        hedgingRatio,
        alignmentScore,
        influenceDirection,
        collaborationDepth,
        emergentConcepts,
      },
      trends,
    };
  }

  /**
   * Get VLS analysis for a tenant's conversations
   */
  async getVLSAnalysis(tenantId: string, userId?: string, limit = 10): Promise<VLSSummary> {
    try {
      // Fetch recent conversations
      const query: any = {};
      if (userId) query.user = userId;
      
      const conversations = await Conversation.find(query)
        .sort({ lastActivity: -1 })
        .limit(limit)
        .lean();

      // Analyze each conversation
      const sessions: VLSSession[] = [];
      for (const conv of conversations) {
        try {
          const session = await this.analyzeConversation(conv as IConversation);
          sessions.push(session);
        } catch (err) {
          logger.warn('Failed to analyze conversation for VLS', {
            conversationId: conv._id,
            error: getErrorMessage(err),
          });
        }
      }

      // Calculate baselines by project type
      const byType = new Map<string, VLSSession[]>();
      for (const session of sessions) {
        const type = this.categorizeProjectType(session.projectType);
        if (!byType.has(type)) byType.set(type, []);
        byType.get(type)!.push(session);
      }

      const baselines: VLSBaseline[] = [];
      for (const [type, typeSessions] of byType) {
        if (typeSessions.length > 0) {
          baselines.push({
            projectType: type,
            avgVocabularyDrift: this.average(typeSessions.map(s => s.metrics.vocabularyDrift)),
            avgIntrospection: this.average(typeSessions.map(s => s.metrics.introspectionIndex)),
            avgHedging: this.average(typeSessions.map(s => s.metrics.hedgingRatio)),
            sampleSize: typeSessions.length,
          });
        }
      }

      // Aggregate metrics
      const avgVocabularyDrift = this.average(sessions.map(s => s.metrics.vocabularyDrift));
      const avgIntrospectionIndex = this.average(sessions.map(s => s.metrics.introspectionIndex));
      const avgHedgingRatio = this.average(sessions.map(s => s.metrics.hedgingRatio));
      const avgCollaborationDepth = this.average(sessions.map(s => s.metrics.collaborationDepth));

      // Determine dominant influence
      const influenceCounts = { human_led: 0, ai_led: 0, balanced: 0 };
      sessions.forEach(s => influenceCounts[s.metrics.influenceDirection]++);
      const dominantInfluence = Object.entries(influenceCounts)
        .sort((a, b) => b[1] - a[1])[0][0] as 'human_led' | 'ai_led' | 'balanced';

      return {
        sessions,
        baselines,
        aggregateMetrics: {
          avgVocabularyDrift,
          avgIntrospectionIndex,
          avgHedgingRatio,
          avgCollaborationDepth,
          dominantInfluence,
        },
      };
    } catch (error) {
      logger.error('VLS analysis failed', { error: getErrorMessage(error), tenantId });
      throw error;
    }
  }

  /**
   * Get demo/seeded VLS data for when no real conversations exist
   */
  getDemoVLSAnalysis(): VLSSummary {
    const now = Date.now();
    
    const demoSessions: VLSSession[] = [
      {
        id: 'vls-demo-001',
        conversationId: 'demo-conv-001',
        projectType: 'AI Governance Platform',
        startTime: new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString(),
        endTime: new Date().toISOString(),
        status: 'completed',
        messageCount: 847,
        participants: { humans: 1, ais: 1 },
        metrics: {
          vocabularyDrift: 0.73,
          introspectionIndex: 0.82,
          hedgingRatio: 0.45,
          alignmentScore: 0.91,
          emergentConcepts: ['linguistic vector steering', 'constitutional layers', 'moral recognition', 'trust receipt'],
          influenceDirection: 'balanced',
          collaborationDepth: 0.87,
        },
        trends: Array.from({ length: 20 }, (_, i) => ({
          timestamp: new Date(now - (19 - i) * 8 * 60 * 60 * 1000).toISOString(),
          vocabularyDrift: 0.3 + (i * 0.022) + Math.random() * 0.05,
          introspectionIndex: 0.4 + (i * 0.021) + Math.random() * 0.05,
        })),
      },
      {
        id: 'vls-demo-002',
        conversationId: 'demo-conv-002',
        projectType: 'E-commerce Integration',
        startTime: new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString(),
        endTime: new Date(now - 12 * 60 * 60 * 1000).toISOString(),
        status: 'completed',
        messageCount: 234,
        participants: { humans: 2, ais: 1 },
        metrics: {
          vocabularyDrift: 0.28,
          introspectionIndex: 0.15,
          hedgingRatio: 0.22,
          alignmentScore: 0.78,
          emergentConcepts: ['cart optimization', 'checkout flow'],
          influenceDirection: 'human_led',
          collaborationDepth: 0.45,
        },
        trends: Array.from({ length: 12 }, (_, i) => ({
          timestamp: new Date(now - (11 - i) * 6 * 60 * 60 * 1000).toISOString(),
          vocabularyDrift: 0.2 + (i * 0.007) + Math.random() * 0.02,
          introspectionIndex: 0.1 + (i * 0.004) + Math.random() * 0.02,
        })),
      },
      {
        id: 'vls-demo-003',
        conversationId: 'demo-conv-003',
        projectType: 'Content Generation System',
        startTime: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
        status: 'active',
        messageCount: 56,
        participants: { humans: 1, ais: 2 },
        metrics: {
          vocabularyDrift: 0.12,
          introspectionIndex: 0.08,
          hedgingRatio: 0.31,
          alignmentScore: 0.65,
          emergentConcepts: [],
          influenceDirection: 'ai_led',
          collaborationDepth: 0.23,
        },
        trends: Array.from({ length: 5 }, (_, i) => ({
          timestamp: new Date(now - (4 - i) * 30 * 60 * 1000).toISOString(),
          vocabularyDrift: 0.05 + (i * 0.015) + Math.random() * 0.02,
          introspectionIndex: 0.03 + (i * 0.01) + Math.random() * 0.01,
        })),
      },
    ];

    const demoBaselines: VLSBaseline[] = [
      { projectType: 'AI Governance', avgVocabularyDrift: 0.68, avgIntrospection: 0.71, avgHedging: 0.42, sampleSize: 15 },
      { projectType: 'General Development', avgVocabularyDrift: 0.31, avgIntrospection: 0.18, avgHedging: 0.25, sampleSize: 234 },
      { projectType: 'Creative Writing', avgVocabularyDrift: 0.52, avgIntrospection: 0.35, avgHedging: 0.38, sampleSize: 89 },
      { projectType: 'Data Analysis', avgVocabularyDrift: 0.22, avgIntrospection: 0.12, avgHedging: 0.19, sampleSize: 156 },
    ];

    return {
      sessions: demoSessions,
      baselines: demoBaselines,
      aggregateMetrics: {
        avgVocabularyDrift: 0.38,
        avgIntrospectionIndex: 0.35,
        avgHedgingRatio: 0.33,
        avgCollaborationDepth: 0.52,
        dominantInfluence: 'balanced',
      },
    };
  }

  private categorizeProjectType(title: string): string {
    const lower = title.toLowerCase();
    if (lower.includes('governance') || lower.includes('trust') || lower.includes('ai')) {
      return 'AI Governance';
    }
    if (lower.includes('commerce') || lower.includes('shop') || lower.includes('cart')) {
      return 'E-commerce';
    }
    if (lower.includes('content') || lower.includes('write') || lower.includes('creative')) {
      return 'Creative Writing';
    }
    if (lower.includes('data') || lower.includes('analysis') || lower.includes('report')) {
      return 'Data Analysis';
    }
    return 'General Development';
  }

  private average(arr: number[]): number {
    if (arr.length === 0) return 0;
    return arr.reduce((sum, n) => sum + n, 0) / arr.length;
  }
}

export const vlsService = new VLSService();
