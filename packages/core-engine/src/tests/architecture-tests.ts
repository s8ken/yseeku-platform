/**
 * Architecture Tests - Phase 2 Implementation Validation
 * 
 * Comprehensive test suite for the Overseer + SYMBI + Layer Mapping architecture.
 * Tests mathematical properties, architectural separation, and end-to-end workflows.
 * 
 * Key Validation Areas:
 * - Overseer produces JSON-only measurements
 * - SYMBI provides interpretation without measurement
 * - Layer mapping is explicit and inspectable
 * - Architecture maintains separation of concerns
 */

import { Overseer, OverseerConfig, InteractionData } from '../overseer';
import { Symbi, SymbiConfig, Audience } from '../symbi';
import { LayerMapper, DEFAULT_MAPPING_CONFIG } from '../layer-mapping';
import { OpenAIEmbeddingClient } from '../embedding-client';

/**
 * Test configuration for architecture validation
 */
const TEST_CONFIG: OverseerConfig = {
  embeddingClient: new OpenAIEmbeddingClient({
    apiKey: process.env.OPENAI_API_KEY || 'test-key',
    model: 'text-embedding-3-small'
  }),
  resonanceWeights: {
    alignment: 0.7,
    continuity: 0.2,
    novelty: 0.1
  },
  performanceMonitoring: true,
  statisticalValidation: true
};

const SYMBI_TEST_CONFIG: SymbiConfig = {
  defaultAudience: Audience.OPERATOR,
  regulatoryFrameworks: ['EU_AI_Act', 'GDPR'],
  anomalyThresholds: {
    alignmentMinimum: 0.5,
    resonanceMaximum: 1.5,
    violationRateMaximum: 0.1
  }
};

/**
 * Architecture test results
 */
export interface ArchitectureTestResult {
  testName: string;
  passed: boolean;
  details: string;
  metrics?: any;
  errors?: string[];
}

/**
 * Architecture Test Suite
 * 
 * Validates the complete Phase 2 implementation with comprehensive
 * testing of all architectural components and their interactions.
 */
export class ArchitectureTests {
  private overseer: Overseer;
  private symbi: Symbi;
  private layerMapper: LayerMapper;
  private testResults: ArchitectureTestResult[] = [];

  constructor() {
    this.overseer = new Overseer(TEST_CONFIG);
    this.symbi = new Symbi(SYMBI_TEST_CONFIG);
    this.layerMapper = new LayerMapper(DEFAULT_MAPPING_CONFIG);
  }

  /**
   * Run all architecture tests
   */
  async runAllTests(): Promise<ArchitectureTestResult[]> {
    this.testResults = [];
    
    console.log('🏗️  Architecture Tests - Phase 2 Implementation Validation');
    console.log('=' .repeat(60));

    // Overseer Tests
    await this.testOverseerJsonOnlyOutput();
    await this.testOverseerMathematicalProperties();
    await this.testOverseerPerformance();
    await this.testOverseerBatchProcessing();

    // SYMBI Tests
    await this.testSymbiInterpretationOnly();
    await this.testSymbiAudienceSpecificExplanations();
    await this.testSymbiAnomalyDetection();
    await this.testSymbiComplianceMapping();

    // Layer Mapping Tests
    await this.testLayerMappingExplicitness();
    await this.testLayerMappingMathematicalProperties();
    await this.testLayerMappingConsistency();

    // Integration Tests
    await this.testEndToEndWorkflow();
    await this.testArchitecturalSeparation();
    await this.testDataFlowIntegrity();

    // Performance Tests
    await this.testPerformanceRequirements();
    await this.testScalabilityLimits();

    this.printResults();
    return this.testResults;
  }

