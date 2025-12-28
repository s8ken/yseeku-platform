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

export interface BedauIndexCalculator {
  calculateBedauIndex(
    semanticIntent: SemanticIntent,
    surfacePattern: SurfacePattern
  ): BedauMetrics;
  
  analyzeTemporalEvolution(
    timeSeriesData: number[][]
  ): {
    emergence_trajectory: number[];
    critical_transitions: number[];
  };
  
  bootstrapConfidenceInterval(
    data: number[],
    nBootstrap: number
  ): [number, number];
}

/**
 * Core Bedau Index Calculator Implementation
 */
class BedauIndexCalculatorImpl implements BedauIndexCalculator {
  private readonly emergenceThresholds = {
    LINEAR: 0.3,
    WEAK_EMERGENCE: 0.7,
    STRONG_EMERGENCE: 0.9
  };

  /**
   * Calculate the Bedau Index for weak emergence detection
   */
  calculateBedauIndex(
    semanticIntent: SemanticIntent,
    surfacePattern: SurfacePattern
  ): BedauMetrics {
    // 1. Calculate semantic-surface divergence
    const semanticSurfaceDivergence = this.calculateSemanticSurfaceDivergence(
      semanticIntent,
      surfacePattern
    );

    // 2. Calculate irreducibility using Kolmogorov complexity approximation
    const kolmogorovComplexity = this.approximateKolmogorovComplexity(
      semanticIntent.intent_vectors
    );

    // 3. Calculate semantic entropy
    const semanticEntropy = this.calculateSemanticEntropy(semanticIntent);

    // 4. Combine metrics into Bedau Index
    const bedau_index = this.combineMetrics(
      semanticSurfaceDivergence,
      kolmogorovComplexity,
      semanticEntropy
    );

    // 5. Determine emergence type
    const emergence_type = this.classifyEmergenceType(bedau_index);

    // 6. Calculate confidence interval
    const confidence_interval = this.calculateConfidenceInterval([
      semanticSurfaceDivergence,
      kolmogorovComplexity,
      semanticEntropy
    ]);

    // 7. Calculate effect size
    const effect_size = this.calculateEffectSize(bedau_index);

    return {
      bedau_index,
      emergence_type,
      kolmogorov_complexity: kolmogorovComplexity,
      semantic_entropy: semanticEntropy,
      confidence_interval,
      effect_size
    };
  }

  /**
   * Analyze temporal evolution of emergence
   */
  analyzeTemporalEvolution(timeSeriesData: number[][]): {
    emergence_trajectory: number[];
    critical_transitions: number[];
  } {
    const emergence_trajectory: number[] = [];
    const critical_transitions: number[] = [];

    for (let i = 0; i < timeSeriesData.length; i++) {
      const window = timeSeriesData[i];
      const semanticIntent = this.extractSemanticIntent(window);
      const surfacePattern = this.extractSurfacePattern(window);
      
      const metrics = this.calculateBedauIndex(semanticIntent, surfacePattern);
      emergence_trajectory.push(metrics.bedau_index);

      // Detect critical transitions
      if (i > 0) {
        const change = Math.abs(emergence_trajectory[i] - emergence_trajectory[i - 1]);
        if (change > 0.2) {
          critical_transitions.push(i);
        }
      }
    }

    return { emergence_trajectory, critical_transitions };
  }

  /**
   * Bootstrap confidence interval calculation
   */
  bootstrapConfidenceInterval(data: number[], nBootstrap: number = 1000): [number, number] {
    const bootstrapMeans: number[] = [];

    for (let i = 0; i < nBootstrap; i++) {
      const bootstrapSample = this.resample(data);
      const mean = bootstrapSample.reduce((sum, val) => sum + val, 0) / bootstrapSample.length;
      bootstrapMeans.push(mean);
    }

    bootstrapMeans.sort((a, b) => a - b);
    const lowerIndex = Math.floor(0.025 * nBootstrap);
    const upperIndex = Math.floor(0.975 * nBootstrap);

    return [bootstrapMeans[lowerIndex], bootstrapMeans[upperIndex]];
  }

  // Private helper methods

  private calculateSemanticSurfaceDivergence(
    semantic: SemanticIntent,
    surface: SurfacePattern
  ): number {
    // Calculate cosine similarity between semantic and surface vectors
    const semanticMean = semantic.intent_vectors.reduce((sum, val) => sum + val, 0) / semantic.intent_vectors.length;
    const surfaceMean = surface.surface_vectors.reduce((sum, val) => sum + val, 0) / surface.surface_vectors.length;
    
    // Divergence is inversely related to similarity
    const similarity = Math.abs(semanticMean - surfaceMean) / Math.max(Math.abs(semanticMean), Math.abs(surfaceMean), 1);
    return 1 - similarity;
  }

