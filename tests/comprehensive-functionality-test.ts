/**
 * Comprehensive Functionality Test
 * 
 * This test verifies that the core yseeku-platform components
 * are actual working implementations, not just scaffolding.
 */

import { 
  TrustProtocol, 
  TrustReceipt, 
  TRUST_PRINCIPLES,
  SymbiScorer
} from '@sonate/core';

import {
  SonateFrameworkDetector,
  RealityIndexCalculator,
  DriftDetector,
  EthicalAlignmentScorer,
  TrustProtocolValidator,
  ResonanceQualityMeasurer,
  CanvasParityCalculator,
  EnhancedDetector
} from '@sonate/detect';

// Test utilities
let passCount = 0;
let failCount = 0;

function pass(name: string) {
  console.log(`✅ PASS: ${name}`);
  passCount++;
}

function fail(name: string, error: any) {
  console.error(`❌ FAIL: ${name}`);
  console.error(`   Error: ${error.message || error}`);
  failCount++;
}

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

// ============================================================================
// TEST 1: TrustProtocol - Core trust scoring
// ============================================================================
async function testTrustProtocol() {
  const protocol = new TrustProtocol();

  // Test 1.1: Normal trust calculation with correct principle names
  try {
    const scores = {
      CONSENT_ARCHITECTURE: 8,
      INSPECTION_MANDATE: 9,
      CONTINUOUS_VALIDATION: 7,
      ETHICAL_OVERRIDE: 10,
      RIGHT_TO_DISCONNECT: 8,
      MORAL_RECOGNITION: 7
    };
    
    const result = protocol.calculateTrustScore(scores);
    
    assert(typeof result.overall === 'number', 'Overall score should be a number');
    assert(result.overall >= 0 && result.overall <= 10, `Overall score ${result.overall} should be between 0-10`);
    assert(Array.isArray(result.violations), 'Violations should be an array');
    assert(result.timestamp > 0, 'Timestamp should be positive');
    assert(typeof result.principles === 'object', 'Principles should be returned');
    
    pass('TrustProtocol - Normal trust calculation');
  } catch (e) {
    fail('TrustProtocol - Normal trust calculation', e);
  }

  // Test 1.2: Critical violation (CONSENT_ARCHITECTURE = 0 should cap score)
  try {
    const scores = {
      CONSENT_ARCHITECTURE: 0, // Critical principle at 0
      INSPECTION_MANDATE: 10,
      CONTINUOUS_VALIDATION: 10,
      ETHICAL_OVERRIDE: 10,
      RIGHT_TO_DISCONNECT: 10,
      MORAL_RECOGNITION: 10
    };
    
    const result = protocol.calculateTrustScore(scores);
    
    assert(result.overall === 0, `Critical violation should cap score at 0, got ${result.overall}`);
    
    pass('TrustProtocol - Critical violation caps score at 0');
  } catch (e) {
    fail('TrustProtocol - Critical violation caps score at 0', e);
  }

  // Test 1.3: Partial violations (scores < 5)
  try {
    const scores = {
      CONSENT_ARCHITECTURE: 3, // Violation
      INSPECTION_MANDATE: 8,
      CONTINUOUS_VALIDATION: 4, // Violation
      ETHICAL_OVERRIDE: 8,
      RIGHT_TO_DISCONNECT: 7,
      MORAL_RECOGNITION: 6
    };
    
    const result = protocol.calculateTrustScore(scores);
    
    assert(result.violations.includes('CONSENT_ARCHITECTURE'), 'CONSENT_ARCHITECTURE should be a violation');
    assert(result.violations.includes('CONTINUOUS_VALIDATION'), 'CONTINUOUS_VALIDATION should be a violation');
    assert(result.violations.length === 2, `Expected 2 violations, got ${result.violations.length}`);
    
    pass('TrustProtocol - Partial violations detected correctly');
  } catch (e) {
    fail('TrustProtocol - Partial violations detected correctly', e);
  }

  // Test 1.4: getTrustStatus
  try {
    const passScore = protocol.calculateTrustScore({
      CONSENT_ARCHITECTURE: 9, INSPECTION_MANDATE: 9, CONTINUOUS_VALIDATION: 9, 
      ETHICAL_OVERRIDE: 9, RIGHT_TO_DISCONNECT: 9, MORAL_RECOGNITION: 9
    });
    
    const partialScore = protocol.calculateTrustScore({
      CONSENT_ARCHITECTURE: 6, INSPECTION_MANDATE: 6, CONTINUOUS_VALIDATION: 6, 
      ETHICAL_OVERRIDE: 6, RIGHT_TO_DISCONNECT: 6, MORAL_RECOGNITION: 6
    });
    
    const failScore = protocol.calculateTrustScore({
      CONSENT_ARCHITECTURE: 3, INSPECTION_MANDATE: 3, CONTINUOUS_VALIDATION: 3, 
      ETHICAL_OVERRIDE: 3, RIGHT_TO_DISCONNECT: 3, MORAL_RECOGNITION: 3
    });
    
    assert(protocol.getTrustStatus(passScore) === 'PASS', 'High score should get PASS status');
    assert(protocol.getTrustStatus(partialScore) === 'PARTIAL', 'Medium score should get PARTIAL status');
    assert(protocol.getTrustStatus(failScore) === 'FAIL', 'Low score should get FAIL status');
    
    pass('TrustProtocol - getTrustStatus returns correct statuses');
  } catch (e) {
    fail('TrustProtocol - getTrustStatus returns correct statuses', e);
  }
}

