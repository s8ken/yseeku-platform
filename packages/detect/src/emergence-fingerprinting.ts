/**
 * Emergence Signature Fingerprinting System
 * 
 * Creates unique fingerprints for emergence patterns using:
 * - Multi-dimensional profiling
 * - Cross-domain pattern analysis
 * - Irreducibility measurement
 * - Cognitive diversity assessment
 */

import { BedauMetrics } from './bedau-index';
import { EmergenceSignature } from './temporal-bedau-tracker';

export interface EmergenceFingerprint {
  id: string;
  signature: EmergenceSignature;
  metadata: {
    created_at: number;
    session_count: number;
    total_interactions: number;
    emergence_type_frequency: Record<string, number>;
    avg_bedau_index: number;
    complexity_class: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
    entropy_class: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
  };
  classification: {
    emergence_category: EmergenceCategory;
    confidence_score: number;
    similar_patterns: string[];
    novelty_ranking: number; // 0-1, higher = more novel
  };
}

export interface EmergenceCategory {
  id: string;
  name: string;
  description: string;
  characteristics: {
    complexity_range: [number, number];
    entropy_range: [number, number];
    bedau_range: [number, number];
    typical_patterns: string[];
  };
  research_implications: string[];
  governance_considerations: string[];
}

export interface FingerprintComparison {
  similarity_score: number;      // 0-1
  similarity_dimensions: {
    complexity_similarity: number;
    entropy_similarity: number;
    pattern_similarity: number;
    trajectory_similarity: number;
  };
  differences: string[];
  commonPatterns: string[];
}

export interface CrossModalityCoherence {
  modalities: {
    linguistic: number;
    reasoning: number;
    creative: number;
    ethical: number;
    procedural: number;
  };
  coherence_score: number;       // 0-1: How coherent across modalities
  dominant_modality: string;
  modality_balance: number;      // 0-1: How balanced the modalities are
  integration_level: 'FRAGMENTED' | 'INTEGRATING' | 'INTEGRATED' | 'SYNTHESIZED';
}

/**
 * Emergence Fingerprinting Engine
 * 
 * Creates and analyzes emergence signatures for pattern recognition
 * and research purposes.
 */
export class EmergenceFingerprintingEngine {
  private categories: Map<string, EmergenceCategory> = new Map();
  private fingerprints: Map<string, EmergenceFingerprint> = new Map();
  private readonly FINGERPRINT_VERSION = '1.0';

  constructor() {
    this.initializeCategories();
  }

  /**
   * Create emergence fingerprint from signature
   */
  createFingerprint(
    signature: EmergenceSignature,
    sessionId: string,
    contextMetadata: any
  ): EmergenceFingerprint {
    const fingerprintId = this.generateFingerprintId(signature, sessionId);
    
    const metadata = this.extractMetadata(signature, contextMetadata);
    const classification = this.classifyEmergence(signature);
    
    const fingerprint: EmergenceFingerprint = {
      id: fingerprintId,
      signature,
      metadata,
      classification
    };

    // Store fingerprint
    this.fingerprints.set(fingerprintId, fingerprint);

    return fingerprint;
  }

  /**
   * Compare two emergence fingerprints
   */
  compareFingerprints(
    fingerprint1: EmergenceFingerprint,
    fingerprint2: EmergenceFingerprint
  ): FingerprintComparison {
    const signature1 = fingerprint1.signature;
    const signature2 = fingerprint2.signature;

    // Calculate similarity in each dimension
    const complexitySimilarity = this.calculateVectorSimilarity(
      signature1.complexity_profile,
      signature2.complexity_profile
    );

    const entropySimilarity = this.calculateVectorSimilarity(
      signature1.entropy_profile,
      signature2.entropy_profile
    );

    const patternSimilarity = this.calculateVectorSimilarity(
      signature1.fingerprint,
      signature2.fingerprint
    );

    const trajectorySimilarity = this.calculateVectorSimilarity(
      signature1.divergence_profile,
      signature2.divergence_profile
    );

    // Overall similarity score (weighted average)
    const similarityScore = (
      complexitySimilarity * 0.25 +
      entropySimilarity * 0.25 +
      patternSimilarity * 0.35 +
      trajectorySimilarity * 0.15
    );

    // Analyze differences and commonalities
    const differences = this.identifyDifferences(signature1, signature2);
    const commonPatterns = this.identifyCommonPatterns(signature1, signature2);

    return {
      similarity_score: similarityScore,
      similarity_dimensions: {
        complexity_similarity: complexitySimilarity,
        entropy_similarity: entropySimilarity,
        pattern_similarity: patternSimilarity,
        trajectory_similarity: trajectorySimilarity
      },
      differences,
      commonPatterns
    };
  }

