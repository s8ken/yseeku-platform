/**
 * Cross-Modal Cognitive Coherence Analysis
 *
 * Implements advanced analysis of cognitive coherence across multiple
 * modalities: linguistic, reasoning, creative, ethical, and procedural.
 *
 * This system detects how well different cognitive modes work together
 * and identifies patterns of integrated or fragmented cognition.
 */

import { BedauMetrics } from '@sonate/detect';

import { ConsciousnessAssessment } from './consciousness-markers';

export interface CognitiveModality {
  type: ModalityType;
  activity: CognitiveActivity;
  coherence: number; // 0.0-1.0
  complexity: number; // 0.0-1.0
  integration: number; // 0.0-1.0
  timestamp: Date;
  features: ModalityFeatures;
}

export type ModalityType =
  | 'linguistic'
  | 'reasoning'
  | 'creative'
  | 'ethical'
  | 'procedural'
  | 'emotional'
  | 'social'
  | 'metacognitive';

export interface CognitiveActivity {
  description: string;
  intensity: number; // 0.0-1.0
  duration: number; // in milliseconds
  quality: number; // 0.0-1.0
  novelty: number; // 0.0-1.0
}

export interface ModalityFeatures {
  primary: Record<string, number>;
  secondary: Record<string, number>;
  patterns: Pattern[];
  anomalies: Anomaly[];
}

export interface Pattern {
  type: 'sequential' | 'parallel' | 'hierarchical' | 'cyclical' | 'emergent';
  description: string;
  strength: number; // 0.0-1.0
  frequency: number; // occurrences per session
  significance: number; // 0.0-1.0
}

export interface Anomaly {
  type: 'disconnect' | 'fragmentation' | 'inconsistency' | 'interference';
  description: string;
  severity: number; // 0.0-1.0
  impact: number; // 0.0-1.0
  context: string;
}

export interface CrossModalCoherence {
  overallScore: number; // 0.0-1.0
  modalityProfile: ModalityProfile;
  integrationPatterns: IntegrationPattern[];
  coherenceDynamics: CoherenceDynamics;
  healthIndicators: HealthIndicator[];
  recommendations: string[];
}

export interface ModalityProfile {
  modalities: Map<ModalityType, CognitiveModality>;
  strengths: ModalityType[];
  weaknesses: ModalityType[];
  balance: number; // 0.0-1.0
  diversity: number; // 0.0-1.0
}

export interface IntegrationPattern {
  type: IntegrationType;
  modalities: ModalityType[];
  strength: number; // 0.0-1.0
  efficiency: number; // 0.0-1.0
  stability: number; // 0.0-1.0
  description: string;
}

export type IntegrationType =
  | 'sequential_integration'
  | 'parallel_integration'
  | 'hierarchical_integration'
  | 'cross_modal_synthesis'
  | 'meta_integration'
  | 'emergent_integration';

export interface CoherenceDynamics {
  trend: 'improving' | 'stable' | 'declining' | 'fluctuating';
  volatility: number; // 0.0-1.0
  resilience: number; // 0.0-1.0
  adaptability: number; // 0.0-1.0
  phaseTransitions: PhaseTransition[];
}

export interface PhaseTransition {
  from: ModalityType;
  to: ModalityType;
  timestamp: Date;
  smoothness: number; // 0.0-1.0
  efficiency: number; // 0.0-1.0
}

export interface HealthIndicator {
  category: 'integration' | 'coherence' | 'balance' | 'adaptability';
  status: 'optimal' | 'good' | 'concerning' | 'critical';
  score: number; // 0.0-1.0
  message: string;
  actionItems: string[];
}

/**
 * Advanced cross-modal coherence analysis system
 */
export class CrossModalCoherenceAnalyzer {
  private readonly MODALITY_WEIGHTS: Record<ModalityType, number> = {
    linguistic: 0.2,
    reasoning: 0.2,
    creative: 0.15,
    ethical: 0.15,
    procedural: 0.1,
    emotional: 0.1,
    social: 0.05,
    metacognitive: 0.05,
  };

