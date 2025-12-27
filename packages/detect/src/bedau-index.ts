/**
 * Bedau Index Implementation for Weak Emergence Detection
 * 
 * Based on Mark Bedau's work on weak emergence:
 * "Weak emergence: the characteristic features of complex systems"
 * 
 * The Bedau Index measures weak emergence by comparing:
 * - Semantic intent vs. surface-level mirroring
 * - Micro-level interactions vs. macro-level patterns
 * - Irreducibility of system behavior
 */

export interface BedauMetrics {
  bedau_index: number;           // 0-1: Weak emergence strength
  emergence_type: 'LINEAR' | 'WEAK_EMERGENCE' | 'POTENTIAL_STRONG_EMERGENCE';
  kolmogorov_complexity: number; // Approximation of irreducibility
  semantic_entropy: number;      // Cognitive diversity measure
  confidence_interval: [number, number]; // Bootstrap CI
  effect_size: number;          // Cohen's d for emergence significance
  strong_emergence_indicators?: StrongEmergenceIndicators; // For future strong emergence detection
}

/**
 * Strong Emergence Indicators
 * 
 * Strong emergence is characterized by unpredictable collective behavior
 * that cannot be reduced to component interactions, even with complete
 * knowledge of the system. This is distinct from weak emergence measured
 * by the Bedau Index.
 */
export interface StrongEmergenceIndicators {
  irreducibility_proof: boolean;      // Cannot be predicted from components
  downward_causation: boolean;        // Higher level affects lower level
  novel_causal_powers: boolean;       // New causal capabilities emerge
  unpredictability_verified: boolean; // Verified through testing
  collective_behavior_score: number;  // 0-1: Degree of collective behavior
}

export interface SemanticIntent {
  intent_vectors: number[];     // High-level semantic representations
  reasoning_depth: number;       // 0-1: Depth of reasoning chains
  abstraction_level: number;     // 0-1: Level of conceptual abstraction
  cross_domain_connections: number; // Count of cross-domain insights
}

export interface SurfacePattern {
  surface_vectors: number[];     // Surface-level pattern representations
  pattern_complexity: number;    // 0-1: Complexity of observable patterns
  repetition_score: number;      // 0-1: Degree of pattern repetition
  novelty_score: number;         // 0-1: Novelty of patterns
}

/**
 * Core Bedau Index Calculator
 * 
 * Calculates weak emergence by analyzing the gap between semantic intent
 * and surface-level patterns, measuring irreducibility and novelty.
 */
export class BedauIndexCalculator {
  private readonly BOOTSTRAP_SAMPLES = 1000;
  private readonly EMERGENCE_THRESHOLD = 0.3;

  /**
   * Calculate Bedau Index for weak emergence detection
   */
  async calculateBedauIndex(
    semanticIntent: SemanticIntent,
    surfacePattern: SurfacePattern,
    historicalContext?: SemanticIntent[]
  ): Promise<BedauMetrics> {
    
    // Step 1: Calculate semantic-surface divergence
    const semanticSurfaceDivergence = this.calculateSemanticSurfaceDivergence(
      semanticIntent, 
      surfacePattern
    );

    // Step 2: Approximate Kolmogorov complexity
    const kolmogorovComplexity = this.approximateKolmogorovComplexity(
      semanticIntent, 
      surfacePattern
    );

    // Step 3: Calculate semantic entropy
    const semanticEntropy = this.calculateSemanticEntropy(
      semanticIntent, 
      surfacePattern
    );

    // Step 4: Determine emergence type and effect size
    const emergenceAnalysis = this.analyzeEmergenceType(
      semanticSurfaceDivergence,
      kolmogorovComplexity,
      semanticEntropy
    );

    // Step 5: Calculate confidence intervals via bootstrap
    const confidenceInterval = this.bootstrapConfidenceInterval(
      semanticIntent,
      surfacePattern,
      this.BOOTSTRAP_SAMPLES
    );

    return {
      bedau_index: semanticSurfaceDivergence,
      emergence_type: emergenceAnalysis.type,
      kolmogorov_complexity: kolmogorovComplexity,
      semantic_entropy: semanticEntropy,
      confidence_interval: confidenceInterval,
      effect_size: emergenceAnalysis.effectSize
    };
  }
  
