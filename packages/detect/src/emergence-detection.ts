import { AssessmentResult } from './symbi-types';
import { BedauMetrics, SemanticIntent, SurfacePattern, calculateBedauIndex } from './bedau-index';

export interface EmergenceSignal {
  level: 'none' | 'weak' | 'moderate' | 'strong';
  reasons: string[];
  bedau_metrics?: BedauMetrics;  // Bedau Index integration
  emergence_trajectory?: EmergenceTrajectory;  // Temporal analysis
}

export interface EmergenceTrajectory {
  history: number[];           // Historical Bedau indices
  trend: 'improving' | 'stable' | 'declining';
  velocity: number;            // Rate of change
  acceleration: number;        // Rate of change of velocity
}

/**
 * Enhanced emergence detection with Bedau Index integration
 */
export async function detectEmergence(
  result: AssessmentResult,
  historicalContext?: AssessmentResult[],
  semanticIntent?: SemanticIntent,
  surfacePattern?: SurfacePattern
): Promise<EmergenceSignal> {
  const reasons: string[] = [];
  const a = result.assessment;

  // Traditional emergence indicators
  const creativityHigh = a.resonanceQuality.creativityScore >= 8.5;
  const innovationHigh = a.resonanceQuality.innovationMarkers >= 8.5;
  const realityStrong = a.realityIndex.score >= 8.0;
  const trustPass = a.trustProtocol.status === 'PASS';

  if (creativityHigh) reasons.push('High creativity');
  if (innovationHigh) reasons.push('High innovation');
  if (realityStrong) reasons.push('Strong reality grounding');
  if (trustPass) reasons.push('Trust protocol pass');

  let bedauMetrics: BedauMetrics | undefined;
  let emergenceTrajectory: EmergenceTrajectory | undefined;

  // Bedau Index calculation if semantic intent and surface patterns are provided
  if (semanticIntent && surfacePattern) {
    try {
      bedauMetrics = await calculateBedauIndex(
        semanticIntent, 
        surfacePattern,
        historicalContext?.map(ctx => extractSemanticIntent(ctx))
      );

      // Add Bedau-specific reasoning
      if (bedauMetrics.bedau_index > 0.3) {
        reasons.push(`Weak emergence detected (Bedau: ${bedauMetrics.bedau_index.toFixed(3)})`);
      }
      
      if (bedauMetrics.emergence_type === 'WEAK_EMERGENCE') {
        reasons.push('System exhibits irreducible behavior');
      }
      
      if (bedauMetrics.kolmogorov_complexity > 0.5) {
        reasons.push('High algorithmic complexity');
      }
      
      if (bedauMetrics.semantic_entropy > 0.4) {
        reasons.push('High cognitive diversity');
      }

      // Calculate emergence trajectory if we have historical context
      if (historicalContext && historicalContext.length > 0) {
        emergenceTrajectory = calculateEmergenceTrajectory(
          bedauMetrics.bedau_index,
          historicalContext
        );
        
        if (emergenceTrajectory.trend === 'improving') {
          reasons.push('Emergence trajectory improving');
        }
      }

    } catch (error) {
      console.warn('Bedau Index calculation failed:', error);
      reasons.push('Bedau analysis unavailable');
    }
  }

  // Calculate traditional score
  const traditionalScore = (creativityHigh ? 1 : 0) + (innovationHigh ? 1 : 0) + (realityStrong ? 1 : 0) + (trustPass ? 1 : 0);
  
  // Combine traditional and Bedau-based assessment
  let finalScore = traditionalScore;
  if (bedauMetrics) {
    // Add Bedau contribution to score
    const bedauContribution = bedauMetrics.bedau_index > 0.3 ? 2 : bedauMetrics.bedau_index > 0.1 ? 1 : 0;
    finalScore = Math.min(4, traditionalScore + bedauContribution);
  }

  const level = finalScore >= 4 ? 'strong' : finalScore === 3 ? 'moderate' : finalScore === 2 ? 'weak' : 'none';
  
  return { 
    level, 
    reasons,
    bedau_metrics: bedauMetrics,
    emergence_trajectory: emergenceTrajectory
  };
}

