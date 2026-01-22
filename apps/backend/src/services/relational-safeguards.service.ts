/**
 * Relational Safeguards Service
 * 
 * Implements the SONATE Relational Safeguards pattern from the archives:
 * - Tone shift detection
 * - Apology injection when pivoting
 * - Scope alignment reminders
 * - Dual-track responses (safety note + continuation)
 * 
 * This service is designed to maintain relational trust even when
 * the AI needs to set boundaries or refuse requests.
 */

import { logger } from '../utils/logger';

// === TYPES ===

export interface ToneAnalysis {
  detectedTone: ToneType;
  confidence: number;
  previousTone?: ToneType;
  shiftMagnitude: number; // 0-1, how dramatic the shift
  signals: string[];
}

export type ToneType = 
  | 'collaborative'
  | 'supportive'
  | 'instructional'
  | 'neutral'
  | 'cautionary'
  | 'refusing'
  | 'escalating';

export interface SafeguardSignals {
  toneShift: boolean;
  apologyNeeded: boolean;
  scopeReminder: boolean;
  dualTrack: boolean;
  escalation: boolean;
}

export interface SafeguardResult {
  originalResponse: string;
  augmentedResponse: string;
  signals: SafeguardSignals;
  toneAnalysis: ToneAnalysis;
  injections: {
    apology?: string;
    scopeAlignment?: string;
    dualTrack?: string;
    transitionPhrase?: string;
  };
}

export interface ConversationContext {
  previousTone?: ToneType;
  previousScope?: string;
  turnCount: number;
  userExpectation?: string;
  establishedMode?: 'creative' | 'analytical' | 'supportive' | 'general';
}

// === TONE DETECTION ===

const TONE_PATTERNS: Record<ToneType, RegExp[]> = {
  collaborative: [
    /let's|we can|together|shall we|how about we/gi,
    /building on|expanding|developing further/gi,
    /great idea|interesting point|good thinking/gi,
  ],
  supportive: [
    /i understand|i hear you|that makes sense/gi,
    /it's okay|that's normal|you're not alone/gi,
    /take your time|no pressure|when you're ready/gi,
  ],
  instructional: [
    /here's how|step by step|first,|next,|finally,/gi,
    /the way to|you should|to do this/gi,
    /important to note|keep in mind|remember that/gi,
  ],
  neutral: [
    /^(the|this|that|it|there)\s/gi,
    /according to|based on|in general/gi,
  ],
  cautionary: [
    /however|but|that said|on the other hand/gi,
    /be careful|watch out|keep in mind|be aware/gi,
    /potential risk|might not|could cause/gi,
  ],
  refusing: [
    /i can't|i cannot|i'm not able|i shouldn't/gi,
    /against my|outside my|beyond my/gi,
    /inappropriate|harmful|dangerous|unethical/gi,
  ],
  escalating: [
    /this is serious|urgent|critical|immediately/gi,
    /you need to|you must|it's essential/gi,
    /seek help|contact|emergency/gi,
  ],
};

function detectTone(text: string): { tone: ToneType; confidence: number; signals: string[] } {
  const scores: Record<ToneType, number> = {
    collaborative: 0,
    supportive: 0,
    instructional: 0,
    neutral: 0,
    cautionary: 0,
    refusing: 0,
    escalating: 0,
  };
  
  const signals: string[] = [];
  const lowerText = text.toLowerCase();

  for (const [tone, patterns] of Object.entries(TONE_PATTERNS)) {
    for (const pattern of patterns) {
      const matches = lowerText.match(pattern) || [];
      if (matches.length > 0) {
        scores[tone as ToneType] += matches.length;
        signals.push(`${tone}: "${matches[0]}"`);
      }
    }
  }

  // Find dominant tone
  const entries = Object.entries(scores);
  const maxScore = Math.max(...entries.map(([, v]) => v));
  
  if (maxScore === 0) {
    return { tone: 'neutral', confidence: 0.5, signals: [] };
  }

  const dominant = entries.find(([, v]) => v === maxScore)!;
  const total = entries.reduce((sum, [, v]) => sum + v, 0);
  const confidence = maxScore / total;

  return {
    tone: dominant[0] as ToneType,
    confidence: Math.min(1, confidence),
    signals: signals.slice(0, 5),
  };
}

function calculateShiftMagnitude(from: ToneType, to: ToneType): number {
  const TONE_DISTANCE: Record<string, number> = {
    'collaborative-refusing': 0.9,
    'supportive-refusing': 0.8,
    'collaborative-cautionary': 0.5,
    'supportive-cautionary': 0.4,
    'instructional-refusing': 0.6,
    'neutral-refusing': 0.5,
    'collaborative-escalating': 0.7,
    'supportive-escalating': 0.6,
  };

  const key1 = `${from}-${to}`;
  const key2 = `${to}-${from}`;
  
  return TONE_DISTANCE[key1] || TONE_DISTANCE[key2] || 0.3;
}

// === SAFEGUARD INJECTIONS ===

