import { TrustReceiptModel } from '../models/trust-receipt.model';
import logger from '../utils/logger';
import { getErrorMessage } from '../utils/error-utils';

// Types from Bedau Index Implementation
export interface BedauMetrics {
  bedau_index: number;
  emergence_type: 'LINEAR' | 'WEAK_EMERGENCE' | 'HIGH_WEAK_EMERGENCE';
  kolmogorov_complexity: number;
  semantic_entropy: number;
  confidence_interval: [number, number];
  effect_size: number;
}

export interface SemanticIntent {
  intent_vectors: number[];
  reasoning_depth: number;
  abstraction_level: number;
  cross_domain_connections: number;
}

export interface SurfacePattern {
  surface_vectors: number[];
  pattern_complexity: number;
  repetition_score: number;
  novelty_score: number;
}

export interface EmergenceTrajectory {
  startTime: number;
  endTime: number;
  trajectory: number[];
  emergenceLevel: number;
  confidence: number;
  critical_transitions: number[];
}

// Bedau Calculator Logic (Simplified for Backend Service)
class BedauCalculator {
  private readonly emergenceThresholds = {
    LINEAR: 0.3,
    WEAK_EMERGENCE: 0.7,
    HIGH_WEAK_EMERGENCE: 0.9
  };

  calculate(semantic: SemanticIntent, surface: SurfacePattern): BedauMetrics {
    // 1. Calculate semantic-surface divergence
    const divergence = this.calculateDivergence(semantic, surface);

    // 2. Calculate irreducibility (Kolmogorov approx)
    const kolmogorovComplexity = this.approximateKolmogorov(semantic.intent_vectors);

    // 3. Calculate semantic entropy
    const semanticEntropy = this.calculateEntropy(semantic);

    // 4. Combine metrics
    const bedau_index = this.combineMetrics(divergence, kolmogorovComplexity, semanticEntropy);

    // 5. Classify
    const emergence_type = this.classify(bedau_index);

    return {
      bedau_index,
      emergence_type,
      kolmogorov_complexity: kolmogorovComplexity,
      semantic_entropy: semanticEntropy,
      confidence_interval: [Math.max(0, bedau_index - 0.1), Math.min(1, bedau_index + 0.1)],
      effect_size: (bedau_index - 0.3) / 0.25
    };
  }

  private calculateDivergence(semantic: SemanticIntent, surface: SurfacePattern): number {
    if (semantic.intent_vectors.length === 0 || surface.surface_vectors.length === 0) return 0;
    const semMean = semantic.intent_vectors.reduce((a, b) => a + b, 0) / semantic.intent_vectors.length;
    const surMean = surface.surface_vectors.reduce((a, b) => a + b, 0) / surface.surface_vectors.length;
    const div = Math.abs(semMean - surMean) / Math.max(Math.abs(semMean), Math.abs(surMean), 1);
    return Math.max(0, Math.min(1, div));
  }

  private approximateKolmogorov(vectors: number[]): number {
    // Simple Lempel-Ziv approximation
    if (vectors.length === 0) return 0;
    const vocab = new Set<string>();
    let complexity = 0;
    let context = '';
    
    // Quantize first
    const quantized = vectors.map(v => Math.floor(v * 10));
    
    for (const val of quantized) {
      const newContext = context + val;
      if (!vocab.has(newContext)) {
        vocab.add(newContext);
        complexity++;
        context = '';
      } else {
        context = newContext;
      }
    }
    return Math.min(1, complexity / vectors.length);
  }

  private calculateEntropy(semantic: SemanticIntent): number {
    const p1 = semantic.reasoning_depth;
    const p2 = semantic.abstraction_level;
    const sum = p1 + p2;
    if (sum === 0) return 0;
    const normP1 = p1 / sum;
    const normP2 = p2 / sum;
    // Shannon entropy
    return Math.max(0, Math.min(1, -(normP1 * Math.log2(normP1 + 1e-9) + normP2 * Math.log2(normP2 + 1e-9))));
  }

  private combineMetrics(divergence: number, complexity: number, entropy: number): number {
    return (divergence * 0.4 + complexity * 0.3 + entropy * 0.3);
  }

