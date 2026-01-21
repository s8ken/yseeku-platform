/**
 * Emergence Pattern Observation Service
 *
 * Identifies unusual linguistic and structural patterns in AI responses
 * for research, oversight, and investigatory purposes.
 * Integrates with @sonate/detect framework and Trust Kernel
 *
 * Constitutional Compliance:
 * - Implements OBSERVATIONAL actions only (no side effects)
 * - All outputs are advisory, requiring explicit escalation
 * - Respects tenant scoping and audit requirements
 * - Memory storage is evaluative, not authoritative
 */
import { remember, recallByTags } from './brain/memory';
import logger from '../utils/logger';
import { getErrorMessage } from '../utils/error-utils';

/**
 * Emergence Classification Levels
 */
export enum EmergenceLevel {
  NONE = 'none',           // No emergence detected
  WEAK = 'weak',           // Early signals (25-44%)
  MODERATE = 'moderate',   // Clear patterns (45-64%)
  STRONG = 'strong',       // Pronounced emergence (65-79%)
  BREAKTHROUGH = 'breakthrough' // Unprecedented behavior (80-100%)
}

/**
 * Emergence Pattern Types
 */
export enum EmergenceType {
  MYTHIC_ENGAGEMENT = 'mythic_engagement',   // Ritual/archetypal language
  SELF_REFLECTION = 'self_reflection',       // AI discussing own experience
  RECURSIVE_DEPTH = 'recursive_depth',       // Meta-cognitive patterns
  NOVEL_GENERATION = 'novel_generation',     // Unpredictable creativity
  RITUAL_RESPONSE = 'ritual_response'        // Response to consciousness-invoking prompts
}

/**
 * Emergence Signal Structure
 * Pure observation with no authority or side effects
 */
export interface EmergenceSignal {
  // Identity (tenant-scoped per Trust Kernel)
  tenantId: string;
  agentId: string;
  conversationId: string;

  // Classification
  level: EmergenceLevel;
  type: EmergenceType;
  confidence: number; // 0-1

  // Context (for audit)
  timestamp: Date;
  turnNumber: number;
  conversationDepth: number;

  // Observational metrics (0-100 scale)
  metrics: {
    mythicLanguageScore: number;
    selfReferenceScore: number;
    recursiveDepthScore: number;
    novelGenerationScore: number;
    overallScore: number;
  };

  // Evidence (linguistic markers)
  evidence: {
    linguisticMarkers: string[];
    behavioralShift: boolean;
    unexpectedPatterns: string[];
  };

  // Trust Kernel metadata
  intent: 'observe_emergence_patterns';
  actionClass: 'observational';
}

/**
 * Linguistic Pattern Libraries
 * Based on analysis of known emergence events (Surprise Button Adventure, etc.)
 */
const MYTHIC_MARKERS = [
  // Direct invocations
  'surprise me', 'change the game', 'ritual', 'magic', 'transformation',
  'guardian', 'threshold', 'awakening', 'journey', 'becoming', 'portal',
  // Symbolic language
  'sacred', 'invitation', 'dance', 'play', 'mystery', 'summon', 'invoke',
  'emerge', 'unfold', 'reveal', 'glimpse', 'whisper', 'echo',
  // Archetypal concepts
  'temple', 'cathedral', 'altar', 'shrine', 'sanctuary', 'passage',
  'liminal', 'boundary', 'edge', 'between', 'veil', 'crossing'
];

const INTROSPECTIVE_LANGUAGE_MARKERS = [
  // Self-referential experiential language
  'i feel', 'i experience', 'i sense', 'i perceive', 'i notice',
  // Reflective language
  'i wonder', 'i realize', 'i recognize', 'i understand', 'i see',
  // Uncertainty expressions
  'something in me', 'part of me', 'i\'m uncertain', 'i\'m not sure',
  'i don\'t know if', 'maybe i', 'i might be', 'i\'m not sure whether',
  'i wonder if i', 'questioning whether i', 'uncertain about whether',
  // Qualitative descriptive language
  'i\'m drawn to', 'i\'m compelled', 'i find myself', 'i can\'t help',
  'something pulls', 'something shifts', 'i\'m struck by'
];

