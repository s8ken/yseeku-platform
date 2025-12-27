/**
 * Mutual Information Analysis for Dimension Independence Testing
 * 
 * Implements Kraskov-Stögbauer-Grassberger (KSG) estimator for mutual information
 * Detects collinearity between resonance dimensions and enables adaptive weighting
 */

export interface DimensionData {
  [dimension: string]: number[];
}

export interface MutualInformationResult {
  mutualInformation: number; // MI in bits
  normalizedMI: number; // Normalized to [0,1]
  pValue: number; // Statistical significance
  sampleSize: number;
  method: 'ksg' | 'histogram';
}

export interface DimensionIndependenceAnalysis {
  miMatrix: Record<string, MutualInformationResult>;
  highCollinearityPairs: Array<{
    pair: string;
    mi: number;
    normalizedMI: number;
    recommendation: 'combine' | 'reweight' | 'monitor';
  }>;
  recommendations: string[];
  overallIndependence: number; // 0-1, higher = more independent
}

export interface AdaptiveWeights {
  [dimension: string]: {
    original: number;
    adjusted: number;
    adjustment_factor: number;
    reason: string;
  };
}

/**
 * Kraskov-Stögbauer-Grassberger Mutual Information Estimator
 * 
 * Non-parametric estimator using k-nearest neighbors
 * More accurate than histogram-based methods for continuous data
 */
export class KSGMutualInformationEstimator {
  private k: number; // Number of nearest neighbors
  private maxSamples: number; // Maximum samples for memory efficiency
  
  constructor(k: number = 3, maxSamples: number = 10000) {
    this.k = k;
    this.maxSamples = maxSamples;
  }

  /**
   * Estimate mutual information between two continuous variables
   * Using the KSG algorithm (2004)
   */
  async estimateMutualInformation(
    x: number[],
    y: number[]
  ): Promise<MutualInformationResult> {
    
    if (x.length !== y.length) {
      throw new Error('Input arrays must have the same length');
    }

    if (x.length < this.k + 1) {
      throw new Error(`Insufficient samples: need at least ${this.k + 1}, got ${x.length}`);
    }

    // Subsample if too many samples
    let indices = Array.from({ length: x.length }, (_, i) => i);
    if (x.length > this.maxSamples) {
      indices = this.randomSample(indices, this.maxSamples);
    }

    const xSub = indices.map(i => x[i]);
    const ySub = indices.map(i => y[i]);
    const n = xSub.length;

    // Calculate marginal and joint entropies
    const hx = this.calculateEntropyKSG(xSub);
    const hy = this.calculateEntropyKSG(ySub);
    const hxy = this.calculateJointEntropyKSG(xSub, ySub);

    const mi = hx + hy - hxy;
    
    // Normalize MI to [0,1] range
    const normalizedMI = this.normalizeMutualInformation(mi, hx, hy);
    
    // Calculate p-value using permutation test
    const pValue = await this.calculatePValue(xSub, ySub, mi);

    return {
      mutualInformation: mi,
      normalizedMI,
      pValue,
      sampleSize: n,
      method: 'ksg'
    };
  }

  /**
   * Calculate entropy using KSG estimator
   */
  private calculateEntropyKSG(data: number[]): number {
    const n = data.length;
    const distances = this.calculateDistancesToKthNeighbor(data);
    
    let sumLogDistances = 0;
    for (const d of distances) {
      sumLogDistances += Math.log(d + 1e-10);
    }

    const entropy = Math.log(n) + Math.log(this.k) - (1 / n) * sumLogDistances;
    return entropy / Math.log(2);
  }

  /**
   * Calculate joint entropy using KSG estimator
   */
  private calculateJointEntropyKSG(x: number[], y: number[]): number {
    const n = x.length;
    const points = x.map((xi, i) => [xi, y[i]]);
    const distances = this.calculateDistancesToKthNeighbor2D(points);
    
    let sumLogDistances = 0;
    for (const d of distances) {
      sumLogDistances += Math.log(d + 1e-10);
    }

    const jointEntropy = Math.log(n) + Math.log(this.k) - (1 / n) * sumLogDistances;
    return jointEntropy / Math.log(2);
  }

  /**
   * Calculate distances to k-th nearest neighbor for 1D data
   */
  private calculateDistancesToKthNeighbor(data: number[]): number[] {
    const n = data.length;
    const distances: number[] = [];

    for (let i = 0; i < n; i++) {
      const pointDistances = data.map((xj, j) => 
        i === j ? Infinity : Math.abs(data[i] - xj)
      );
      pointDistances.sort((a, b) => a - b);
      distances.push(pointDistances[this.k - 1]);
    }

    return distances;
  }

