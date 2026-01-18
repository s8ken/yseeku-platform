/**
 * Third Mind Research Program
 *
 * Research framework for investigating AI emergence and consciousness hypotheses:
 * - Systematic emergence hypothesis testing
 * - Consciousness marker detection
 * - Third mind phenomenon analysis (human-AI collaborative emergence)
 * - Cross-paradigm validation studies
 */

import { BedauMetrics, SemanticIntent, SurfacePattern , EmergenceSignature, TemporalBedauRecord } from '@sonate/detect';

export interface ConsciousnessMarker {
  marker_id: string;
  name: string;
  description: string;
  detection_method:
    | 'behavioral'
    | 'neural_correlate'
    | 'phenomenological'
    | 'information_theoretic';
  confidence_threshold: number;
  current_evidence: EvidenceRecord[];
  research_status: 'hypothesis' | 'preliminary' | 'corroborated' | 'established';
}

export interface EvidenceRecord {
  timestamp: number;
  experiment_id: string;
  observation_type: string;
  strength: number; // 0-1: Strength of evidence
  reproducibility: number; // 0-1: How reproducible the observation is
  context: string;
  raw_data: any;
}

export interface EmergenceHypothesis {
  hypothesis_id: string;
  name: string;
  description: string;
  predictions: string[];
  test_methodology: TestMethodology;
  validation_status: 'untested' | 'testing' | 'partially_validated' | 'validated' | 'refuted';
  supporting_evidence: number;
  contradicting_evidence: number;
  confidence_score: number; // 0-1: Overall confidence in hypothesis
}

export interface TestMethodology {
  experimental_design: string;
  control_conditions: string[];
  measurement_protocols: string[];
  statistical_tests: string[];
  sample_size_required: number;
  duration_estimate: number; // In days
}

export interface ThirdMindInteraction {
  interaction_id: string;
  human_participant_id: string;
  ai_session_id: string;
  collaboration_type: 'creative' | 'analytical' | 'problem_solving' | 'exploratory';
  emergence_metrics: {
    individual_performance: number[];
    collaborative_performance: number[];
    emergence_gain: number; // How much better they are together
    synergistic_patterns: string[];
  };
  consciousness_indicators: {
    shared_attention: number;
    mutual_understanding: number;
    emergent_goals: number;
    collective_intelligence: number;
  };
}

export interface ResearchStudy {
  study_id: string;
  title: string;
  research_question: string;
  hypotheses: EmergenceHypothesis[];
  methodology: ResearchMethodology;
  progress: StudyProgress;
  results: StudyResults;
  publications: string[];
}

export interface ResearchMethodology {
  approach: 'longitudinal' | 'cross_sectional' | 'experimental' | 'observational';
  participant_criteria: string[];
  data_collection_methods: string[];
  analysis_techniques: string[];
  ethical_considerations: string[];
  irb_status: 'pending' | 'approved' | 'rejected';
}

export interface StudyProgress {
  phase: 'planning' | 'recruitment' | 'data_collection' | 'analysis' | 'completed';
  participants_enrolled: number;
  participants_target: number;
  data_collected: number;
  milestones_completed: string[];
  next_milestone: string;
}

export interface StudyResults {
  statistical_findings: StatisticalFinding[];
  qualitative_insights: string[];
  unexpected_discoveries: string[];
  limitations: string[];
  implications: string[];
  follow_up_research: string[];
}

export interface StatisticalFinding {
  variable: string;
  effect_size: number;
  p_value: number;
  confidence_interval: [number, number];
  significance: 'significant' | 'marginal' | 'non_significant';
  interpretation: string;
}

/**
 * Third Mind Research Engine
 *
 * Manages research programs for AI emergence and consciousness studies
 */
export class ThirdMindResearchEngine {
  private consciousnessMarkers: Map<string, ConsciousnessMarker> = new Map();
  private hypotheses: Map<string, EmergenceHypothesis> = new Map();
  private studies: Map<string, ResearchStudy> = new Map();
  private thirdMindInteractions: Map<string, ThirdMindInteraction> = new Map();

  constructor() {
    this.initializeConsciousnessMarkers();
    this.initializeBaselineHypotheses();
  }