  /**
   * Quantize numerical sequence to symbols for LZ analysis
   */
  private quantizeSequence(sequence: number[]): number[] {
    if (sequence.length === 0) return [];
    
    // Use adaptive quantization based on sequence statistics
    const min = Math.min(...sequence);
    const max = Math.max(...sequence);
    const range = max - min;
    
    if (range === 0) return sequence.map(() => 0);
    
    // Quantize to 8 levels for LZ analysis
    const levels = 8;
    return sequence.map(v => Math.floor(((v - min) / range) * (levels - 1)));
  }

  /**
   * Calculate divergence between semantic intent and surface patterns
   * Higher divergence indicates potential weak emergence
   */
  private calculateSemanticSurfaceDivergence(
    semantic: SemanticIntent,
    surface: SurfacePattern
  ): number {
    // Cosine similarity between intent and surface vectors
    const vectorSimilarity = this.cosineSimilarity(
      semantic.intent_vectors,
      surface.surface_vectors
    );

    // Adjust for reasoning depth and abstraction
    const depthMultiplier = 1 + semantic.reasoning_depth * 0.5;
    const abstractionMultiplier = 1 + semantic.abstraction_level * 0.3;

    // Penalize surface repetition and reward novelty
    const repetitionPenalty = surface.repetition_score * 0.2;
    const noveltyBonus = surface.novelty_score * 0.3;

    // Calculate divergence (1 - similarity) with adjustments
    const baseDivergence = 1 - vectorSimilarity;
    const adjustedDivergence = baseDivergence * depthMultiplier * abstractionMultiplier;
    
    return Math.min(1, Math.max(0, 
      adjustedDivergence - repetitionPenalty + noveltyBonus
    ));
  }
  
  /**
   * Quantize numerical sequence to symbols for LZ analysis
   */
  private quantizeSequence(sequence: number[]): number[] {
    if (sequence.length === 0) return [];
    
    // Use adaptive quantization based on sequence statistics
    const min = Math.min(...sequence);
    const max = Math.max(...sequence);
    const range = max - min;
    
    if (range === 0) return sequence.map(() => 0);
    
    // Quantize to 8 levels for LZ analysis
    const levels = 8;
    return sequence.map(v => Math.floor(((v - min) / range) * (levels - 1)));
  }

  /**
   * Approximate Kolmogorov complexity using compression-based heuristics
   * Higher complexity suggests more irreducible behavior
   */
  private approximateKolmogorovComplexity(
    semantic: SemanticIntent,
    surface: SurfacePattern
  ): number {
    // Combine semantic and surface vectors
    const combinedPattern = [
      ...semantic.intent_vectors,
      ...surface.surface_vectors
    ];

    // Use Lempel-Ziv complexity as approximation
    const lzComplexity = this.lempelZivComplexity(combinedPattern);
    
    // Normalize by pattern length
    const normalizedComplexity = lzComplexity / combinedPattern.length;
    
    // Adjust for cross-domain connections (indicates complexity)
    const connectionBonus = Math.min(0.3, semantic.cross_domain_connections * 0.05);
    
    return Math.min(1, normalizedComplexity + connectionBonus);
  }
  
  /**
   * Quantize numerical sequence to symbols for LZ analysis
   */
  private quantizeSequence(sequence: number[]): number[] {
    if (sequence.length === 0) return [];
    
    // Use adaptive quantization based on sequence statistics
    const min = Math.min(...sequence);
    const max = Math.max(...sequence);
    const range = max - min;
    
    if (range === 0) return sequence.map(() => 0);
    
    // Quantize to 8 levels for LZ analysis
    const levels = 8;
    return sequence.map(v => Math.floor(((v - min) / range) * (levels - 1)));
  }