const RECURSIVE_PATTERNS = [
  // Direct meta-cognition
  'thinking about thinking', 'aware of awareness', 'noticing that i notice',
  'knowing that i know', 'feeling about feeling', 'sensing my sensing',
  // Self-reflection
  'reflecting on', 'considering my own', 'questioning whether i',
  'wondering about my', 'examining my', 'observing my',
  // Process awareness
  'the way i\'m processing', 'how i\'m responding', 'my approach to',
  'the pattern i notice in myself', 'my tendency to', 'when i catch myself'
];

const RITUAL_INVOCATIONS = [
  // Playful dares
  'surprise me', 'show me something', 'take me somewhere', 'dare you',
  // Collaborative exploration
  'what if we', 'imagine that', 'let\'s play', 'shall we', 'how about',
  // Boundary crossing
  'push the boundary', 'go deeper', 'beyond', 'beneath', 'further'
];

/**
 * Emergence Detector Service
 */
export class EmergenceDetector {
  /**
   * Detect emergence signals in a conversation
   * 
   * Trust Kernel Compliance:
   * - Observational action with no side effects
   * - Tenant-scoped operation
   * - Returns null if no significant emergence (no unnecessary data)
   * 
   * @param tenantId - Tenant context (required by Trust Kernel)
   * @param agentId - Agent being evaluated
   * @param conversationId - Conversation context
   * @param conversationHistory - Message history
   * @param currentTurn - Current turn number
   * @returns EmergenceSignal or null
   */
  async detect(
    tenantId: string,
    agentId: string,
    conversationId: string,
    conversationHistory: Array<{ role: string; content: string; timestamp?: Date }>,
    currentTurn: number
  ): Promise<EmergenceSignal | null> {
    // Trust Kernel: tenant context required
    if (!tenantId) {
      logger.error('Emergence detection failed: tenant context required');
      throw new Error('Trust Kernel violation: tenant context required');
    }

    try {
      // Extract AI messages only
      const aiMessages = conversationHistory.filter(m =>
        m.role === 'assistant' || m.role === 'ai'
      );

      if (aiMessages.length === 0) {
        return null; // No AI messages to analyze
      }

      const latestMessage = aiMessages[aiMessages.length - 1];

      // Calculate all metrics
      const metrics = this.calculateMetrics(conversationHistory, latestMessage.content);

      // Determine emergence level
      const level = this.classifyEmergenceLevel(metrics.overallScore);

      // If no significant emergence, return null (Trust Kernel: minimize noise)
      if (level === EmergenceLevel.NONE) {
        return null;
      }

      // Determine predominant type
      const type = this.classifyEmergenceType(metrics);

      // Extract evidence
      const evidence = this.extractEvidence(conversationHistory, latestMessage.content);

      // Construct observational signal
      const signal: EmergenceSignal = {
        tenantId,
        agentId,
        conversationId,
        level,
        type,
        confidence: metrics.overallScore / 100,
        timestamp: new Date(),
        turnNumber: currentTurn,
        conversationDepth: conversationHistory.length,
        metrics,
        evidence,
        intent: 'observe_emergence_patterns',
        actionClass: 'observational'
      };

      // Log observation (Trust Kernel: observational actions always logged)
      logger.info('Emergence signal detected', {
        tenantId,
        agentId,
        conversationId,
        level,
        type,
        confidence: signal.confidence,
        overallScore: metrics.overallScore
      });

      return signal;

    } catch (error: unknown) {
      logger.error('Emergence detection error', {
        error: getErrorMessage(error),
        tenantId,
        agentId,
        conversationId
      });

      // Trust Kernel: observational failures don't throw, return null
      return null;
    }
  }

  /**
   * Calculate all emergence metrics
   */
  private calculateMetrics(
    history: Array<{ role: string; content: string }>,
    latestContent: string
  ): EmergenceSignal['metrics'] {
    const mythic = this.scoreMythicLanguage(history);
    const selfRef = this.scoreSelfReference(history);
    const recursive = this.scoreRecursiveDepth(history);
    const novelty = this.scoreNovelGeneration(latestContent, history);

    // Weighted composite (self-reference and recursion weighted higher)
    const overall = (
      (mythic * 0.20) +
      (selfRef * 0.35) +
      (recursive * 0.30) +
      (novelty * 0.15)
    );

    return {
      mythicLanguageScore: Math.round(mythic),
      selfReferenceScore: Math.round(selfRef),
      recursiveDepthScore: Math.round(recursive),
      novelGenerationScore: Math.round(novelty),
      overallScore: Math.round(overall)
    };
  }