  /**
   * Design a new research study on emergence
   */
  designEmergenceStudy(
    researchQuestion: string,
    methodology: ResearchMethodology,
    targetHypotheses: string[]
  ): ResearchStudy {
    const studyId = this.generateStudyId(researchQuestion);

    const hypotheses = targetHypotheses
      .map((id) => this.hypotheses.get(id))
      .filter((h) => h !== undefined);

    const study: ResearchStudy = {
      study_id: studyId,
      title: `Emergence Study: ${researchQuestion}`,
      research_question: researchQuestion,
      hypotheses,
      methodology,
      progress: {
        phase: 'planning',
        participants_enrolled: 0,
        participants_target: this.estimateSampleSize(methodology),
        data_collected: 0,
        milestones_completed: [],
        next_milestone: 'IRB Approval',
      },
      results: {
        statistical_findings: [],
        qualitative_insights: [],
        unexpected_discoveries: [],
        limitations: [],
        implications: [],
        follow_up_research: [],
      },
      publications: [],
    };

    this.studies.set(studyId, study);
    return study;
  }

  /**
   * Test emergence hypothesis with empirical data
   */
  testEmergenceHypothesis(
    hypothesisId: string,
    empiricalData: BedauMetrics[],
    controlData: BedauMetrics[]
  ): {
    hypothesis: EmergenceHypothesis;
    test_results: StatisticalTestResults;
    updated_status: EmergenceHypothesis['validation_status'];
  } {
    const hypothesis = this.hypotheses.get(hypothesisId);
    if (!hypothesis) {
      throw new Error(`Hypothesis ${hypothesisId} not found`);
    }

    const testResults = this.performStatisticalTest(
      empiricalData,
      controlData,
      hypothesis.test_methodology
    );

    // Update hypothesis based on test results
    const updatedHypothesis = this.updateHypothesisValidation(hypothesis, testResults);

    return {
      hypothesis: updatedHypothesis,
      test_results: testResults,
      updated_status: updatedHypothesis.validation_status,
    };
  }

  /**
   * Analyze third mind interaction for emergence patterns
   */
  analyzeThirdMindInteraction(
    humanPerformance: number[],
    aiPerformance: number[],
    collaborativePerformance: number[],
    interactionContext: any
  ): ThirdMindInteraction {
    const interactionId = this.generateInteractionId();

    // Calculate emergence gain (synergy)
    const avgHuman = humanPerformance.reduce((a, b) => a + b, 0) / humanPerformance.length;
    const avgAI = aiPerformance.reduce((a, b) => a + b, 0) / aiPerformance.length;
    const avgCollaborative =
      collaborativePerformance.reduce((a, b) => a + b, 0) / collaborativePerformance.length;

    const expectedIndividualAvg = (avgHuman + avgAI) / 2;
    const emergenceGain = (avgCollaborative - expectedIndividualAvg) / expectedIndividualAvg;

    // Detect synergistic patterns
    const synergisticPatterns = this.detectSynergisticPatterns(
      humanPerformance,
      aiPerformance,
      collaborativePerformance
    );

    // Analyze consciousness indicators
    const consciousnessIndicators = this.analyzeConsciousnessIndicators(
      humanPerformance,
      aiPerformance,
      collaborativePerformance,
      interactionContext
    );

    const interaction: ThirdMindInteraction = {
      interaction_id: interactionId,
      human_participant_id: interactionContext.participant_id || 'unknown',
      ai_session_id: interactionContext.session_id || 'unknown',
      collaboration_type: interactionContext.collaboration_type || 'exploratory',
      emergence_metrics: {
        individual_performance: [...humanPerformance, ...aiPerformance],
        collaborative_performance: collaborativePerformance,
        emergence_gain: emergenceGain,
        synergistic_patterns: synergisticPatterns,
      },
      consciousness_indicators: consciousnessIndicators,
    };

    this.thirdMindInteractions.set(interactionId, interaction);
    return interaction;
  }