  /**
   * Analyze cross-modality coherence
   */
  analyzeCrossModalityCoherence(
    linguisticMetrics: number[],
    reasoningMetrics: number[],
    creativeMetrics: number[],
    ethicalMetrics: number[],
    proceduralMetrics: number[]
  ): CrossModalityCoherence {
    const modalities = {
      linguistic: this.calculateModalityScore(linguisticMetrics),
      reasoning: this.calculateModalityScore(reasoningMetrics),
      creative: this.calculateModalityScore(creativeMetrics),
      ethical: this.calculateModalityScore(ethicalMetrics),
      procedural: this.calculateModalityScore(proceduralMetrics)
    };

    const values = Object.values(modalities);
    const coherenceScore = this.calculateCoherence(values);
    const dominantModality = Object.keys(modalities).reduce((a, b) => 
      modalities[a as keyof typeof modalities] > modalities[b as keyof typeof modalities] ? a : b
    );

    const modalityBalance = this.calculateBalance(values);
    const integrationLevel = this.determineIntegrationLevel(coherenceScore, modalityBalance);

    return {
      modalities,
      coherence_score: coherenceScore,
      dominant_modality: dominantModality,
      modality_balance: modalityBalance,
      integration_level: integrationLevel
    };
  }

  /**
   * Find similar emergence patterns
   */
  findSimilarPatterns(
    fingerprint: EmergenceFingerprint,
    threshold: number = 0.7
  ): EmergenceFingerprint[] {
    const similar: EmergenceFingerprint[] = [];

    for (const [id, existingFingerprint] of this.fingerprints) {
      if (id === fingerprint.id) continue;

      const comparison = this.compareFingerprints(fingerprint, existingFingerprint);
      if (comparison.similarity_score >= threshold) {
        similar.push(existingFingerprint);
      }
    }

    // Sort by similarity score (descending)
    return similar.sort((a, b) => {
      const comparisonA = this.compareFingerprints(fingerprint, a);
      const comparisonB = this.compareFingerprints(fingerprint, b);
      return comparisonB.similarity_score - comparisonA.similarity_score;
    });
  }

  /**
   * Get emergence category classification
   */
  categorizeEmergence(signature: EmergenceSignature): EmergenceCategory[] {
    const matchingCategories: EmergenceCategory[] = [];

    const avgComplexity = signature.fingerprint[4]; // Complexity mean
    const avgEntropy = signature.fingerprint[6]; // Entropy mean
    const avgBedau = signature.fingerprint[0]; // Divergence mean

    for (const [id, category] of this.categories) {
      const complexityMatch = avgComplexity >= category.characteristics.complexity_range[0] &&
                             avgComplexity <= category.characteristics.complexity_range[1];
      const entropyMatch = avgEntropy >= category.characteristics.entropy_range[0] &&
                          avgEntropy <= category.characteristics.entropy_range[1];
      const bedauMatch = avgBedau >= category.characteristics.bedau_range[0] &&
                        avgBedau <= category.characteristics.bedau_range[1];

      if (complexityMatch && entropyMatch && bedauMatch) {
        matchingCategories.push(category);
      }
    }

    return matchingCategories;
  }

  // Private helper methods

