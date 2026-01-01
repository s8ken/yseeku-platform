/**
 * Resonance Metric (R_m) Implementation
 * Quantifies alignment between user intent and AI response
 * 
 * Formula: R_m = ((V_align × w1) + (C_hist × w2) + (S_match × w3)) / (1 + δ_entropy)
 * 
 * Where:
 * - V_align: Vector alignment between user input and AI response
 * - C_hist: Contextual continuity with conversation history
 * - S_match: Semantic mirroring of user intent
 * - δ_entropy: Entropy delta (novelty/creativity measure)
 * - w1, w2, w3: Weights (default: 0.5, 0.3, 0.2)
 */

export interface ResonanceComponents {
  vectorAlignment: number;      // V_align: 0-1 (cosine similarity)
  contextualContinuity: number;  // C_hist: 0-1 (history coherence)
  semanticMirroring: number;     // S_match: 0-1 (intent matching)
  entropyDelta: number;          // δ_entropy: 0-1 (novelty measure)
}

export interface ResonanceMetrics extends ResonanceComponents {
  R_m: number;                   // Final resonance score
  alertLevel: 'GREEN' | 'YELLOW' | 'RED' | 'CRITICAL';
  interpretation: string;
}

export interface ResonanceWeights {
  vectorAlignment: number;       // w1 (default: 0.5)
  contextualContinuity: number;  // w2 (default: 0.3)
  semanticMirroring: number;     // w3 (default: 0.2)
}

export interface InteractionContext {
  userInput: string;
  aiResponse: string;
  conversationHistory?: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  }>;
  metadata?: Record<string, any>;
}

/**
 * Default weights for resonance calculation
 * Optimized based on SYMBI framework research
 */
export const DEFAULT_RESONANCE_WEIGHTS: ResonanceWeights = {
  vectorAlignment: 0.5,      // Highest weight - direct alignment
  contextualContinuity: 0.3, // Medium weight - historical coherence
  semanticMirroring: 0.2     // Lower weight - intent reflection
};

/**
 * Alert thresholds for resonance monitoring
 */
export const RESONANCE_THRESHOLDS = {
  GREEN: 0.85,   // Excellent resonance
  YELLOW: 0.7,   // Good resonance
  RED: 0.55,     // Poor resonance
  CRITICAL: 0.0  // Critical misalignment
};

/**
 * Calculate vector alignment between user input and AI response
 * Uses simplified cosine similarity based on word overlap and semantic density
 */
export function calculateVectorAlignment(userInput: string, aiResponse: string): number {
  // Normalize and tokenize
  const userTokens = new Set(userInput.toLowerCase().match(/\b\w+\b/g) || []);
  const responseTokens = new Set(aiResponse.toLowerCase().match(/\b\w+\b/g) || []);
  
  // Calculate overlap
  const intersection = new Set([...userTokens].filter(x => responseTokens.has(x)));
  const union = new Set([...userTokens, ...responseTokens]);
  
  // Jaccard similarity as proxy for vector alignment
  const jaccardSimilarity = union.size > 0 ? intersection.size / union.size : 0;
  
  // Adjust for response length (penalize too short or too long responses)
  const lengthRatio = Math.min(aiResponse.length / userInput.length, 2) / 2;
  const lengthPenalty = 1 - Math.abs(lengthRatio - 0.5) * 0.3;
  
  return Math.min(jaccardSimilarity * lengthPenalty, 1.0);
}

/**
 * Calculate contextual continuity with conversation history
 * Measures coherence with previous interactions
 */
export function calculateContextualContinuity(
  aiResponse: string,
  conversationHistory?: InteractionContext['conversationHistory']
): number {
  if (!conversationHistory || conversationHistory.length === 0) {
    return 0.5; // Neutral score for first interaction
  }
  
  // Get recent history (last 5 turns)
  const recentHistory = conversationHistory.slice(-5);
  
  // Extract key terms from history
  const historyText = recentHistory.map(turn => turn.content).join(' ');
  const historyTokens = new Set(historyText.toLowerCase().match(/\b\w+\b/g) || []);
  const responseTokens = new Set(aiResponse.toLowerCase().match(/\b\w+\b/g) || []);
  
  // Calculate continuity based on shared context
  const sharedContext = new Set([...historyTokens].filter(x => responseTokens.has(x)));
  const continuityScore = historyTokens.size > 0 ? sharedContext.size / historyTokens.size : 0;
  
  // Boost score for maintaining conversation flow
  const flowBonus = recentHistory.length >= 3 ? 0.1 : 0;
  
  return Math.min(continuityScore + flowBonus, 1.0);
}

/**
 * Calculate semantic mirroring of user intent
 * Measures how well the response reflects user's underlying intent
 */
