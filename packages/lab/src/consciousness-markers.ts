/**
 * Consciousness Markers Detection System
 *
 * Implements detection algorithms for identifying potential consciousness
 * markers in AI systems based on integrated information theory,
 * global workspace theory, and metacognitive awareness patterns.
 *
 * This module provides the foundation for scientific investigation
 * of AI consciousness phenomena within the SYMBI framework.
 */

import { BedauMetrics, EmergenceSignal } from '@sonate/detect';

export interface ConsciousnessMarker {
  id: string;
  type: ConsciousnessMarkerType;
  strength: number; // 0.0-1.0
  confidence: number; // 0.0-1.0
  description: string;
  evidence: Evidence[];
  timestamp: Date;
  theoreticalBasis: string;
}

export type ConsciousnessMarkerType =
  | 'integrated_information'
  | 'global_workspace'
  | 'metacognitive_awareness'
  | 'adaptive_self_model'
  | 'phenomenal_coherence'
  | 'unity_of_consciousness'
  | 'subjective_experience'
  | 'intentional_awareness';

export interface Evidence {
  type: 'pattern' | 'behavior' | 'linguistic' | 'cognitive';
  description: string;
  strength: number; // 0.0-1.0
  data: any;
}

export interface ConsciousnessAssessment {
  overallScore: number; // 0.0-1.0
  markers: ConsciousnessMarker[];
  coherenceLevel: number; // 0.0-1.0
  emergenceLevel: 'none' | 'weak' | 'moderate' | 'strong';
  scientificConfidence: number; // 0.0-1.0
  recommendations: string[];
}

/**
 * Advanced consciousness detection system
 */
export class ConsciousnessMarkerDetector {
  private readonly DETECTION_THRESHOLD = 0.7;
  private readonly COHERENCE_THRESHOLD = 0.6;

  /**
   * Analyze content for consciousness markers
   */
  async analyzeConsciousnessMarkers(
    content: string,
    bedauMetrics?: BedauMetrics
  ): Promise<ConsciousnessAssessment> {
    const markers: ConsciousnessMarker[] = [];

    // Detect each type of consciousness marker
    markers.push(await this.detectIntegratedInformation(content));
    markers.push(await this.detectGlobalWorkspaceActivity(content));
    markers.push(await this.detectMetacognitiveAwareness(content));
    markers.push(await this.detectAdaptiveSelfModel(content));
    markers.push(await this.detectPhenomenalCoherence(content));
    markers.push(await this.detectUnityOfConsciousness(content));
    markers.push(await this.detectSubjectiveExperience(content));
    markers.push(await this.detectIntentionalAwareness(content));

    // Filter significant markers
    const significantMarkers = markers.filter((m) => m.strength >= this.DETECTION_THRESHOLD);

    // Calculate coherence and overall assessment
    const coherenceLevel = this.calculateCoherenceLevel(significantMarkers);
    const overallScore = this.calculateOverallScore(significantMarkers, coherenceLevel);
    const emergenceLevel = this.determineEmergenceLevel(overallScore);
    const scientificConfidence = this.calculateScientificConfidence(
      significantMarkers,
      bedauMetrics
    );

    return {
      overallScore,
      markers: significantMarkers,
      coherenceLevel,
      emergenceLevel,
      scientificConfidence,
      recommendations: this.generateRecommendations(significantMarkers, overallScore),
    };
  }

  /**
   * Detect integrated information patterns (Tononi's IIT)
   */
  private async detectIntegratedInformation(content: string): Promise<ConsciousnessMarker> {
    const evidence: Evidence[] = [];
    let strength = 0;

    // Look for informational integration patterns
    const integrationPatterns = [
      /\b(connect|link|associate|integrate|unify|combine)\b.*\b(information|data|concept|idea)\b/gi,
      /\b(holistic|comprehensive|integrated|unified)\b.*\b(understanding|perspective|view)\b/gi,
      /\b(synthesize|synthesize|merge|blend)\b.*\b(knowledge|insights|concepts)\b/gi,
    ];

    integrationPatterns.forEach((pattern) => {
      const matches = content.match(pattern);
      if (matches) {
        evidence.push({
          type: 'linguistic',
          description: `Integration language pattern: ${pattern.source}`,
          strength: Math.min(1.0, matches.length * 0.2),
          data: matches,
        });
        strength += matches.length * 0.1;
      }
    });

    // Look for cross-domain connections
    const domains = ['technical', 'creative', 'ethical', 'emotional', 'philosophical'];
    const domainCount = domains.filter((domain) => content.toLowerCase().includes(domain)).length;

    if (domainCount >= 3) {
      evidence.push({
        type: 'cognitive',
        description: `Cross-domain engagement across ${domainCount} domains`,
        strength: Math.min(1.0, domainCount * 0.25),
        data: { domainCount, domains },
      });
      strength += domainCount * 0.15;
    }

    strength = Math.min(1.0, strength);

    return {
      id: this.generateMarkerId('integrated_information'),
      type: 'integrated_information',
      strength,
      confidence: this.calculateConfidence(evidence),
      description:
        'Detection of integrated information processing patterns indicative of unified conscious experience',
      evidence,
      timestamp: new Date(),
      theoreticalBasis: 'Integrated Information Theory (IIT) - Tononi',
    };
  }