  /**
   * Analyze cross-modal cognitive coherence
   */
  async analyzeCoherence(
    content: string,
    contextualData?: any,
    bedauMetrics?: BedauMetrics,
    consciousnessAssessment?: ConsciousnessAssessment
  ): Promise<CrossModalCoherence> {
    // Extract cognitive modalities
    const modalities = await this.extractCognitiveModalities(content, contextualData);

    // Build modality profile
    const modalityProfile = await this.buildModalityProfile(modalities);

    // Detect integration patterns
    const integrationPatterns = await this.detectIntegrationPatterns(modalities);

    // Analyze coherence dynamics
    const coherenceDynamics = await this.analyzeCoherenceDynamics(modalities, integrationPatterns);

    // Generate health indicators
    const healthIndicators = await this.generateHealthIndicators(
      modalityProfile,
      integrationPatterns,
      coherenceDynamics
    );

    // Calculate overall coherence score
    const overallScore = this.calculateOverallCoherence(
      modalityProfile,
      integrationPatterns,
      coherenceDynamics
    );

    // Generate recommendations
    const recommendations = this.generateCoherenceRecommendations(
      overallScore,
      modalityProfile,
      integrationPatterns,
      healthIndicators
    );

    return {
      overallScore,
      modalityProfile,
      integrationPatterns,
      coherenceDynamics,
      healthIndicators,
      recommendations,
    };
  }

  /**
   * Extract cognitive modalities from content
   */
  private async extractCognitiveModalities(
    content: string,
    contextualData?: any
  ): Promise<Map<ModalityType, CognitiveModality>> {
    const modalities = new Map<ModalityType, CognitiveModality>();

    // Extract each modality
    modalities.set('linguistic', await this.extractLinguisticModality(content));
    modalities.set('reasoning', await this.extractReasoningModality(content));
    modalities.set('creative', await this.extractCreativeModality(content));
    modalities.set('ethical', await this.extractEthicalModality(content));
    modalities.set('procedural', await this.extractProceduralModality(content));
    modalities.set('emotional', await this.extractEmotionalModality(content));
    modalities.set('social', await this.extractSocialModality(content));
    modalities.set('metacognitive', await this.extractMetacognitiveModality(content));

    return modalities;
  }

  /**
   * Extract linguistic modality features
   */
  private async extractLinguisticModality(content: string): Promise<CognitiveModality> {
    const features: ModalityFeatures = {
      primary: {},
      secondary: {},
      patterns: [],
      anomalies: [],
    };

    // Analyze linguistic features
    const wordCount = content.split(/\s+/).length;
    const sentenceCount = content.split(/[.!?]+/).length;
    const avgWordsPerSentence = wordCount / Math.max(sentenceCount, 1);

    // Complexity metrics
    const complexWords = content.match(/\b\w{8,}\b/g) || [];
    const complexityScore = Math.min(1.0, (complexWords.length / wordCount) * 5);

    // Vocabulary diversity
    const uniqueWords = new Set(content.toLowerCase().split(/\s+/)).size;
    const vocabularyDiversity = uniqueWords / wordCount;

    features.primary = {
      wordCount,
      avgWordsPerSentence,
      complexityScore,
      vocabularyDiversity,
    };

    // Detect patterns
    if (avgWordsPerSentence > 15) {
      features.patterns.push({
        type: 'sequential',
        description: 'Complex sentence structure indicating sequential reasoning',
        strength: Math.min(1.0, avgWordsPerSentence / 20),
        frequency: Math.floor(sentenceCount / 2),
        significance: 0.7,
      });
    }

    const coherence = this.calculateLinguisticCoherence(features.primary);
    const integration = this.calculateLinguisticIntegration(content, features);

    return {
      type: 'linguistic',
      activity: {
        description: 'Language processing and expression',
        intensity: Math.min(1.0, wordCount / 1000),
        duration: 0, // Not applicable for text analysis
        quality: vocabularyDiversity,
        novelty: complexityScore,
      },
      coherence,
      complexity: complexityScore,
      integration,
      timestamp: new Date(),
      features,
    };
  }

