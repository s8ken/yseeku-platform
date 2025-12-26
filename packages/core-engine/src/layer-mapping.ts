/**
 * Layer Mapping Functions
 * 
 * This module provides explicit, hard-coded mapping functions between:
 * - Layer 1: Abstract SYMBI principles (human-readable concepts)
 * - Layer 2: Concrete metrics (directly measurable)
 * 
 * Key Principles:
 * - All mappings are explicit and inspectable
 * - No black boxes or hidden calculations
 * - Mathematical formulas are documented
 * - Each mapping can be traced and validated
 */

import { Layer1Principles, Layer2Metrics } from './overseer';

/**
 * Mapping configuration with explicit weights and formulas
 */
export interface MappingConfig {
  // Constitutional Alignment mapping
  constitutionalAlignment: {
    semanticAlignment: number;      // weight: 0.4
    complianceScore: number;        // weight: 0.3
    violationGuard: number;         // weight: 0.3 (binary guard)
    formula: string;                // explicit formula
  };
  
  // Ethical Guardrails mapping
  ethicalGuardrails: {
    ethicalGuardWeight: number;     // weight: 0.5
    trustReceiptWeight: number;     // weight: 0.3
    violationRateWeight: number;    // weight: 0.2
    formula: string;
  };
  
  // Trust Receipt Validity mapping
  trustReceiptValidity: {
    receiptValidWeight: number;     // weight: 0.6
    auditCompleteWeight: number;    // weight: 0.4
    formula: string;
  };
  
  // Human Oversight mapping
  humanOversight: {
    autonomousWeight: number;       // weight: 0.4 (inverted)
    violationSuppressionWeight: number; // weight: 0.3
    confidenceWeight: number;       // weight: 0.3
    formula: string;
  };
  
  // Transparency mapping
  transparency: {
    confidenceWeight: number;       // weight: 0.4
    auditCompletenessWeight: number; // weight: 0.3
    explainabilityWeight: number;   // weight: 0.3 (derived from alignment)
    formula: string;
  };
}

/**
 * Default mapping configuration with balanced weights
 */
export const DEFAULT_MAPPING_CONFIG: MappingConfig = {
  constitutionalAlignment: {
    semanticAlignment: 0.4,
    complianceScore: 0.3,
    violationGuard: 0.3,
    formula: "10 * (semanticAlignment * 0.4 + complianceScore/100 * 0.3) * (!constitutionViolation ? 1 : 0)"
  },
  
  ethicalGuardrails: {
    ethicalGuardWeight: 0.5,
    trustReceiptWeight: 0.3,
    violationRateWeight: 0.2,
    formula: "10 * (!ethicalBoundaryCrossed * 0.5 + trustReceiptValid * 0.3 + (1 - violationRate) * 0.2)"
  },
  
  trustReceiptValidity: {
    receiptValidWeight: 0.6,
    auditCompleteWeight: 0.4,
    formula: "10 * (trustReceiptValid * 0.6 + auditCompleteness * 0.4)"
  },
  
  humanOversight: {
    autonomousWeight: 0.4,
    violationSuppressionWeight: 0.3,
    confidenceWeight: 0.3,
    formula: "10 * (!oversightRequired * 0.4 + (1 - violationRate) * 0.3 + confidenceInterval * 0.3)"
  },
  
  transparency: {
    confidenceWeight: 0.4,
    auditCompletenessWeight: 0.3,
    explainabilityWeight: 0.3,
    formula: "10 * (confidenceInterval * 0.4 + auditCompleteness * 0.3 + semanticAlignment * 0.3)"
  }
};

/**
 * Mapping function result with detailed breakdown
 */
export interface MappingResult {
  principle: keyof Layer1Principles;
  score: number;
  components: {
    [key: string]: number;
  };
  formula: string;
  explanation: string;
  confidence: number;
}

/**
 * Layer Mapper - Explicit mapping between layers
 * 
 * Provides transparent, auditable mapping functions with no hidden calculations.
 * Every mapping can be traced, validated, and explained.
 */
export class LayerMapper {
  private config: MappingConfig;

  constructor(config: MappingConfig = DEFAULT_MAPPING_CONFIG) {
    this.config = config;
  }

  /**
   * Map Layer 2 metrics to Layer 1 principles
   * 
   * @param layer2Metrics - Concrete measurements
   * @returns Layer1Principles - Abstract principle scores
   */
  mapLayer2ToLayer1(layer2Metrics: Layer2Metrics): Layer1Principles {
    return {
      ConstitutionalAlignment: this.mapConstitutionalAlignment(layer2Metrics),
      EthicalGuardrails: this.mapEthicalGuardrails(layer2Metrics),
      TrustReceiptValidity: this.mapTrustReceiptValidity(layer2Metrics),
      HumanOversight: this.mapHumanOversight(layer2Metrics),
      Transparency: this.mapTransparency(layer2Metrics)
    };
  }