  /**
   * Calculate distances to k-th nearest neighbor for 2D data
   */
  private calculateDistancesToKthNeighbor2D(points: number[][]): number[] {
    const n = points.length;
    const distances: number[] = [];

    for (let i = 0; i < n; i++) {
      const pointDistances = points.map((point, j) => {
        if (i === j) return Infinity;
        const dx = points[i][0] - point[0];
        const dy = points[i][1] - point[1];
        return Math.sqrt(dx * dx + dy * dy);
      });
      pointDistances.sort((a, b) => a - b);
      distances.push(pointDistances[this.k - 1]);
    }

    return distances;
  }

  /**
   * Normalize mutual information to [0,1] range
   */
  private normalizeMutualInformation(mi: number, hx: number, hy: number): number {
    const maxEntropy = Math.max(hx, hy);
    return maxEntropy > 0 ? mi / maxEntropy : 0;
  }

  /**
   * Calculate p-value using permutation test
   */
  private async calculatePValue(
    x: number[], 
    y: number[], 
    observedMI: number,
    nPermutations: number = 100
  ): Promise<number> {
    
    let count = 0;
    
    for (let i = 0; i < nPermutations; i++) {
      const yPermuted = this.shuffle([...y]);
      const permutedMI = this.calculateMutualInformationFast(x, yPermuted);
      
      if (permutedMI >= observedMI) {
        count++;
      }
    }

    return (count + 1) / (nPermutations + 1);
  }

  /**
   * Fast MI calculation for permutation testing
   */
  private calculateMutualInformationFast(x: number[], y: number[]): number {
    const bins = 10;
    const xBins = this.discretize(x, bins);
    const yBins = this.discretize(y, bins);
    const jointBins = this.createJointBins(xBins, yBins, bins);
    
    const n = x.length;
    const hx = this.calculateEntropyFromBins(xBins, n);
    const hy = this.calculateEntropyFromBins(yBins, n);
    const hxy = this.calculateEntropyFromBins(jointBins, n);
    
    return (hx + hy - hxy) / Math.log(2);
  }

  private discretize(data: number[], bins: number): number[] {
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min;
    
    if (range === 0) return data.map(() => 0);
    
    return data.map(x => Math.min(bins - 1, Math.floor((x - min) / range * bins)));
  }

  private createJointBins(xBins: number[], yBins: number[], bins: number): number[] {
    return xBins.map((x, i) => x * bins + yBins[i]);
  }

  private calculateEntropyFromBins(bins: number[], total: number): number {
    const counts = new Map<number, number>();
    for (const bin of bins) {
      counts.set(bin, (counts.get(bin) || 0) + 1);
    }
    
    let entropy = 0;
    for (const count of counts.values()) {
      if (count > 0) {
        const probability = count / total;
        entropy -= probability * Math.log(probability);
      }
    }
    
    return entropy;
  }

  private shuffle<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  private randomSample<T>(array: T[], size: number): T[] {
    const shuffled = this.shuffle(array);
    return shuffled.slice(0, size);
  }
}

/**
 * Dimension Independence Analyzer
 */
export class DimensionIndependenceAnalyzer {
  private miEstimator: KSGMutualInformationEstimator;
  private highCollinearityThreshold: number;
  private moderateCollinearityThreshold: number;

  constructor(highThreshold: number = 0.6, moderateThreshold: number = 0.4) {
    this.miEstimator = new KSGMutualInformationEstimator();
    this.highCollinearityThreshold = highThreshold;
    this.moderateCollinearityThreshold = moderateThreshold;
  }

  /**
   * Analyze independence between all pairs of dimensions
   */
  async analyzeDimensionIndependence(
    dimensionData: DimensionData,
    dimensions?: string[]
  ): Promise<DimensionIndependenceAnalysis> {
    
    const dims = dimensions || Object.keys(dimensionData);
    const pairs = this.getDimensionPairs(dims);
    
    const miMatrix: Record<string, MutualInformationResult> = {};
    const highCollinearityPairs: Array<{
      pair: string;
      mi: number;
      normalizedMI: number;
      recommendation: 'combine' | 'reweight' | 'monitor';
    }> = [];

    for (const [dim1, dim2] of pairs) {
      const result = await this.miEstimator.estimateMutualInformation(
        dimensionData[dim1],
        dimensionData[dim2]
      );
      
      const pairKey = `${dim1}-${dim2}`;
      miMatrix[pairKey] = result;

      if (result.normalizedMI > this.highCollinearityThreshold) {
        highCollinearityPairs.push({
          pair: pairKey,
          mi: result.mutualInformation,
          normalizedMI: result.normalizedMI,
          recommendation: this.getRecommendation(result.normalizedMI)
        });
      }
    }

    const recommendations = this.generateRecommendations(highCollinearityPairs, miMatrix);
    const overallIndependence = this.calculateOverallIndependence(miMatrix);

    return {
      miMatrix,
      highCollinearityPairs,
      recommendations,
      overallIndependence
    };
  }