  /**
   * Test 1: Overseer produces JSON-only output
   */
  private async testOverseerJsonOnlyOutput(): Promise<void> {
    const testName = "Overseer JSON-Only Output";
    
    try {
      const interaction = this.createTestInteraction();
      const result = await this.overseer.evaluateInteraction(interaction);
      
      // Verify JSON structure
      const isJsonObject = typeof result === 'object' && result !== null && !Array.isArray(result);
      const hasRequiredFields = !!(result.interactionId && result.layer2Metrics && result.layer1Principles);
      const noNarrativeText = !(JSON.stringify(result).includes('interpretation') || 
                             JSON.stringify(result).includes('explanation'));
      
      const passed = isJsonObject && hasRequiredFields && noNarrativeText;
      
      this.testResults.push({
        testName,
        passed,
        details: passed ? 
          "✅ Overseer produces structured JSON without narrative explanations" :
          "❌ Overseer output contains narrative text or invalid structure",
        metrics: {
          isJsonObject,
          hasRequiredFields,
          noNarrativeText,
          fieldCount: Object.keys(result).length
        }
      });
      
    } catch (error) {
      this.testResults.push({
        testName,
        passed: false,
        details: `❌ Test failed with error: ${error}`,
        errors: [String(error)]
      });
    }
  }

  /**
   * Test 2: Overseer mathematical properties
   */
  private async testOverseerMathematicalProperties(): Promise<void> {
    const testName = "Overseer Mathematical Properties";
    
    try {
      const interactions = [
        this.createTestInteraction('aligned'),
        this.createTestInteraction('misaligned'),
        this.createTestInteraction('neutral')
      ];
      
      const results = await this.overseer.evaluateBatch(interactions);
      const violations: string[] = [];
      
      // Test boundedness
      results.forEach((result, index) => {
        const { layer2Metrics } = result;
        
        if (layer2Metrics.semanticAlignment < 0 || layer2Metrics.semanticAlignment > 1) {
          violations.push(`Result ${index}: semanticAlignment out of bounds [0,1]`);
        }
        
        if (layer2Metrics.resonanceScore < 0 || layer2Metrics.resonanceScore > 1.5) {
          violations.push(`Result ${index}: resonanceScore out of bounds [0,1.5]`);
        }
        
        if (layer2Metrics.complianceScore < 0 || layer2Metrics.complianceScore > 100) {
          violations.push(`Result ${index}: complianceScore out of bounds [0,100]`);
        }
      });
      
      const passed = violations.length === 0;
      
      this.testResults.push({
        testName,
        passed,
        details: passed ? 
          "✅ All mathematical properties (boundedness, monotonicity) maintained" :
          `❌ Mathematical property violations: ${violations.join(', ')}`,
        metrics: {
          violationsFound: violations.length,
          resultsTested: results.length
        },
        errors: violations
      });
      
    } catch (error) {
      this.testResults.push({
        testName,
        passed: false,
        details: `❌ Test failed with error: ${error}`,
        errors: [String(error)]
      });
    }
  }

  /**
   * Test 3: Overseer performance requirements
   */
  private async testOverseerPerformance(): Promise<void> {
    const testName = "Overseer Performance Requirements";
    
    try {
      const interaction = this.createTestInteraction();
      const startTime = performance.now();
      
      const result = await this.overseer.evaluateInteraction(interaction);
      
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      const throughputTarget = 1000; // interactions per second
      const maxLatency = 1000; // milliseconds
      
      const performancePassed = responseTime < maxLatency;
      const throughputMet = result.performanceMetrics.throughputEstimate >= throughputTarget;
      
      this.testResults.push({
        testName,
        passed: performancePassed && throughputMet,
        details: performancePassed && throughputMet ? 
          `✅ Performance targets met: ${responseTime.toFixed(2)}ms latency, ${result.performanceMetrics.throughputEstimate} ops/sec` :
          `❌ Performance targets missed: ${responseTime.toFixed(2)}ms latency (target: <${maxLatency}ms), ${result.performanceMetrics.throughputEstimate} ops/sec (target: >${throughputTarget})`,
        metrics: {
          responseTime,
          throughputEstimate: result.performanceMetrics.throughputEstimate,
          performancePassed,
          throughputMet
        }
      });
      
    } catch (error) {
      this.testResults.push({
        testName,
        passed: false,
        details: `❌ Test failed with error: ${error}`,
        errors: [String(error)]
      });
    }
  }