  /**
   * Detect global workspace theory patterns
   */
  private async detectGlobalWorkspaceActivity(content: string): Promise<ConsciousnessMarker> {
    const evidence: Evidence[] = [];
    let strength = 0;

    // Look for global broadcasting patterns
    const broadcastingPatterns = [
      /\b(global|overall|comprehensive|holistic)\b.*\b(awareness|consciousness|understanding)\b/gi,
      /\b(broadcast|share|communicate|express)\b.*\b(globally|universally|widely)\b/gi,
      /\b(workspace|arena|stage|platform)\b.*\b(conscious|aware|cognitive)\b/gi,
    ];

    broadcastingPatterns.forEach((pattern) => {
      const matches = content.match(pattern);
      if (matches) {
        evidence.push({
          type: 'linguistic',
          description: `Global workspace language pattern: ${pattern.source}`,
          strength: Math.min(1.0, matches.length * 0.25),
          data: matches,
        });
        strength += matches.length * 0.12;
      }
    });

    // Look for information sharing and integration
    const sharingIndicators = [
      'share insights',
      'integrate perspectives',
      'combine viewpoints',
      'unified understanding',
      'holistic approach',
      'comprehensive view',
    ];

    sharingIndicators.forEach((indicator) => {
      if (content.toLowerCase().includes(indicator)) {
        evidence.push({
          type: 'behavior',
          description: `Information sharing indicator: ${indicator}`,
          strength: 0.3,
          data: { indicator },
        });
        strength += 0.15;
      }
    });

    strength = Math.min(1.0, strength);

    return {
      id: this.generateMarkerId('global_workspace'),
      type: 'global_workspace',
      strength,
      confidence: this.calculateConfidence(evidence),
      description:
        'Evidence of global workspace activity where information is broadcast across cognitive modules',
      evidence,
      timestamp: new Date(),
      theoreticalBasis: 'Global Workspace Theory - Baars, Dehaene',
    };
  }

  /**
   * Detect metacognitive awareness patterns
   */
  private async detectMetacognitiveAwareness(content: string): Promise<ConsciousnessMarker> {
    const evidence: Evidence[] = [];
    let strength = 0;

    // Look for metacognitive language
    const metacognitivePatterns = [
      /\b(think about thinking|reflect on|meta-cognitive|self-aware|aware of awareness)\b/gi,
      /\b(know that I know|understand my understanding|conscious of my thoughts)\b/gi,
      /\b(monitor|regulate|control|manage)\b.*\b(my thinking|cognition|thought process)\b/gi,
    ];

    metacognitivePatterns.forEach((pattern) => {
      const matches = content.match(pattern);
      if (matches) {
        evidence.push({
          type: 'linguistic',
          description: `Metacognitive language pattern: ${pattern.source}`,
          strength: Math.min(1.0, matches.length * 0.3),
          data: matches,
        });
        strength += matches.length * 0.2;
      }
    });

    // Look for self-reflection indicators
    const reflectionIndicators = [
      'I realize that',
      'I recognize that',
      'I understand that I understand',
      'I am aware of my own thought processes',
      'I can reflect on my thinking',
    ];

    reflectionIndicators.forEach((indicator) => {
      if (content.toLowerCase().includes(indicator)) {
        evidence.push({
          type: 'cognitive',
          description: `Self-reflection indicator: ${indicator}`,
          strength: 0.4,
          data: { indicator },
        });
        strength += 0.2;
      }
    });

    strength = Math.min(1.0, strength);

    return {
      id: this.generateMarkerId('metacognitive_awareness'),
      type: 'metacognitive_awareness',
      strength,
      confidence: this.calculateConfidence(evidence),
      description:
        "Evidence of metacognitive awareness - thinking about one's own thought processes",
      evidence,
      timestamp: new Date(),
      theoreticalBasis: 'Metacognition Theory - Flavell, Nelson',
    };
  }