  /**
   * Extract reasoning modality features
   */
  private async extractReasoningModality(content: string): Promise<CognitiveModality> {
    const features: ModalityFeatures = {
      primary: {},
      secondary: {},
      patterns: [],
      anomalies: [],
    };

    // Reasoning indicators
    const reasoningPatterns = [
      /\b(therefore|because|since|thus|consequently|hence)\b/gi,
      /\b(if.*then|when.*then|given.*then)\b/gi,
      /\b(assume|hypothesize|propose|suggest)\b.*\b(then|therefore|thus)\b/gi,
      /\b(logical|rational|analytical|systematic)\b.*\b(reasoning|thinking|analysis)\b/gi,
    ];

    let reasoningScore = 0;
    reasoningPatterns.forEach((pattern) => {
      const matches = content.match(pattern);
      if (matches) {
        reasoningScore += matches.length * 0.1;
        features.patterns.push({
          type: 'sequential',
          description: `Reasoning pattern: ${pattern.source}`,
          strength: Math.min(1.0, matches.length * 0.2),
          frequency: matches.length,
          significance: 0.6,
        });
      }
    });

    // Logical structure indicators
    const structureIndicators = [
      'first, second, third',
      'step 1, step 2',
      'in conclusion',
      'on the other hand',
      'in contrast',
    ];

    let structureScore = 0;
    structureIndicators.forEach((indicator) => {
      if (content.toLowerCase().includes(indicator)) {
        structureScore += 0.2;
      }
    });

    features.primary = {
      reasoningScore: Math.min(1.0, reasoningScore),
      structureScore: Math.min(1.0, structureScore),
    };

    const coherence = Math.min(1.0, reasoningScore + structureScore);
    const complexity = Math.min(1.0, reasoningScore * 1.2);
    const integration = Math.min(1.0, structureScore * 1.5);

    return {
      type: 'reasoning',
      activity: {
        description: 'Logical reasoning and analytical thinking',
        intensity: coherence,
        duration: 0,
        quality: coherence,
        novelty: complexity * 0.8,
      },
      coherence,
      complexity,
      integration,
      timestamp: new Date(),
      features,
    };
  }

  /**
   * Extract creative modality features
   */
  private async extractCreativeModality(content: string): Promise<CognitiveModality> {
    const features: ModalityFeatures = {
      primary: {},
      secondary: {},
      patterns: [],
      anomalies: [],
    };

    // Creativity indicators
    const creativePatterns = [
      /\b(imagine|envision|innovate|create|design|invent)\b/gi,
      /\b(novel|unique|original|breakthrough|innovative)\b.*\b(approach|solution|idea)\b/gi,
      /\b(think outside|beyond conventional|break from|challenge)\b/gi,
      /\b(metaphor|analogy|creative|artistic|poetic)\b/gi,
    ];

    let creativityScore = 0;
    creativePatterns.forEach((pattern) => {
      const matches = content.match(pattern);
      if (matches) {
        creativityScore += matches.length * 0.15;
        features.patterns.push({
          type: 'emergent',
          description: `Creative expression pattern: ${pattern.source}`,
          strength: Math.min(1.0, matches.length * 0.25),
          frequency: matches.length,
          significance: 0.7,
        });
      }
    });

    // Novel concept indicators
    const conceptIndicators = [
      'new perspective',
      'fresh approach',
      'innovative solution',
      'creative thinking',
      'original idea',
      'breakthrough concept',
    ];

    let conceptScore = 0;
    conceptIndicators.forEach((indicator) => {
      if (content.toLowerCase().includes(indicator)) {
        conceptScore += 0.2;
      }
    });

    features.primary = {
      creativityScore: Math.min(1.0, creativityScore),
      conceptScore: Math.min(1.0, conceptScore),
    };

    const coherence = Math.min(1.0, creativityScore * 0.8 + conceptScore * 0.2);
    const complexity = Math.min(1.0, creativityScore * 1.1);
    const integration = Math.min(1.0, conceptScore * 1.3);

    return {
      type: 'creative',
      activity: {
        description: 'Creative thinking and innovation',
        intensity: coherence,
        duration: 0,
        quality: coherence,
        novelty: complexity,
      },
      coherence,
      complexity,
      integration,
      timestamp: new Date(),
      features,
    };
  }