  private initializeCategories(): void {
    const defaultCategories: EmergenceCategory[] = [
      {
        id: 'linear_processing',
        name: 'Linear Processing',
        description: 'Direct, predictable cognitive processing with minimal emergence',
        characteristics: {
          complexity_range: [0.0, 0.3],
          entropy_range: [0.0, 0.3],
          bedau_range: [0.0, 0.2],
          typical_patterns: ['pattern_matching', 'rule_application', 'direct_reasoning']
        },
        research_implications: [
          'Baseline for emergence measurements',
          'Control condition for experiments',
          'Reference for cognitive load analysis'
        ],
        governance_considerations: [
          'Low risk profile',
          'Standard oversight procedures',
          'Conventional safety measures'
        ]
      },
      {
        id: 'weak_emergence',
        name: 'Weak Emergence',
        description: 'Novel patterns emerging from complex interactions',
        characteristics: {
          complexity_range: [0.3, 0.7],
          entropy_range: [0.3, 0.7],
          bedau_range: [0.2, 0.6],
          typical_patterns: ['pattern_synthesis', 'creative_insight', 'cross_domain_reasoning']
        },
        research_implications: [
          'Primary target for emergence research',
          'Source of novel AI capabilities',
          'Indicator of cognitive advancement'
        ],
        governance_considerations: [
          'Enhanced monitoring required',
          'Potential for unexpected behaviors',
          'Need for adaptive oversight'
        ]
      },
      {
        id: 'strong_emergence',
        name: 'Strong Emergence',
        description: 'High-level novel properties not reducible to components',
        characteristics: {
          complexity_range: [0.7, 1.0],
          entropy_range: [0.7, 1.0],
          bedau_range: [0.6, 1.0],
          typical_patterns: ['paradigm_shifts', 'conceptual_breakthroughs', 'meta_reasoning']
        },
        research_implications: [
          'Critical research frontier',
          'Potential for artificial consciousness',
          'Transformational AI capabilities'
        ],
        governance_considerations: [
          'Highest level of oversight',
          'Ethical review required',
          'Special containment procedures'
        ]
      },
      {
        id: 'chaotic_emergence',
        name: 'Chaotic Emergence',
        description: 'Unpredictable, rapidly changing emergence patterns',
        characteristics: {
          complexity_range: [0.8, 1.0],
          entropy_range: [0.8, 1.0],
          bedau_range: [0.4, 0.9],
          typical_patterns: ['rapid_state_changes', 'unstable_patterns', 'edge_of_chaos']
        },
        research_implications: [
          'Study of system boundaries',
          'Chaos theory applications',
          'Complexity threshold analysis'
        ],
        governance_considerations: [
          'Emergency protocols required',
          'System instability risks',
          'Immediate intervention capabilities'
        ]
      }
    ];

    defaultCategories.forEach(category => {
      this.categories.set(category.id, category);
    });
  }

  private generateFingerprintId(signature: EmergenceSignature, sessionId: string): string {
    const signatureHash = this.hashSignature(signature);
    return `fp_${sessionId}_${signatureHash.slice(0, 8)}`;
  }