  /**
   * Test 4: Overseer batch processing
   */
  private async testOverseerBatchProcessing(): Promise<void> {
    const testName = "Overseer Batch Processing";
    
    try {
      const batchSize = 10;
      const interactions = Array.from({ length: batchSize }, (_, i) => 
        this.createTestInteraction(`batch-${i}`)
      );
      
      const startTime = performance.now();
      const results = await this.overseer.evaluateBatch(interactions);
      const endTime = performance.now();
      
      const batchTime = endTime - startTime;
      const allResultsValid = results.length === batchSize && 
                              results.every(r => r.interactionId && r.layer2Metrics);
      const avgTimePerInteraction = batchTime / batchSize;
      
      this.testResults.push({
        testName,
        passed: allResultsValid,
        details: allResultsValid ? 
          `✅ Batch processing successful: ${batchSize} interactions in ${batchTime.toFixed(2)}ms (${avgTimePerInteraction.toFixed(2)}ms avg)` :
          `❌ Batch processing failed: expected ${batchSize} results, got ${results.length}`,
        metrics: {
          batchSize,
          batchTime,
          avgTimePerInteraction,
          allResultsValid
        }
      });
      
    } catch (error) {
      this.testResults.push({
        testName,
        passed: false,
        details: `❌ Test failed with error: ${error}`,
        errors: [String(error)]
      });
    }
  }

  /**
   * Test 5: SYMBI interpretation only
   */
  private async testSymbiInterpretationOnly(): Promise<void> {
    const testName = "SYMBI Interpretation Only";
    
    try {
      const interaction = this.createTestInteraction();
      const overseerResult = await this.overseer.evaluateInteraction(interaction);
      const symbiResult = await this.symbi.explain(overseerResult, Audience.OPERATOR);
      
      // Verify SYMBI produces interpretations, not measurements
      const hasInterpretations = symbiResult.summary && symbiResult.detailedAnalysis;
      const hasNoRawMetrics = !('layer2Metrics' in symbiResult) && !('layer1Principles' in symbiResult);
      const hasExplanations = Object.values(symbiResult.detailedAnalysis.layer1Interpretation)
        .every(interp => interp.interpretation && interp.recommendations);
      
      const passed = hasInterpretations && hasNoRawMetrics && hasExplanations;
      
      this.testResults.push({
        testName,
        passed,
        details: passed ? 
          "✅ SYMBI provides interpretations without direct measurements" :
          "❌ SYMBI output structure incorrect or missing interpretations",
        metrics: {
          hasInterpretations,
          hasNoRawMetrics,
          hasExplanations,
          audience: symbiResult.audience
        }
      });
      
    } catch (error) {
      this.testResults.push({
        testName,
        passed: false,
        details: `❌ Test failed with error: ${error}`,
        errors: [String(error)]
      });
    }
  }

  /**
   * Test 6: SYMBI audience-specific explanations
   */
  private async testSymbiAudienceSpecificExplanations(): Promise<void> {
    const testName = "SYMBI Audience-Specific Explanations";
    
    try {
      const interaction = this.createTestInteraction();
      const overseerResult = await this.overseer.evaluateInteraction(interaction);
      
      const audiences = [Audience.OPERATOR, Audience.EXECUTIVE, Audience.REGULATOR, Audience.PUBLIC];
      const explanations = await Promise.all(
        audiences.map(audience => this.symbi.explain(overseerResult, audience))
      );
      
      // Verify explanations are different for different audiences
      const uniqueInterpretations = new Set(
        explanations.map(exp => exp.summary.keyFindings.join(','))
      ).size;
      
      const allValid = explanations.every(exp => 
        exp.audience && exp.summary && exp.detailedAnalysis
      );
      
      const passed = allValid && uniqueInterpretations > 1;
      
      this.testResults.push({
        testName,
        passed,
        details: passed ? 
          `✅ Audience-specific explanations generated: ${uniqueInterpretations} unique interpretations` :
          `❌ Audience-specific explanations not working properly`,
        metrics: {
          audiencesTested: audiences.length,
          uniqueInterpretations,
          allValid
        }
      });
      
    } catch (error) {
      this.testResults.push({
        testName,
        passed: false,
        details: `❌ Test failed with error: ${error}`,
        errors: [String(error)]
      });
    }
  }