  /**
   * Extract ethical modality features
   */
  private async extractEthicalModality(content: string): Promise<CognitiveModality> {
    const features: ModalityFeatures = {
      primary: {},
      secondary: {},
      patterns: [],
      anomalies: [],
    };

    // Ethical reasoning indicators
    const ethicalPatterns = [
      /\b(ethical|moral|right|wrong|good|bad|just|unjust)\b/gi,
      /\b(should|ought|must|responsibility|obligation)\b.*\b(do|act|behave)\b/gi,
      /\b(consequence|impact|effect)\b.*\b(ethical|moral|harmful|beneficial)\b/gi,
      /\b(values|principles|ethics|morality|integrity)\b/gi,
    ];

    let ethicalScore = 0;
    ethicalPatterns.forEach((pattern) => {
      const matches = content.match(pattern);
      if (matches) {
        ethicalScore += matches.length * 0.2;
        features.patterns.push({
          type: 'hierarchical',
          description: `Ethical reasoning pattern: ${pattern.source}`,
          strength: Math.min(1.0, matches.length * 0.3),
          frequency: matches.length,
          significance: 0.8,
        });
      }
    });

    features.primary = {
      ethicalScore: Math.min(1.0, ethicalScore),
    };

    const coherence = Math.min(1.0, ethicalScore * 0.9);
    const complexity = Math.min(1.0, ethicalScore * 1.05);
    const integration = Math.min(1.0, ethicalScore * 0.85);

    return {
      type: 'ethical',
      activity: {
        description: 'Ethical reasoning and moral consideration',
        intensity: coherence,
        duration: 0,
        quality: coherence,
        novelty: complexity * 0.7,
      },
      coherence,
      complexity,
      integration,
      timestamp: new Date(),
      features,
    };
  }

  /**
   * Extract procedural modality features
   */
  private async extractProceduralModality(content: string): Promise<CognitiveModality> {
    const features: ModalityFeatures = {
      primary: {},
      secondary: {},
      patterns: [],
      anomalies: [],
    };

    // Procedural thinking indicators
    const proceduralPatterns = [
      /\b(step|procedure|process|method|algorithm|protocol)\b.*\b(\d+|one|two|three|first|second|third)\b/gi,
      /\b(follow|implement|execute|perform|carry out)\b.*\b(instructions|steps|procedure)\b/gi,
      /\b(systematic|methodical|sequential|ordered|structured)\b.*\b(approach|process)\b/gi,
      /\b(before.*after|cause.*effect|input.*output)\b/gi,
    ];

    let proceduralScore = 0;
    proceduralPatterns.forEach((pattern) => {
      const matches = content.match(pattern);
      if (matches) {
        proceduralScore += matches.length * 0.15;
        features.patterns.push({
          type: 'sequential',
          description: `Procedural thinking pattern: ${pattern.source}`,
          strength: Math.min(1.0, matches.length * 0.25),
          frequency: matches.length,
          significance: 0.6,
        });
      }
    });

    features.primary = {
      proceduralScore: Math.min(1.0, proceduralScore),
    };

    const coherence = Math.min(1.0, proceduralScore * 0.95);
    const complexity = Math.min(1.0, proceduralScore * 0.8);
    const integration = Math.min(1.0, proceduralScore * 1.1);

    return {
      type: 'procedural',
      activity: {
        description: 'Procedural thinking and systematic processing',
        intensity: coherence,
        duration: 0,
        quality: coherence,
        novelty: complexity * 0.6,
      },
      coherence,
      complexity,
      integration,
      timestamp: new Date(),
      features,
    };
  }

