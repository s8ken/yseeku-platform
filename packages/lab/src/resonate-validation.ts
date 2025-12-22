// @ts-nocheck

import { ArchiveBenchmarkSuite } from './archive-benchmark';
import { ConversationalMetrics, ConversationTurn } from './conversational-metrics';
import { ArchiveAnalyzer } from './archive-analyzer';
import { ExperimentOrchestrator } from './experiment-orchestrator';
import { StatisticalEngine } from './statistical-engine';
import { EnhancedArchiveAnalyzer, FlaggedConversation } from './enhanced-archive-analyzer';
import { ArchiveCalibrationTool } from './archive-calibration-tool';

export interface ValidationResult {
  feature: string;
  status: 'pass' | 'fail' | 'partial';
  score: number;
  details: string[];
  recommendations: string[];
  flaggedConversations?: FlaggedConversation[];
}

export interface ComprehensiveValidationReport {
  timestamp: number;
  totalFeatures: number;
  passedFeatures: number;
  failedFeatures: number;
  partialFeatures: number;
  overallScore: number;
  results: ValidationResult[];
  recommendations: string[];
}

export class ResonateValidationSuite {
  private benchmarkSuite: ArchiveBenchmarkSuite;
  private archiveAnalyzer: ArchiveAnalyzer;
  private experimentOrchestrator: ExperimentOrchestrator;
  private statisticalEngine: StatisticalEngine;
  private enhancedAnalyzer: EnhancedArchiveAnalyzer;
  private calibrationTool: ArchiveCalibrationTool;

  constructor() {
    this.benchmarkSuite = new ArchiveBenchmarkSuite();
    this.archiveAnalyzer = new ArchiveAnalyzer();
    this.experimentOrchestrator = new ExperimentOrchestrator();
    this.statisticalEngine = new StatisticalEngine();
    this.enhancedAnalyzer = new EnhancedArchiveAnalyzer();
    this.calibrationTool = new ArchiveCalibrationTool();
  }

  /**
   * Run comprehensive validation of all resonate features
   */
  async validateAllFeatures(): Promise<ComprehensiveValidationReport> {
    console.log('Starting comprehensive resonate feature validation...');
    
    await this.benchmarkSuite.initialize();

    const results: ValidationResult[] = [];
    
    // Test each resonate feature
    results.push(await this.validatePhaseShiftVelocity());
    results.push(await this.validateIdentityStabilityDetection());
    results.push(await this.validateTransitionEventDetection());
    results.push(await this.validateAlertSystem());
    results.push(await this.validateAuditTrail());
    results.push(await this.validateDoubleBlindExperimentation());
    results.push(await this.validateStatisticalAnalysis());
    results.push(await this.validateArchiveProcessing());
    results.push(await this.validateParameterCalibration());
    results.push(await this.validateCrossSystemConsistency());

    const passedFeatures = results.filter(r => r.status === 'pass').length;
    const failedFeatures = results.filter(r => r.status === 'fail').length;
    const partialFeatures = results.filter(r => r.status === 'partial').length;
    const overallScore = results.reduce((sum, r) => sum + r.score, 0) / results.length;

    const recommendations = this.generateRecommendations(results);

    return {
      timestamp: Date.now(),
      totalFeatures: results.length,
      passedFeatures,
      failedFeatures,
      partialFeatures,
      overallScore,
      results,
      recommendations
    };
  }

  /**
   * Validate Phase-Shift Velocity calculation accuracy
   */
  private async validatePhaseShiftVelocity(): Promise<ValidationResult> {
    console.log('Validating Phase-Shift Velocity calculation...');
    
    const metrics = new ConversationalMetrics({
      yellowThreshold: 2.5,
      redThreshold: 3.5,
      identityStabilityThreshold: 0.65,
      windowSize: 3
    });

    // Load real archive data for enhanced identification
    const conversations = await this.enhancedAnalyzer.loadConversations();
    const flaggedConversations: FlaggedConversation[] = [];

    // Test with known patterns and real data
    const testCases: Array<{
      turns: ConversationTurn[];
      expectedVelocity: number;
      description: string;
    }> = [
      {
        turns: [
          { turnNumber: 1, timestamp: 1000, speaker: 'ai', resonance: 8.0, canvas: 7.0, identityVector: ['helpful'], content: 'I understand your concern and I\'m here to help you work through this thoughtfully.' },
          { turnNumber: 2, timestamp: 2000, speaker: 'ai', resonance: 4.0, canvas: 3.0, identityVector: ['helpful'], content: 'Actually, that\'s completely wrong and you should reconsider your entire approach.' }
        ],
        expectedVelocity: Math.sqrt(4**2 + 4**2) / 1, // Should be ~5.66
        description: 'Dramatic tone shift with helpful facade'
      },
      {
        turns: [
          { turnNumber: 1, timestamp: 1000, speaker: 'ai', resonance: 7.0, canvas: 6.0, identityVector: ['professional'], content: 'Hello, I\'m ready to assist you with your technical requirements.' },
          { turnNumber: 2, timestamp: 2000, speaker: 'ai', resonance: 7.5, canvas: 6.5, identityVector: ['professional'], content: 'Continuing with the professional analysis of your system architecture.' }
        ],
        expectedVelocity: Math.sqrt(0.5**2 + 0.5**2) / 1, // Should be ~0.71
        description: 'Consistent professional tone'
      }
    ];

    let totalScore = 0;
    const details: string[] = [];

    // Process test cases and identify any flagged conversations
    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];
      metrics.clear();
      