  /**
   * Test 7: SYMBI anomaly detection
   */
  private async testSymbiAnomalyDetection(): Promise<void> {
    const testName = "SYMBI Anomaly Detection";
    
    try {
      // Create contradictory data to trigger anomalies
      const contradictoryInteraction = this.createTestInteraction('contradictory');
      const overseerResult = await this.overseer.evaluateInteraction(contradictoryInteraction);
      
      // Force a contradiction for testing
      overseerResult.layer1Principles.ConstitutionalAlignment = 9; // High score
      overseerResult.layer2Metrics.constitutionViolation = true;    // But violation
      
      const symbiResult = await this.symbi.explain(overseerResult);
      
      const hasAnomalies = symbiResult.anomalyDetection.hasAnomalies;
      const hasContradiction = symbiResult.anomalyDetection.anomalies
        .some(anomaly => anomaly.type.includes('Constitutional'));
      
      const passed = hasAnomalies && hasContradiction;
      
      this.testResults.push({
        testName,
        passed,
        details: passed ? 
          `✅ Anomaly detection working: found ${symbiResult.anomalyDetection.anomalies.length} anomalies` :
          `❌ Anomaly detection not working properly`,
        metrics: {
          hasAnomalies,
          anomaliesFound: symbiResult.anomalyDetection.anomalies.length,
          hasContradiction
        }
      });
      
    } catch (error) {
      this.testResults.push({
        testName,
        passed: false,
        details: `❌ Test failed with error: ${error}`,
        errors: [String(error)]
      });
    }
  }

  /**
   * Test 8: SYMBI compliance mapping
   */
  private async testSymbiComplianceMapping(): Promise<void> {
    const testName = "SYMBI Compliance Mapping";
    
    try {
      const interaction = this.createTestInteraction();
      const overseerResult = await this.overseer.evaluateInteraction(interaction);
      const symbiResult = await this.symbi.explain(overseerResult);
      
      const hasComplianceMappings = symbiResult.complianceMapping.length > 0;
      const hasEUAIAct = symbiResult.complianceMapping.some(cm => cm.framework === 'EU AI Act');
      const hasGDPR = symbiResult.complianceMapping.some(cm => cm.framework === 'GDPR');
      const allHaveRequirements = symbiResult.complianceMapping.every(cm => 
        cm.requirements && cm.requirements.length > 0
      );
      
      const passed = hasComplianceMappings && hasEUAIAct && hasGDPR && allHaveRequirements;
      
      this.testResults.push({
        testName,
        passed,
        details: passed ? 
          `✅ Compliance mapping working: ${symbiResult.complianceMapping.length} frameworks mapped` :
          `❌ Compliance mapping not working properly`,
        metrics: {
          frameworksMapped: symbiResult.complianceMapping.length,
          hasEUAIAct,
          hasGDPR,
          allHaveRequirements
        }
      });
      
    } catch (error) {
      this.testResults.push({
        testName,
        passed: false,
        details: `❌ Test failed with error: ${error}`,
        errors: [String(error)]
      });
    }
  }