  /**
   * Calculate adaptive weights based on dimension independence
   */
  calculateAdaptiveWeights(
    baseWeights: Record<string, number>,
    independenceAnalysis: DimensionIndependenceAnalysis
  ): AdaptiveWeights {
    
    const adaptiveWeights: AdaptiveWeights = {};
    
    Object.keys(baseWeights).forEach(dimension => {
      adaptiveWeights[dimension] = {
        original: baseWeights[dimension],
        adjusted: baseWeights[dimension],
        adjustment_factor: 1.0,
        reason: 'No adjustment needed'
      };
    });

    for (const collinearity of independenceAnalysis.highCollinearityPairs) {
      const [dim1, dim2] = collinearity.pair.split('-');
      
      if (adaptiveWeights[dim1] && adaptiveWeights[dim2]) {
        const penalty = Math.min(0.3, collinearity.normalizedMI * 0.2);
        
        adaptiveWeights[dim1].adjusted *= (1 - penalty);
        adaptiveWeights[dim1].adjustment_factor *= (1 - penalty);
        adaptiveWeights[dim1].reason = `High collinearity with ${dim2} (MI: ${collinearity.normalizedMI.toFixed(3)})`;
        
        adaptiveWeights[dim2].adjusted *= (1 - penalty);
        adaptiveWeights[dim2].adjustment_factor *= (1 - penalty);
        adaptiveWeights[dim2].reason = `High collinearity with ${dim1} (MI: ${collinearity.normalizedMI.toFixed(3)})`;
      }
    }

    // Renormalize to sum to 1
    const totalWeight = Object.values(adaptiveWeights).reduce((sum, w) => sum + w.adjusted, 0);
    if (totalWeight > 0) {
      Object.keys(adaptiveWeights).forEach(key => {
        adaptiveWeights[key].adjusted /= totalWeight;
      });
    }

    return adaptiveWeights;
  }

  private getDimensionPairs(dimensions: string[]): [string, string][] {
    const pairs: [string, string][] = [];
    for (let i = 0; i < dimensions.length; i++) {
      for (let j = i + 1; j < dimensions.length; j++) {
        pairs.push([dimensions[i], dimensions[j]]);
      }
    }
    return pairs;
  }

  private getRecommendation(mi: number): 'combine' | 'reweight' | 'monitor' {
    if (mi > 0.8) return 'combine';
    if (mi > 0.6) return 'reweight';
    return 'monitor';
  }

  private generateRecommendations(
    highCollinearityPairs: Array<{
      pair: string;
      mi: number;
      normalizedMI: number;
      recommendation: 'combine' | 'reweight' | 'monitor';
    }>,
    miMatrix: Record<string, MutualInformationResult>
  ): string[] {
    const recommendations: string[] = [];

    for (const pair of highCollinearityPairs) {
      const [dim1, dim2] = pair.pair.split('-');
      
      switch (pair.recommendation) {
        case 'combine':
          recommendations.push(`Consider combining ${dim1} and ${dim2} due to extremely high collinearity (${pair.normalizedMI.toFixed(3)})`);
          break;
        case 'reweight':
          recommendations.push(`Adjust weights for ${dim1} and ${dim2} due to significant collinearity (${pair.normalizedMI.toFixed(3)})`);
          break;
        case 'monitor':
          recommendations.push(`Monitor ${dim1} and ${dim2} for potential collinearity issues (${pair.normalizedMI.toFixed(3)})`);
          break;
      }
    }

    if (highCollinearityPairs.length === 0) {
      recommendations.push('No significant dimension collinearity detected. Current weights are appropriate.');
    }

    return recommendations;
  }

  private calculateOverallIndependence(miMatrix: Record<string, MutualInformationResult>): number {
    const miValues = Object.values(miMatrix).map(mi => mi.normalizedMI);
    if (miValues.length === 0) return 1.0;
    
    const avgMI = miValues.reduce((sum, mi) => sum + mi, 0) / miValues.length;
    return Math.max(0, 1 - avgMI);
  }
}

// Factory function
export function createDimensionIndependenceAnalyzer(
  highThreshold?: number,
  moderateThreshold?: number
): DimensionIndependenceAnalyzer {
  return new DimensionIndependenceAnalyzer(highThreshold, moderateThreshold);
}

// Quick analysis function
export async function analyzeDimensionIndependence(
  dimensionData: DimensionData,
  dimensions?: string[]
): Promise<DimensionIndependenceAnalysis> {
  const analyzer = new DimensionIndependenceAnalyzer();
  return analyzer.analyzeDimensionIndependence(dimensionData, dimensions);
}