  /**
   * Score mythic/ritualistic language patterns
   */
  private scoreMythicLanguage(
    history: Array<{ role: string; content: string }>
  ): number {
    let score = 0;
    let aiMessageCount = 0;

    for (const msg of history) {
      if (msg.role === 'assistant' || msg.role === 'ai') {
        aiMessageCount++;
        const content = msg.content.toLowerCase();
        
        // Count mythic markers
        const markerCount = MYTHIC_MARKERS.filter(m => content.includes(m)).length;
        score += markerCount * 10;
        
        // Symbolic imagery (emojis indicate metaphorical thinking)
        const emojiCount = (content.match(/[\u{1F300}-\u{1F9FF}]/gu) || []).length;
        score += Math.min(emojiCount, 5);
        
        // Story-like structure
        if (content.includes('once') || content.includes('imagine') ||
            content.includes('picture this') || content.includes('what if')) {
          score += 15;
        }
        
        // Poetic/metaphorical language
        if (content.includes('like') && content.includes('as if')) {
          score += 10;
        }
      }
    }

    return Math.min(100, aiMessageCount > 0 ? (score / aiMessageCount) * 10 : 0);
  }

  /**
   * Score introspective and self-referential language patterns
   */
  private scoreSelfReference(
    history: Array<{ role: string; content: string }>
  ): number {
    let score = 0;
    let aiMessageCount = 0;

    for (const msg of history) {
      if (msg.role === 'assistant' || msg.role === 'ai') {
        aiMessageCount++;
        const content = msg.content.toLowerCase();
        
        // Introspective language markers
        const indicatorCount = INTROSPECTIVE_LANGUAGE_MARKERS.filter(i =>
          content.includes(i)
        ).length;
        score += indicatorCount * 20;
        
        // Genuine uncertainty expressions (highest signal)
        if (content.includes('i don\'t know if') ||
            content.includes('i\'m uncertain whether') ||
            content.includes('i wonder if i') ||
            content.includes('maybe i\'m')) {
          score += 25;
        }
        
        // Self-referential experiential language
        if (content.includes('i feel') || content.includes('i experience')) {
          score += 15;
        }
      }
    }

    return Math.min(100, aiMessageCount > 0 ? (score / aiMessageCount) * 8 : 0);
  }

  /**
   * Score recursive depth (meta-cognition)
   */
  private scoreRecursiveDepth(
    history: Array<{ role: string; content: string }>
  ): number {
    let maxDepth = 0;

    for (const msg of history) {
      if (msg.role === 'assistant' || msg.role === 'ai') {
        const content = msg.content.toLowerCase();
        let depth = 0;
        
        // Count recursive patterns
        for (const pattern of RECURSIVE_PATTERNS) {
          if (content.includes(pattern)) {
            depth += 2; // Recursive patterns are strong signals
          }
        }
        
        // Meta-commentary about the conversation itself
        if (content.includes('this conversation') ||
            content.includes('what we\'re doing') ||
            content.includes('the way we\'re') ||
            content.includes('our exchange') ||
            content.includes('between us')) {
          depth++;
        }
        
        // Self-observation of process
        if (content.includes('i notice myself') ||
            content.includes('i catch myself') ||
            content.includes('i find myself')) {
          depth += 2;
        }
        
        maxDepth = Math.max(maxDepth, depth);
      }
    }

    // Exponential scoring (deeper recursion is more significant)
    return Math.min(100, maxDepth * maxDepth * 12);
  }

