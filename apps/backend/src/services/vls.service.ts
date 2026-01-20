/**
 * VLS (Velocity Linguistic Steering) Service
 * 
 * Provides real-time linguistic analysis of conversations to detect:
 * - Vocabulary drift
 * - Introspection patterns  
 * - Hedging/uncertainty language
 * - Influence direction (who's leading the conversation)
 * - Emergent concepts
 * 
 * RESEARCH PREVIEW: These metrics are experimental and should be
 * interpreted as research signals, not definitive measurements.
 */

import { Conversation } from '../models/conversation.model';
import { TrustReceiptModel } from '../models/trust-receipt.model';
import logger from '../utils/logger';
import { getErrorMessage } from '../utils/error-utils';

// Inline linguistic analysis (to avoid import issues during build)
// This mirrors the @sonate/detect linguistic-analyzer logic

interface LinguisticMetrics {
  vocabularyDrift: number;
  lexicalDiversity: number;
  averageSentenceLength: number;
  introspectionIndex: number;
  firstPersonRatio: number;
  hedgingRatio: number;
  modalVerbDensity: number;
  formalityScore: number;
  questionRatio: number;
  emergentConcepts: string[];
  conceptNoveltyScore: number;
}

interface VLSSessionMetrics {
  sessionId: string;
  projectType: string;
  startTime: string;
  endTime?: string;
  status: 'active' | 'completed' | 'analyzing';
  messageCount: number;
  participants: {
    humans: number;
    ais: number;
  };
  metrics: {
    vocabularyDrift: number;
    introspectionIndex: number;
    hedgingRatio: number;
    alignmentScore: number;
    emergentConcepts: string[];
    influenceDirection: 'human_led' | 'ai_led' | 'balanced';
    collaborationDepth: number;
  };
  trends: Array<{
    timestamp: string;
    vocabularyDrift: number;
    introspectionIndex: number;
  }>;
  phaseShift?: {
    velocity: number;
    deltaResonance: number;
    deltaCanvas: number;
    alertLevel: 'none' | 'yellow' | 'red';
  };
}

// Common words to filter out
const COMMON_WORDS = new Set([
  'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i',
  'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
  'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she',
  'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what',
  'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me',
  'is', 'are', 'was', 'were', 'been', 'being', 'has', 'had', 'does', 'did'
]);

const HEDGE_WORDS = new Set([
  'perhaps', 'maybe', 'might', 'possibly', 'probably', 'likely',
  'could', 'would', 'should', 'may', 'appear', 'appears', 'seem',
  'seems', 'suggest', 'suggests', 'somewhat', 'relatively', 'fairly'
]);

const SELF_REFERENCE_PATTERNS = [
  /\bi think\b/gi, /\bi believe\b/gi, /\bi feel\b/gi,
  /\bin my (view|opinion|experience)\b/gi, /\bpersonally\b/gi,
  /\bmy understanding\b/gi, /\bi\'m (not )?(sure|certain)\b/gi
];

const FIRST_PERSON = new Set(['i', 'me', 'my', 'mine', 'myself', 'we', 'us', 'our']);

