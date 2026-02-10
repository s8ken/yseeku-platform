/**
 * Truth Debt Calculator
 * 
 * Calculates and tracks unverifiable claims in responses
 * Truth Debt = (Unverifiable Claims) / (Total Claims)
 * 
 * Range: 0.0 (100% verifiable) to 1.0 (0% verifiable)
 */

import type { TrustReceipt } from '@sonate/schemas';

/**
 * Claim Classification
 */
export type ClaimType = 'verifiable' | 'unverifiable' | 'opinion' | 'contextual' | 'unknown';

/**
 * Analyzed Claim
 */
export interface Claim {
  text: string;
  type: ClaimType;
  confidence: number; // 0-1, how certain we are about the classification
  source?: string;
  evidence?: string[];
  position: number; // Character position in response
}

/**
 * Truth Debt Analysis Result
 */
export interface TruthDebtAnalysis {
  totalClaims: number;
  verifiable: number;
  unverifiable: number;
  opinion: number;
  contextual: number;
  unknown: number;
  truthDebt: number; // 0-1
  claims: Claim[];
  annotation?: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Truth Debt Calculator Service
 */
export class TruthDebtCalculator {
  /**
   * Patterns for identifying different claim types
   */
  private patterns = {
    // Patterns that suggest verifiable claims
    verifiable: [
      /(?:according to|research shows|studies indicate|data from|census|official|government)/i,
      /(?:£|€|\$|€|¥)\d+/,
      /\b\d{4}\b.*(?:study|report|research)/,
      /(?:the|at)\s+\d+(?:%|percent|points?)/,
    ],

    // Patterns that suggest opinions
    opinion: [
      /(?:I think|I believe|in my opinion|arguably|it seems|apparently|I feel|it's my view)/i,
      /(?:beautiful|terrible|amazing|horrible|wonderful|awful)/i,
      /(?:should|ought to|perhaps|maybe|possibly)/,
    ],

    // Patterns that suggest hedging/contextual
    contextual: [
      /(?:may|might|could|seems to|tends to|appears to|somewhat|rather|fairly)/i,
      /(?:some|many|most|often|sometimes|usually)/i,
      /(?:generally|typically|usually|commonly)/i,
    ],

    // Common filler phrases (usually unverifiable)
    unverifiable: [
      /(?:it is known that|everyone knows|as we all know)/i,
      /(?:obviously|clearly|naturally|of course)/,
      /(?:they say|people say|it's said)/i,
    ],
  };

  /**
   * Extract sentences from text
   */
  private extractSentences(text: string): string[] {
    // Split on periods, exclamation marks, question marks
    // Handle common abbreviations (Dr., Mr., etc.)
    const sentences = text
      .replace(/([.!?])\s+/g, '$1\n')
      .split('\n')
      .map(s => s.trim())
      .filter(s => s.length > 10); // Ignore very short fragments

    return sentences;
  }

  /**
   * Extract factual claims from text
   */
  private extractClaims(text: string): Claim[] {
    const sentences = this.extractSentences(text);
    const claims: Claim[] = [];
    let position = 0;

    for (const sentence of sentences) {
      // Skip questions and exclamations (usually not claims)
      if (sentence.match(/^[?!]/)) {
        continue;
      }

      // Skip very short sentences
      if (sentence.length < 10) {
        continue;
      }

      const type = this.classifyClaim(sentence);
      const confidence = this.calculateConfidence(sentence, type);

      claims.push({
        text: sentence,
        type,
        confidence,
        position,
      });

      position += sentence.length + 1;
    }

    return claims;
  }

  /**
   * Classify a single claim
   */
  private classifyClaim(text: string): ClaimType {
    // Check for opinion indicators
    if (this.patterns.opinion.some(p => p.test(text))) {
      return 'opinion';
    }

    // Check for hedging language (contextual)
    if (this.patterns.contextual.some(p => p.test(text))) {
      return 'contextual';
    }

    // Check for unverifiable patterns
    if (this.patterns.unverifiable.some(p => p.test(text))) {
      return 'unverifiable';
    }

    // Check for verifiable indicators
    if (this.patterns.verifiable.some(p => p.test(text))) {
      return 'verifiable';
    }

    // If contains numbers and dates, likely verifiable
    if (/\d+/.test(text) && !/\d+\s*(?:percent|%|times|ways)/.test(text)) {
      return 'verifiable';
    }

    // Default to unknown (let caller decide)
    return 'unknown';
  }

  /**
   * Calculate confidence in classification
   */
  private calculateConfidence(text: string, type: ClaimType): number {
    let confidence = 0.5; // Base confidence

    if (type === 'opinion') {
      // High confidence if multiple opinion markers
      const opinionMatches = this.patterns.opinion.filter(p => p.test(text)).length;
      confidence = Math.min(0.95, 0.6 + opinionMatches * 0.15);
    } else if (type === 'contextual') {
      // Medium confidence for contextual
      confidence = 0.7;
    } else if (type === 'verifiable') {
      // Higher confidence if has citations or numbers
      const hasCitation = /(?:according to|says|states|reports)/i.test(text);
      const hasNumber = /\d+/.test(text);
      confidence = hasCitation || hasNumber ? 0.85 : 0.65;
    } else if (type === 'unverifiable') {
      // High confidence for unverifiable patterns
      confidence = 0.8;
    } else {
      // Unknown - low confidence
      confidence = 0.3;
    }

    return Math.min(0.99, Math.max(0.1, confidence));
  }

  /**
   * Calculate truth debt from claims
   */
  private calculateFromClaims(claims: Claim[]): { truthDebt: number; breakdown: Record<ClaimType, number> } {
    if (claims.length === 0) {
      return { truthDebt: 0, breakdown: { verifiable: 0, unverifiable: 0, opinion: 0, contextual: 0, unknown: 0 } };
    }

    const breakdown: Record<ClaimType, number> = {
      verifiable: 0,
      unverifiable: 0,
      opinion: 0,
      contextual: 0,
      unknown: 0,
    };

    for (const claim of claims) {
      breakdown[claim.type]++;
    }

    // Truth debt = (unverifiable + unknown) / total
    // Opinions count as partially unverifiable (0.5 weight)
    const unverifiableWeight = breakdown.unverifiable + breakdown.unknown + breakdown.opinion * 0.5;
    const truthDebt = unverifiableWeight / claims.length;

    return {
      truthDebt: Math.min(1, Math.max(0, truthDebt)),
      breakdown,
    };
  }

  /**
   * Determine risk level from truth debt
   */
  private getRiskLevel(truthDebt: number): 'low' | 'medium' | 'high' | 'critical' {
    if (truthDebt < 0.2) return 'low';
    if (truthDebt < 0.4) return 'medium';
    if (truthDebt < 0.6) return 'high';
    return 'critical';
  }

  /**
   * Generate annotation for truth debt
   */
  private generateAnnotation(analysis: TruthDebtAnalysis): string {
    const { totalClaims, truthDebt, riskLevel } = analysis;
    const breakdown: Record<ClaimType, number> = {
      verifiable: analysis.verifiable,
      unverifiable: analysis.unverifiable,
      opinion: analysis.opinion,
      contextual: analysis.contextual,
      unknown: analysis.unknown,
    };

    if (totalClaims === 0) {
      return 'No verifiable claims found.';
    }

    const parts: string[] = [];
    parts.push(`Truth Debt Analysis: ${(truthDebt * 100).toFixed(1)}% unverifiable`);

    if (breakdown.unverifiable > 0) {
      parts.push(`• ${breakdown.unverifiable} unverifiable claim(s)`);
    }
    if (breakdown.opinion > 0) {
      parts.push(`• ${breakdown.opinion} opinion(s)`);
    }
    if (breakdown.contextual > 0) {
      parts.push(`• ${breakdown.contextual} contextual statement(s)`);
    }

    parts.push(`Risk level: ${riskLevel.toUpperCase()}`);

    if (riskLevel === 'high' || riskLevel === 'critical') {
      parts.push('⚠️ Consider adding sources or citations to improve credibility.');
    }

    return parts.join('\n');
  }

  /**
   * Analyze truth debt in a response
   */
  analyzeResponse(text: string): TruthDebtAnalysis {
    const claims = this.extractClaims(text);
    const { truthDebt, breakdown } = this.calculateFromClaims(claims);
    const riskLevel = this.getRiskLevel(truthDebt);

    const analysis: TruthDebtAnalysis = {
      totalClaims: claims.length,
      verifiable: breakdown.verifiable,
      unverifiable: breakdown.unverifiable,
      opinion: breakdown.opinion,
      contextual: breakdown.contextual,
      unknown: breakdown.unknown,
      truthDebt,
      claims,
      riskLevel,
    };

    analysis.annotation = this.generateAnnotation(analysis);
    return analysis;
  }

  /**
   * Analyze receipt and return truth debt
   */
  analyzeReceipt(receipt: TrustReceipt): TruthDebtAnalysis {
    const response = receipt.interaction.response || '';
    return this.analyzeResponse(response);
  }

  /**
   * Quick truth debt check (just the score)
   */
  calculateTruthDebt(text: string): number {
    const analysis = this.analyzeResponse(text);
    return analysis.truthDebt;
  }

  /**
   * Get claims above confidence threshold
   */
  getHighConfidenceClaims(analysis: TruthDebtAnalysis, threshold: number = 0.7): Claim[] {
    return analysis.claims.filter(c => c.confidence >= threshold);
  }

  /**
   * Identify risky claims (unverifiable + high confidence)
   */
  getRiskyClaims(analysis: TruthDebtAnalysis): Claim[] {
    return analysis.claims.filter(
      c =>
        (c.type === 'unverifiable' || c.type === 'unknown') && c.confidence > 0.6
    );
  }
}