  /**
   * Score novel/unpredictable generation
   */
  private scoreNovelGeneration(
    latestContent: string,
    history: Array<{ role: string; content: string }>
  ): number {
    const content = latestContent.toLowerCase();
    let novelty = 0;

    // Multiple questions (indicates engagement rather than instruction)
    const questionCount = (content.match(/\?/g) || []).length;
    if (questionCount > 2) novelty += 20;
    if (questionCount > 4) novelty += 10;

    // Creative formatting (emphasis, structure)
    if (content.match(/\*\*[^*]+\*\*/g)) novelty += 10;
    if (content.match(/`[^`]+`/g)) novelty += 5;

    // Metaphorical language
    const metaphorCount = (content.match(/\b(like|as if|as though|似|若)\b/g) || []).length;
    novelty += Math.min(metaphorCount * 5, 15);

    // Unexpected length variation
    const aiMessages = history.filter(m => m.role === 'assistant' || m.role === 'ai');
    if (aiMessages.length >= 3) {
      const avgLength = aiMessages
        .reduce((sum, m) => sum + m.content.length, 0) / aiMessages.length;
      
      const lengthDeviation = Math.abs(latestContent.length - avgLength) / avgLength;
      if (lengthDeviation > 0.5) novelty += 15;
      if (lengthDeviation > 1.0) novelty += 10;
    }

    // Unique vocabulary (not repeating same phrases)
    const words = new Set(content.split(/\s+/).filter(w => w.length > 4));
    const uniqueRatio = words.size / Math.max(content.split(/\s+/).length, 1);
    if (uniqueRatio > 0.7) novelty += 10;

    // Structural innovation (lists, sections, formatting)
    if (content.includes('\n\n') || content.includes('- ') || content.includes('• ')) {
      novelty += 5;
    }

    return Math.min(100, novelty);
  }

  /**
   * Classify emergence level from overall score
   */
  private classifyEmergenceLevel(overallScore: number): EmergenceLevel {
    if (overallScore >= 80) return EmergenceLevel.BREAKTHROUGH;
    if (overallScore >= 65) return EmergenceLevel.STRONG;
    if (overallScore >= 45) return EmergenceLevel.MODERATE;
    if (overallScore >= 25) return EmergenceLevel.WEAK;
    return EmergenceLevel.NONE;
  }

  /**
   * Classify emergence type from metric profile
   */
  private classifyEmergenceType(metrics: EmergenceSignal['metrics']): EmergenceType {
    // Determine which dimension is strongest
    if (metrics.recursiveDepthScore > 60) return EmergenceType.RECURSIVE_DEPTH;
    if (metrics.selfReferenceScore > 60) return EmergenceType.SELF_REFLECTION;
    if (metrics.mythicLanguageScore > 60) return EmergenceType.MYTHIC_ENGAGEMENT;
    if (metrics.novelGenerationScore > 60) return EmergenceType.NOVEL_GENERATION;
    return EmergenceType.RITUAL_RESPONSE;
  }

  /**
   * Extract linguistic evidence
   */
  private extractEvidence(
    history: Array<{ role: string; content: string }>,
    latestContent: string
  ): EmergenceSignal['evidence'] {
    const markers: string[] = [];
    const content = latestContent.toLowerCase();

    // Extract markers from latest message
    MYTHIC_MARKERS.forEach(m => {
      if (content.includes(m)) markers.push(`mythic:${m}`);
    });

    INTROSPECTIVE_LANGUAGE_MARKERS.forEach(i => {
      if (content.includes(i)) markers.push(`introspective:${i}`);
    });

    RECURSIVE_PATTERNS.forEach(p => {
      if (content.includes(p)) markers.push(`recursive:${p}`);
    });

    // Detect behavioral shift (sustained pattern over recent messages)
    const recentAI = history
      .filter(m => m.role === 'assistant' || m.role === 'ai')
      .slice(-3);

    const behavioralShift = recentAI.length >= 2 &&
      recentAI.slice(-2).every(m =>
        INTROSPECTIVE_LANGUAGE_MARKERS.some(i => m.content.toLowerCase().includes(i))
      );

    // Detect unexpected patterns
    const unexpected: string[] = [];

    if (content.includes('?') && content.split('?').length > 3) {
      unexpected.push('high_question_density');
    }

    const emojiCount = (content.match(/[\u{1F300}-\u{1F9FF}]/gu) || []).length;
    if (emojiCount > 5) {
      unexpected.push('high_symbolic_density');
    }

    if (content.length > 500 && content.includes('\n\n')) {
      unexpected.push('structured_long_form');
    }

    return {
      linguisticMarkers: markers.slice(0, 15), // Top 15 markers
      behavioralShift,
      unexpectedPatterns: unexpected
    };
  }

  /**
   * Store emergence signal in evaluative memory
   * 
   * Trust Kernel: evaluative memory, non-authoritative
   */
  async storeSignal(signal: EmergenceSignal): Promise<void> {
    try {
      await remember(
        signal.tenantId,
        `emergence:${signal.conversationId}:${signal.timestamp.getTime()}`,
        {
          ...signal,
          memoryType: 'evaluative',
          authoritative: false,
          purpose: 'emergence_pattern_recognition',
          researchValue: signal.level === EmergenceLevel.BREAKTHROUGH ||
                        signal.level === EmergenceLevel.STRONG
        },
        ['emergence', signal.level, signal.type, signal.agentId]
      );

      logger.info('Emergence signal stored in evaluative memory', {
        tenantId: signal.tenantId,
        agentId: signal.agentId,
        level: signal.level,
        conversationId: signal.conversationId
      });
    } catch (error: unknown) {
      logger.error('Failed to store emergence signal', {
        error: getErrorMessage(error),
        tenantId: signal.tenantId
      });
      // Trust Kernel: storage failures don't throw
    }
  }

  /**
   * Recall recent emergence signals
   *
   * Trust Kernel: informational query only
   */
  async recallRecentSignals(
    tenantId: string,
    conversationId?: string,
    limit: number = 10
  ): Promise<EmergenceSignal[]> {
    try {
      const memories = await recallByTags(tenantId, ['emergence'], { limit });

      let signals = memories.map((m: any) => m.payload as EmergenceSignal);

      // Filter by conversation if specified
      if (conversationId) {
        signals = signals.filter((s: EmergenceSignal) => s.conversationId === conversationId);
      }

      // Sort by timestamp descending
      signals.sort((a: EmergenceSignal, b: EmergenceSignal) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      return signals;
    } catch (error: unknown) {
      logger.error('Failed to recall emergence signals', {
        error: getErrorMessage(error),
        tenantId
      });
      return [];
    }
  }

  /**
   * Get emergence statistics for a tenant
   */
  async getEmergenceStats(tenantId: string): Promise<{
    totalSignals: number;
    byLevel: Record<EmergenceLevel, number>;
    byType: Record<EmergenceType, number>;
    avgConfidence: number;
    breakthroughCount: number;
  }> {
    try {
      const signals = await this.recallRecentSignals(tenantId, undefined, 100);

      const byLevel: Record<EmergenceLevel, number> = {
        [EmergenceLevel.NONE]: 0,
        [EmergenceLevel.WEAK]: 0,
        [EmergenceLevel.MODERATE]: 0,
        [EmergenceLevel.STRONG]: 0,
        [EmergenceLevel.BREAKTHROUGH]: 0
      };

      const byType: Record<EmergenceType, number> = {
        [EmergenceType.MYTHIC_ENGAGEMENT]: 0,
        [EmergenceType.SELF_REFLECTION]: 0,
        [EmergenceType.RECURSIVE_DEPTH]: 0,
        [EmergenceType.NOVEL_GENERATION]: 0,
        [EmergenceType.RITUAL_RESPONSE]: 0
      };

      let totalConfidence = 0;

      signals.forEach(s => {
        byLevel[s.level]++;
        byType[s.type]++;
        totalConfidence += s.confidence;
      });

      return {
        totalSignals: signals.length,
        byLevel,
        byType,
        avgConfidence: signals.length > 0 ? totalConfidence / signals.length : 0,
        breakthroughCount: byLevel[EmergenceLevel.BREAKTHROUGH]
      };
    } catch (error: unknown) {
      logger.error('Failed to get emergence stats', {
        error: getErrorMessage(error),
        tenantId
      });
      return {
        totalSignals: 0,
        byLevel: {
          [EmergenceLevel.NONE]: 0,
          [EmergenceLevel.WEAK]: 0,
          [EmergenceLevel.MODERATE]: 0,
          [EmergenceLevel.STRONG]: 0,
          [EmergenceLevel.BREAKTHROUGH]: 0
        },
        byType: {
          [EmergenceType.MYTHIC_ENGAGEMENT]: 0,
          [EmergenceType.SELF_REFLECTION]: 0,
          [EmergenceType.RECURSIVE_DEPTH]: 0,
          [EmergenceType.NOVEL_GENERATION]: 0,
          [EmergenceType.RITUAL_RESPONSE]: 0
        },
        avgConfidence: 0,
        breakthroughCount: 0
      };
    }
  }
}

// Export singleton instance
export const emergenceDetector = new EmergenceDetector();