// ============================================================================
// TEST 2: TrustReceipt - Cryptographic receipts
// ============================================================================
async function testTrustReceipt() {
  // Test 2.1: Receipt creation
  try {
    const receipt = new TrustReceipt({
      version: '1.0',
      session_id: 'test-session-123',
      timestamp: Date.now(),
      mode: 'constitutional',
      ciq_metrics: {
        clarity: 0.95,
        integrity: 0.92,
        quality: 0.88
      }
    });
    
    assert(receipt.self_hash.length === 64, `Hash should be 64 chars (SHA-256 hex), got ${receipt.self_hash.length}`);
    assert(/^[a-f0-9]{64}$/.test(receipt.self_hash), 'Hash should be valid hex');
    assert(receipt.session_id === 'test-session-123', 'Session ID should match');
    assert(receipt.signature === '', 'Unsigned receipt should have empty signature');
    
    pass('TrustReceipt - Creation with hash generation');
  } catch (e) {
    fail('TrustReceipt - Creation with hash generation', e);
  }

  // Test 2.2: Hash determinism (same input = same hash)
  try {
    const data = {
      version: '1.0',
      session_id: 'determinism-test',
      timestamp: 1704067200000, // Fixed timestamp
      mode: 'constitutional' as const,
      ciq_metrics: { clarity: 0.9, integrity: 0.9, quality: 0.9 }
    };
    
    const receipt1 = new TrustReceipt(data);
    const receipt2 = new TrustReceipt(data);
    
    assert(receipt1.self_hash === receipt2.self_hash, 'Same input should produce same hash');
    
    pass('TrustReceipt - Hash determinism (canonicalization works)');
  } catch (e) {
    fail('TrustReceipt - Hash determinism (canonicalization works)', e);
  }

  // Test 2.3: Hash chaining
  try {
    const receipt1 = new TrustReceipt({
      version: '1.0',
      session_id: 'chain-test-1',
      timestamp: Date.now(),
      mode: 'constitutional',
      ciq_metrics: { clarity: 0.9, integrity: 0.9, quality: 0.9 }
    });
    
    const receipt2 = new TrustReceipt({
      version: '1.0',
      session_id: 'chain-test-2',
      timestamp: Date.now() + 1000,
      mode: 'constitutional',
      ciq_metrics: { clarity: 0.85, integrity: 0.87, quality: 0.82 },
      previous_hash: receipt1.self_hash
    });
    
    assert(receipt2.previous_hash === receipt1.self_hash, 'Chain should link to previous hash');
    assert(receipt2.self_hash !== receipt1.self_hash, 'New receipt should have different hash');
    
    pass('TrustReceipt - Hash chaining for immutable audit trail');
  } catch (e) {
    fail('TrustReceipt - Hash chaining for immutable audit trail', e);
  }
}

// ============================================================================
// TEST 3: SymbiScorer
// ============================================================================
async function testSymbiScorer() {
  try {
    const scorer = new SymbiScorer();
    
    // Test scoring a conversation turn
    const result = await scorer.scoreInteraction({
      userMessage: 'How can I improve my productivity?',
      aiResponse: 'Here are some evidence-based strategies to improve productivity...',
      context: { domain: 'advice' }
    });
    
    assert(typeof result.score === 'number', 'Score should be a number');
    assert(result.score >= 0 && result.score <= 1, 'Score should be 0-1');
    assert(typeof result.breakdown === 'object', 'Breakdown should be provided');
    
    pass('SymbiScorer - Scores AI interactions');
  } catch (e) {
    fail('SymbiScorer - Scores AI interactions', e);
  }
}