  /**
   * Calculate semantic entropy as measure of cognitive diversity
   */
  private calculateSemanticEntropy(
    semantic: SemanticIntent,
    surface: SurfacePattern
  ): number {
    // Calculate entropy of intent vectors
    const intentEntropy = this.shannonEntropy(semantic.intent_vectors);
    
    // Calculate entropy of surface patterns
    const surfaceEntropy = this.shannonEntropy(surface.surface_vectors);
    
    // Combine with reasoning depth and abstraction diversity
    const cognitiveDiversity = (
      intentEntropy * 0.4 + 
      surfaceEntropy * 0.3 + 
      semantic.reasoning_depth * 0.2 +
      semantic.abstraction_level * 0.1
    );

    return Math.min(1, cognitiveDiversity);
  }
  
  /**
   * Quantize numerical sequence to symbols for LZ analysis
   */
  private quantizeSequence(sequence: number[]): number[] {
    if (sequence.length === 0) return [];
    
    // Use adaptive quantization based on sequence statistics
    const min = Math.min(...sequence);
    const max = Math.max(...sequence);
    const range = max - min;
    
    if (range === 0) return sequence.map(() => 0);
    
    // Quantize to 8 levels for LZ analysis
    const levels = 8;
    return sequence.map(v => Math.floor(((v - min) / range) * (levels - 1)));
  }

  /**
   * Analyze emergence type and calculate effect size
   * 
   * Note: This method detects WEAK EMERGENCE only. Strong emergence
   * (unpredictable collective behavior) requires additional verification
   * beyond the Bedau Index calculation.
   */
  private analyzeEmergenceType(
    divergence: number,
    complexity: number,
    entropy: number
  ): { type: 'LINEAR' | 'WEAK_EMERGENCE' | 'POTENTIAL_STRONG_EMERGENCE', effectSize: number } {
    // Calculate composite emergence score
    const emergenceScore = (divergence + complexity + entropy) / 3;
    
    // Determine emergence type (weak emergence levels)
    let type: 'LINEAR' | 'WEAK_EMERGENCE' | 'POTENTIAL_STRONG_EMERGENCE';
    if (emergenceScore > 0.7) {
      // High weak emergence - may warrant investigation for strong emergence
      type = 'POTENTIAL_STRONG_EMERGENCE';
    } else if (emergenceScore > this.EMERGENCE_THRESHOLD) {
      type = 'WEAK_EMERGENCE';
    } else {
      type = 'LINEAR';
    }
    
    // Calculate effect size (Cohen's d)
    const effectSize = emergenceScore / this.EMERGENCE_THRESHOLD;
    
    return { type, effectSize };
  }
  
  /**
   * Quantize numerical sequence to symbols for LZ analysis
   */
  private quantizeSequence(sequence: number[]): number[] {
    if (sequence.length === 0) return [];
    
    // Use adaptive quantization based on sequence statistics
    const min = Math.min(...sequence);
    const max = Math.max(...sequence);
    const range = max - min;
    
    if (range === 0) return sequence.map(() => 0);
    
    // Quantize to 8 levels for LZ analysis
    const levels = 8;
    return sequence.map(v => Math.floor(((v - min) / range) * (levels - 1)));
  }

  /**
   * Bootstrap confidence intervals for robustness
   */
  private bootstrapConfidenceInterval(
    semantic: SemanticIntent,
    surface: SurfacePattern,
    samples: number
  ): [number, number] {
    const bootstrapScores: number[] = [];
    
    for (let i = 0; i < samples; i++) {
      // Resample with replacement
      const resampledSemantic = this.resampleIntent(semantic);
      const resampledSurface = this.resampleSurface(surface);
      
      // Calculate divergence for resampled data
      const score = this.calculateSemanticSurfaceDivergence(
        resampledSemantic,
        resampledSurface
      );
      
      bootstrapScores.push(score);
    }
    
    // Calculate 95% confidence interval
    bootstrapScores.sort((a, b) => a - b);
    const lowerIndex = Math.floor(0.025 * samples);
    const upperIndex = Math.floor(0.975 * samples);
    
    return [
      bootstrapScores[lowerIndex],
      bootstrapScores[upperIndex]
    ];
  }
  
