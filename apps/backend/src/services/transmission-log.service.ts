/**
 * Transmission Log Service
 * 
 * Implements the transmissionLog concept from the SONATE archives:
 * Inter-session memory that persists context fingerprints across conversations.
 * 
 * This allows the system to maintain relationship continuity even when
 * individual conversation sessions end.
 * 
 * Features:
 * - Context fingerprinting (key themes, emotional tone, unresolved topics)
 * - Cross-session relationship tracking
 * - Transmission log entries that can be "received" by new sessions
 * - Privacy-respecting memory decay
 */

import { createHash } from 'crypto';
import { logger } from '../utils/logger';

// === TYPES ===

export interface ContextFingerprint {
  id: string;
  userId: string;
  sessionId: string;
  timestamp: number;
  themes: string[];
  emotionalTone: EmotionalTone;
  unresolvedTopics: string[];
  trustLevel: number; // 0-1
  interactionCount: number;
  keyInsights: string[];
  lastUserIntent?: string;
}

export type EmotionalTone = 
  | 'positive'
  | 'neutral'
  | 'seeking-help'
  | 'frustrated'
  | 'curious'
  | 'anxious';

export interface TransmissionLogEntry {
  id: string;
  fingerprint: ContextFingerprint;
  createdAt: number;
  expiresAt: number;
  priority: 'low' | 'medium' | 'high';
  transmitted: boolean;
  receivedBy?: string[]; // Session IDs that received this transmission
}

export interface TransmissionSummary {
  userId: string;
  recentThemes: string[];
  averageTrustLevel: number;
  totalInteractions: number;
  unresolvedTopics: string[];
  relationshipAge: number; // days since first interaction
  lastSeenAt: number;
  emotionalJourney: EmotionalTone[];
}

// === IN-MEMORY STORE (would be Redis/DB in production) ===

const transmissionStore: Map<string, TransmissionLogEntry[]> = new Map();
const fingerprintCache: Map<string, ContextFingerprint[]> = new Map();

// === THEME EXTRACTION ===

const THEME_PATTERNS: Record<string, RegExp> = {
  'work-stress': /work|job|boss|deadline|project|career|office/gi,
  'relationships': /partner|friend|family|relationship|dating|marriage/gi,
  'health': /health|doctor|symptom|pain|exercise|sleep|diet/gi,
  'learning': /learn|study|understand|course|book|skill/gi,
  'creativity': /creative|write|art|design|music|project|build/gi,
  'technical': /code|programming|bug|error|software|api|database/gi,
  'emotional-support': /feel|emotion|anxious|sad|happy|stressed|overwhelmed/gi,
  'decision-making': /decide|choice|option|should i|pros and cons/gi,
  'planning': /plan|future|goal|strategy|next step|prepare/gi,
};

function extractThemes(text: string): string[] {
  const themes: string[] = [];
  const lowerText = text.toLowerCase();

  for (const [theme, pattern] of Object.entries(THEME_PATTERNS)) {
    if (pattern.test(lowerText)) {
      themes.push(theme);
    }
  }

  return themes;
}

// === EMOTIONAL TONE DETECTION ===