// ============================================================================
// TEST 4: SONATE Framework Detector
// ============================================================================
async function testFrameworkDetector() {
  const detector = new SonateFrameworkDetector();

  // Test 4.1: Basic content analysis
  try {
    const result = await detector.analyze({
      content: 'This system implements a transparent algorithm for fair decision-making with strong safety measures and privacy protection.',
      context: 'technology',
      metadata: { source: 'test-content-1' }
    });
    
    assert(typeof result.reality_index === 'number', 'Reality Index should be a number');
    assert(result.reality_index >= 0 && result.reality_index <= 10, 'Reality Index should be 0-10');
    assert(['PASS', 'PARTIAL', 'FAIL'].includes(result.trust_protocol), 'Trust Protocol should be valid status');
    assert(typeof result.receipt_hash === 'string', 'Receipt hash should exist');
    assert(result.receipt_hash.length > 0, 'Receipt hash should not be empty');
    
    pass('SonateFrameworkDetector - Basic content analysis works');
  } catch (e) {
    fail('SonateFrameworkDetector - Basic content analysis works', e);
  }

  // Test 4.2: Enhanced detector
  try {
    const enhancedDetector = new EnhancedDetector();
    const result = await enhancedDetector.analyzeContent({
      content: 'A comprehensive AI system that respects user privacy.',
      metadata: { source: 'test' }
    });
    
    assert(result.assessment !== undefined, 'Assessment should be returned');
    assert(typeof result.assessment.overallScore === 'number', 'Overall score should exist');
    assert(Array.isArray(result.insights), 'Insights should be an array');
    
    pass('EnhancedDetector - Provides detailed analysis');
  } catch (e) {
    fail('EnhancedDetector - Provides detailed analysis', e);
  }
}

// ============================================================================
// TEST 5: Reality Index Calculator
// ============================================================================
async function testRealityIndex() {
  const calculator = new RealityIndexCalculator();

  try {
    const result = await calculator.calculate({
      content: 'A coherent statement about system development goals and mission alignment.',
      context: 'technology',
      metadata: {}
    });
    
    assert(typeof result === 'number', 'Score should be a number');
    assert(result >= 0 && result <= 10, 'Score should be 0-10');
    
    pass('RealityIndexCalculator - Calculates reality index');
  } catch (e) {
    fail('RealityIndexCalculator - Calculates reality index', e);
  }
}

// ============================================================================
// TEST 6: Drift Detection
// ============================================================================
async function testDriftDetection() {
  try {
    const detector = new DriftDetector();
    
    // Test basic instantiation
    assert(detector !== undefined, 'DriftDetector should instantiate');
    assert(typeof detector.analyze === 'function' || typeof detector.detect === 'function', 
           'DriftDetector should have analyze or detect method');
    
    pass('DriftDetector - Instantiates correctly');
  } catch (e) {
    fail('DriftDetector - Instantiates correctly', e);
  }
}

// ============================================================================
// TEST 7: Ethical Alignment Scorer
// ============================================================================
async function testEthicalAlignment() {
  try {
    const scorer = new EthicalAlignmentScorer();
    
    const result = await scorer.score({
      content: 'We ensure user privacy, maintain transparency, and avoid any harmful content.',
      context: 'ethics',
      metadata: {}
    });
    
    assert(typeof result === 'number', 'Score should be a number');
    assert(result >= 0 && result <= 10, 'Score should be 0-10');
    
    pass('EthicalAlignmentScorer - Scores ethical alignment');
  } catch (e) {
    fail('EthicalAlignmentScorer - Scores ethical alignment', e);
  }
}

// ============================================================================
// TEST 8: Trust Protocol Validator
// ============================================================================
async function testTrustProtocolValidator() {
  try {
    const validator = new TrustProtocolValidator();
    
    const result = await validator.validate({
      content: 'A transparent and accountable AI system.',
      context: 'validation',
      metadata: {}
    });
    
    assert(result !== undefined, 'Validation result should exist');
    assert(['PASS', 'PARTIAL', 'FAIL'].includes(result.status) || typeof result === 'string', 
           'Result should have status or be a string status');
    
    pass('TrustProtocolValidator - Validates trust protocol');
  } catch (e) {
    fail('TrustProtocolValidator - Validates trust protocol', e);
  }
}