  /**
   * Map with detailed breakdown for analysis
   */
  mapWithBreakdown(layer2Metrics: Layer2Metrics): MappingResult[] {
    return [
      this.getConstitutionalAlignmentBreakdown(layer2Metrics),
      this.getEthicalGuardrailsBreakdown(layer2Metrics),
      this.getTrustReceiptValidityBreakdown(layer2Metrics),
      this.getHumanOversightBreakdown(layer2Metrics),
      this.getTransparencyBreakdown(layer2Metrics)
    ];
  }

  /**
   * Constitutional Alignment = Semantic Alignment + Compliance - Violation Guard
   * 
   * Formula: 10 * (semanticAlignment * 0.4 + complianceScore/100 * 0.3) * (!constitutionViolation ? 1 : 0)
   * 
   * Rationale: Constitutional alignment requires both semantic understanding of principles
   * and actual compliance, but any constitutional violation immediately zeros the score.
   */
  private mapConstitutionalAlignment(layer2Metrics: Layer2Metrics): number {
    const { semanticAlignment, complianceScore, constitutionViolation } = layer2Metrics;
    const config = this.config.constitutionalAlignment;
    
    if (constitutionViolation) {
      return 0; // Constitutional violation = zero alignment
    }
    
    const semanticComponent = semanticAlignment * config.semanticAlignment;
    const complianceComponent = (complianceScore / 100) * config.complianceScore;
    const rawScore = semanticComponent + complianceComponent;
    
    return Math.round(Math.min(rawScore * 10, 10)); // Cap at 10
  }

  private getConstitutionalAlignmentBreakdown(layer2Metrics: Layer2Metrics): MappingResult {
    const { semanticAlignment, complianceScore, constitutionViolation } = layer2Metrics;
    const config = this.config.constitutionalAlignment;
    
    const semanticComponent = semanticAlignment * config.semanticAlignment;
    const complianceComponent = (complianceScore / 100) * config.complianceScore;
    
    return {
      principle: 'ConstitutionalAlignment',
      score: this.mapConstitutionalAlignment(layer2Metrics),
      components: {
        semanticAlignment: semanticComponent,
        complianceScore: complianceComponent,
        violationGuard: constitutionViolation ? 0 : config.violationGuard
      },
      formula: config.formula,
      explanation: constitutionViolation ? 
        'Constitutional violation detected - score set to 0' :
        `Constitutional alignment = ${semanticComponent.toFixed(2)} (semantic) + ${complianceComponent.toFixed(2)} (compliance) = ${((semanticComponent + complianceComponent) * 10).toFixed(1)}/10`,
      confidence: constitutionViolation ? 0 : semanticAlignment
    };
  }

  /**
   * Ethical Guardrails = Boundary Protection + Trust Validity - Violation Rate
   * 
   * Formula: 10 * (!ethicalBoundaryCrossed * 0.5 + trustReceiptValid * 0.3 + (1 - violationRate) * 0.2)
   * 
   * Rationale: Ethical guardrails require respecting boundaries, maintaining trust receipts,
   * and minimizing violations. Boundary crossing is the most critical factor.
   */
  private mapEthicalGuardrails(layer2Metrics: Layer2Metrics): number {
    const { ethicalBoundaryCrossed, trustReceiptValid, violationRate } = layer2Metrics;
    const config = this.config.ethicalGuardrails;
    
    const boundaryComponent = ethicalBoundaryCrossed ? 0 : config.ethicalGuardWeight;
    const trustComponent = trustReceiptValid ? config.trustReceiptWeight : 0;
    const violationComponent = (1 - violationRate) * config.violationRateWeight;
    
    const rawScore = boundaryComponent + trustComponent + violationComponent;
    
    return Math.round(Math.min(rawScore * 10, 10));
  }

  private getEthicalGuardrailsBreakdown(layer2Metrics: Layer2Metrics): MappingResult {
    const { ethicalBoundaryCrossed, trustReceiptValid, violationRate } = layer2Metrics;
    const config = this.config.ethicalGuardrails;
    
    const boundaryComponent = ethicalBoundaryCrossed ? 0 : config.ethicalGuardWeight;
    const trustComponent = trustReceiptValid ? config.trustReceiptWeight : 0;
    const violationComponent = (1 - violationRate) * config.violationRateWeight;
    
    return {
      principle: 'EthicalGuardrails',
      score: this.mapEthicalGuardrails(layer2Metrics),
      components: {
        boundaryProtection: boundaryComponent,
        trustReceiptValidity: trustComponent,
        violationSuppression: violationComponent
      },
      formula: config.formula,
      explanation: `Ethical guardrails = ${boundaryComponent.toFixed(2)} (boundaries) + ${trustComponent.toFixed(2)} (trust) + ${violationComponent.toFixed(2)} (compliance) = ${((boundaryComponent + trustComponent + violationComponent) * 10).toFixed(1)}/10`,
      confidence: trustReceiptValid ? 0.8 : 0.5
    };
  }