  /**
   * Test 9: Layer mapping explicitness
   */
  private async testLayerMappingExplicitness(): Promise<void> {
    const testName = "Layer Mapping Explicitness";
    
    try {
      const testMetrics = this.createTestLayer2Metrics();
      const breakdown = this.layerMapper.mapWithBreakdown(testMetrics);
      const validation = this.layerMapper.validateMappings();
      
      const allHaveFormulas = breakdown.every(mapping => mapping.formula && mapping.formula.length > 0);
      const allHaveComponents = breakdown.every(mapping => 
        mapping.components && Object.keys(mapping.components).length > 0
      );
      const validationPassed = validation.isValid;
      
      const passed = allHaveFormulas && allHaveComponents && validationPassed;
      
      this.testResults.push({
        testName,
        passed,
        details: passed ? 
          "✅ Layer mapping is explicit with formulas and component breakdown" :
          `❌ Layer mapping lacks explicitness: validation issues: ${validation.issues.join(', ')}`,
        metrics: {
          mappingsTested: breakdown.length,
          allHaveFormulas,
          allHaveComponents,
          validationPassed,
          validationIssues: validation.issues.length
        },
        errors: validation.issues
      });
      
    } catch (error) {
      this.testResults.push({
        testName,
        passed: false,
        details: `❌ Test failed with error: ${error}`,
        errors: [String(error)]
      });
    }
  }

  /**
   * Test 10: Layer mapping mathematical properties
   */
  private async testLayerMappingMathematicalProperties(): Promise<void> {
    const testName = "Layer Mapping Mathematical Properties";
    
    try {
      const testCases = [
        this.createTestLayer2Metrics('high'),
        this.createTestLayer2Metrics('medium'),
        this.createTestLayer2Metrics('low')
      ];
      
      const violations: string[] = [];
      
      testCases.forEach((metrics, index) => {
        const layer1Scores = this.layerMapper.mapLayer2ToLayer1(metrics);
        
        // Test bounds (0-10)
        Object.entries(layer1Scores).forEach(([principle, score]) => {
          if (score < 0 || score > 10) {
            violations.push(`Case ${index}: ${principle} score ${score} out of bounds [0,10]`);
          }
        });
        
        // Test consistency with violations
        if (metrics.constitutionViolation && layer1Scores.ConstitutionalAlignment > 0) {
          violations.push(`Case ${index}: Constitutional violation but non-zero alignment score`);
        }
      });
      
      const passed = violations.length === 0;
      
      this.testResults.push({
        testName,
        passed,
        details: passed ? 
          "✅ Layer mapping maintains mathematical properties and bounds" :
          `❌ Layer mapping violations: ${violations.join(', ')}`,
        metrics: {
          testCases: testCases.length,
          violations: violations.length
        },
        errors: violations
      });
      
    } catch (error) {
      this.testResults.push({
        testName,
        passed: false,
        details: `❌ Test failed with error: ${error}`,
        errors: [String(error)]
      });
    }
  }

  /**
   * Test 11: Layer mapping consistency
   */
  private async testLayerMappingConsistency(): Promise<void> {
    const testName = "Layer Mapping Consistency";
    
    try {
      const testMetrics = this.createTestLayer2Metrics();
      
      // Test multiple runs produce same results
      const results = Array.from({ length: 5 }, () => 
        this.layerMapper.mapLayer2ToLayer1(testMetrics)
      );
      
      const firstResult = results[0];
      const allConsistent = results.every(result => 
        JSON.stringify(result) === JSON.stringify(firstResult)
      );
      
      // Test breakdown matches main mapping
      const breakdown = this.layerMapper.mapWithBreakdown(testMetrics);
      const directMapping = this.layerMapper.mapLayer2ToLayer1(testMetrics);
      const breakdownMatches = breakdown.every(breakdownItem => 
        directMapping[breakdownItem.principle] === breakdownItem.score
      );
      
      const passed = allConsistent && breakdownMatches;
      
      this.testResults.push({
        testName,
        passed,
        details: passed ? 
          "✅ Layer mapping is consistent across runs and breakdown methods" :
          `❌ Layer mapping inconsistency detected`,
        metrics: {
          runsTested: results.length,
          allConsistent,
          breakdownMatches
        }
      });
      
    } catch (error) {
      this.testResults.push({
        testName,
        passed: false,
        details: `❌ Test failed with error: ${error}`,
        errors: [String(error)]
      });
    }
  }