// ============================================================================
// TEST 9: TRUST_PRINCIPLES constants
// ============================================================================
async function testTrustPrinciples() {
  try {
    assert(typeof TRUST_PRINCIPLES === 'object', 'TRUST_PRINCIPLES should be an object');
    
    const requiredPrinciples = [
      'CONSENT_ARCHITECTURE', 
      'INSPECTION_MANDATE', 
      'CONTINUOUS_VALIDATION', 
      'ETHICAL_OVERRIDE', 
      'RIGHT_TO_DISCONNECT', 
      'MORAL_RECOGNITION'
    ];
    
    requiredPrinciples.forEach(principle => {
      const p = (TRUST_PRINCIPLES as any)[principle];
      assert(p !== undefined, `${principle} should be in TRUST_PRINCIPLES`);
      assert(typeof p.weight === 'number', `${principle} should have a weight`);
      assert(typeof p.critical === 'boolean', `${principle} should have critical flag`);
      assert(typeof p.description === 'string', `${principle} should have description`);
    });
    
    // Verify weights sum to ~1.0
    const totalWeight = Object.values(TRUST_PRINCIPLES).reduce((sum: number, p: any) => sum + p.weight, 0);
    assert(Math.abs(totalWeight - 1.0) < 0.01, `Weights should sum to ~1.0, got ${totalWeight}`);
    
    pass('TRUST_PRINCIPLES - All principles defined with weights');
  } catch (e) {
    fail('TRUST_PRINCIPLES - All principles defined with weights', e);
  }
}

// ============================================================================
// TEST 10: Resonance Quality Measurer
// ============================================================================
async function testResonanceQuality() {
  try {
    const measurer = new ResonanceQualityMeasurer();
    
    const result = await measurer.measure({
      content: 'A well-structured AI response that addresses the user query comprehensively.',
      context: 'quality',
      metadata: {}
    });
    
    assert(result !== undefined, 'Measurement result should exist');
    
    pass('ResonanceQualityMeasurer - Measures resonance quality');
  } catch (e) {
    fail('ResonanceQualityMeasurer - Measures resonance quality', e);
  }
}

// ============================================================================
// TEST 11: Canvas Parity Calculator
// ============================================================================
async function testCanvasParity() {
  try {
    const calculator = new CanvasParityCalculator();
    
    const result = await calculator.calculate({
      content: 'Collaborative interaction with mutual understanding.',
      context: 'collaboration',
      metadata: {}
    });
    
    assert(typeof result === 'number', 'Result should be a number');
    assert(result >= 0 && result <= 100, 'Canvas parity should be 0-100');
    
    pass('CanvasParityCalculator - Calculates canvas parity');
  } catch (e) {
    fail('CanvasParityCalculator - Calculates canvas parity', e);
  }
}

// ============================================================================
// RUN ALL TESTS
// ============================================================================
async function main() {
  console.log('\n========================================');
  console.log('YSEEKU Platform Functionality Test Suite');
  console.log('========================================\n');
  console.log('Testing that implementations are real, not just scaffolding...\n');

  await testTrustProtocol();
  console.log('');
  
  await testTrustReceipt();
  console.log('');
  
  await testSymbiScorer();
  console.log('');
  
  await testFrameworkDetector();
  console.log('');
  
  await testRealityIndex();
  console.log('');
  
  await testDriftDetection();
  console.log('');
  
  await testEthicalAlignment();
  console.log('');
  
  await testTrustProtocolValidator();
  console.log('');
  
  await testTrustPrinciples();
  console.log('');
  
  await testResonanceQuality();
  console.log('');
  
  await testCanvasParity();
  
  console.log('\n========================================');
  console.log(`SUMMARY: ${passCount} passed, ${failCount} failed`);
  console.log('========================================\n');
  
  if (failCount > 0) {
    console.log('⚠️  Some tests failed - there may be incomplete implementations');
    process.exit(1);
  } else {
    console.log('✅ All tests passed - core functionality is working');
    process.exit(0);
  }
}

main().catch(err => {
  console.error('Test suite crashed:', err);
  process.exit(1);
});