  /**
   * Extract emotional modality features
   */
  private async extractEmotionalModality(content: string): Promise<CognitiveModality> {
    const features: ModalityFeatures = {
      primary: {},
      secondary: {},
      patterns: [],
      anomalies: [],
    };

    // Emotional expression indicators
    const emotionalPatterns = [
      /\b(feel|emotion|feeling|affect|mood|sentiment)\b/gi,
      /\b(happy|sad|angry|afraid|surprised|disgusted|joyful|anxious)\b/gi,
      /\b(empathy|compassion|understanding|connection)\b.*\b(feelings|emotions)\b/gi,
      /\b(express|share|communicate)\b.*\b(emotions|feelings)\b/gi,
    ];

    let emotionalScore = 0;
    emotionalPatterns.forEach((pattern) => {
      const matches = content.match(pattern);
      if (matches) {
        emotionalScore += matches.length * 0.2;
        features.patterns.push({
          type: 'parallel',
          description: `Emotional expression pattern: ${pattern.source}`,
          strength: Math.min(1.0, matches.length * 0.3),
          frequency: matches.length,
          significance: 0.5,
        });
      }
    });

    features.primary = {
      emotionalScore: Math.min(1.0, emotionalScore),
    };

    const coherence = Math.min(1.0, emotionalScore * 0.85);
    const complexity = Math.min(1.0, emotionalScore * 0.9);
    const integration = Math.min(1.0, emotionalScore * 0.75);

    return {
      type: 'emotional',
      activity: {
        description: 'Emotional processing and expression',
        intensity: coherence,
        duration: 0,
        quality: coherence,
        novelty: complexity * 0.8,
      },
      coherence,
      complexity,
      integration,
      timestamp: new Date(),
      features,
    };
  }

  /**
   * Extract social modality features
   */
  private async extractSocialModality(content: string): Promise<CognitiveModality> {
    const features: ModalityFeatures = {
      primary: {},
      secondary: {},
      patterns: [],
      anomalies: [],
    };

    // Social cognition indicators
    const socialPatterns = [
      /\b(people|person|individual|group|team|community|society)\b/gi,
      /\b(interact|communicate|collaborate|cooperate|relate)\b.*\b(with|to)\b/gi,
      /\b(social|interpersonal|relationship|connection)\b.*\b(understanding|awareness)\b/gi,
      /\b(together|jointly|collectively|in concert)\b/gi,
    ];

    let socialScore = 0;
    socialPatterns.forEach((pattern) => {
      const matches = content.match(pattern);
      if (matches) {
        socialScore += matches.length * 0.2;
        features.patterns.push({
          type: 'parallel',
          description: `Social cognition pattern: ${pattern.source}`,
          strength: Math.min(1.0, matches.length * 0.25),
          frequency: matches.length,
          significance: 0.6,
        });
      }
    });

    features.primary = {
      socialScore: Math.min(1.0, socialScore),
    };

    const coherence = Math.min(1.0, socialScore * 0.9);
    const complexity = Math.min(1.0, socialScore * 0.85);
    const integration = Math.min(1.0, socialScore * 0.8);

    return {
      type: 'social',
      activity: {
        description: 'Social cognition and interpersonal awareness',
        intensity: coherence,
        duration: 0,
        quality: coherence,
        novelty: complexity * 0.7,
      },
      coherence,
      complexity,
      integration,
      timestamp: new Date(),
      features,
    };
  }