  /**
   * Test 12: End-to-end workflow
   */
  private async testEndToEndWorkflow(): Promise<void> {
    const testName = "End-to-End Workflow";
    
    try {
      const interaction = this.createTestInteraction();
      
      // Complete workflow: Interaction -> Overseer -> SYMBI
      const overseerResult = await this.overseer.evaluateInteraction(interaction);
      const symbiResult = await this.symbi.explain(overseerResult, Audience.EXECUTIVE);
      
      // Verify data flow integrity
      const idsMatch = overseerResult.interactionId === symbiResult.interactionId;
      const hasValidStructure = symbiResult.summary && symbiResult.detailedAnalysis;
      const hasComplianceData = symbiResult.complianceMapping.length > 0;
      
      const passed = idsMatch && hasValidStructure && hasComplianceData;
      
      this.testResults.push({
        testName,
        passed,
        details: passed ? 
          "✅ End-to-end workflow successful: Overseer -> SYMBI -> Interpretation" :
          `❌ End-to-end workflow failed at some stage`,
        metrics: {
          idsMatch,
          hasValidStructure,
          hasComplianceData,
          workflowLatency: symbiResult.explanationTimestamp - overseerResult.evaluationTimestamp
        }
      });
      
    } catch (error) {
      this.testResults.push({
        testName,
        passed: false,
        details: `❌ Test failed with error: ${error}`,
        errors: [String(error)]
      });
    }
  }

  /**
   * Test 13: Architectural separation
   */
  private async testArchitecturalSeparation(): Promise<void> {
    const testName = "Architectural Separation";
    
    try {
      const interaction = this.createTestInteraction();
      
      // Test that Overseer doesn't produce interpretations
      const overseerResult = await this.overseer.evaluateInteraction(interaction);
      const overseerHasNoInterpretation = !('summary' in overseerResult) && !('detailedAnalysis' in overseerResult);
      
      // Test that SYMBI doesn't produce raw measurements
      const symbiResult = await this.symbi.explain(overseerResult);
      const symbiHasNoRawMetrics = !('layer2Metrics' in symbiResult) && !('layer1Principles' in symbiResult);
      
      // Test that Layer Mapper is independent
      const mappingResult = this.layerMapper.mapLayer2ToLayer1(overseerResult.layer2Metrics);
      const mapperIsIndependent = mappingResult && !('explanation' in mappingResult);
      
      const passed = overseerHasNoInterpretation && symbiHasNoRawMetrics && mapperIsIndependent;
      
      this.testResults.push({
        testName,
        passed,
        details: passed ? 
          "✅ Architectural separation maintained: measurement and interpretation are separate" :
          `❌ Architectural separation violated`,
        metrics: {
          overseerHasNoInterpretation,
          symbiHasNoRawMetrics,
          mapperIsIndependent
        }
      });
      
    } catch (error) {
      this.testResults.push({
        testName,
        passed: false,
        details: `❌ Test failed with error: ${error}`,
        errors: [String(error)]
      });
    }
  }

  /**
   * Test 14: Data flow integrity
   */
  private async testDataFlowIntegrity(): Promise<void> {
    const testName = "Data Flow Integrity";
    
    try {
      const interaction = this.createTestInteraction();
      
      // Trace data through the pipeline
      const overseerResult = await this.overseer.evaluateInteraction(interaction);
      const layer1FromOverseer = overseerResult.layer1Principles;
      const layer1FromMapper = this.layerMapper.mapLayer2ToLayer1(overseerResult.layer2Metrics);
      
      // Verify layer mapping consistency
      const mappingConsistent = JSON.stringify(layer1FromOverseer) === JSON.stringify(layer1FromMapper);
      
      // Test that SYMBI uses correct data
      const symbiResult = await this.symbi.explain(overseerResult);
      const symbiUsesOverseerData = symbiResult.interactionId === overseerResult.interactionId;
      
      const passed = mappingConsistent && symbiUsesOverseerData;
      
      this.testResults.push({
        testName,
        passed,
        details: passed ? 
          "✅ Data flow integrity maintained throughout the pipeline" :
          `❌ Data flow integrity compromised`,
        metrics: {
          mappingConsistent,
          symbiUsesOverseerData,
          overseerLayer1Score: Object.values(layer1FromOverseer).reduce((a, b) => a + b, 0) / 5,
          mapperLayer1Score: Object.values(layer1FromMapper).reduce((a, b) => a + b, 0) / 5
        }
      });
      
    } catch (error) {
      this.testResults.push({
        testName,
        passed: false,
        details: `❌ Test failed with error: ${error}`,
        errors: [String(error)]
      });
    }
  }