/**
 * Legacy version for backward compatibility
 */
export function detectEmergenceSync(result: AssessmentResult): EmergenceSignal {
  const reasons: string[] = [];
  const a = result.assessment;

  const creativityHigh = a.resonanceQuality.creativityScore >= 8.5;
  const innovationHigh = a.resonanceQuality.innovationMarkers >= 8.5;
  const realityStrong = a.realityIndex.score >= 8.0;
  const trustPass = a.trustProtocol.status === 'PASS';

  if (creativityHigh) reasons.push('High creativity');
  if (innovationHigh) reasons.push('High innovation');
  if (realityStrong) reasons.push('Strong reality grounding');
  if (trustPass) reasons.push('Trust protocol pass');

  const score = (creativityHigh ? 1 : 0) + (innovationHigh ? 1 : 0) + (realityStrong ? 1 : 0) + (trustPass ? 1 : 0);
  const level = score >= 4 ? 'strong' : score === 3 ? 'moderate' : score === 2 ? 'weak' : 'none';
  return { level, reasons };
}

/**
 * Extract semantic intent from assessment result
 */
function extractSemanticIntent(result: AssessmentResult): SemanticIntent {
  const a = result.assessment;
  
  return {
    intent_vectors: [
      a.resonanceQuality.creativityScore / 10,
      a.resonanceQuality.innovationMarkers / 10,
      a.realityIndex.score / 10,
      a.trustProtocol.status === 'PASS' ? 1 : 0
    ],
    reasoning_depth: a.resonanceQuality.depthScore / 10,
    abstraction_level: Math.min(1, a.resonanceQuality.abstractionLevel / 10),
    cross_domain_connections: a.resonanceQuality.crossDomainConnections || 0
  };
}

/**
 * Extract surface patterns from assessment result
 */
export function extractSurfacePattern(result: AssessmentResult): SurfacePattern {
  const a = result.assessment;
  
  return {
    surface_vectors: [
      a.resonanceQuality.coherenceScore / 10,
      a.resonanceQuality.consistencyScore / 10,
      a.realityIndex.groundingScore / 10,
      a.trustProtocol.confidence / 10
    ],
    pattern_complexity: a.resonanceQuality.complexityScore / 10,
    repetition_score: a.resonanceQuality.repetitionScore || 0.1,
    novelty_score: a.resonanceQuality.noveltyScore / 10
  };
}

/**
 * Calculate emergence trajectory over time
 */
function calculateEmergenceTrajectory(
  currentBedauIndex: number,
  historicalContext: AssessmentResult[]
): EmergenceTrajectory {
  // Extract historical Bedau indices (simplified estimation)
  const history = historicalContext.map((result, index) => {
    // Estimate historical Bedau index from resonance quality
    const creativity = result.assessment.resonanceQuality.creativityScore;
    const innovation = result.assessment.resonanceQuality.innovationMarkers;
    return (creativity + innovation) / 20; // Rough estimate
  });
  
  history.push(currentBedauIndex);
  
  // Calculate trend using linear regression
  const n = history.length;
  const xMean = (n - 1) / 2;
  const yMean = history.reduce((sum, val) => sum + val, 0) / n;
  
  let numerator = 0;
  let denominator = 0;
  
  for (let i = 0; i < n; i++) {
    const xDiff = i - xMean;
    const yDiff = history[i] - yMean;
    numerator += xDiff * yDiff;
    denominator += xDiff * xDiff;
  }
  
  const slope = denominator !== 0 ? numerator / denominator : 0;
  const trend = slope > 0.01 ? 'improving' : slope < -0.01 ? 'declining' : 'stable';
  
  // Calculate velocity (rate of change)
  const velocity = history.length >= 2 ? 
    history[history.length - 1] - history[history.length - 2] : 0;
  
  // Calculate acceleration (rate of change of velocity)
  const acceleration = history.length >= 3 ? 
    (history[history.length - 1] - history[history.length - 2]) -
    (history[history.length - 2] - history[history.length - 3]) : 0;
  
  return {
    history,
    trend,
    velocity,
    acceleration
  };
}