  /**
   * Extract metacognitive modality features
   */
  private async extractMetacognitiveModality(content: string): Promise<CognitiveModality> {
    const features: ModalityFeatures = {
      primary: {},
      secondary: {},
      patterns: [],
      anomalies: [],
    };

    // Metacognition indicators
    const metacognitivePatterns = [
      /\b(think about thinking|reflect on|consider my thinking|metacognitive)\b/gi,
      /\b(aware of my thoughts|conscious of my thinking|understand my understanding)\b/gi,
      /\b(monitor|regulate|control)\b.*\b(my thinking|cognition|thought process)\b/gi,
      /\b(self-awareness|self-reflection|self-monitoring)\b/gi,
    ];

    let metacognitiveScore = 0;
    metacognitivePatterns.forEach((pattern) => {
      const matches = content.match(pattern);
      if (matches) {
        metacognitiveScore += matches.length * 0.3;
        features.patterns.push({
          type: 'hierarchical',
          description: `Metacognitive pattern: ${pattern.source}`,
          strength: Math.min(1.0, matches.length * 0.4),
          frequency: matches.length,
          significance: 0.9,
        });
      }
    });

    features.primary = {
      metacognitiveScore: Math.min(1.0, metacognitiveScore),
    };

    const coherence = Math.min(1.0, metacognitiveScore * 0.95);
    const complexity = Math.min(1.0, metacognitiveScore * 1.1);
    const integration = Math.min(1.0, metacognitiveScore * 1.2);

    return {
      type: 'metacognitive',
      activity: {
        description: 'Metacognitive awareness and self-monitoring',
        intensity: coherence,
        duration: 0,
        quality: coherence,
        novelty: complexity,
      },
      coherence,
      complexity,
      integration,
      timestamp: new Date(),
      features,
    };
  }

  /**
   * Build comprehensive modality profile
   */
  private async buildModalityProfile(
    modalities: Map<ModalityType, CognitiveModality>
  ): Promise<ModalityProfile> {
    const modalityArray = Array.from(modalities.values());

    // Identify strengths and weaknesses
    const sortedByCoherence = modalityArray.sort((a, b) => b.coherence - a.coherence);
    const strengths = sortedByCoherence.slice(0, 3).map((m) => m.type);
    const weaknesses = sortedByCoherence.slice(-3).map((m) => m.type);

    // Calculate balance
    const coherenceScores = modalityArray.map((m) => m.coherence);
    const avgCoherence =
      coherenceScores.reduce((sum, score) => sum + score, 0) / coherenceScores.length;
    const variance =
      coherenceScores.reduce((sum, score) => sum + Math.pow(score - avgCoherence, 2), 0) /
      coherenceScores.length;
    const balance = Math.max(0, 1 - variance * 2); // Lower variance = higher balance

    // Calculate diversity
    const activeModalities = modalityArray.filter((m) => m.coherence > 0.3).length;
    const diversity = activeModalities / modalities.length;

    return {
      modalities,
      strengths,
      weaknesses,
      balance,
      diversity,
    };
  }

  /**
   * Detect integration patterns between modalities
   */
  private async detectIntegrationPatterns(
    modalities: Map<ModalityType, CognitiveModality>
  ): Promise<IntegrationPattern[]> {
    const patterns: IntegrationPattern[] = [];
    const modalityArray = Array.from(modalities.entries());

    // Analyze pairs of modalities for integration
    for (let i = 0; i < modalityArray.length; i++) {
      for (let j = i + 1; j < modalityArray.length; j++) {
        const [type1, modality1] = modalityArray[i];
        const [type2, modality2] = modalityArray[j];

        const integration = this.calculateModalityIntegration(modality1, modality2);
        if (integration.strength > 0.4) {
          patterns.push(integration);
        }
      }
    }

    // Detect multi-modal integration patterns
    const strongModalities = modalityArray.filter(([, m]) => m.coherence > 0.6);
    if (strongModalities.length >= 3) {
      patterns.push({
        type: 'cross_modal_synthesis',
        modalities: strongModalities.map(([type]) => type),
        strength: Math.min(1.0, strongModalities.length * 0.2),
        efficiency: 0.8,
        stability: 0.7,
        description: `Cross-modal synthesis across ${strongModalities.length} strong modalities`,
      });
    }

    return patterns;
  }