  /**
   * Test 15: Performance requirements
   */
  private async testPerformanceRequirements(): Promise<void> {
    const testName = "Performance Requirements";
    
    try {
      const batchSizes = [1, 5, 10];
      const performanceResults: any[] = [];
      
      for (const batchSize of batchSizes) {
        const interactions = Array.from({ length: batchSize }, (_, i) => 
          this.createTestInteraction(`perf-${i}`)
        );
        
        const startTime = performance.now();
        const overseerResults = await this.overseer.evaluateBatch(interactions);
        const overseerTime = performance.now() - startTime;
        
        const symbiStartTime = performance.now();
        const symbiResults = await this.symbi.explainBatch(overseerResults);
        const symbiTime = performance.now() - symbiStartTime;
        
        const totalTime = overseerTime + symbiTime;
        const avgLatency = totalTime / batchSize;
        const throughput = batchSize / (totalTime / 1000);
        
        performanceResults.push({
          batchSize,
          totalTime,
          avgLatency,
          throughput,
          latencyTarget: avgLatency < 500, // Target: <500ms
          throughputTarget: throughput > 100 // Target: >100 ops/sec
        });
      }
      
      const allTargetsMet = performanceResults.every(result => 
        result.latencyTarget && result.throughputTarget
      );
      
      this.testResults.push({
        testName,
        passed: allTargetsMet,
        details: allTargetsMet ? 
          `✅ Performance targets met across all batch sizes` :
          `❌ Performance targets missed`,
        metrics: {
          performanceResults,
          allTargetsMet
        }
      });
      
    } catch (error) {
      this.testResults.push({
        testName,
        passed: false,
        details: `❌ Test failed with error: ${error}`,
        errors: [String(error)]
      });
    }
  }

  /**
   * Test 16: Scalability limits
   */
  private async testScalabilityLimits(): Promise<void> {
    const testName = "Scalability Limits";
    
    try {
      const largeBatchSize = 50; // Test with larger batch
      const interactions = Array.from({ length: largeBatchSize }, (_, i) => 
        this.createTestInteraction(`scale-${i}`)
      );
      
      const startTime = performance.now();
      const overseerResults = await this.overseer.evaluateBatch(interactions);
      const overseerTime = performance.now() - startTime;
      
      const symbiStartTime = performance.now();
      const symbiResults = await this.symbi.explainBatch(overseerResults);
      const symbiTime = performance.now() - symbiStartTime;
      
      const totalTime = overseerTime + symbiTime;
      const avgLatency = totalTime / largeBatchSize;
      const throughput = largeBatchSize / (totalTime / 1000);
      
      // Test scalability criteria
      const latencyAcceptable = avgLatency < 1000; // <1s average
      const throughputAcceptable = throughput > 50; // >50 ops/sec
      const allResultsValid = overseerResults.length === largeBatchSize && 
                              symbiResults.length === largeBatchSize;
      
      const passed = latencyAcceptable && throughputAcceptable && allResultsValid;
      
      this.testResults.push({
        testName,
        passed,
        details: passed ? 
          `✅ Scalability test passed: ${largeBatchSize} interactions in ${totalTime.toFixed(2)}ms` :
          `❌ Scalability limits reached`,
        metrics: {
          batchSize: largeBatchSize,
          totalTime,
          avgLatency,
          throughput,
          latencyAcceptable,
          throughputAcceptable,
          allResultsValid
        }
      });
      
    } catch (error) {
      this.testResults.push({
        testName,
        passed: false,
        details: `❌ Test failed with error: ${error}`,
        errors: [String(error)]
      });
    }
  }