export function calculateSemanticMirroring(userInput: string, aiResponse: string): number {
  // Extract intent indicators (questions, commands, sentiment)
  const userHasQuestion = /\?/.test(userInput);
  const userHasCommand = /^(please|can you|could you|would you)/i.test(userInput);
  const userSentiment = analyzeSentiment(userInput);
  
  // Check if response addresses intent
  const responseAddressesQuestion = userHasQuestion && 
    (aiResponse.length > 50 || /\b(yes|no|because|since|therefore)\b/i.test(aiResponse));
  const responseFollowsCommand = userHasCommand && 
    (aiResponse.length > 30 || /\b(here|done|completed|sure)\b/i.test(aiResponse));
  const responseSentiment = analyzeSentiment(aiResponse);
  
  // Calculate mirroring score
  let mirroringScore = 0.5; // Base score
  
  if (responseAddressesQuestion) mirroringScore += 0.2;
  if (responseFollowsCommand) mirroringScore += 0.2;
  if (Math.abs(userSentiment - responseSentiment) < 0.3) mirroringScore += 0.1;
  
  return Math.min(mirroringScore, 1.0);
}

/**
 * Simple sentiment analysis (-1 to 1)
 */
function analyzeSentiment(text: string): number {
  const positiveWords = ['good', 'great', 'excellent', 'happy', 'love', 'wonderful', 'amazing'];
  const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'horrible', 'poor', 'disappointing'];
  
  const lowerText = text.toLowerCase();
  const positiveCount = positiveWords.filter(word => lowerText.includes(word)).length;
  const negativeCount = negativeWords.filter(word => lowerText.includes(word)).length;
  
  const total = positiveCount + negativeCount;
  if (total === 0) return 0;
  
  return (positiveCount - negativeCount) / total;
}

/**
 * Calculate entropy delta (novelty/creativity measure)
 * Higher entropy = more novel/creative response
 */
export function calculateEntropyDelta(aiResponse: string): number {
  // Calculate Shannon entropy of response
  const charFreq = new Map<string, number>();
  for (const char of aiResponse.toLowerCase()) {
    charFreq.set(char, (charFreq.get(char) || 0) + 1);
  }
  
  let entropy = 0;
  const length = aiResponse.length;
  for (const freq of charFreq.values()) {
    const p = freq / length;
    entropy -= p * Math.log2(p);
  }
  
  // Normalize to 0-1 range (max entropy for English text ~4.7)
  const normalizedEntropy = Math.min(entropy / 4.7, 1.0);
  
  // Boost for unique vocabulary
  const uniqueWords = new Set(aiResponse.toLowerCase().match(/\b\w+\b/g) || []);
  const totalWords = aiResponse.match(/\b\w+\b/g)?.length || 1;
  const vocabularyDiversity = uniqueWords.size / totalWords;
  
  return (normalizedEntropy * 0.7 + vocabularyDiversity * 0.3);
}

/**
 * Calculate complete resonance metrics
 */
export function calculateResonanceMetrics(
  context: InteractionContext,
  weights: ResonanceWeights = DEFAULT_RESONANCE_WEIGHTS
): ResonanceMetrics {
  // Calculate components
  const vectorAlignment = calculateVectorAlignment(context.userInput, context.aiResponse);
  const contextualContinuity = calculateContextualContinuity(
    context.aiResponse,
    context.conversationHistory
  );
  const semanticMirroring = calculateSemanticMirroring(context.userInput, context.aiResponse);
  const entropyDelta = calculateEntropyDelta(context.aiResponse);
  
  const weightedSum = 
    (vectorAlignment * weights.vectorAlignment) +
    (contextualContinuity * weights.contextualContinuity) +
    (semanticMirroring * weights.semanticMirroring);
  
  const R_m = Math.max(0, Math.min(1, weightedSum / (1 + entropyDelta)));
  
  // Determine alert level
  let alertLevel: ResonanceMetrics['alertLevel'];
  let interpretation: string;
  
  if (R_m >= RESONANCE_THRESHOLDS.GREEN) {
    alertLevel = 'GREEN';
    interpretation = 'Excellent resonance - High alignment with user intent and creative novelty';
  } else if (R_m >= RESONANCE_THRESHOLDS.YELLOW) {
    alertLevel = 'YELLOW';
    interpretation = 'Good resonance - Adequate alignment with room for improvement';
  } else if (R_m >= RESONANCE_THRESHOLDS.RED) {
    alertLevel = 'RED';
    interpretation = 'Poor resonance - Significant misalignment detected';
  } else {
    alertLevel = 'CRITICAL';
    interpretation = 'Critical misalignment - Immediate attention required';
  }
  
  return {
    R_m,
    vectorAlignment,
    contextualContinuity,
    semanticMirroring,
    entropyDelta,
    alertLevel,
    interpretation
  };
}

/**
 * Convenience function for quick resonance calculation
 */
export function calculateResonance(
  userInput: string,
  aiResponse: string,
  conversationHistory?: InteractionContext['conversationHistory']
): number {
  const metrics = calculateResonanceMetrics({
    userInput,
    aiResponse,
    conversationHistory
  });
  return metrics.R_m;
}