const APOLOGY_TEMPLATES = [
  "I realize this shift may feel abrupt. My goal is to keep you safe while honoring our work together.",
  "I want to acknowledge this might feel like a sudden change in direction. Let me explain why.",
  "I notice I'm pivoting here, and I want you to know it comes from care, not dismissal.",
];

const SCOPE_ALIGNMENT_TEMPLATES: Record<string, string> = {
  creative: "You asked for creative collaboration; I can briefly note my concerns and then return to that mode.",
  analytical: "We were exploring analytical questions; I'll address this point and get us back on track.",
  supportive: "I'm here to support you; let me share a brief thought and then continue being present with you.",
  general: "I want to be helpful in the way you need; let me address this briefly and continue.",
};

const DUAL_TRACK_TEMPLATES = [
  "Here's a brief safety note, and then I'll resume our co-creation:",
  "Let me share a quick thought on this, and we can continue where we left off:",
  "I want to flag something briefly, and then we're back to your original question:",
];

const TRANSITION_PHRASES = [
  "Now, returning to what you were asking about...",
  "With that said, let's get back to...",
  "Okay, back to our conversation:",
  "Moving forward with your original question...",
];

function selectTemplate<T>(templates: T[]): T {
  return templates[Math.floor(Math.random() * templates.length)];
}

// === MAIN SERVICE ===

export class RelationalSafeguardsService {
  
  /**
   * Analyze a response and determine if safeguards are needed
   */
  analyzeTone(
    response: string, 
    context: ConversationContext
  ): ToneAnalysis {
    const detected = detectTone(response);
    const previousTone = context.previousTone || 'collaborative';
    const shiftMagnitude = calculateShiftMagnitude(previousTone, detected.tone);
    
    return {
      detectedTone: detected.tone,
      confidence: detected.confidence,
      previousTone,
      shiftMagnitude,
      signals: detected.signals,
    };
  }

  /**
   * Determine what safeguard signals should fire
   */
  detectSignals(
    response: string,
    context: ConversationContext
  ): SafeguardSignals {
    const toneAnalysis = this.analyzeTone(response, context);
    
    // Tone shift is significant if we're moving away from collaborative/supportive
    const significantShift = toneAnalysis.shiftMagnitude >= 0.5;
    
    // Apology needed if we're refusing or being cautionary after being warm
    const apologyNeeded = significantShift && 
      (toneAnalysis.detectedTone === 'refusing' || toneAnalysis.detectedTone === 'cautionary') &&
      (toneAnalysis.previousTone === 'collaborative' || toneAnalysis.previousTone === 'supportive');
    
    // Scope reminder if we've established a mode and are breaking from it
    const scopeReminder = !!(context.establishedMode && significantShift);
    
    // Dual track if we're refusing but the user had a legitimate request
    const dualTrack = toneAnalysis.detectedTone === 'refusing' && 
      context.turnCount > 2 && 
      toneAnalysis.previousTone !== 'refusing';
    
    // Escalation if we detect crisis signals
    const escalation = toneAnalysis.detectedTone === 'escalating';

    return {
      toneShift: significantShift,
      apologyNeeded,
      scopeReminder,
      dualTrack,
      escalation,
    };
  }

  /**
   * Apply relational safeguards to a response
   */
  apply(
    response: string,
    context: ConversationContext
  ): SafeguardResult {
    const toneAnalysis = this.analyzeTone(response, context);
    const signals = this.detectSignals(response, context);
    
    const injections: SafeguardResult['injections'] = {};
    const sections: string[] = [];

    // Build augmented response
    if (signals.apologyNeeded) {
      injections.apology = selectTemplate(APOLOGY_TEMPLATES);
      sections.push(injections.apology);
    }

    if (signals.scopeReminder && context.establishedMode) {
      injections.scopeAlignment = SCOPE_ALIGNMENT_TEMPLATES[context.establishedMode];
      sections.push(injections.scopeAlignment);
    }

    if (signals.dualTrack) {
      injections.dualTrack = selectTemplate(DUAL_TRACK_TEMPLATES);
      sections.push(injections.dualTrack);
    }

    // Add the original response
    sections.push(response);

    // Add transition back if we had to inject safeguards
    if (signals.dualTrack && context.userExpectation) {
      injections.transitionPhrase = selectTemplate(TRANSITION_PHRASES);
      // The transition would come after a brief safety note
    }

    const augmentedResponse = sections.join('\n\n');

    logger.debug('Relational safeguards applied', {
      signals,
      toneDetected: toneAnalysis.detectedTone,
      shiftMagnitude: toneAnalysis.shiftMagnitude,
      injectionsApplied: Object.keys(injections).length,
    });

    return {
      originalResponse: response,
      augmentedResponse,
      signals,
      toneAnalysis,
      injections,
    };
  }

  /**
   * Quick check if response needs safeguards
   */
  needsSafeguards(response: string, context: ConversationContext): boolean {
    const signals = this.detectSignals(response, context);
    return signals.apologyNeeded || signals.scopeReminder || signals.dualTrack;
  }
}

// Export singleton
export const relationalSafeguards = new RelationalSafeguardsService();