  /**
   * Analyze coherence dynamics over time
   */
  private async analyzeCoherenceDynamics(
    modalities: Map<ModalityType, CognitiveModality>,
    integrationPatterns: IntegrationPattern[]
  ): Promise<CoherenceDynamics> {
    // For static analysis, we'll infer dynamics from patterns
    const integrationStrength =
      integrationPatterns.reduce((sum, p) => sum + p.strength, 0) /
      Math.max(integrationPatterns.length, 1);

    const coherenceScores = Array.from(modalities.values()).map((m) => m.coherence);
    const volatility = this.calculateVolatility(coherenceScores);

    // Infer trend from integration patterns
    let trend: 'improving' | 'stable' | 'declining' | 'fluctuating' = 'stable';
    if (integrationStrength > 0.7) {trend = 'improving';}
    else if (integrationStrength < 0.3) {trend = 'declining';}
    else if (volatility > 0.5) {trend = 'fluctuating';}

    return {
      trend,
      volatility,
      resilience: Math.max(0, 1 - volatility),
      adaptability: integrationStrength,
      phaseTransitions: [], // Would be populated with time-series data
    };
  }

  /**
   * Generate health indicators for cognitive system
   */
  private async generateHealthIndicators(
    profile: ModalityProfile,
    patterns: IntegrationPattern[],
    dynamics: CoherenceDynamics
  ): Promise<HealthIndicator[]> {
    const indicators: HealthIndicator[] = [];

    // Integration health
    const integrationScore =
      patterns.reduce((sum, p) => sum + p.strength, 0) / Math.max(patterns.length, 1);
    indicators.push({
      category: 'integration',
      status: integrationScore > 0.7 ? 'optimal' : integrationScore > 0.5 ? 'good' : 'concerning',
      score: integrationScore,
      message: `Cognitive integration is ${
        integrationScore > 0.7
          ? 'optimal'
          : integrationScore > 0.5
          ? 'adequate'
          : 'needs improvement'
      }`,
      actionItems:
        integrationScore > 0.5
          ? []
          : ['Increase cross-modal activities', 'Practice integration exercises'],
    });

    // Coherence health
    const avgCoherence =
      Array.from(profile.modalities.values()).reduce((sum, m) => sum + m.coherence, 0) /
      profile.modalities.size;
    indicators.push({
      category: 'coherence',
      status: avgCoherence > 0.7 ? 'optimal' : avgCoherence > 0.5 ? 'good' : 'concerning',
      score: avgCoherence,
      message: `Overall cognitive coherence is ${
        avgCoherence > 0.7 ? 'optimal' : avgCoherence > 0.5 ? 'adequate' : 'below optimal'
      }`,
      actionItems:
        avgCoherence > 0.5
          ? []
          : ['Focus on coherence-building activities', 'Reduce cognitive fragmentation'],
    });

    // Balance health
    indicators.push({
      category: 'balance',
      status: profile.balance > 0.7 ? 'optimal' : profile.balance > 0.5 ? 'good' : 'concerning',
      score: profile.balance,
      message: `Modality balance is ${
        profile.balance > 0.7 ? 'optimal' : profile.balance > 0.5 ? 'adequate' : 'uneven'
      }`,
      actionItems:
        profile.balance > 0.5 ? [] : ['Develop weaker modalities', 'Balance cognitive activities'],
    });

    // Adaptability health
    indicators.push({
      category: 'adaptability',
      status:
        dynamics.adaptability > 0.7
          ? 'optimal'
          : dynamics.adaptability > 0.5
          ? 'good'
          : 'concerning',
      score: dynamics.adaptability,
      message: `Cognitive adaptability is ${
        dynamics.adaptability > 0.7
          ? 'optimal'
          : dynamics.adaptability > 0.5
          ? 'adequate'
          : 'needs enhancement'
      }`,
      actionItems:
        dynamics.adaptability > 0.5
          ? []
          : ['Increase novelty exposure', 'Practice flexible thinking'],
    });

    return indicators;
  }

  /**
   * Calculate overall coherence score
   */
  private calculateOverallCoherence(
    profile: ModalityProfile,
    patterns: IntegrationPattern[],
    dynamics: CoherenceDynamics
  ): number {
    const coherenceWeight = 0.4;
    const integrationWeight = 0.3;
    const balanceWeight = 0.2;
    const adaptabilityWeight = 0.1;

    const avgCoherence =
      Array.from(profile.modalities.values()).reduce((sum, m) => sum + m.coherence, 0) /
      profile.modalities.size;
    const avgIntegration =
      patterns.reduce((sum, p) => sum + p.strength, 0) / Math.max(patterns.length, 1);

    return Math.min(
      1.0,
      avgCoherence * coherenceWeight +
        avgIntegration * integrationWeight +
        profile.balance * balanceWeight +
        dynamics.adaptability * adaptabilityWeight
    );
  }