  private approximateKolmogorovComplexity(vectors: number[]): number {
    // Use Lempel-Ziv complexity as approximation
    const quantized = this.quantizeSequence(vectors);
    return this.lempelZivComplexity(quantized);
  }

  private calculateSemanticEntropy(semantic: SemanticIntent): number {
    // Calculate entropy based on reasoning depth and abstraction level
    const entropy = -(
      semantic.reasoning_depth * Math.log(semantic.reasoning_depth + 1e-10) +
      semantic.abstraction_level * Math.log(semantic.abstraction_level + 1e-10)
    );
    return Math.min(1, entropy / Math.log(2));
  }

  private combineMetrics(
    divergence: number,
    complexity: number,
    entropy: number
  ): number {
    // Weighted combination of metrics
    const weights = { divergence: 0.4, complexity: 0.3, entropy: 0.3 };
    return (
      divergence * weights.divergence +
      complexity * weights.complexity +
      entropy * weights.entropy
    );
  }

  private classifyEmergenceType(bedau_index: number): 'LINEAR' | 'WEAK_EMERGENCE' | 'POTENTIAL_STRONG_EMERGENCE' {
    if (bedau_index <= this.emergenceThresholds.LINEAR) {
      return 'LINEAR';
    } else if (bedau_index <= this.emergenceThresholds.WEAK_EMERGENCE) {
      return 'WEAK_EMERGENCE';
    } else {
      return 'POTENTIAL_STRONG_EMERGENCE';
    }
  }

  private calculateConfidenceInterval(values: number[]): [number, number] {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const stdError = Math.sqrt(variance / values.length);
    
    // 95% confidence interval
    const margin = 1.96 * stdError;
    return [mean - margin, mean + margin];
  }

  private calculateEffectSize(bedau_index: number): number {
    // Cohen's d relative to random baseline
    const baseline = 0.3; // Expected random baseline
    const pooledStd = 0.25; // Assumed pooled standard deviation
    return (bedau_index - baseline) / pooledStd;
  }

  private quantizeSequence(sequence: number[]): number[] {
    if (sequence.length === 0) return [];
    
    // Use adaptive quantization based on sequence statistics
    const min = Math.min(...sequence);
    const max = Math.max(...sequence);
    const range = max - min;
    
    if (range === 0) return sequence.map(() => 0);
    
    // Quantize to 8 levels
    const levels = 8;
    return sequence.map(val => Math.floor(((val - min) / range) * levels));
  }

  private lempelZivComplexity(sequence: number[]): number {
    if (sequence.length === 0) return 0;
    
    const vocabulary = new Set<string>();
    let currentContext = '';
    let complexity = 0;
    
    for (const symbol of sequence) {
      const newContext = currentContext + symbol.toString();
      
      if (!vocabulary.has(newContext)) {
        vocabulary.add(newContext);
        complexity++;
        currentContext = '';
      } else {
        currentContext = newContext;
      }
    }
    
    return complexity / sequence.length;
  }

  private resample(data: number[]): number[] {
    const resampled: number[] = [];
    for (let i = 0; i < data.length; i++) {
      const randomIndex = Math.floor(Math.random() * data.length);
      resampled.push(data[randomIndex]);
    }
    return resampled;
  }

  private extractSemanticIntent(window: number[]): SemanticIntent {
    // Mock extraction - in production this would use NLP
    return {
      intent_vectors: window,
      reasoning_depth: Math.random(),
      abstraction_level: Math.random(),
      cross_domain_connections: Math.floor(Math.random() * 5)
    };
  }

  private extractSurfacePattern(window: number[]): SurfacePattern {
    // Mock extraction - in production this would analyze surface patterns
    return {
      surface_vectors: window,
      pattern_complexity: Math.random(),
      repetition_score: Math.random(),
      novelty_score: Math.random()
    };
  }
}

/**
 * Factory function to create Bedau Index Calculator
 */
export function createBedauIndexCalculator(): BedauIndexCalculator {
  return new BedauIndexCalculatorImpl();
}

/**
 * Convenience function for direct calculation
 */
export async function calculateBedauIndex(
  semanticIntent: SemanticIntent,
  surfacePattern: SurfacePattern
): Promise<BedauMetrics> {
  const calculator = createBedauIndexCalculator();
  return calculator.calculateBedauIndex(semanticIntent, surfacePattern);
}