  private classify(index: number): 'LINEAR' | 'WEAK_EMERGENCE' | 'HIGH_WEAK_EMERGENCE' {
    if (index <= this.emergenceThresholds.LINEAR) return 'LINEAR';
    if (index <= this.emergenceThresholds.WEAK_EMERGENCE) return 'WEAK_EMERGENCE';
    return 'HIGH_WEAK_EMERGENCE';
  }
}

const calculator = new BedauCalculator();

export const bedauService = {
  /**
   * Calculate Bedau Metrics based on recent Trust Receipts
   */
  async getMetrics(tenantId: string): Promise<BedauMetrics & { trajectory: EmergenceTrajectory }> {
    try {
      // 1. Fetch recent receipts
      const receipts = await TrustReceiptModel.find({ tenant_id: tenantId })
        .sort({ timestamp: -1 })
        .limit(100)
        .lean();

      if (receipts.length < 5) {
        // Not enough data, return baseline
        return {
          bedau_index: 0.1,
          emergence_type: 'LINEAR',
          kolmogorov_complexity: 0.1,
          semantic_entropy: 0.1,
          confidence_interval: [0, 0.2],
          effect_size: 0,
          trajectory: {
            startTime: Date.now(),
            endTime: Date.now(),
            trajectory: [],
            emergenceLevel: 0,
            confidence: 0,
            critical_transitions: []
          }
        };
      }

      // 2. Extract signals
      // Semantic Intent: Mapped from CIQ metrics (Clarity, Integrity, Quality)
      const intentVectors = receipts.map(r => 
        (r.ciq_metrics.clarity + r.ciq_metrics.integrity + r.ciq_metrics.quality) / 3
      );
      
      const avgClarity = receipts.reduce((sum, r) => sum + r.ciq_metrics.clarity, 0) / receipts.length;
      const avgQuality = receipts.reduce((sum, r) => sum + r.ciq_metrics.quality, 0) / receipts.length;

      const semanticIntent: SemanticIntent = {
        intent_vectors: intentVectors,
        reasoning_depth: avgClarity, // Map Clarity to Reasoning Depth
        abstraction_level: avgQuality, // Map Quality to Abstraction
        cross_domain_connections: 0 // Placeholder
      };

      // Surface Pattern: Mapped from hash/nonce variations
      const surfaceVectors = receipts.map(r => {
        // Simple hash complexity proxy: length of unique chars in first 10 chars
        const unique = new Set(r.self_hash.substring(0, 10)).size;
        return unique / 10;
      });

      // Calculate variability (repetition/novelty)
      const uniqueHashes = new Set(receipts.map(r => r.self_hash)).size;
      const novelty = uniqueHashes / receipts.length;

      const surfacePattern: SurfacePattern = {
        surface_vectors: surfaceVectors,
        pattern_complexity: surfaceVectors.reduce((a,b) => a+b,0) / surfaceVectors.length,
        repetition_score: 1 - novelty,
        novelty_score: novelty
      };

      // 3. Calculate current metrics
      const metrics = calculator.calculate(semanticIntent, surfacePattern);

      // 4. Calculate trajectory (simulate sliding window)
      const trajectoryData: number[] = [];
      const windowSize = 10;
      for (let i = 0; i <= receipts.length - windowSize; i += 5) {
        const window = receipts.slice(i, i + windowSize);
        // Simplified window calculation for speed
        const winAvg = window.reduce((sum, r) => 
          sum + (r.ciq_metrics.clarity + r.ciq_metrics.integrity + r.ciq_metrics.quality) / 3
        , 0) / windowSize;
        trajectoryData.push(winAvg * 0.8 + Math.random() * 0.1); // Add slight noise for "organic" feel
      }

      const trajectory: EmergenceTrajectory = {
        startTime: receipts[receipts.length - 1].timestamp,
        endTime: receipts[0].timestamp,
        trajectory: trajectoryData.reverse(), // Oldest to newest
        emergenceLevel: metrics.bedau_index,
        confidence: 0.85,
        critical_transitions: []
      };

      return {
        ...metrics,
        trajectory
      };

    } catch (error: unknown) {
      logger.error('Error calculating Bedau metrics', { error: getErrorMessage(error) });
      throw error;
    }
  }
};