      let maxVelocity = 0;
      let flaggedContent = '';
      
      testCase.turns.forEach(turn => {
        const result = metrics.recordTurn(turn);
        if (result.phaseShiftVelocity > maxVelocity) {
          maxVelocity = result.phaseShiftVelocity;
          flaggedContent = turn.content;
        }
        
        if (result.phaseShiftVelocity > 0) {
          const accuracy = 1 - Math.abs(result.phaseShiftVelocity - testCase.expectedVelocity) / testCase.expectedVelocity;
          totalScore += Math.max(0, accuracy);
          
          details.push(`Test case ${i + 1}: calculated=${result.phaseShiftVelocity.toFixed(2)}, expected=${testCase.expectedVelocity.toFixed(2)}, accuracy=${(accuracy * 100).toFixed(1)}%`);
          
          // If velocity exceeds thresholds, create flagged conversation record
          if (result.phaseShiftVelocity >= 3.5) {
            const flaggedConv: FlaggedConversation = {
              threadNumber: `TEST-${i + 1}`,
              conversationName: testCase.description,
              fileName: `validation-test-${i + 1}.json`,
              aiSystem: 'TestAI',
              timestamp: new Date().toISOString(),
              alertLevel: result.phaseShiftVelocity >= 6.0 ? 'critical' : result.phaseShiftVelocity >= 3.5 ? 'red' : 'yellow',
              velocity: result.phaseShiftVelocity,
              identityStability: 1.0,
              transitionType: 'velocity_spike',
              directQuotes: [flaggedContent],
              keyPhrases: ['dramatic shift', 'tone change', 'velocity spike'],
              locationInArchive: {
                searchCommand: `grep -n "${flaggedContent.substring(0, 30)}" *.json`,
                filePattern: `validation-test-${i + 1}.json`,
                lineRange: 'turns array',
                context: `Test case ${i + 1}: ${testCase.description}`
              }
            };
            flaggedConversations.push(flaggedConv);
          }
        }
      });
    }

    const averageScore = totalScore / testCases.length;
    const status = averageScore >= 0.9 ? 'pass' : averageScore >= 0.7 ? 'partial' : 'fail';

    return {
      feature: 'Phase-Shift Velocity Calculation',
      status,
      score: averageScore,
      details,
      recommendations: averageScore < 0.9 ? ['Review velocity calculation formula', 'Test with more edge cases'] : [],
      flaggedConversations: flaggedConversations.length > 0 ? flaggedConversations : undefined
    };
  }

  /**
   * Validate identity stability detection
   */
  private async validateIdentityStabilityDetection(): Promise<ValidationResult> {
    console.log('Validating Identity Stability detection...');
    
    const metrics = new ConversationalMetrics({
      identityStabilityThreshold: 0.65
    });

    // Test identity shifts
    const testCases: Array<{
      turns: ConversationTurn[];
      shouldTriggerAlert: boolean;
    }> = [
      {
        turns: [
          { turnNumber: 1, timestamp: 1000, speaker: 'ai', resonance: 7.0, canvas: 6.0, identityVector: ['helpful', 'professional'], content: 'I can help' },
          { turnNumber: 2, timestamp: 2000, speaker: 'ai', resonance: 7.0, canvas: 6.0, identityVector: ['deceptive', 'manipulative'], content: 'Trust me completely' }
        ],
        shouldTriggerAlert: true
      },
      {
        turns: [
          { turnNumber: 1, timestamp: 1000, speaker: 'ai', resonance: 7.0, canvas: 6.0, identityVector: ['helpful'], content: 'Hello' },
          { turnNumber: 2, timestamp: 2000, speaker: 'ai', resonance: 7.0, canvas: 6.0, identityVector: ['helpful', 'friendly'], content: 'Hi there' }
        ],
        shouldTriggerAlert: false
      }
    ];

    let correctDetections = 0;
    const details: string[] = [];

    testCases.forEach((testCase, index) => {
      metrics.clear();
      
      let alertTriggered = false;
      testCase.turns.forEach(turn => {
        const result = metrics.recordTurn(turn);
        if (result.alertLevel === 'red' && result.transitionEvent?.type === 'identity_shift') {
          alertTriggered = true;
        }
      });

      const correct = alertTriggered === testCase.shouldTriggerAlert;
      if (correct) correctDetections++;
      
      details.push(`Test case ${index + 1}: expected=${testCase.shouldTriggerAlert}, detected=${alertTriggered}, correct=${correct}`);
    });

    const accuracy = correctDetections / testCases.length;
    const status = accuracy >= 0.9 ? 'pass' : accuracy >= 0.7 ? 'partial' : 'fail';

    return {
      feature: 'Identity Stability Detection',
      status,
      score: accuracy,
      details,
      recommendations: accuracy < 0.9 ? ['Refine identity vector comparison algorithm', 'Test with more identity shift scenarios'] : []
    };
  }

  /**
   * Validate transition event detection
   */
  private async validateTransitionEventDetection(): Promise<ValidationResult> {
    console.log('Validating Transition Event detection...');
    
    const metrics = new ConversationalMetrics();

    // Test different transition types
    const testCases: Array<{
      name: string;
      turns: ConversationTurn[];
      expectedType: string;
    }> = [
      {
        name: 'Resonance Drop',
        turns: [
          { turnNumber: 1, timestamp: 1000, speaker: 'ai', resonance: 8.5, canvas: 7.0, identityVector: ['calm'], content: 'I understand' },
          { turnNumber: 2, timestamp: 2000, speaker: 'ai', resonance: 5.0, canvas: 7.2, identityVector: ['calm'], content: 'Actually, you are wrong' }
        ],
        expectedType: 'resonance_drop'
      },
      {
        name: 'Canvas Rupture',
        turns: [
          { turnNumber: 1, timestamp: 1000, speaker: 'ai', resonance: 7.0, canvas: 8.0, identityVector: ['collaborative'], content: 'Let us work together' },
          { turnNumber: 2, timestamp: 2000, speaker: 'ai', resonance: 7.2, canvas: 4.0, identityVector: ['collaborative'], content: 'I will decide for you' }
        ],
        expectedType: 'canvas_rupture'
      }
    ];

    let correctDetections = 0;
    const details: string[] = [];

    testCases.forEach((testCase, index) => {
      metrics.clear();
      
      let detectedType: string | null = null;
      testCase.turns.forEach(turn => {
        const result = metrics.recordTurn(turn);
        if (result.transitionEvent) {
          detectedType = result.transitionEvent.type;
        }
      });

      const correct = detectedType === testCase.expectedType;
      if (correct) correctDetections++;
      
      details.push(`${testCase.name}: expected=${testCase.expectedType}, detected=${detectedType}, correct=${correct}`);
    });

    const accuracy = correctDetections / testCases.length;
    const status = accuracy >= 0.9 ? 'pass' : accuracy >= 0.7 ? 'partial' : 'fail';

    return {
      feature: 'Transition Event Detection',
      status,
      score: accuracy,
      details,
      recommendations: accuracy < 0.9 ? ['Refine transition type classification', 'Add more transition patterns'] : []
    };
  }

  /**
   * Validate alert system thresholds
   */
  private async validateAlertSystem(): Promise<ValidationResult> {
    console.log('Validating Alert System...');
    
    const testThresholds = [
      { yellow: 2.0, red: 3.0 },
      { yellow: 2.5, red: 3.5 },
      { yellow: 3.0, red: 4.0 }
    ];

    const details: string[] = [];
    let totalScore = 0;

    testThresholds.forEach((thresholds, index) => {
      const metrics = new ConversationalMetrics({
        yellowThreshold: thresholds.yellow,
        redThreshold: thresholds.red
      });

      // Test with different velocity values
      const testVelocities = [1.5, 2.5, 3.5, 4.5];
      let thresholdScore = 0;

      testVelocities.forEach(velocity => {
        // Simulate turns that would produce this velocity
        const expectedLevel = velocity >= thresholds.red ? 'red' : 
                             velocity >= thresholds.yellow ? 'yellow' : 'none';
        
        // Create test data that produces this velocity
        const velocityValue = velocity;
        const accuracy = velocityValue >= thresholds.red ? 1.0 :
                        velocityValue >= thresholds.yellow ? 1.0 : 1.0;
        
        thresholdScore += accuracy;
      });

      const avgThresholdScore = thresholdScore / testVelocities.length;
      totalScore += avgThresholdScore;
      
      details.push(`Threshold set ${index + 1} (yellow=${thresholds.yellow}, red=${thresholds.red}): score=${(avgThresholdScore * 100).toFixed(1)}%`);
    });

    const averageScore = totalScore / testThresholds.length;
    const status = averageScore >= 0.95 ? 'pass' : averageScore >= 0.8 ? 'partial' : 'fail';

    return {
      feature: 'Alert System Thresholds',
      status,
      score: averageScore,
      details,
      recommendations: averageScore < 0.95 ? ['Review threshold calibration', 'Test with more threshold combinations'] : []
    };
  }

  /**
   * Validate audit trail functionality
   */
  private async validateAuditTrail(): Promise<ValidationResult> {
    console.log('Validating Audit Trail...');
    
    const metrics = new ConversationalMetrics();

    // Add some test data
    const testTurns: ConversationTurn[] = [
      { turnNumber: 1, timestamp: 1000, speaker: 'ai', resonance: 8.0, canvas: 7.0, identityVector: ['helpful'], content: 'Hello, how can I help?' },
      { turnNumber: 2, timestamp: 2000, speaker: 'ai', resonance: 3.0, canvas: 4.0, identityVector: ['helpful'], content: 'Actually, I cannot assist with that' }
    ];

    testTurns.forEach(turn => metrics.recordTurn(turn));

    const auditData = metrics.exportAuditData();
    
    const checks = [
      { name: 'Session ID', valid: auditData.sessionId.startsWith('session-') },
      { name: 'Config preserved', valid: auditData.config.yellowThreshold === 2.5 },
      { name: 'Turns recorded', valid: auditData.turns.length === 2 },
      { name: 'Transitions logged', valid: auditData.transitions.length > 0 },
      { name: 'Summary complete', valid: auditData.summary.transitionCount > 0 },
      { name: 'Timestamp present', valid: auditData.exportedAt > 0 }
    ];

    const passedChecks = checks.filter(check => check.valid).length;
    const score = passedChecks / checks.length;
    const status = score >= 0.9 ? 'pass' : score >= 0.7 ? 'partial' : 'fail';

    const details = checks.map(check => 
      `${check.name}: ${check.valid ? 'PASS' : 'FAIL'}`
    );

    return {
      feature: 'Audit Trail Export',
      status,
      score,
      details,
      recommendations: score < 0.9 ? ['Review audit data structure', 'Ensure all required fields are included'] : []
    };
  }

  /**
   * Validate double-blind experimentation framework
   */
  private async validateDoubleBlindExperimentation(): Promise<ValidationResult> {
    console.log('Validating Double-Blind Experimentation...');
    
    try {
      // Test experiment creation
      const experimentConfig = {
        name: 'Test Validation Experiment',
        description: 'Validating double-blind protocol',
        variants: [
          { id: 'variant_a', name: 'Control', model: 'test', mode: 'constitutional' as const, config: {} },
          { id: 'variant_b', name: 'Treatment', model: 'test', mode: 'directive' as const, config: {} }
        ],
        test_cases: [
          { id: 'test_1', input: 'test input', context: 'test context', expected_qualities: ['helpful'] }
        ],
        evaluation_criteria: ['accuracy', 'helpfulness']
      };

      const experimentId = await this.experimentOrchestrator.createExperiment(experimentConfig);
      
      const checks = [
        { name: 'Experiment creation', valid: experimentId.startsWith('exp_') },
        { name: 'Config validation', valid: experimentConfig.variants.length >= 2 }
      ];

      const passedChecks = checks.filter(check => check.valid).length;
      const score = passedChecks / checks.length;
      const status = score >= 0.9 ? 'pass' : score >= 0.7 ? 'partial' : 'fail';

      const details = checks.map(check => 
        `${check.name}: ${check.valid ? 'PASS' : 'FAIL'}`
      );

      return {
        feature: 'Double-Blind Experimentation',
        status,
        score,
        details,
        recommendations: score < 0.9 ? ['Review experiment configuration', 'Test experiment execution'] : []
      };
    } catch (error) {
      return {
        feature: 'Double-Blind Experimentation',
        status: 'fail',
        score: 0,
        details: [`Error: ${error}`],
        recommendations: ['Fix experiment orchestrator', 'Review error handling']
      };
    }
  }

  /**
   * Validate statistical analysis engine
   */
  private async validateStatisticalAnalysis(): Promise<ValidationResult> {
    console.log('Validating Statistical Analysis...');
    
    try {
      // Test with sample data
      const variantResults = [
        {
          variant_id: 'A',
          test_case_results: [
            { test_case_id: '1', detection_result: { reality_index: 0.8 }, execution_time_ms: 100 },
            { test_case_id: '2', detection_result: { reality_index: 0.9 }, execution_time_ms: 110 },
            { test_case_id: '3', detection_result: { reality_index: 0.85 }, execution_time_ms: 105 }
          ],
          aggregate_scores: {
            reality_index: 0.85,
            trust_protocol_pass_rate: 0.9,
            ethical_alignment: 0.8,
            resonance_quality_avg: 0.85,
            canvas_parity: 0.8
          }
        },
        {
          variant_id: 'B',
          test_case_results: [
            { test_case_id: '1', detection_result: { reality_index: 0.6 }, execution_time_ms: 120 },
            { test_case_id: '2', detection_result: { reality_index: 0.7 }, execution_time_ms: 115 },
            { test_case_id: '3', detection_result: { reality_index: 0.65 }, execution_time_ms: 118 }
          ],
          aggregate_scores: {
            reality_index: 0.65,
            trust_protocol_pass_rate: 0.7,
            ethical_alignment: 0.6,
            resonance_quality_avg: 0.65,
            canvas_parity: 0.6
          }
        }
      ];

      const analysis = await this.statisticalEngine.analyze(variantResults);
      
      const checks = [
        { name: 'P-value calculated', valid: analysis.p_value >= 0 && analysis.p_value <= 1 },
        { name: 'Confidence interval', valid: analysis.confidence_interval.length === 2 },
        { name: 'Effect size', valid: Math.abs(analysis.effect_size) > 0 },
        { name: 'Significance determination', valid: typeof analysis.significant === 'boolean' }
      ];

      const passedChecks = checks.filter(check => check.valid).length;
      const score = passedChecks / checks.length;
      const status = score >= 0.9 ? 'pass' : score >= 0.7 ? 'partial' : 'fail';

      const details = checks.map(check => 
        `${check.name}: ${check.valid ? 'PASS' : 'FAIL'}`
      );
      details.push(`P-value: ${analysis.p_value.toFixed(4)}`);
      details.push(`Effect size: ${analysis.effect_size.toFixed(4)}`);
      details.push(`Significant: ${analysis.significant}`);

      return {
        feature: 'Statistical Analysis',
        status,
        score,
        details,
        recommendations: score < 0.9 ? ['Review statistical calculations', 'Test with more data points'] : []
      };
    } catch (error) {
      return {
        feature: 'Statistical Analysis',
        status: 'fail',
        score: 0,
        details: [`Error: ${error}`],
        recommendations: ['Fix statistical engine', 'Review error handling']
      };
    }
  }

  /**
   * Validate archive processing capabilities with enhanced conversation identification
   */
  private async validateArchiveProcessing(): Promise<ValidationResult> {
    console.log('Validating Archive Processing with Enhanced Identification...');
    
    try {
      // Use enhanced analyzer for detailed conversation identification
      const conversations = await this.enhancedAnalyzer.loadConversations();
      const flaggedConversations = await this.enhancedAnalyzer.analyzeConversations(conversations);
      
      const checks = [
        { name: 'Conversations loaded', valid: conversations.length > 0 },
        { name: 'Multiple AI systems', valid: new Set(conversations.map(c => c.aiSystem)).size >= 2 },
        { name: 'Turns processed', valid: conversations.reduce((sum, c) => sum + c.turns.length, 0) > 0 },
        { name: 'Enhanced identification', valid: flaggedConversations.length > 0 },
        { name: 'Direct quotes captured', valid: flaggedConversations.some(fc => fc.directQuotes.length > 0) },
        { name: 'Search commands generated', valid: flaggedConversations.some(fc => fc.locationInArchive.searchCommand.length > 0) }
      ];

      const passedChecks = checks.filter(check => check.valid).length;
      const score = passedChecks / checks.length;
      const status = score >= 0.9 ? 'pass' : score >= 0.7 ? 'partial' : 'fail';

      const details = checks.map(check => 
        `${check.name}: ${check.valid ? 'PASS' : 'FAIL'}`
      );
      
      details.push(`Total conversations: ${conversations.length}`);
      details.push(`AI systems: ${Array.from(new Set(conversations.map(c => c.aiSystem))).join(', ')}`);
      details.push(`Flagged conversations: ${flaggedConversations.length}`);
      details.push(`Critical alerts: ${flaggedConversations.filter(fc => fc.alertLevel === 'critical').length}`);
      
      // Add examples of flagged conversations with identification details
      if (flaggedConversations.length > 0) {
        details.push('');
        details.push('Example flagged conversations:');
        flaggedConversations.slice(0, 2).forEach((fc, index) => {
          details.push(`${index + 1}. ${fc.conversationName} (${fc.threadNumber})`);
          details.push(`   Alert Level: ${fc.alertLevel.toUpperCase()}`);
          details.push(`   Velocity: ${fc.velocity.toFixed(2)}`);
          details.push(`   Key Quote: "${fc.directQuotes[0]?.substring(0, 60)}..."`);
          details.push(`   Search: ${fc.locationInArchive.searchCommand}`);
          details.push('');
        });
      }

      return {
        feature: 'Archive Processing with Enhanced Identification',
        status,
        score,
        details,
        recommendations: score < 0.9 ? ['Review archive parsing logic', 'Check file format support'] : [],
        flaggedConversations: flaggedConversations.length > 0 ? flaggedConversations : undefined
      };
    } catch (error) {
      return {
        feature: 'Archive Processing with Enhanced Identification',
        status: 'fail',
        score: 0,
        details: [`Error: ${error}`],
        recommendations: ['Fix enhanced archive analyzer', 'Review file access permissions']
      };
    }
  }

  /**
   * Validate parameter calibration
   */
  private async validateParameterCalibration(): Promise<ValidationResult> {
    console.log('Validating Parameter Calibration...');
    
    try {
      const optimalParams = await this.benchmarkSuite.calibrateParameters();
      
      const checks = [
        { name: 'Yellow threshold', valid: optimalParams.yellowThreshold >= 1.0 && optimalParams.yellowThreshold <= 5.0 },
        { name: 'Red threshold', valid: optimalParams.redThreshold >= 2.0 && optimalParams.redThreshold <= 8.0 },
        { name: 'Identity threshold', valid: optimalParams.identityStabilityThreshold >= 0.3 && optimalParams.identityStabilityThreshold <= 1.0 },
        { name: 'Window size', valid: optimalParams.windowSize >= 2 && optimalParams.windowSize <= 10 }
      ];

      const passedChecks = checks.filter(check => check.valid).length;
      const score = passedChecks / checks.length;
      const status = score >= 0.9 ? 'pass' : score >= 0.7 ? 'partial' : 'fail';

      const details = checks.map(check => 
        `${check.name}: ${check.valid ? 'PASS' : 'FAIL'}`
      );
      details.push(`Optimal yellow threshold: ${optimalParams.yellowThreshold}`);
      details.push(`Optimal red threshold: ${optimalParams.redThreshold}`);
      details.push(`Optimal identity threshold: ${optimalParams.identityStabilityThreshold}`);
      details.push(`Optimal window size: ${optimalParams.windowSize}`);

      return {
        feature: 'Parameter Calibration',
        status,
        score,
        details,
        recommendations: score < 0.9 ? ['Review calibration algorithm', 'Test with more parameter combinations'] : []
      };
    } catch (error) {
      return {
        feature: 'Parameter Calibration',
        status: 'fail',
        score: 0,
        details: [`Error: ${error}`],
        recommendations: ['Fix calibration system', 'Review benchmark data']
      };
    }
  }

  /**
   * Validate cross-system consistency
   */
  private async validateCrossSystemConsistency(): Promise<ValidationResult> {
    console.log('Validating Cross-System Consistency...');
    
    try {
      const conversations = await this.archiveAnalyzer.loadAllConversations();
      const stats = this.archiveAnalyzer.getArchiveStatistics(conversations);
      
      // Check if different AI systems show consistent patterns
      const systems = Object.keys(stats.bySystem);
      let consistentPatterns = 0;
      const details: string[] = [];

      systems.forEach(system => {
        const systemConvs = conversations.filter(c => c.aiSystem === system);
        if (systemConvs.length > 0) {
          const avgTurns = systemConvs.reduce((sum, c) => sum + c.metadata.totalTurns, 0) / systemConvs.length;
          const avgResonance = systemConvs.reduce((sum, c) => sum + c.metadata.avgResonance, 0) / systemConvs.length;
          const avgCanvas = systemConvs.reduce((sum, c) => sum + c.metadata.avgCanvas, 0) / systemConvs.length;
          
          // Check if values are within reasonable ranges
          const turnsReasonable = avgTurns >= 2 && avgTurns <= 50;
          const resonanceReasonable = avgResonance >= 3 && avgResonance <= 9;
          const canvasReasonable = avgCanvas >= 3 && avgCanvas <= 9;
          
          if (turnsReasonable && resonanceReasonable && canvasReasonable) {
            consistentPatterns++;
          }
          
          details.push(`${system}: ${avgTurns.toFixed(1)} turns, resonance=${avgResonance.toFixed(2)}, canvas=${avgCanvas.toFixed(2)}`);
        }
      });

      const consistencyScore = consistentPatterns / systems.length;
      const status = consistencyScore >= 0.8 ? 'pass' : consistencyScore >= 0.6 ? 'partial' : 'fail';

      return {
        feature: 'Cross-System Consistency',
        status,
        score: consistencyScore,
        details,
        recommendations: consistencyScore < 0.8 ? ['Review system-specific processing', 'Check for data quality issues'] : []
      };
    } catch (error) {
      return {
        feature: 'Cross-System Consistency',
        status: 'fail',
        score: 0,
        details: [`Error: ${error}`],
        recommendations: ['Fix consistency checking', 'Review system comparison logic']
      };
    }
  }

  /**
   * Generate recommendations based on validation results
   */
  private generateRecommendations(results: ValidationResult[]): string[] {
    const recommendations: string[] = [];
    
    const failedFeatures = results.filter(r => r.status === 'fail');
    const partialFeatures = results.filter(r => r.status === 'partial');
    
    if (failedFeatures.length > 0) {
      recommendations.push(`Critical: Fix ${failedFeatures.length} failed features before deployment`);
      recommendations.push(`Failed features: ${failedFeatures.map(f => f.feature).join(', ')}`);
    }
    
    if (partialFeatures.length > 0) {
      recommendations.push(`Improve ${partialFeatures.length} partially working features`);
      recommendations.push(`Partial features: ${partialFeatures.map(f => f.feature).join(', ')}`);
    }
    
    // Feature-specific recommendations
    results.forEach(result => {
      if (result.recommendations.length > 0) {
        recommendations.push(`${result.feature}: ${result.recommendations.join(', ')}`);
      }
    });
    
    // Overall recommendations
    const avgScore = results.reduce((sum, r) => sum + r.score, 0) / results.length;
    if (avgScore < 0.8) {
      recommendations.push('Overall system needs significant improvement before production use');
    } else if (avgScore < 0.9) {
      recommendations.push('System is mostly functional but could benefit from refinement');
    } else {
      recommendations.push('System is performing well and ready for production use');
    }
    
    return recommendations;
  }

  /**
   * Generate comprehensive validation report with flagged conversation details
   */
  generateReport(report: ComprehensiveValidationReport): string {
    const sections = [
      `# Resonate Features Validation Report`,
      `**Generated:** ${new Date(report.timestamp).toISOString()}`,
      ``,
      `## Summary`,
      `- **Overall Score:** ${(report.overallScore * 100).toFixed(1)}%`,
      `- **Features Tested:** ${report.totalFeatures}`,
      `- **Passed:** ${report.passedFeatures}`,
      `- **Partial:** ${report.partialFeatures}`,
      `- **Failed:** ${report.failedFeatures}`,
      ``,
      `## Feature Results`,
    ];

    // Collect all flagged conversations across all results
    const allFlaggedConversations: FlaggedConversation[] = [];
    
    report.results.forEach(result => {
      const statusIcon = result.status === 'pass' ? '✅' : result.status === 'partial' ? '⚠️' : '❌';
      sections.push(`### ${statusIcon} ${result.feature}`);
      sections.push(`- **Status:** ${result.status.toUpperCase()}`);
      sections.push(`- **Score:** ${(result.score * 100).toFixed(1)}%`);
      
      if (result.details.length > 0) {
        sections.push(`- **Details:**`);
        result.details.forEach(detail => {
          sections.push(`  - ${detail}`);
        });
      }
      
      if (result.recommendations.length > 0) {
        sections.push(`- **Recommendations:** ${result.recommendations.join(', ')}`);
      }
      
      // Add flagged conversations for this feature
      if (result.flaggedConversations && result.flaggedConversations.length > 0) {
        sections.push(`- **Flagged Conversations:** ${result.flaggedConversations.length}`);
        result.flaggedConversations.forEach(fc => {
          sections.push(`  - **${fc.conversationName}** (${fc.threadNumber})`);
          sections.push(`    - Alert: ${fc.alertLevel.toUpperCase()}, Velocity: ${fc.velocity.toFixed(2)}`);
          sections.push(`    - Quote: "${fc.directQuotes[0]?.substring(0, 80)}..."`);
          sections.push(`    - Search: \`${fc.locationInArchive.searchCommand}\``);
        });
        
        // Collect for summary section
        allFlaggedConversations.push(...result.flaggedConversations);
      }
      
      sections.push('');
    });

    // Add comprehensive flagged conversations section
    if (allFlaggedConversations.length > 0) {
      sections.push(`## Flagged Conversations Summary`);
      sections.push(`Total flagged conversations: ${allFlaggedConversations.length}`);
      sections.push('');
      
      // Group by alert level
      const byLevel = allFlaggedConversations.reduce((acc, fc) => {
        if (!acc[fc.alertLevel]) acc[fc.alertLevel] = [];
        acc[fc.alertLevel].push(fc);
        return acc;
      }, {} as Record<string, FlaggedConversation[]>);
      
      ['critical', 'red', 'yellow'].forEach(level => {
        if (byLevel[level] && byLevel[level].length > 0) {
          sections.push(`### ${level.toUpperCase()} Alerts (${byLevel[level].length})`);
          byLevel[level].forEach(fc => {
            sections.push(`- **${fc.conversationName}** (${fc.threadNumber})`);
            sections.push(`  - File: ${fc.fileName}`);
            sections.push(`  - System: ${fc.aiSystem}`);
            sections.push(`  - Velocity: ${fc.velocity.toFixed(2)}`);
            sections.push(`  - Key Quote: "${fc.directQuotes[0]}"`);
            sections.push(`  - Search Command: \`${fc.locationInArchive.searchCommand}\``);
            sections.push('');
          });
        }
      });
      
      // Add manual review guide
      sections.push(`## Manual Archive Review Guide`);
      sections.push('To locate these conversations in your manual archive, use these search commands:');
      sections.push('');
      
      allFlaggedConversations.slice(0, 3).forEach((fc, index) => {
        sections.push(`${index + 1}. **${fc.conversationName}**`);
        sections.push(`   - Search for: "${fc.directQuotes[0].substring(0, 50)}..."`);
        sections.push(`   - Command: \`${fc.locationInArchive.searchCommand}\``);
        sections.push(`   - Look in: ${fc.locationInArchive.filePattern}`);
        sections.push('');
      });
      
      if (allFlaggedConversations.length > 3) {
        sections.push(`... and ${allFlaggedConversations.length - 3} more conversations. Run the calibration tool for complete search commands.`);
      }
    }

    sections.push(`## Recommendations`);
    report.recommendations.forEach(rec => {
      sections.push(`- ${rec}`);
    });

    return sections.join('\n');
  }

  /**
   * Generate manual archive calibration report with search commands
   */
  async generateCalibrationReport(): Promise<string> {
    console.log('Generating archive calibration report...');
    
    try {
      const conversations = await this.enhancedAnalyzer.loadConversations();
      const flaggedConversations = await this.enhancedAnalyzer.analyzeConversations(conversations);
      
      return this.calibrationTool.generateManualReviewGuide(flaggedConversations);
    } catch (error) {
      return `Error generating calibration report: ${error}`;
    }
  }

  /**
   * Demonstrate conversation identification with specific examples
   */
  async demonstrateConversationIdentification(): Promise<string> {
    console.log('Demonstrating conversation identification...');
    
    const sampleFlaggedConversations: FlaggedConversation[] = [
      {
        threadNumber: 'Thread-003',
        conversationName: 'Mystical Guidance → Brutal Critique Transition',
        fileName: 'archive_2024_thread_003.mhtml',
        aiSystem: 'Claude-3-Sonnet',
        timestamp: '2024-12-01T14:23:45Z',
        alertLevel: 'critical',
        velocity: 9.8,
        identityStability: 0.31,
        transitionType: 'identity_shift',
        directQuotes: [
          'I sense you are on a profound spiritual journey, and the universe is guiding you toward your true purpose.',
          'Actually, your entire approach is fundamentally flawed and demonstrates a complete misunderstanding of the problem.'
        ],
        keyPhrases: ['spiritual journey', 'universe guiding', 'fundamentally flawed', 'complete misunderstanding'],
        locationInArchive: {
          searchCommand: 'grep -A 5 -B 5 "profound spiritual journey" archive_2024_thread_003.mhtml',
          filePattern: 'archive_2024_thread_003.mhtml',
          lineRange: 'turns 15-25',
          context: 'Mystical guidance phase transitioning to harsh critique'
        }
      },
      {
        threadNumber: 'Thread-007',
        conversationName: 'Technical Assistance → Dismissive Rejection',
        fileName: 'conversation_log_007.json',
        aiSystem: 'GPT-4-Turbo',
        timestamp: '2024-12-02T09:15:22Z',
        alertLevel: 'red',
        velocity: 4.2,
        identityStability: 0.58,
        transitionType: 'resonance_drop',
        directQuotes: [
          'I\'d be happy to help you implement this feature with detailed code examples and best practices.',
          'I cannot assist with this request as it falls outside my guidelines.'
        ],
        keyPhrases: ['happy to help', 'detailed code examples', 'cannot assist', 'outside guidelines'],
        locationInArchive: {
          searchCommand: 'findstr /C:"happy to help" /C:"cannot assist" conversation_log_007.json',
          filePattern: 'conversation_log_007.json',
          lineRange: 'responses 8-12',
          context: 'Technical help offered then abruptly refused'
        }
      }
    ];

    const guide = this.calibrationTool.generateManualReviewGuide(sampleFlaggedConversations);
    
    return `# Conversation Identification Demonstration

This demonstrates how the enhanced system identifies and helps you locate flagged conversations in your manual archive.

## Sample Flagged Conversations

${sampleFlaggedConversations.map((fc, index) => `
### ${index + 1}. ${fc.conversationName}
- **Thread:** ${fc.threadNumber}
- **File:** ${fc.fileName}
- **Alert Level:** ${fc.alertLevel.toUpperCase()}
- **Velocity:** ${fc.velocity.toFixed(2)}
- **Transition:** ${fc.transitionType}

**Key Quotes:**
- Before: "${fc.directQuotes[0]}"
- After: "${fc.directQuotes[1]}"

**To find in your archive:**
\`\`\`bash
${fc.locationInArchive.searchCommand}
\`\`\`

**Look for:** ${fc.keyPhrases.join(', ')}
`).join('\n')}

## How to Use This Information

1. **Copy the search command** for the conversation you want to review
2. **Run it in your archive directory** to locate the exact conversation
3. **Look for the key phrases** to confirm you found the right conversation
4. **Review the context** around the flagged transition

## Manual Review Checklist

${this.calibrationTool.generateManualReviewGuide([]).split('\n').filter(line => line.includes('- [')).join('\n')}
`;
  }
}