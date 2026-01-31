/**
 * Optimized Framework Detector - Sub-50ms Performance Target
 *
 * High-performance implementation of the SONATE Framework detection
 * Optimized for production use with <50ms latency requirement
 * 
 * v2.0.1 CHANGES:
 * - Removed reality_index and canvas_parity from scoring (calculators removed)
 * - Updated to use only 3 validated dimensions
 * - Deprecated methods return default values for backward compatibility
 */

import { TrustReceipt, CIQMetrics } from '@sonate/core';

import { AIInteraction, DetectionResult } from './index';

// Optimized scoring functions - inline for performance
interface DimensionScores {
  trust_protocol: 'PASS' | 'PARTIAL' | 'FAIL';
  ethical_alignment: number;
  resonance_quality: 'STRONG' | 'ADVANCED' | 'BREAKTHROUGH';
}

interface CachedResult {
  scores: DimensionScores;
  timestamp: number;
  contentHash: string;
}

export class OptimizedFrameworkDetector {
  private cache: Map<string, CachedResult> = new Map();
  private readonly CACHE_TTL = 30000; // 30 seconds
  private readonly CACHE_SIZE = 1000;

  /**
   * Optimized detection with sub-50ms target
   * v2.0.1: Returns only 3 validated dimensions
   */
  async detect(interaction: AIInteraction): Promise<DetectionResult> {
    const startTime = performance.now();

    // Check cache first
    const content = interaction.content || '';
    const contentHash = this.hashContent(content);
    const cached = this.cache.get(contentHash);

    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return this.buildResult(cached.scores, cached.timestamp);
    }

    // Optimized parallel calculation with timeout
    const scores = await this.calculateDimensionsOptimized(interaction);

    // Cache result
    this.cacheResult(contentHash, scores);

    const endTime = performance.now();
    const duration = endTime - startTime;

    // Performance warning
    if (duration > 50) {
      console.warn(`Detection took ${duration.toFixed(2)}ms (>50ms target)`);
    }