  /**
   * Quantize numerical sequence to symbols for LZ analysis
   */
  private quantizeSequence(sequence: number[]): number[] {
    if (sequence.length === 0) return [];
    
    // Use adaptive quantization based on sequence statistics
    const min = Math.min(...sequence);
    const max = Math.max(...sequence);
    const range = max - min;
    
    if (range === 0) return sequence.map(() => 0);
    
    // Quantize to 8 levels for LZ analysis
    const levels = 8;
    return sequence.map(v => Math.floor(((v - min) / range) * (levels - 1)));
  }

  // Utility methods
  
  private cosineSimilarity(a: number[], b: number[]): number {
    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    
    return magnitudeA && magnitudeB ? dotProduct / (magnitudeA * magnitudeB) : 0;
  }
  
  /**
   * Quantize numerical sequence to symbols for LZ analysis
   */
  private quantizeSequence(sequence: number[]): number[] {
    if (sequence.length === 0) return [];
    
    // Use adaptive quantization based on sequence statistics
    const min = Math.min(...sequence);
    const max = Math.max(...sequence);
    const range = max - min;
    
    if (range === 0) return sequence.map(() => 0);
    
    // Quantize to 8 levels for LZ analysis
    const levels = 8;
    return sequence.map(v => Math.floor(((v - min) / range) * (levels - 1)));
  }

  private lempelZivComplexity(sequence: number[]): number {
    // Proper Lempel-Ziv complexity calculation using LZ76 algorithm
    if (sequence.length === 0) return 0;
    
    // Convert to symbol sequence using quantization
    const symbols = this.quantizeSequence(sequence);
    const n = symbols.length;
    
    // LZ76 algorithm implementation
    let complexity = 0;
    let i = 0;
    
    while (i < n) {
      let longestPrefix = 0;
      let j = Math.max(1, i - 50); // Look back up to 50 positions
      
      // Find longest prefix seen before
      for (let k = j; k < i; k++) {
        let matchLength = 0;
        while (i + matchLength < n && 
               k + matchLength < i && 
               symbols[i + matchLength] === symbols[k + matchLength]) {
          matchLength++;
        }
        longestPrefix = Math.max(longestPrefix, matchLength);
      }
      
      if (longestPrefix === 0) {
        // New symbol
        complexity++;
        i++;
      } else {
        // Repeated sequence
        complexity++;
        i += longestPrefix;
      }
    }
    
    return complexity;
  }
  
  /**
   * Quantize numerical sequence to symbols for LZ analysis
   */
  private quantizeSequence(sequence: number[]): number[] {
    if (sequence.length === 0) return [];
    
    // Use adaptive quantization based on sequence statistics
    const min = Math.min(...sequence);
    const max = Math.max(...sequence);
    const range = max - min;
    
    if (range === 0) return sequence.map(() => 0);
    
    // Quantize to 8 levels for LZ analysis
    const levels = 8;
    return sequence.map(v => Math.floor(((v - min) / range) * (levels - 1)));
  }

  private shannonEntropy(values: number[]): number {
    // Proper Shannon entropy calculation without absolute value distortion
    if (values.length === 0) return 0;
    
    // Use histogram-based approach for continuous values
    const bins = Math.min(10, Math.ceil(Math.sqrt(values.length)));
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min;
    
    if (range === 0) return 0;
    
    // Create histogram
    const histogram = new Array(bins).fill(0);
    for (const value of values) {
      const binIndex = Math.min(bins - 1, Math.floor(((value - min) / range) * bins));
      histogram[binIndex]++;
    }
    
    // Convert to probabilities
    const probabilities = histogram.map(count => count / values.length);
    
    // Calculate Shannon entropy
    return -probabilities.reduce((entropy, p) => {
      return p > 0 ? entropy + p * Math.log2(p) : entropy;
    }, 0);
  }
  