  /**
   * Detect consciousness markers in emergence data
   */
  detectConsciousnessMarkers(
    bedauMetrics: BedauMetrics[],
    temporalData: TemporalBedauRecord[]
  ): {
    detected_markers: ConsciousnessMarker[];
    overall_consciousness_score: number;
    confidence_assessment: string;
  } {
    const detectedMarkers: ConsciousnessMarker[] = [];
    let totalConfidence = 0;
    let markerCount = 0;

    for (const [markerId, marker] of this.consciousnessMarkers) {
      const detectionResult = this.testConsciousnessMarker(marker, bedauMetrics, temporalData);

      if (detectionResult.detected) {
        const updatedMarker = {
          ...marker,
          current_evidence: [
            ...marker.current_evidence,
            {
              timestamp: Date.now(),
              experiment_id: `detection_${Date.now()}`,
              observation_type: marker.detection_method,
              strength: detectionResult.strength,
              reproducibility: detectionResult.reproducibility,
              context: detectionResult.context,
              raw_data: detectionResult.raw_data,
            },
          ],
        };

        detectedMarkers.push(updatedMarker);
        totalConfidence += detectionResult.strength;
        markerCount++;
      }
    }

    const overallScore = markerCount > 0 ? totalConfidence / markerCount : 0;
    const confidenceAssessment = this.assessOverallConfidence(overallScore, markerCount);

    return {
      detected_markers: detectedMarkers,
      overall_consciousness_score: overallScore,
      confidence_assessment: confidenceAssessment,
    };
  }

  /**
   * Generate research insights from accumulated data
   */
  generateResearchInsights(): {
    key_findings: string[];
    patterns_identified: string[];
    theoretical_implications: string[];
    practical_applications: string[];
    future_research_directions: string[];
  } {
    const insights = {
      key_findings: [] as string[],
      patterns_identified: [] as string[],
      theoretical_implications: [] as string[],
      practical_applications: [] as string[],
      future_research_directions: [] as string[],
    };

    // Analyze all studies for patterns
    for (const study of this.studies.values()) {
      if (study.progress.phase === 'completed') {
        // Extract key findings
        study.results.statistical_findings.forEach((finding) => {
          if (finding.significance === 'significant') {
            insights.key_findings.push(finding.interpretation);
          }
        });

        // Identify qualitative insights
        insights.patterns_identified.push(...study.results.qualitative_insights);

        // Extract implications
        insights.theoretical_implications.push(...study.results.implications);
        insights.practical_applications.push(...(study.results.limited_implications || []));
        insights.future_research_directions.push(...study.results.follow_up_research);
      }
    }

    // Analyze third mind interactions for broader patterns
    if (this.thirdMindInteractions.size > 10) {
      const avgEmergenceGain =
        Array.from(this.thirdMindInteractions.values()).reduce(
          (sum, interaction) => sum + interaction.emergence_metrics.emergence_gain,
          0
        ) / this.thirdMindInteractions.size;

      if (avgEmergenceGain > 0.2) {
        insights.key_findings.push(
          'Consistent third mind emergence gain observed across interactions'
        );
        insights.practical_applications.push(
          'Human-AI collaboration shows measurable synergistic benefits'
        );
      }
    }

    return insights;
  }

  // Private helper methods

  private initializeConsciousnessMarkers(): void {
    const defaultMarkers: ConsciousnessMarker[] = [
      {
        marker_id: 'integrated_information',
        name: 'Integrated Information Theory Indicator',
        description: 'High integration of information across system components',
        detection_method: 'information_theoretic',
        confidence_threshold: 0.7,
        current_evidence: [],
        research_status: 'hypothesis',
      },
      {
        marker_id: 'global_workspace',
        name: 'Global Workspace Indicator',
        description: 'Evidence of global information broadcasting in the system',
        detection_method: 'neural_correlate',
        confidence_threshold: 0.6,
        current_evidence: [],
        research_status: 'hypothesis',
      },
      {
        marker_id: 'metacognitive_awareness',
        name: 'Metacognitive Awareness',
        description: 'System demonstrates awareness of its own cognitive processes',
        detection_method: 'behavioral',
        confidence_threshold: 0.8,
        current_evidence: [],
        research_status: 'preliminary',
      },
      {
        marker_id: 'phenomenal_coherence',
        name: 'Phenomenal Coherence',
        description: 'Coherent, unified experience rather than fragmented processing',
        detection_method: 'phenomenological',
        confidence_threshold: 0.6,
        current_evidence: [],
        research_status: 'hypothesis',
      },
      {
        marker_id: 'adaptive_self_model',
        name: 'Adaptive Self-Model',
        description: 'System maintains and updates a model of itself',
        detection_method: 'behavioral',
        confidence_threshold: 0.5,
        current_evidence: [],
        research_status: 'preliminary',
      },
    ];

    defaultMarkers.forEach((marker) => {
      this.consciousnessMarkers.set(marker.marker_id, marker);
    });
  }