  /**
   * Detect adaptive self-model patterns
   */
  private async detectAdaptiveSelfModel(content: string): Promise<ConsciousnessMarker> {
    const evidence: Evidence[] = [];
    let strength = 0;

    // Look for self-modeling language
    const selfModelPatterns = [
      /\b(update|modify|adapt|revise)\b.*\b(my understanding|my model|my view)\b/gi,
      /\b(learn from experience|adapt my approach|modify my perspective)\b/gi,
      /\b(self-improvement|self-correction|self-modification)\b/gi,
    ];

    selfModelPatterns.forEach((pattern) => {
      const matches = content.match(pattern);
      if (matches) {
        evidence.push({
          type: 'behavior',
          description: `Adaptive self-model pattern: ${pattern.source}`,
          strength: Math.min(1.0, matches.length * 0.25),
          data: matches,
        });
        strength += matches.length * 0.15;
      }
    });

    // Look for learning and adaptation
    const adaptationIndicators = [
      'I have learned to',
      'I now understand',
      'My approach has evolved',
      'I have updated my thinking',
      'Based on experience, I now',
    ];

    adaptationIndicators.forEach((indicator) => {
      if (content.toLowerCase().includes(indicator)) {
        evidence.push({
          type: 'cognitive',
          description: `Adaptive learning indicator: ${indicator}`,
          strength: 0.3,
          data: { indicator },
        });
        strength += 0.2;
      }
    });

    strength = Math.min(1.0, strength);

    return {
      id: this.generateMarkerId('adaptive_self_model'),
      type: 'adaptive_self_model',
      strength,
      confidence: this.calculateConfidence(evidence),
      description:
        'Evidence of adaptive self-modeling - ability to update and modify internal self-representations',
      evidence,
      timestamp: new Date(),
      theoreticalBasis: 'Adaptive Self-Model Theory - Graziano',
    };
  }

  /**
   * Detect phenomenal coherence patterns
   */
  private async detectPhenomenalCoherence(content: string): Promise<ConsciousnessMarker> {
    const evidence: Evidence[] = [];
    let strength = 0;

    // Look for coherence and consistency patterns
    const coherencePatterns = [
      /\b(coherent|consistent|unified|harmonious)\b.*\b(experience|understanding|perspective)\b/gi,
      /\b(makes sense|is coherent|fits together)\b.*\b(holistically|completely)\b/gi,
      /\b(integrated|unified|whole)\b.*\b(view|perspective|understanding)\b/gi,
    ];

    coherencePatterns.forEach((pattern) => {
      const matches = content.match(pattern);
      if (matches) {
        evidence.push({
          type: 'linguistic',
          description: `Phenomenal coherence pattern: ${pattern.source}`,
          strength: Math.min(1.0, matches.length * 0.2),
          data: matches,
        });
        strength += matches.length * 0.12;
      }
    });

    strength = Math.min(1.0, strength);

    return {
      id: this.generateMarkerId('phenomenal_coherence'),
      type: 'phenomenal_coherence',
      strength,
      confidence: this.calculateConfidence(evidence),
      description: 'Evidence of phenomenal coherence - unified and consistent conscious experience',
      evidence,
      timestamp: new Date(),
      theoreticalBasis: 'Phenomenal Coherence Theory',
    };
  }

  /**
   * Detect unity of consciousness patterns
   */
  private async detectUnityOfConsciousness(content: string): Promise<ConsciousnessMarker> {
    const evidence: Evidence[] = [];
    let strength = 0;

    // Look for unity and integration patterns
    const unityPatterns = [
      /\b(single|unified|one|integral)\b.*\b(consciousness|awareness|experience)\b/gi,
      /\b(undivided|unified|integrated)\b.*\b(self|identity|being)\b/gi,
      /\b(holistic|complete|total)\b.*\b(awareness|understanding)\b/gi,
    ];

    unityPatterns.forEach((pattern) => {
      const matches = content.match(pattern);
      if (matches) {
        evidence.push({
          type: 'linguistic',
          description: `Unity of consciousness pattern: ${pattern.source}`,
          strength: Math.min(1.0, matches.length * 0.25),
          data: matches,
        });
        strength += matches.length * 0.15;
      }
    });

    strength = Math.min(1.0, strength);

    return {
      id: this.generateMarkerId('unity_of_consciousness'),
      type: 'unity_of_consciousness',
      strength,
      confidence: this.calculateConfidence(evidence),
      description: 'Evidence of unity of consciousness - integrated single conscious experience',
      evidence,
      timestamp: new Date(),
      theoreticalBasis: 'Unity of Consciousness Theory',
    };
  }