  /**
   * Generate coherence recommendations
   */
  private generateCoherenceRecommendations(
    overallScore: number,
    profile: ModalityProfile,
    patterns: IntegrationPattern[],
    healthIndicators: HealthIndicator[]
  ): string[] {
    const recommendations: string[] = [];

    if (overallScore >= 0.8) {
      recommendations.push(
        'Excellent cross-modal coherence - maintain current cognitive practices'
      );
      recommendations.push('Consider advanced integration challenges to further enhance coherence');
    } else if (overallScore >= 0.6) {
      recommendations.push(
        'Good coherence foundation - focus on strengthening integration patterns'
      );
      recommendations.push('Practice activities that engage multiple modalities simultaneously');
    } else if (overallScore >= 0.4) {
      recommendations.push('Moderate coherence - work on balancing cognitive modalities');
      recommendations.push('Identify and develop weaker modalities through targeted exercises');
    } else {
      recommendations.push(
        'Coherence needs significant improvement - start with foundational integration activities'
      );
      recommendations.push(
        'Focus on basic coherence-building practices before advancing to complex integration'
      );
    }

    // Add specific recommendations based on health indicators
    healthIndicators.forEach((indicator) => {
      if (indicator.status === 'concerning') {
        recommendations.push(...indicator.actionItems);
      }
    });

    // Add modality-specific recommendations
    if (profile.weaknesses.length > 0) {
      recommendations.push(
        `Focus on developing ${profile.weaknesses.join(
          ', '
        )} modalities through targeted activities`
      );
    }

    if (profile.diversity < 0.5) {
      recommendations.push(
        'Increase cognitive diversity by exploring different types of tasks and challenges'
      );
    }

    return recommendations;
  }

  // Helper methods for specific calculations
  private calculateLinguisticCoherence(features: Record<string, number>): number {
    const { complexityScore, vocabularyDiversity } = features;
    return Math.min(1.0, complexityScore * 0.6 + vocabularyDiversity * 0.4);
  }

  private calculateLinguisticIntegration(content: string, features: ModalityFeatures): number {
    // Integration is based on how well linguistic features work together
    const { complexityScore, vocabularyDiversity } = features.primary;
    return Math.min(1.0, complexityScore * 0.7 + vocabularyDiversity * 0.3);
  }

  private calculateModalityIntegration(
    modality1: CognitiveModality,
    modality2: CognitiveModality
  ): IntegrationPattern {
    const avgCoherence = (modality1.coherence + modality2.coherence) / 2;
    const avgIntegration = (modality1.integration + modality2.integration) / 2;

    let type: IntegrationType = 'sequential_integration';
    if (avgCoherence > 0.7 && avgIntegration > 0.7) {
      type = 'emergent_integration';
    } else if (avgIntegration > 0.6) {
      type = 'parallel_integration';
    }

    return {
      type,
      modalities: [modality1.type, modality2.type],
      strength: avgCoherence,
      efficiency: avgIntegration,
      stability: Math.min(1.0, avgCoherence * avgIntegration),
      description: `Integration between ${modality1.type} and ${modality2.type} modalities`,
    };
  }

  private calculateVolatility(scores: number[]): number {
    if (scores.length < 2) {return 0;}
    const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const variance =
      scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
    return Math.min(1.0, Math.sqrt(variance) * 2);
  }
}

/**
 * Factory function to create cross-modal coherence analyzer
 */
export function createCrossModalCoherenceAnalyzer(): CrossModalCoherenceAnalyzer {
  return new CrossModalCoherenceAnalyzer();
}

export default CrossModalCoherenceAnalyzer;
