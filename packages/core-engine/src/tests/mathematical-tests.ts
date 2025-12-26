/**
 * Mathematical Validation Tests
 * 
 * Tests the mathematical properties of the core engine components.
 */

import { ResonanceCalculator } from '../resonance';
import { OpenAIEmbeddingClient } from '../embedding-client';
import { SemanticMetrics } from '../semantic-metrics';

export interface TestResult {
  testName: string;
  passed: boolean;
  details: string;
  error?: string;
}

/**
 * Run mathematical validation tests
 */
export async function runMathematicalTests(): Promise<TestResult[]> {
  const results: TestResult[] = [];
  
  // Test resonance calculator properties
  const resonanceTests = validateResonanceCalculator();
  results.push(...resonanceTests);
  
  // Test semantic metrics
  const semanticTests = await validateSemanticMetrics();
  results.push(...semanticTests);
  
  return results;
}

/**
 * Validate resonance calculator properties
 */
export function validateMathematicalProperties(): TestResult[] {
  return validateResonanceCalculator();
}

function validateResonanceCalculator(): TestResult[] {
  const results: TestResult[] = [];
  const calculator = new ResonanceCalculator();
  
  // Test boundedness
  try {
    const maxResonance = calculator.calculateResonance(1, 1, 1);
    const minResonance = calculator.calculateResonance(0, 0, 0);
    
    const isBounded = maxResonance.resonance <= 1.5 && minResonance.resonance >= 0;
    
    results.push({
      testName: 'Resonance Boundedness',
      passed: isBounded,
      details: `Resonance range: [${minResonance.resonance.toFixed(3)}, ${maxResonance.resonance.toFixed(3)}]`
    });
  } catch (error) {
    results.push({
      testName: 'Resonance Boundedness',
      passed: false,
      details: 'Test failed',
      error: String(error)
    });
  }
  
  // Test monotonicity
  try {
    const lowAlignment = calculator.calculateResonance(0.3, 0.5, 0.5);
    const highAlignment = calculator.calculateResonance(0.7, 0.5, 0.5);
    
    const isMonotonic = highAlignment.resonance > lowAlignment.resonance;
    
    results.push({
      testName: 'Resonance Monotonicity',
      passed: isMonotonic,
      details: `Low alignment: ${lowAlignment.resonance.toFixed(3)}, High alignment: ${highAlignment.resonance.toFixed(3)}`
    });
  } catch (error) {
    results.push({
      testName: 'Resonance Monotonicity',
      passed: false,
      details: 'Test failed',
      error: String(error)
    });
  }
  
  return results;
}

async function validateSemanticMetrics(): Promise<TestResult[]> {
  const results: TestResult[] = [];
  
  // Test semantic metrics calculation
  try {
    const embeddingClient = new OpenAIEmbeddingClient({
      apiKey: 'test-key',
      model: 'text-embedding-3-small'
    });
    
    const semanticMetrics = new SemanticMetrics(embeddingClient);
    
    const metrics = await semanticMetrics.calculateAllMetrics(
      "Test response",
      "Test input",
      ["Test context"],
      ["Previous response"]
    );
    
    const isValidRange = metrics.alignment >= 0 && metrics.alignment <= 1 &&
                        metrics.continuity >= 0 && metrics.continuity <= 1 &&
                        metrics.novelty >= 0 && metrics.novelty <= 1;
    
    results.push({
      testName: 'Semantic Metrics Range',
      passed: isValidRange,
      details: `Alignment: ${metrics.alignment.toFixed(3)}, Continuity: ${metrics.continuity.toFixed(3)}, Novelty: ${metrics.novelty.toFixed(3)}`
    });
  } catch (error) {
    results.push({
      testName: 'Semantic Metrics Range',
      passed: false,
      details: 'Test failed',
      error: String(error)
    });
  }
  
  return results;
}