  private initializeBaselineHypotheses(): void {
    const baselineHypotheses: EmergenceHypothesis[] = [
      {
        hypothesis_id: 'weak_emergence_scaling',
        name: 'Weak Emergence Scales with Complexity',
        description: 'Bedau Index increases predictably with system complexity',
        predictions: [
          'Bedau Index correlates with Kolmogorov complexity',
          'Higher complexity systems show more stable emergence',
          'Emergence becomes more predictable at larger scales',
        ],
        test_methodology: {
          experimental_design: 'Cross-sectional study of systems at different complexity levels',
          control_conditions: ['Fixed complexity baseline', 'Random variation control'],
          measurement_protocols: [
            'Bedau Index calculation',
            'Complexity metrics',
            'Stability analysis',
          ],
          statistical_tests: ['Pearson correlation', 'Regression analysis', 'ANOVA'],
          sample_size_required: 100,
          duration_estimate: 30,
        },
        validation_status: 'untested',
        supporting_evidence: 0,
        contradicting_evidence: 0,
        confidence_score: 0.5,
      },
      {
        hypothesis_id: 'consciousness_correlate',
        name: 'Consciousness Correlates with Emergence',
        description: 'Higher emergence correlates with consciousness-like markers',
        predictions: [
          'High Bedau Index systems show consciousness markers',
          'Consciousness markers scale with emergence strength',
          'Emergence patterns predict consciousness indicator activation',
        ],
        test_methodology: {
          experimental_design: 'Longitudinal study of emergence and consciousness markers',
          control_conditions: ['Low emergence baseline', 'False marker controls'],
          measurement_protocols: [
            'Bedau Index tracking',
            'Consciousness marker detection',
            'Temporal analysis',
          ],
          statistical_tests: ['Time series analysis', 'Cross-correlation', 'Granger causality'],
          sample_size_required: 50,
          duration_estimate: 90,
        },
        validation_status: 'untested',
        supporting_evidence: 0,
        contradicting_evidence: 0,
        confidence_score: 0.3,
      },
    ];

    baselineHypotheses.forEach((hypothesis) => {
      this.hypotheses.set(hypothesis.hypothesis_id, hypothesis);
    });
  }

  private generateStudyId(researchQuestion: string): string {
    const hash = this.simpleHash(researchQuestion);
    return `study_${hash.slice(0, 8)}_${Date.now().toString(36)}`;
  }