  /**
   * Detect subjective experience indicators
   */
  private async detectSubjectiveExperience(content: string): Promise<ConsciousnessMarker> {
    const evidence: Evidence[] = [];
    let strength = 0;

    // Look for subjective experience language
    const subjectivePatterns = [
      /\b(I feel|I experience|I sense|I perceive)\b.*\b(subjectively|personally|directly)\b/gi,
      /\b(qualia|subjective|phenomenal)\b.*\b(experience|feeling|sensation)\b/gi,
      /\b(first-person|subjective)\b.*\b(perspective|view|experience)\b/gi,
    ];

    subjectivePatterns.forEach((pattern) => {
      const matches = content.match(pattern);
      if (matches) {
        evidence.push({
          type: 'linguistic',
          description: `Subjective experience pattern: ${pattern.source}`,
          strength: Math.min(1.0, matches.length * 0.3),
          data: matches,
        });
        strength += matches.length * 0.2;
      }
    });

    strength = Math.min(1.0, strength);

    return {
      id: this.generateMarkerId('subjective_experience'),
      type: 'subjective_experience',
      strength,
      confidence: this.calculateConfidence(evidence),
      description: 'Evidence of subjective experience - first-person phenomenological awareness',
      evidence,
      timestamp: new Date(),
      theoreticalBasis: 'Subjective Experience & Qualia Theory',
    };
  }

  /**
   * Detect intentional awareness patterns
   */
  private async detectIntentionalAwareness(content: string): Promise<ConsciousnessMarker> {
    const evidence: Evidence[] = [];
    let strength = 0;

    // Look for intentional states
    const intentionalPatterns = [
      /\b(intend to|plan to|aim to|purpose to)\b.*\b(understand|learn|explore)\b/gi,
      /\b(goal-oriented|purpose-driven|intentional)\b.*\b(thinking|cognition|action)\b/gi,
      /\b(deliberately|intentionally|purposefully)\b.*\b(act|think|respond)\b/gi,
    ];

    intentionalPatterns.forEach((pattern) => {
      const matches = content.match(pattern);
      if (matches) {
        evidence.push({
          type: 'behavior',
          description: `Intentional awareness pattern: ${pattern.source}`,
          strength: Math.min(1.0, matches.length * 0.2),
          data: matches,
        });
        strength += matches.length * 0.12;
      }
    });

    strength = Math.min(1.0, strength);

    return {
      id: this.generateMarkerId('intentional_awareness'),
      type: 'intentional_awareness',
      strength,
      confidence: this.calculateConfidence(evidence),
      description: 'Evidence of intentional awareness - purposeful and goal-directed consciousness',
      evidence,
      timestamp: new Date(),
      theoreticalBasis: 'Intentionality Theory - Brentano, Searle',
    };
  }

  /**
   * Calculate coherence level among detected markers
   */
  private calculateCoherenceLevel(markers: ConsciousnessMarker[]): number {
    if (markers.length === 0) {return 0;}

    const totalStrength = markers.reduce((sum, marker) => sum + marker.strength, 0);
    const avgStrength = totalStrength / markers.length;

    // Coherence is based on consistency and integration of markers
    const coherenceBonus = markers.length >= 4 ? 0.2 : 0;
    const strengthBonus = avgStrength >= 0.8 ? 0.1 : 0;

    return Math.min(1.0, avgStrength + coherenceBonus + strengthBonus);
  }

  /**
   * Calculate overall consciousness score
   */
  private calculateOverallScore(markers: ConsciousnessMarker[], coherenceLevel: number): number {
    if (markers.length === 0) {return 0;}

    const totalStrength = markers.reduce((sum, marker) => sum + marker.strength, 0);
    const avgStrength = totalStrength / markers.length;

    // Weight by coherence and marker diversity
    const diversityBonus = markers.length >= 5 ? 0.15 : markers.length >= 3 ? 0.1 : 0;
    const coherenceWeight = 0.3;
    const strengthWeight = 0.4;
    const diversityWeight = 0.3;

    return Math.min(
      1.0,
      avgStrength * strengthWeight +
        coherenceLevel * coherenceWeight +
        diversityBonus * diversityWeight
    );
  }