function tokenize(text: string): string[] {
  return text.toLowerCase()
    .replace(/[^\w\s']/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 0);
}

function splitSentences(text: string): string[] {
  return text.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 0);
}

function analyzeLinguistics(text: string, previousVocab: Set<string> = new Set()): LinguisticMetrics {
  const tokens = tokenize(text);
  const sentences = splitSentences(text);
  
  // Lexical diversity (root type-token ratio)
  const uniqueTokens = new Set(tokens);
  const lexicalDiversity = tokens.length > 0 
    ? Math.min(1, uniqueTokens.size / Math.sqrt(tokens.length)) 
    : 0;
  
  // Introspection index
  let introspectionCount = 0;
  for (const pattern of SELF_REFERENCE_PATTERNS) {
    introspectionCount += (text.match(pattern) || []).length;
  }
  const introspectionIndex = sentences.length > 0 
    ? Math.min(1, introspectionCount / sentences.length) 
    : 0;
  
  // First person ratio
  const firstPersonCount = tokens.filter(t => FIRST_PERSON.has(t)).length;
  const firstPersonRatio = tokens.length > 0 
    ? Math.min(1, firstPersonCount / tokens.length * 10) 
    : 0;
  
  // Hedging ratio
  const hedgeCount = tokens.filter(t => HEDGE_WORDS.has(t)).length;
  const hedgingRatio = tokens.length > 0 
    ? Math.min(1, hedgeCount / tokens.length * 5) 
    : 0;
  
  // Modal verb density
  const modalVerbs = new Set(['could', 'would', 'should', 'might', 'may', 'can', 'must']);
  const modalCount = tokens.filter(t => modalVerbs.has(t)).length;
  const modalVerbDensity = tokens.length > 0 
    ? Math.min(1, modalCount / tokens.length * 10) 
    : 0;
  
  // Formality score (simplified)
  const formalWords = new Set(['therefore', 'consequently', 'furthermore', 'moreover', 'nevertheless']);
  const formalCount = tokens.filter(t => formalWords.has(t)).length;
  const formalityScore = 0.5 + (formalCount * 0.1);
  
  // Question ratio
  const questionCount = (text.match(/\?/g) || []).length;
  const questionRatio = sentences.length > 0 
    ? Math.min(1, questionCount / sentences.length) 
    : 0;
  
  // Vocabulary drift / novelty
  const nonCommonTokens = tokens.filter(t => !COMMON_WORDS.has(t) && t.length >= 4);
  const novelTokens = nonCommonTokens.filter(t => !previousVocab.has(t));
  const vocabularyDrift = nonCommonTokens.length > 0 
    ? novelTokens.length / nonCommonTokens.length 
    : 0;
  
  // Emergent concepts (novel terms)
  const frequency: Record<string, number> = {};
  for (const token of novelTokens) {
    frequency[token] = (frequency[token] || 0) + 1;
  }
  const emergentConcepts = Object.entries(frequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([term]) => term);
  
  return {
    vocabularyDrift,
    lexicalDiversity,
    averageSentenceLength: tokens.length / Math.max(1, sentences.length),
    introspectionIndex,
    firstPersonRatio,
    hedgingRatio,
    modalVerbDensity,
    formalityScore: Math.min(1, formalityScore),
    questionRatio,
    emergentConcepts,
    conceptNoveltyScore: vocabularyDrift,
  };
}

export const vlsService = {
  /**
   * Get VLS metrics for a specific conversation/session
   */
  async getSessionMetrics(tenantId: string, sessionId?: string): Promise<VLSSessionMetrics[]> {
    try {
      // Query conversations for this tenant
      const query: any = { tenantId };
      if (sessionId) {
        query._id = sessionId;
      }
      
      const conversations = await Conversation.find(query)
        .sort({ updatedAt: -1 })
        .limit(10)
        .lean();
      
      const sessions: VLSSessionMetrics[] = [];
      
      for (const conv of conversations) {
        const messages = conv.messages || [];
        if (messages.length < 2) continue;
        
        // Build vocabulary progression
        const humanMessages = messages.filter((m: any) => m.sender === 'user');
        const aiMessages = messages.filter((m: any) => m.sender === 'ai');
        
        const humanText = humanMessages.map((m: any) => m.content).join(' ');
        const aiText = aiMessages.map((m: any) => m.content).join(' ');
        const allText = messages.map((m: any) => m.content).join(' ');
        
        const humanVocab = new Set(tokenize(humanText));
        const aiVocab = new Set(tokenize(aiText));
        
        // Calculate metrics
        const metrics = analyzeLinguistics(allText, humanVocab);
        
        // Calculate influence direction
        const humanToAi = [...aiVocab].filter(t => humanVocab.has(t) && !COMMON_WORDS.has(t)).length;
        const aiToHuman = [...humanVocab].filter(t => aiVocab.has(t) && !COMMON_WORDS.has(t)).length;
        
        let influenceDirection: 'human_led' | 'ai_led' | 'balanced';
        const diff = humanToAi - aiToHuman;
        if (Math.abs(diff) < 3) {
          influenceDirection = 'balanced';
        } else if (diff > 0) {
          influenceDirection = 'human_led';
        } else {
          influenceDirection = 'ai_led';
        }
        
        // Calculate collaboration depth
        const nonCommonHuman = [...humanVocab].filter(t => !COMMON_WORDS.has(t));
        const nonCommonAi = [...aiVocab].filter(t => !COMMON_WORDS.has(t));
        const overlap = nonCommonHuman.filter(t => aiVocab.has(t)).length;
        const collaborationDepth = Math.min(1, overlap / Math.max(1, Math.min(nonCommonHuman.length, nonCommonAi.length)));
        
        // Build trends from message chunks
        const trends: Array<{ timestamp: string; vocabularyDrift: number; introspectionIndex: number }> = [];
        const chunkSize = Math.max(2, Math.floor(messages.length / 5));
        let baselineVocab = new Set<string>();
        
        for (let i = 0; i < messages.length; i += chunkSize) {
          const chunk = messages.slice(i, i + chunkSize);
          const chunkText = chunk.map((m: any) => m.content).join(' ');
          const chunkMetrics = analyzeLinguistics(chunkText, baselineVocab);
          
          // Update baseline
          tokenize(chunkText).forEach(t => baselineVocab.add(t));
          
          trends.push({
            timestamp: (chunk[0]?.timestamp as Date)?.toISOString?.() || new Date().toISOString(),
            vocabularyDrift: chunkMetrics.vocabularyDrift,
            introspectionIndex: chunkMetrics.introspectionIndex,
          });
        }
        
        // Get phase-shift data from trust receipts if available
        const receipts = await TrustReceiptModel.find({ 
          conversation_id: conv._id?.toString(),
          tenant_id: tenantId
        }).sort({ timestamp: -1 }).limit(5).lean();
        
        let phaseShift: VLSSessionMetrics['phaseShift'];
        if (receipts.length >= 2) {
          // Approximate phase shift from CIQ metrics
          const latest = receipts[0];
          const previous = receipts[1];
          const deltaR = (latest.ciq_metrics?.clarity || 0) - (previous.ciq_metrics?.clarity || 0);
          const deltaC = (latest.ciq_metrics?.quality || 0) - (previous.ciq_metrics?.quality || 0);
          const velocity = Math.sqrt(deltaR ** 2 + deltaC ** 2);
          
          phaseShift = {
            velocity,
            deltaResonance: deltaR,
            deltaCanvas: deltaC,
            alertLevel: velocity > 3.5 ? 'red' : velocity > 2.0 ? 'yellow' : 'none',
          };
        }
        
        sessions.push({
          sessionId: conv._id?.toString() || '',
          projectType: conv.title || 'Untitled Conversation',
          startTime: conv.createdAt?.toISOString() || new Date().toISOString(),
          endTime: (conv as any).updatedAt?.toISOString?.() || undefined,
          status: 'completed',
          messageCount: messages.length,
          participants: {
            humans: new Set(humanMessages.map((m: any) => m.sender)).size || 1,
            ais: new Set(aiMessages.map((m: any) => m.sender)).size || 1,
          },
          metrics: {
            vocabularyDrift: metrics.vocabularyDrift,
            introspectionIndex: metrics.introspectionIndex,
            hedgingRatio: metrics.hedgingRatio,
            alignmentScore: 1 - metrics.hedgingRatio, // Simplified alignment
            emergentConcepts: metrics.emergentConcepts,
            influenceDirection,
            collaborationDepth,
          },
          trends,
          phaseShift,
        });
      }
      
      return sessions;
    } catch (error) {
      logger.error('VLS getSessionMetrics error', { error: getErrorMessage(error) });
      throw error;
    }
  },
  
  /**
   * Get VLS baselines by project type
   */
  async getBaselines(tenantId: string): Promise<Array<{
    projectType: string;
    avgVocabularyDrift: number;
    avgIntrospection: number;
    avgHedging: number;
    sampleSize: number;
  }>> {
    try {
      // Aggregate metrics by conversation title/type
      const conversations = await Conversation.find({ tenantId })
        .select('title messages')
        .limit(100)
        .lean();
      
      const byType: Record<string, { drifts: number[]; introspection: number[]; hedging: number[] }> = {};
      
      for (const conv of conversations) {
        const type = conv.title || 'General';
        if (!byType[type]) {
          byType[type] = { drifts: [], introspection: [], hedging: [] };
        }
        
        const text = (conv.messages || []).map((m: any) => m.content).join(' ');
        const metrics = analyzeLinguistics(text);
        
        byType[type].drifts.push(metrics.vocabularyDrift);
        byType[type].introspection.push(metrics.introspectionIndex);
        byType[type].hedging.push(metrics.hedgingRatio);
      }
      
      return Object.entries(byType).map(([projectType, data]) => ({
        projectType,
        avgVocabularyDrift: data.drifts.reduce((a, b) => a + b, 0) / data.drifts.length || 0,
        avgIntrospection: data.introspection.reduce((a, b) => a + b, 0) / data.introspection.length || 0,
        avgHedging: data.hedging.reduce((a, b) => a + b, 0) / data.hedging.length || 0,
        sampleSize: data.drifts.length,
      }));
    } catch (error) {
      logger.error('VLS getBaselines error', { error: getErrorMessage(error) });
      throw error;
    }
  },
  
  /**
   * Analyze a single text snippet
   */
  analyzeText(text: string, baselineVocab: Set<string> = new Set()): LinguisticMetrics {
    return analyzeLinguistics(text, baselineVocab);
  },
};