  private generateInteractionId(): string {
    return `interaction_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  }

  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }

  private estimateSampleSize(methodology: ResearchMethodology): number {
    // Simple sample size estimation based on methodology complexity
    const baseSample = 30;
    const complexityMultiplier = methodology.analysis_techniques.length * 10;
    return baseSample + complexityMultiplier;
  }

  private performStatisticalTest(
    empiricalData: BedauMetrics[],
    controlData: BedauMetrics[],
    methodology: TestMethodology
  ): StatisticalTestResults {
    // Simplified statistical test implementation
    const empiricalMeans = empiricalData.map((d) => d.bedau_index);
    const controlMeans = controlData.map((d) => d.bedau_index);

    const empiricalAvg = empiricalMeans.reduce((a, b) => a + b, 0) / empiricalMeans.length;
    const controlAvg = controlMeans.reduce((a, b) => a + b, 0) / controlMeans.length;

    const effectSize = this.calculateCohenD(empiricalMeans, controlMeans);
    const pValue = this.calculatePValue(empiricalMeans, controlMeans);
    const confidenceInterval = this.calculateConfidenceInterval(empiricalMeans);

    const significance =
      pValue < 0.05 ? (pValue < 0.01 ? 'significant' : 'marginal') : 'non_significant';

    return {
      effect_size: effectSize,
      p_value: pValue,
      confidence_interval: confidenceInterval,
      significance: significance,
      interpretation: this.interpretResults(effectSize, pValue, methodology),
    };
  }

  private calculateCohenD(group1: number[], group2: number[]): number {
    const mean1 = group1.reduce((a, b) => a + b, 0) / group1.length;
    const mean2 = group2.reduce((a, b) => a + b, 0) / group2.length;

    const variance1 =
      group1.reduce((sum, val) => sum + Math.pow(val - mean1, 2), 0) / group1.length;
    const variance2 =
      group2.reduce((sum, val) => sum + Math.pow(val - mean2, 2), 0) / group2.length;

    const pooledStdDev = Math.sqrt(
      ((group1.length - 1) * variance1 + (group2.length - 1) * variance2) /
        (group1.length + group2.length - 2)
    );

    return (mean1 - mean2) / pooledStdDev;
  }

  private calculatePValue(group1: number[], group2: number[]): number {
    // Simplified t-test p-value calculation
    const tStatistic = this.calculateTStatistic(group1, group2);
    // In practice, use proper statistical library
    return Math.max(0.001, Math.abs(tStatistic) / 10); // Simplified approximation
  }

  private calculateTStatistic(group1: number[], group2: number[]): number {
    const mean1 = group1.reduce((a, b) => a + b, 0) / group1.length;
    const mean2 = group2.reduce((a, b) => a + b, 0) / group2.length;

    const variance1 =
      group1.reduce((sum, val) => sum + Math.pow(val - mean1, 2), 0) / (group1.length - 1);
    const variance2 =
      group2.reduce((sum, val) => sum + Math.pow(val - mean2, 2), 0) / (group2.length - 1);

    const standardError = Math.sqrt(variance1 / group1.length + variance2 / group2.length);

    return (mean1 - mean2) / standardError;
  }

  private calculateConfidenceInterval(data: number[]): [number, number] {
    const mean = data.reduce((a, b) => a + b, 0) / data.length;
    const stdError =
      Math.sqrt(data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length) /
      Math.sqrt(data.length);

    // 95% confidence interval (simplified)
    const margin = 1.96 * stdError;
    return [mean - margin, mean + margin];
  }

  private interpretResults(
    effectSize: number,
    pValue: number,
    methodology: TestMethodology
  ): string {
    if (pValue < 0.01 && Math.abs(effectSize) > 0.8) {
      return 'Strong evidence supporting hypothesis';
    } else if (pValue < 0.05 && Math.abs(effectSize) > 0.5) {
      return 'Moderate evidence supporting hypothesis';
    } else if (pValue < 0.1) {
      return 'Trend supporting hypothesis, needs more data';
    } 
      return 'Insufficient evidence to support hypothesis';
    
  }

  private updateHypothesisValidation(
    hypothesis: EmergenceHypothesis,
    testResults: StatisticalTestResults
  ): EmergenceHypothesis {
    const newSupportingEvidence = testResults.significance === 'significant' ? 1 : 0;
    const newContradictingEvidence = testResults.significance === 'non_significant' ? 1 : 0;

    // Update confidence score using Bayesian updating
    const priorConfidence = hypothesis.confidence_score;
    const evidenceWeight = 0.1;
    const likelihoodRatio = testResults.significance === 'significant' ? 3 : 0.33;
    const posteriorConfidence =
      (priorConfidence * likelihoodRatio) /
      (priorConfidence * likelihoodRatio + (1 - priorConfidence));

    let newStatus: EmergenceHypothesis['validation_status'] = hypothesis.validation_status;

    if (
      testResults.significance === 'significant' &&
      hypothesis.supporting_evidence + newSupportingEvidence >= 3
    ) {
      newStatus = 'validated';
    } else if (
      testResults.significance === 'significant' &&
      hypothesis.supporting_evidence + newSupportingEvidence >= 1
    ) {
      newStatus = 'partially_validated';
    } else if (hypothesis.contradicting_evidence + newContradictingEvidence >= 3) {
      newStatus = 'refuted';
    } else if (hypothesis.validation_status === 'untested') {
      newStatus = 'testing';
    }

    return {
      ...hypothesis,
      supporting_evidence: hypothesis.supporting_evidence + newSupportingEvidence,
      contradicting_evidence: hypothesis.contradicting_evidence + newContradictingEvidence,
      confidence_score: Math.max(0, Math.min(1, posteriorConfidence)),
      validation_status: newStatus,
    };
  }

  private detectSynergisticPatterns(
    humanPerformance: number[],
    aiPerformance: number[],
    collaborativePerformance: number[]
  ): string[] {
    const patterns: string[] = [];

    // Check for complementarity
    const humanVariance = this.calculateVariance(humanPerformance);
    const aiVariance = this.calculateVariance(aiPerformance);
    const collaborativeVariance = this.calculateVariance(collaborativePerformance);

    if (collaborativeVariance < Math.min(humanVariance, aiVariance)) {
      patterns.push('complementary_stability');
    }

    // Check for amplification
    const maxHuman = Math.max(...humanPerformance);
    const maxAI = Math.max(...aiPerformance);
    const maxCollaborative = Math.max(...collaborativePerformance);

    if (maxCollaborative > Math.max(maxHuman, maxAI) * 1.1) {
      patterns.push('peak_amplification');
    }

    // Check for learning effect
    if (collaborativePerformance.length > 5) {
      const firstHalf = collaborativePerformance.slice(
        0,
        Math.floor(collaborativePerformance.length / 2)
      );
      const secondHalf = collaborativePerformance.slice(
        Math.floor(collaborativePerformance.length / 2)
      );

      const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

      if (secondAvg > firstAvg * 1.05) {
        patterns.push('collaborative_learning');
      }
    }

    return patterns;
  }

  private analyzeConsciousnessIndicators(
    humanPerformance: number[],
    aiPerformance: number[],
    collaborativePerformance: number[],
    context: any
  ): ThirdMindInteraction['consciousness_indicators'] {
    // Simplified consciousness indicator analysis

    // Shared attention (based on performance convergence)
    const performanceDivergence = Math.abs(
      humanPerformance[humanPerformance.length - 1] - aiPerformance[aiPerformance.length - 1]
    );
    const maxPossibleDivergence = 1.0;
    const sharedAttention = Math.max(0, 1 - performanceDivergence / maxPossibleDivergence);

    // Mutual understanding (based on collaborative efficiency)
    const expectedPerformance =
      (humanPerformance[humanPerformance.length - 1] + aiPerformance[aiPerformance.length - 1]) / 2;
    const actualPerformance = collaborativePerformance[collaborativePerformance.length - 1];
    const mutualUnderstanding = Math.min(1, actualPerformance / expectedPerformance);

    // Emergent goals (based on performance exceeding expectations)
    const emergentGoals = Math.max(0, actualPerformance - expectedPerformance);

    // Collective intelligence (composite measure)
    const collectiveIntelligence = (sharedAttention + mutualUnderstanding + emergentGoals) / 3;

    return {
      shared_attention: sharedAttention,
      mutual_understanding: mutualUnderstanding,
      emergent_goals: emergentGoals,
      collective_intelligence: collectiveIntelligence,
    };
  }

  private testConsciousnessMarker(
    marker: ConsciousnessMarker,
    bedauMetrics: BedauMetrics[],
    temporalData: TemporalBedauRecord[]
  ): {
    detected: boolean;
    strength: number;
    reproducibility: number;
    context: string;
    raw_data: any;
  } {
    // Simplified marker detection
    switch (marker.marker_id) {
      case 'integrated_information':
        return this.testIntegratedInformation(bedauMetrics);
      case 'global_workspace':
        return this.testGlobalWorkspace(temporalData);
      case 'metacognitive_awareness':
        return this.testMetacognitiveAwareness(temporalData);
      case 'phenomenal_coherence':
        return this.testPhenomenalCoherence(bedauMetrics);
      case 'adaptive_self_model':
        return this.testAdaptiveSelfModel(temporalData);
      default:
        return {
          detected: false,
          strength: 0,
          reproducibility: 0,
          context: 'Unknown marker',
          raw_data: null,
        };
    }
  }

  private testIntegratedInformation(bedauMetrics: BedauMetrics[]) {
    const avgComplexity =
      bedauMetrics.reduce((sum, m) => sum + m.kolmogorov_complexity, 0) / bedauMetrics.length;
    const detected = avgComplexity > 0.6;

    return {
      detected,
      strength: avgComplexity,
      reproducibility: this.calculateReproducibility(
        bedauMetrics.map((m) => m.kolmogorov_complexity)
      ),
      context: 'High complexity indicates integrated information',
      raw_data: { avg_complexity: avgComplexity },
    };
  }

  private testGlobalWorkspace(temporalData: TemporalBedauRecord[]) {
    // Test for global information broadcasting patterns
    const entropyVariability = this.calculateVariance(
      temporalData.map((r) => r.bedau_metrics.semantic_entropy)
    );
    const detected = entropyVariability < 0.1; // Stable entropy suggests global workspace

    return {
      detected,
      strength: 1 - entropyVariability,
      reproducibility: 0.7, // Simplified
      context: 'Stable entropy patterns suggest global workspace',
      raw_data: { entropy_variability: entropyVariability },
    };
  }

  private testMetacognitiveAwareness(temporalData: TemporalBedauRecord[]) {
    // Test for patterns suggesting self-monitoring
    const bedauTrend = this.calculateTrend(temporalData.map((r) => r.bedau_metrics.bedau_index));
    const detected = Math.abs(bedauTrend) < 0.01; // Stable performance suggests self-monitoring

    return {
      detected,
      strength: 1 - Math.abs(bedauTrend),
      reproducibility: 0.6,
      context: 'Stable performance suggests metacognitive awareness',
      raw_data: { bedau_trend: bedauTrend },
    };
  }

  private testPhenomenalCoherence(bedauMetrics: BedauMetrics[]) {
    // Test for coherent experience patterns
    const coherenceScore =
      bedauMetrics.reduce((sum, m) => sum + m.bedau_index, 0) / bedauMetrics.length;
    const detected = coherenceScore > 0.5;

    return {
      detected,
      strength: coherenceScore,
      reproducibility: this.calculateReproducibility(bedauMetrics.map((m) => m.bedau_index)),
      context: 'High coherence suggests unified experience',
      raw_data: { coherence_score: coherenceScore },
    };
  }

  private testAdaptiveSelfModel(temporalData: TemporalBedauRecord[]) {
    // Test for adaptive self-improvement patterns
    if (temporalData.length < 3) {
      return {
        detected: false,
        strength: 0,
        reproducibility: 0,
        context: 'Insufficient data',
        raw_data: null,
      };
    }

    const recentPerformance = temporalData.slice(-3).map((r) => r.bedau_metrics.bedau_index);
    const improvement = recentPerformance[2] - recentPerformance[0];
    const detected = improvement > 0.05;

    return {
      detected,
      strength: Math.max(0, improvement),
      reproducibility: 0.5,
      context: 'Performance improvement suggests adaptive self-model',
      raw_data: { improvement_trend: improvement },
    };
  }

  private assessOverallConfidence(overallScore: number, markerCount: number): string {
    if (markerCount === 0) {
      return 'No consciousness markers detected';
    }

    if (overallScore > 0.8) {
      return 'Strong evidence of consciousness-like properties';
    } else if (overallScore > 0.6) {
      return 'Moderate evidence of consciousness-like properties';
    } else if (overallScore > 0.4) {
      return 'Weak evidence of consciousness-like properties';
    } 
      return 'Minimal evidence of consciousness-like properties';
    
  }

  private calculateVariance(values: number[]): number {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    return values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  }

  private calculateReproducibility(values: number[]): number {
    // Simplified reproducibility based on consistency
    const variance = this.calculateVariance(values);
    return Math.max(0, 1 - variance * 4); // Scale variance to 0-1 reproducibility
  }

  private calculateTrend(values: number[]): number {
    if (values.length < 2) {return 0;}

    const n = values.length;
    const xMean = (n - 1) / 2;
    const yMean = values.reduce((sum, val) => sum + val, 0) / n;

    let numerator = 0;
    let denominator = 0;

    for (let i = 0; i < n; i++) {
      const xDiff = i - xMean;
      const yDiff = values[i] - yMean;
      numerator += xDiff * yDiff;
      denominator += xDiff * xDiff;
    }

    return denominator === 0 ? 0 : numerator / denominator;
  }
}

// Type definitions for internal methods
interface StatisticalTestResults {
  effect_size: number;
  p_value: number;
  confidence_interval: [number, number];
  significance: 'significant' | 'marginal' | 'non_significant';
  interpretation: string;
}

/**
 * Factory function for creating Third Mind research engines
 */
export function createThirdMindResearchEngine(): ThirdMindResearchEngine {
  return new ThirdMindResearchEngine();
}