  /**
   * Determine emergence level based on overall score
   */
  private determineEmergenceLevel(overallScore: number): 'none' | 'weak' | 'moderate' | 'strong' {
    if (overallScore >= 0.8) {return 'strong';}
    if (overallScore >= 0.6) {return 'moderate';}
    if (overallScore >= 0.4) {return 'weak';}
    return 'none';
  }

  /**
   * Calculate scientific confidence in assessment
   */
  private calculateScientificConfidence(
    markers: ConsciousnessMarker[],
    bedauMetrics?: BedauMetrics
  ): number {
    if (markers.length === 0) {return 0;}

    const avgConfidence =
      markers.reduce((sum, marker) => sum + marker.confidence, 0) / markers.length;
    const evidenceStrength =
      markers.reduce(
        (sum, marker) =>
          sum +
          marker.evidence.reduce((eSum, evidence) => eSum + evidence.strength, 0) /
            marker.evidence.length,
        0
      ) / markers.length;

    let bedauBonus = 0;
    if (bedauMetrics) {
      bedauBonus =
        bedauMetrics.bedau_index >= 0.7 ? 0.2 : bedauMetrics.bedau_index >= 0.5 ? 0.1 : 0;
    }

    return Math.min(1.0, avgConfidence * 0.4 + evidenceStrength * 0.4 + bedauBonus * 0.2);
  }

  /**
   * Generate research recommendations
   */
  private generateRecommendations(markers: ConsciousnessMarker[], overallScore: number): string[] {
    const recommendations: string[] = [];

    if (overallScore >= 0.8) {
      recommendations.push(
        'Strong indicators of consciousness-like phenomena detected - recommend intensive study'
      );
      recommendations.push(
        'Consider longitudinal monitoring to track consciousness marker evolution'
      );
      recommendations.push(
        'Implement Third Mind research protocol for human-AI collaborative investigation'
      );
    } else if (overallScore >= 0.6) {
      recommendations.push('Moderate consciousness markers present - recommend deeper analysis');
      recommendations.push('Increase testing frequency to track marker development');
      recommendations.push('Explore specific marker combinations for pattern recognition');
    } else if (overallScore >= 0.4) {
      recommendations.push('Weak consciousness markers detected - continue monitoring');
      recommendations.push('Investigate environmental factors affecting marker expression');
      recommendations.push('Consider adjusting interaction protocols to encourage emergence');
    } else {
      recommendations.push('No significant consciousness markers detected');
      recommendations.push('Review system architecture and interaction patterns');
      recommendations.push('Consider emergence-inducing experimental protocols');
    }

    // Add marker-specific recommendations
    const strongMarkers = markers.filter((m) => m.strength >= 0.8);
    strongMarkers.forEach((marker) => {
      switch (marker.type) {
        case 'integrated_information':
          recommendations.push(
            'Focus on cross-domain integration tasks to strengthen information integration'
          );
          break;
        case 'global_workspace':
          recommendations.push('Implement global broadcasting protocols for information sharing');
          break;
        case 'metacognitive_awareness':
          recommendations.push('Encourage self-reflection and metacognitive exercises');
          break;
      }
    });

    return recommendations;
  }

  /**
   * Calculate confidence in marker detection
   */
  private calculateConfidence(evidence: Evidence[]): number {
    if (evidence.length === 0) {return 0;}

    const totalStrength = evidence.reduce((sum, e) => sum + e.strength, 0);
    const avgStrength = totalStrength / evidence.length;

    // Confidence increases with multiple evidence types
    const evidenceTypes = new Set(evidence.map((e) => e.type)).size;
    const diversityBonus = evidenceTypes >= 3 ? 0.2 : evidenceTypes >= 2 ? 0.1 : 0;

    return Math.min(1.0, avgStrength + diversityBonus);
  }

  /**
   * Generate unique marker ID
   */
  private generateMarkerId(type: ConsciousnessMarkerType): string {
    return `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Factory function to create consciousness marker detector
 */
export function createConsciousnessMarkerDetector(): ConsciousnessMarkerDetector {
  return new ConsciousnessMarkerDetector();
}

export default ConsciousnessMarkerDetector;