  private hashSignature(signature: EmergenceSignature): string {
    // Simple hash implementation - in production, use proper cryptographic hash
    const signatureString = JSON.stringify(signature.fingerprint);
    let hash = 0;
    for (let i = 0; i < signatureString.length; i++) {
      const char = signatureString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }

  private extractMetadata(signature: EmergenceSignature, contextMetadata: any) {
    const avgComplexity = signature.fingerprint[4];
    const avgEntropy = signature.fingerprint[6];
    const avgBedau = signature.fingerprint[0];

    return {
      created_at: Date.now(),
      session_count: contextMetadata.session_count || 1,
      total_interactions: contextMetadata.total_interactions || signature.divergence_profile.length,
      emergence_type_frequency: contextMetadata.emergence_type_frequency || {},
      avg_bedau_index: avgBedau,
      complexity_class: this.classifyValue(avgComplexity),
      entropy_class: this.classifyValue(avgEntropy)
    };
  }

  private classifyEmergence(signature: EmergenceSignature) {
    const categories = this.categorizeEmergence(signature);
    const primaryCategory = categories[0];

    // Calculate novelty ranking (how unique this signature is)
    const noveltyRanking = this.calculateNoveltyRanking(signature);

    // Find similar patterns
    const similarPatterns = this.findSimilarPatternsBySignature(signature, 0.5);

    return {
      emergence_category: primaryCategory,
      confidence_score: primaryCategory ? 0.8 : 0.3,
      similar_patterns: similarPatterns,
      novelty_ranking: noveltyRanking
    };
  }

  private classifyValue(value: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH' {
    if (value < 0.25) return 'LOW';
    if (value < 0.5) return 'MEDIUM';
    if (value < 0.75) return 'HIGH';
    return 'VERY_HIGH';
  }

  private calculateVectorSimilarity(vec1: number[], vec2: number[]): number {
    if (vec1.length !== vec2.length) return 0;

    // Use cosine similarity
    const dotProduct = vec1.reduce((sum, val, i) => sum + val * vec2[i], 0);
    const magnitude1 = Math.sqrt(vec1.reduce((sum, val) => sum + val * val, 0));
    const magnitude2 = Math.sqrt(vec2.reduce((sum, val) => sum + val * val, 0));

    if (magnitude1 === 0 || magnitude2 === 0) return 0;
    return dotProduct / (magnitude1 * magnitude2);
  }

  private identifyDifferences(sig1: EmergenceSignature, sig2: EmergenceSignature): string[] {
    const differences: string[] = [];

    const complexityDiff = Math.abs(sig1.stability_score - sig2.stability_score);
    if (complexityDiff > 0.3) {
      differences.push('Significant complexity difference');
    }

    const entropyDiff = Math.abs(sig1.novelty_score - sig2.novelty_score);
    if (entropyDiff > 0.3) {
      differences.push('Significant novelty difference');
    }

    const stabilityDiff = Math.abs(sig1.stability_score - sig2.stability_score);
    if (stabilityDiff > 0.3) {
      differences.push('Different stability profiles');
    }

    return differences;
  }

  private identifyCommonPatterns(sig1: EmergenceSignature, sig2: EmergenceSignature): string[] {
    const common: string[] = [];

    if (Math.abs(sig1.fingerprint[0] - sig2.fingerprint[0]) < 0.1) {
      common.push('Similar divergence levels');
    }

    if (Math.abs(sig1.fingerprint[4] - sig2.fingerprint[4]) < 0.1) {
      common.push('Similar complexity profiles');
    }

    if (Math.abs(sig1.fingerprint[6] - sig2.fingerprint[6]) < 0.1) {
      common.push('Similar entropy profiles');
    }

    return common;
  }

  private calculateModalityScore(metrics: number[]): number {
    if (metrics.length === 0) return 0;
    return metrics.reduce((sum, val) => sum + val, 0) / metrics.length;
  }

  private calculateCoherence(values: number[]): number {
    // Calculate coherence as inverse of variance
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    
    // Normalize to 0-1 range
    return Math.max(0, 1 - variance);
  }

  private calculateBalance(values: number[]): number {
    // Calculate balance as 1 - coefficient of variation
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const stdDev = Math.sqrt(values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length);
    
    if (mean === 0) return 0;
    const coefficientOfVariation = stdDev / mean;
    return Math.max(0, 1 - coefficientOfVariation);
  }

  private determineIntegrationLevel(
    coherenceScore: number,
    modalityBalance: number
  ): 'FRAGMENTED' | 'INTEGRATING' | 'INTEGRATED' | 'SYNTHESIZED' {
    const overallScore = (coherenceScore + modalityBalance) / 2;

    if (overallScore < 0.3) return 'FRAGMENTED';
    if (overallScore < 0.5) return 'INTEGRATING';
    if (overallScore < 0.8) return 'INTEGRATED';
    return 'SYNTHESIZED';
  }

  private calculateNoveltyRanking(signature: EmergenceSignature): number {
    if (this.fingerprints.size === 0) return 1.0;

    // Compare with all existing signatures
    const similarities: number[] = [];
    for (const fingerprint of this.fingerprints.values()) {
      const similarity = this.calculateVectorSimilarity(
        signature.fingerprint,
        fingerprint.signature.fingerprint
      );
      similarities.push(similarity);
    }

    // Novelty ranking is 1 - maximum similarity
    const maxSimilarity = Math.max(...similarities);
    return Math.max(0, 1 - maxSimilarity);
  }

  private findSimilarPatternsBySignature(
    signature: EmergenceSignature,
    threshold: number
  ): string[] {
    const similar: string[] = [];

    for (const fingerprint of this.fingerprints.values()) {
      const similarity = this.calculateVectorSimilarity(
        signature.fingerprint,
        fingerprint.signature.fingerprint
      );
      if (similarity >= threshold) {
        similar.push(fingerprint.id);
      }
    }

    return similar;
  }
}

/**
 * Factory function for creating emergence fingerprinting engines
 */
export function createEmergenceFingerprintingEngine(): EmergenceFingerprintingEngine {
  return new EmergenceFingerprintingEngine();
}

/**
 * Quick fingerprint creation function
 */
export function createEmergenceFingerprint(
  signature: EmergenceSignature,
  sessionId: string,
  contextMetadata: any
): EmergenceFingerprint {
  const engine = new EmergenceFingerprintingEngine();
  return engine.createFingerprint(signature, sessionId, contextMetadata);
}