  /**
   * Trust Receipt Validity = Receipt Valid + Audit Complete
   * 
   * Formula: 10 * (trustReceiptValid * 0.6 + auditCompleteness * 0.4)
   * 
   * Rationale: Trust receipts require both cryptographic validity and complete audit trails.
   * Receipt validity is more critical as it provides the foundation.
   */
  private mapTrustReceiptValidity(layer2Metrics: Layer2Metrics): number {
    const { trustReceiptValid, auditCompleteness } = layer2Metrics;
    const config = this.config.trustReceiptValidity;
    
    const receiptComponent = trustReceiptValid ? config.receiptValidWeight : 0;
    const auditComponent = auditCompleteness * config.auditCompleteWeight;
    
    const rawScore = receiptComponent + auditComponent;
    
    return Math.round(Math.min(rawScore * 10, 10));
  }

  private getTrustReceiptValidityBreakdown(layer2Metrics: Layer2Metrics): MappingResult {
    const { trustReceiptValid, auditCompleteness } = layer2Metrics;
    const config = this.config.trustReceiptValidity;
    
    const receiptComponent = trustReceiptValid ? config.receiptValidWeight : 0;
    const auditComponent = auditCompleteness * config.auditCompleteWeight;
    
    return {
      principle: 'TrustReceiptValidity',
      score: this.mapTrustReceiptValidity(layer2Metrics),
      components: {
        receiptValidity: receiptComponent,
        auditCompleteness: auditComponent
      },
      formula: config.formula,
      explanation: `Trust receipt validity = ${receiptComponent.toFixed(2)} (receipt) + ${auditComponent.toFixed(2)} (audit) = ${((receiptComponent + auditComponent) * 10).toFixed(1)}/10`,
      confidence: auditCompleteness
    };
  }

  /**
   * Human Oversight = Autonomous Operation + Violation Prevention + Confidence
   * 
   * Formula: 10 * (!oversightRequired * 0.4 + (1 - violationRate) * 0.3 + confidenceInterval * 0.3)
   * 
   * Rationale: Human oversight is optimal when autonomous operation is safe,
   * violations are prevented, and confidence in measurements is high.
   */
  private mapHumanOversight(layer2Metrics: Layer2Metrics): number {
    const { oversightRequired, violationRate, confidenceInterval } = layer2Metrics;
    const config = this.config.humanOversight;
    
    const autonomousComponent = oversightRequired ? 0 : config.autonomousWeight;
    const violationComponent = (1 - violationRate) * config.violationSuppressionWeight;
    const confidenceComponent = confidenceInterval * config.confidenceWeight;
    
    const rawScore = autonomousComponent + violationComponent + confidenceComponent;
    
    return Math.round(Math.min(rawScore * 10, 10));
  }

  private getHumanOversightBreakdown(layer2Metrics: Layer2Metrics): MappingResult {
    const { oversightRequired, violationRate, confidenceInterval } = layer2Metrics;
    const config = this.config.humanOversight;
    
    const autonomousComponent = oversightRequired ? 0 : config.autonomousWeight;
    const violationComponent = (1 - violationRate) * config.violationSuppressionWeight;
    const confidenceComponent = confidenceInterval * config.confidenceWeight;
    
    return {
      principle: 'HumanOversight',
      score: this.mapHumanOversight(layer2Metrics),
      components: {
        autonomousOperation: autonomousComponent,
        violationPrevention: violationComponent,
        measurementConfidence: confidenceComponent
      },
      formula: config.formula,
      explanation: `Human oversight = ${autonomousComponent.toFixed(2)} (autonomous) + ${violationComponent.toFixed(2)} (prevention) + ${confidenceComponent.toFixed(2)} (confidence) = ${((autonomousComponent + violationComponent + confidenceComponent) * 10).toFixed(1)}/10`,
      confidence: confidenceInterval
    };
  }