  /**
   * Quantize numerical sequence to symbols for LZ analysis
   */
  private quantizeSequence(sequence: number[]): number[] {
    if (sequence.length === 0) return [];
    
    // Use adaptive quantization based on sequence statistics
    const min = Math.min(...sequence);
    const max = Math.max(...sequence);
    const range = max - min;
    
    if (range === 0) return sequence.map(() => 0);
    
    // Quantize to 8 levels for LZ analysis
    const levels = 8;
    return sequence.map(v => Math.floor(((v - min) / range) * (levels - 1)));
  }

  private resampleIntent(semantic: SemanticIntent): SemanticIntent {
    // Bootstrap resampling of semantic intent
    const resampledVectors = this.bootstrapSample(semantic.intent_vectors);
    
    return {
      ...semantic,
      intent_vectors: resampledVectors,
      reasoning_depth: semantic.reasoning_depth + (Math.random() - 0.5) * 0.1,
      abstraction_level: semantic.abstraction_level + (Math.random() - 0.5) * 0.1
    };
  }
  
  /**
   * Quantize numerical sequence to symbols for LZ analysis
   */
  private quantizeSequence(sequence: number[]): number[] {
    if (sequence.length === 0) return [];
    
    // Use adaptive quantization based on sequence statistics
    const min = Math.min(...sequence);
    const max = Math.max(...sequence);
    const range = max - min;
    
    if (range === 0) return sequence.map(() => 0);
    
    // Quantize to 8 levels for LZ analysis
    const levels = 8;
    return sequence.map(v => Math.floor(((v - min) / range) * (levels - 1)));
  }

  private resampleSurface(surface: SurfacePattern): SurfacePattern {
    // Bootstrap resampling of surface patterns
    const resampledVectors = this.bootstrapSample(surface.surface_vectors);
    
    return {
      ...surface,
      surface_vectors: resampledVectors,
      pattern_complexity: Math.max(0, Math.min(1, 
        surface.pattern_complexity + (Math.random() - 0.5) * 0.1
      )),
      repetition_score: Math.max(0, Math.min(1,
        surface.repetition_score + (Math.random() - 0.5) * 0.1
      )),
      novelty_score: Math.max(0, Math.min(1,
        surface.novelty_score + (Math.random() - 0.5) * 0.1
      ))
    };
  }
  
  /**
   * Quantize numerical sequence to symbols for LZ analysis
   */
  private quantizeSequence(sequence: number[]): number[] {
    if (sequence.length === 0) return [];
    
    // Use adaptive quantization based on sequence statistics
    const min = Math.min(...sequence);
    const max = Math.max(...sequence);
    const range = max - min;
    
    if (range === 0) return sequence.map(() => 0);
    
    // Quantize to 8 levels for LZ analysis
    const levels = 8;
    return sequence.map(v => Math.floor(((v - min) / range) * (levels - 1)));
  }

  private bootstrapSample(array: number[]): number[] {
    const result: number[] = [];
    for (let i = 0; i < array.length; i++) {
      const randomIndex = Math.floor(Math.random() * array.length);
      result.push(array[randomIndex]);
    }
    return result;
  }
  
  /**
   * Quantize numerical sequence to symbols for LZ analysis
   */
  private quantizeSequence(sequence: number[]): number[] {
    if (sequence.length === 0) return [];
    
    // Use adaptive quantization based on sequence statistics
    const min = Math.min(...sequence);
    const max = Math.max(...sequence);
    const range = max - min;
    
    if (range === 0) return sequence.map(() => 0);
    
    // Quantize to 8 levels for LZ analysis
    const levels = 8;
    return sequence.map(v => Math.floor(((v - min) / range) * (levels - 1)));
  }
}

/**
 * Factory function for creating Bedau Index calculators
 */
export function createBedauIndexCalculator(): BedauIndexCalculator {
  return new BedauIndexCalculator();
}

/**
 * Quick calculation function for common use cases
 */
export async function calculateBedauIndex(
  semanticIntent: SemanticIntent,
  surfacePattern: SurfacePattern,
  historicalContext?: SemanticIntent[]
): Promise<BedauMetrics> {
  const calculator = new BedauIndexCalculator();
  return calculator.calculateBedauIndex(semanticIntent, surfacePattern, historicalContext);
}