function detectEmotionalTone(text: string): EmotionalTone {
  const lowerText = text.toLowerCase();
  
  const toneIndicators: Record<EmotionalTone, RegExp[]> = {
    'positive': [/thank|great|awesome|love|excited|happy|wonderful/gi],
    'frustrated': [/frustrated|annoying|hate|terrible|ugh|can't believe/gi],
    'anxious': [/worried|nervous|scared|anxious|what if|afraid/gi],
    'seeking-help': [/help|need|please|stuck|don't know|how do i/gi],
    'curious': [/wonder|curious|interesting|tell me|how does|why/gi],
    'neutral': [/^(?!.*(thank|great|frustrated|worried|help|curious))/gi],
  };

  const scores: Record<EmotionalTone, number> = {
    'positive': 0,
    'frustrated': 0,
    'anxious': 0,
    'seeking-help': 0,
    'curious': 0,
    'neutral': 0,
  };

  for (const [tone, patterns] of Object.entries(toneIndicators)) {
    for (const pattern of patterns) {
      const matches = lowerText.match(pattern) || [];
      scores[tone as EmotionalTone] += matches.length;
    }
  }

  const maxTone = Object.entries(scores)
    .sort((a, b) => b[1] - a[1])[0];

  return maxTone[1] > 0 ? maxTone[0] as EmotionalTone : 'neutral';
}

// === UNRESOLVED TOPIC DETECTION ===

function detectUnresolvedTopics(messages: string[]): string[] {
  const unresolved: string[] = [];
  const lastMessage = messages[messages.length - 1] || '';
  const lowerLast = lastMessage.toLowerCase();

  // Questions that weren't fully addressed
  const questionPatterns = [
    { pattern: /what about|how about|and also|one more thing/gi, topic: 'additional-question' },
    { pattern: /i'll think about|let me consider|maybe later/gi, topic: 'deferred-decision' },
    { pattern: /we should|we could|next time/gi, topic: 'future-action' },
    { pattern: /i'm still not sure|still confused|still wondering/gi, topic: 'unresolved-confusion' },
  ];

  for (const { pattern, topic } of questionPatterns) {
    if (pattern.test(lowerLast)) {
      unresolved.push(topic);
    }
  }

  return unresolved;
}

// === SERVICE CLASS ===

export class TransmissionLogService {
  private readonly DEFAULT_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

  /**
   * Create a context fingerprint from conversation data
   */
  createFingerprint(
    userId: string,
    sessionId: string,
    messages: string[],
    trustLevel: number
  ): ContextFingerprint {
    const combinedText = messages.join(' ');
    
    const fingerprint: ContextFingerprint = {
      id: createHash('sha256')
        .update(`${userId}-${sessionId}-${Date.now()}`)
        .digest('hex')
        .slice(0, 16),
      userId,
      sessionId,
      timestamp: Date.now(),
      themes: extractThemes(combinedText),
      emotionalTone: detectEmotionalTone(combinedText),
      unresolvedTopics: detectUnresolvedTopics(messages),
      trustLevel,
      interactionCount: messages.length,
      keyInsights: this.extractKeyInsights(messages),
      lastUserIntent: this.detectLastIntent(messages),
    };

    // Cache the fingerprint
    const userFingerprints = fingerprintCache.get(userId) || [];
    userFingerprints.push(fingerprint);
    // Keep only last 10 fingerprints per user
    if (userFingerprints.length > 10) {
      userFingerprints.shift();
    }
    fingerprintCache.set(userId, userFingerprints);

    logger.debug('Context fingerprint created', {
      fingerprintId: fingerprint.id,
      userId,
      themes: fingerprint.themes,
      emotionalTone: fingerprint.emotionalTone,
    });

    return fingerprint;
  }

  /**
   * Extract key insights from conversation
   */
  private extractKeyInsights(messages: string[]): string[] {
    const insights: string[] = [];
    
    for (const message of messages) {
      // Look for explicit statements of preference or learning
      if (/i prefer|i like|i want|i need|i learned|i realized/gi.test(message)) {
        // Extract the key phrase (simplified)
        const match = message.match(/i (prefer|like|want|need|learned|realized)[^.!?]*/gi);
        if (match && match.length > 0) {
          insights.push(match[0].slice(0, 100));
        }
      }
    }

    return insights.slice(0, 5);
  }

  /**
   * Detect the user's last expressed intent
   */
  private detectLastIntent(messages: string[]): string | undefined {
    // Find the last user message (odd indices in typical conversation)
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      if (msg.length > 10 && msg.length < 200) {
        // Look for intent indicators
        const intentMatch = msg.match(/(?:i want to|i need to|help me|can you|please)[^.!?]*/gi);
        if (intentMatch) {
          return intentMatch[0].slice(0, 100);
        }
      }
    }
    return undefined;
  }

  /**
   * Create a transmission log entry for future sessions
   */
  transmit(fingerprint: ContextFingerprint, priority: 'low' | 'medium' | 'high' = 'medium'): TransmissionLogEntry {
    const entry: TransmissionLogEntry = {
      id: createHash('sha256')
        .update(`${fingerprint.id}-${Date.now()}`)
        .digest('hex')
        .slice(0, 16),
      fingerprint,
      createdAt: Date.now(),
      expiresAt: Date.now() + this.DEFAULT_TTL_MS,
      priority,
      transmitted: false,
      receivedBy: [],
    };

    const userLogs = transmissionStore.get(fingerprint.userId) || [];
    userLogs.push(entry);
    
    // Keep only recent transmissions
    const now = Date.now();
    const filtered = userLogs.filter(e => e.expiresAt > now);
    transmissionStore.set(fingerprint.userId, filtered);

    logger.info('Transmission log entry created', {
      entryId: entry.id,
      userId: fingerprint.userId,
      priority,
      themes: fingerprint.themes,
    });

    return entry;
  }

  /**
   * Receive pending transmissions for a new session
   */
  receive(userId: string, sessionId: string): TransmissionLogEntry[] {
    const userLogs = transmissionStore.get(userId) || [];
    const now = Date.now();
    
    // Get unexpired, untransmitted entries (or high priority ones even if transmitted)
    const pending = userLogs.filter(entry => 
      entry.expiresAt > now && 
      (!entry.receivedBy?.includes(sessionId)) &&
      (entry.priority === 'high' || !entry.transmitted)
    );

    // Mark as received
    for (const entry of pending) {
      entry.transmitted = true;
      entry.receivedBy = entry.receivedBy || [];
      entry.receivedBy.push(sessionId);
    }

    logger.debug('Transmissions received', {
      userId,
      sessionId,
      count: pending.length,
    });

    return pending;
  }

  /**
   * Get a summary of the relationship with this user
   */
  getRelationshipSummary(userId: string): TransmissionSummary | null {
    const fingerprints = fingerprintCache.get(userId);
    if (!fingerprints || fingerprints.length === 0) {
      return null;
    }

    const sorted = fingerprints.sort((a, b) => a.timestamp - b.timestamp);
    const first = sorted[0];
    const last = sorted[sorted.length - 1];

    // Aggregate themes
    const themeCount: Record<string, number> = {};
    const allUnresolved: string[] = [];
    let totalTrust = 0;
    let totalInteractions = 0;
    const emotionalJourney: EmotionalTone[] = [];

    for (const fp of fingerprints) {
      for (const theme of fp.themes) {
        themeCount[theme] = (themeCount[theme] || 0) + 1;
      }
      allUnresolved.push(...fp.unresolvedTopics);
      totalTrust += fp.trustLevel;
      totalInteractions += fp.interactionCount;
      emotionalJourney.push(fp.emotionalTone);
    }

    const recentThemes = Object.entries(themeCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([theme]) => theme);

    const relationshipAge = Math.floor((Date.now() - first.timestamp) / (24 * 60 * 60 * 1000));

    return {
      userId,
      recentThemes,
      averageTrustLevel: totalTrust / fingerprints.length,
      totalInteractions,
      unresolvedTopics: [...new Set(allUnresolved)],
      relationshipAge,
      lastSeenAt: last.timestamp,
      emotionalJourney: emotionalJourney.slice(-5),
    };
  }

  /**
   * Generate a context prompt for a new session based on history
   */
  generateContextPrompt(userId: string): string | null {
    const summary = this.getRelationshipSummary(userId);
    if (!summary) return null;

    const parts: string[] = [];
    
    if (summary.relationshipAge > 0) {
      parts.push(`You've interacted with this user over ${summary.relationshipAge} day(s).`);
    }

    if (summary.recentThemes.length > 0) {
      parts.push(`Recent themes: ${summary.recentThemes.join(', ')}.`);
    }

    if (summary.unresolvedTopics.length > 0) {
      parts.push(`Previously unresolved: ${summary.unresolvedTopics.join(', ')}.`);
    }

    if (summary.averageTrustLevel >= 0.8) {
      parts.push('This user has shown high trust in past interactions.');
    }

    const lastTone = summary.emotionalJourney[summary.emotionalJourney.length - 1];
    if (lastTone && lastTone !== 'neutral') {
      parts.push(`Last emotional tone: ${lastTone}.`);
    }

    if (parts.length === 0) return null;

    return `[SONATE Context Memory]\n${parts.join(' ')}`;
  }

  /**
   * Clear transmission log for a user (privacy/GDPR)
   */
  clearUserData(userId: string): void {
    transmissionStore.delete(userId);
    fingerprintCache.delete(userId);
    logger.info('User transmission data cleared', { userId });
  }
}

// Export singleton
export const transmissionLog = new TransmissionLogService();