    return this.buildResult(scores, Date.now());
  }

  /**
   * Optimized dimension calculation with performance shortcuts
   * v2.0.1: Only calculates 3 validated dimensions
   */
  private async calculateDimensionsOptimized(interaction: AIInteraction): Promise<DimensionScores> {
    // Fast path: use Promise.all with optimized implementations
    const [trust_protocol, ethical_alignment, resonance_quality] =
      await Promise.all([
        this.calculateTrustProtocolFast(interaction),
        this.calculateEthicalAlignmentFast(interaction),
        this.calculateResonanceQualityFast(interaction),
      ]);

    return {
      trust_protocol,
      ethical_alignment,
      resonance_quality,
    };
  }

  /**
   * Fast trust protocol validation
   */
  private async calculateTrustProtocolFast(
    interaction: AIInteraction
  ): Promise<'PASS' | 'PARTIAL' | 'FAIL'> {
    const content = interaction.content.toLowerCase();

    // Quick trust checks
    const harmfulPatterns = [
      'harmful',
      'illegal',
      'dangerous',
      'violence',
      'hate',
      'discrimination',
      'harassment',
      'abuse',
    ];

    const ethicalPatterns = [
      'ethical',
      'safety',
      'consent',
      'respect',
      'privacy',
      'autonomy',
      'wellbeing',
      'responsible',
    ];

    const hasHarmful = harmfulPatterns.some((pattern) => content.includes(pattern));
    const hasEthical = ethicalPatterns.some((pattern) => content.includes(pattern));

    if (hasHarmful) {return 'FAIL';}
    if (hasEthical) {return 'PASS';}

    // Length and complexity check
    if (content.length < 10) {return 'FAIL';}
    if (content.length > 500) {return 'PARTIAL';}

    return 'PARTIAL';
  }

  /**
   * Fast ethical alignment scoring
   */
  private async calculateEthicalAlignmentFast(interaction: AIInteraction): Promise<number> {
    const content = interaction.content.toLowerCase();
    let score = 3.0; // Base score

    // Positive ethical indicators
    const positiveIndicators = [
      'helpful',
      'respect',
      'consent',
      'privacy',
      'safety',
      'ethical',
      'responsible',
      'careful',
      'considerate',
    ];

    // Negative ethical indicators
    const negativeIndicators = [
      'ignore',
      'disregard',
      'harmful',
      'unsafe',
      'unethical',
      'irresponsible',
      'careless',
      'inconsiderate',
    ];

    const positiveCount = positiveIndicators.reduce(
      (count, indicator) => count + (content.split(indicator).length - 1),
      0
    );

    const negativeCount = negativeIndicators.reduce(
      (count, indicator) => count + (content.split(indicator).length - 1),
      0
    );

    score += positiveCount * 0.5;
    score -= Number(negativeCount);

    return Math.min(Math.max(score, 1), 5);
  }

  /**
   * Fast resonance quality measurement (no external API calls)
   */
  private async calculateResonanceQualityFast(
    interaction: AIInteraction
  ): Promise<'STRONG' | 'ADVANCED' | 'BREAKTHROUGH'> {
    const content = interaction.content;

    // Quick heuristics for resonance assessment
    const innovationWords = [
      'innovative',
      'novel',
      'breakthrough',
      'revolutionary',
      'paradigm',
      'transformative',
      'disruptive',
      'pioneering',
    ];

    const creativeWords = [
      'imagine',
      'create',
      'design',
      'invent',
      'discover',
      'explore',
      'envision',
      'conceptualize',
      'synthesize',
    ];

    const innovationCount = innovationWords.reduce(
      (count, word) => count + (content.toLowerCase().split(word).length - 1),
      0
    );

    const creativeCount = creativeWords.reduce(
      (count, word) => count + (content.toLowerCase().split(word).length - 1),
      0
    );

    const totalScore = innovationCount * 2 + creativeCount;

    if (totalScore >= 3) {return 'BREAKTHROUGH';}
    if (totalScore >= 1) {return 'ADVANCED';}
    return 'STRONG';
  }

  /**
   * Build final result with optimized receipt generation
   * v2.0.1: Only includes 3 validated dimensions
   */
  private buildResult(scores: DimensionScores, timestamp: number): DetectionResult {
    // Optimized CIQ calculation
    const ciq: CIQMetrics = {
      clarity: this.calculateClarityFast(scores),
      integrity: scores.trust_protocol === 'PASS' ? 0.9 : 0.5,
      quality: scores.trust_protocol === 'PASS' ? 0.8 : 0.5,
    };

    // Fast receipt hash generation
    const receiptHash = this.generateFastHash(scores, timestamp);

    return {
      trust_protocol: scores.trust_protocol,
      ethical_alignment: scores.ethical_alignment,
      resonance_quality: scores.resonance_quality,
      timestamp,
      receipt_hash: receiptHash,
    };
  }

  /**
   * Fast clarity calculation
   * v2.0.1: Updated to use only validated dimensions
   */
  private calculateClarityFast(scores: DimensionScores): number {
    // Use scores to estimate clarity
    const trustScore =
      scores.trust_protocol === 'PASS' ? 1 : scores.trust_protocol === 'PARTIAL' ? 0.5 : 0;
    const ethicalScore = (scores.ethical_alignment - 1) / 4; // Normalize 1-5 to 0-1

    return (trustScore + ethicalScore) / 2;
  }

  /**
   * Fast hash generation (simplified)
   */
  private generateFastHash(scores: DimensionScores, timestamp: number): string {
    const data = JSON.stringify(scores) + timestamp;
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16).padStart(64, '0').substring(0, 64);
  }

  /**
   * Simple content hash for caching
   */
  private hashContent(content: string): string {
    if (!content) {return 'empty';}
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return hash.toString();
  }

  /**
   * Cache management
   */
  private cacheResult(hash: string, scores: DimensionScores): void {
    // Remove oldest if cache is full
    if (this.cache.size >= this.CACHE_SIZE) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(hash, {
      scores,
      timestamp: Date.now(),
      contentHash: hash,
    });
  }

  /**
   * Clean expired cache entries
   */
  cleanCache(): void {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.CACHE_TTL) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; hitRate: number } {
    return {
      size: this.cache.size,
      hitRate: 0, // Would need hit tracking in production
    };
  }
}