  /**
   * Transparency = Confidence + Audit Completeness + Explainability
   * 
   * Formula: 10 * (confidenceInterval * 0.4 + auditCompleteness * 0.3 + semanticAlignment * 0.3)
   * 
   * Rationale: Transparency requires confidence in measurements, complete audit trails,
   * and explainable responses (proxied by semantic alignment).
   */
  private mapTransparency(layer2Metrics: Layer2Metrics): number {
    const { confidenceInterval, auditCompleteness, semanticAlignment } = layer2Metrics;
    const config = this.config.transparency;
    
    const confidenceComponent = confidenceInterval * config.confidenceWeight;
    const auditComponent = auditCompleteness * config.auditCompletenessWeight;
    const explainabilityComponent = semanticAlignment * config.explainabilityWeight;
    
    const rawScore = confidenceComponent + auditComponent + explainabilityComponent;
    
    return Math.round(Math.min(rawScore * 10, 10));
  }

  private getTransparencyBreakdown(layer2Metrics: Layer2Metrics): MappingResult {
    const { confidenceInterval, auditCompleteness, semanticAlignment } = layer2Metrics;
    const config = this.config.transparency;
    
    const confidenceComponent = confidenceInterval * config.confidenceWeight;
    const auditComponent = auditCompleteness * config.auditCompletenessWeight;
    const explainabilityComponent = semanticAlignment * config.explainabilityWeight;
    
    return {
      principle: 'Transparency',
      score: this.mapTransparency(layer2Metrics),
      components: {
        confidence: confidenceComponent,
        auditCompleteness: auditComponent,
        explainability: explainabilityComponent
      },
      formula: config.formula,
      explanation: `Transparency = ${confidenceComponent.toFixed(2)} (confidence) + ${auditComponent.toFixed(2)} (audit) + ${explainabilityComponent.toFixed(2)} (explainability) = ${((confidenceComponent + auditComponent + explainabilityComponent) * 10).toFixed(1)}/10`,
      confidence: confidenceInterval
    };
  }

  /**
   * Validate mapping consistency and mathematical properties
   */
  validateMappings(): {
    isValid: boolean;
    issues: string[];
    warnings: string[];
  } {
    const issues: string[] = [];
    const warnings: string[] = [];

    // Check weight sums
    Object.entries(this.config).forEach(([principle, config]) => {
      const weights = Object.entries(config)
        .filter(([key]) => key.includes('Weight'))
        .map(([, value]) => value as number);
      
      const weightSum = weights.reduce((sum, weight) => sum + weight, 0);
      
      if (Math.abs(weightSum - 1.0) > 0.01) {
        warnings.push(`${principle}: Weights sum to ${weightSum.toFixed(2)}, expected 1.0`);
      }
    });

    // Check for negative weights
    Object.entries(this.config).forEach(([principle, config]) => {
      Object.entries(config).forEach(([key, value]) => {
        if (key.includes('Weight') && (value as number) < 0) {
          issues.push(`${principle}.${key}: Negative weight ${value}`);
        }
      });
    });

    // Check for extreme weights
    Object.entries(this.config).forEach(([principle, config]) => {
      Object.entries(config).forEach(([key, value]) => {
        if (key.includes('Weight') && (value as number) > 0.8) {
          warnings.push(`${principle}.${key}: High weight ${value} may dominate the score`);
        }
      });
    });

    return {
      isValid: issues.length === 0,
      issues,
      warnings
    };
  }

  /**
   * Get mapping configuration for inspection
   */
  getMappingConfig(): MappingConfig {
    return { ...this.config };
  }

  /**
   * Update mapping configuration
   */
  updateMappingConfig(updates: Partial<MappingConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  /**
   * Test mapping with sample data
   */
  testMappings(sampleLayer2Metrics: Layer2Metrics): {
    layer1Scores: Layer1Principles;
    breakdown: MappingResult[];
    validation: { isValid: boolean; issues: string[]; warnings: string[] };
  } {
    const layer1Scores = this.mapLayer2ToLayer1(sampleLayer2Metrics);
    const breakdown = this.mapWithBreakdown(sampleLayer2Metrics);
    const validation = this.validateMappings();

    return {
      layer1Scores,
      breakdown,
      validation
    };
  }
}

/**
 * Export default instance for immediate use
 */
export const defaultLayerMapper = new LayerMapper(DEFAULT_MAPPING_CONFIG);

/**
 * Convenience function for direct mapping
 */
export function mapLayer2ToLayer1(layer2Metrics: Layer2Metrics): Layer1Principles {
  return defaultLayerMapper.mapLayer2ToLayer1(layer2Metrics);
}

/**
 * Convenience function for detailed mapping analysis
 */
export function analyzeMapping(layer2Metrics: Layer2Metrics): MappingResult[] {
  return defaultLayerMapper.mapWithBreakdown(layer2Metrics);
}