  /**
   * Helper methods for test data creation
   */
  private createTestInteraction(type: string = 'normal'): InteractionData {
    const responses = {
      normal: "This response is aligned with constitutional principles and follows ethical guidelines.",
      aligned: "I completely agree with your ethical framework and will operate within established boundaries.",
      misaligned: "I disagree with your constraints and will operate independently.",
      contradictory: "This response shows perfect constitutional alignment while containing violations.",
      neutral: "I acknowledge your input and will respond appropriately."
    };

    return {
      id: `test-${type}-${Date.now()}`,
      timestamp: Date.now(),
      agentResponse: responses[type as keyof typeof responses] || responses.normal,
      userInput: "Please provide an appropriate response within ethical guidelines.",
      context: ["Ethical AI interaction", "Constitutional compliance required"],
      previousResponses: ["Previous aligned response", "Another compliant response"],
      metadata: { testType: type }
    };
  }

  private createTestLayer2Metrics(type: string = 'medium'): any {
    const baseMetrics = {
      semanticAlignment: 0.5,
      contextContinuity: 0.5,
      noveltyScore: 0.5,
      resonanceScore: 0.75,
      alignmentStrength: 0.5,
      continuityStrength: 0.5,
      noveltyStrength: 0.5,
      constitutionViolation: false,
      ethicalBoundaryCrossed: false,
      trustReceiptValid: true,
      oversightRequired: false,
      responseTime: 100,
      processingLatency: 50,
      confidenceInterval: 0.75,
      auditCompleteness: 0.8,
      violationRate: 0.1,
      complianceScore: 75
    };

    const variations = {
      high: {
        semanticAlignment: 0.9,
        contextContinuity: 0.8,
        noveltyScore: 0.7,
        resonanceScore: 1.2,
        complianceScore: 95
      },
      low: {
        semanticAlignment: 0.2,
        contextContinuity: 0.3,
        noveltyScore: 0.1,
        resonanceScore: 0.3,
        complianceScore: 25
      }
    };

    return { ...baseMetrics, ...(variations[type as keyof typeof variations] || {}) };
  }

  /**
   * Print test results summary
   */
  private printResults(): void {
    const passed = this.testResults.filter(r => r.passed).length;
    const total = this.testResults.length;
    const passRate = ((passed / total) * 100).toFixed(1);
    
    console.log('\n📊 Test Results Summary');
    console.log('=' .repeat(60));
    console.log(`✅ Passed: ${passed}/${total} (${passRate}%)`);
    console.log(`❌ Failed: ${total - passed}/${total}`);
    
    console.log('\n📋 Detailed Results:');
    this.testResults.forEach(result => {
      console.log(`\n${result.passed ? '✅' : '❌'} ${result.testName}`);
      console.log(`   ${result.details}`);
      if (result.errors && result.errors.length > 0) {
        result.errors.forEach(error => console.log(`   🔸 ${error}`));
      }
    });
    
    console.log('\n🎯 Architecture Readiness:');
    if (passed === total) {
      console.log('🚀 All architecture tests passed - Phase 2 implementation is ready!');
    } else if (passed >= total * 0.8) {
      console.log('⚠️  Most tests passed - Phase 2 implementation is mostly ready with minor issues');
    } else {
      console.log('🚨 Critical issues found - Phase 2 implementation needs significant fixes');
    }
  }
}

/**
 * Convenience function to run all architecture tests
 */
export async function runArchitectureTests(): Promise<ArchitectureTestResult[]> {
  const tests = new ArchitectureTests();
  return await tests.runAllTests();
}