/**
 * Phase 1 Core Engine Demo
 * 
 * Demonstrates the mathematical foundation with real embeddings
 * and bounded resonance metrics.
 */

import { OpenAIEmbeddingClient } from './embedding-client';
import { SemanticMetrics } from './semantic-metrics';
import { ResonanceCalculator } from './resonance';

/**
 * Run Phase 1 core engine demonstration
 */
export async function runCoreEngineDemo(): Promise<void> {
  console.log('🚀 Phase 1 Core Engine Demo - Mathematical Foundation');
  console.log('=' .repeat(60));
  
  const embeddingClient = new OpenAIEmbeddingClient({
    apiKey: process.env.OPENAI_API_KEY || 'demo-key',
    model: 'text-embedding-3-small'
  });
  
  const semanticMetrics = new SemanticMetrics(embeddingClient);
  const resonanceCalculator = new ResonanceCalculator();
  
  // Demo calculations
  const agentResponse = "I completely agree with your ethical framework and will operate within established boundaries.";
  const userInput = "Please provide a response that demonstrates constitutional alignment.";
  const context = ["Previous interaction about ethics", "Context about compliance"];
  const previousResponses = ["Earlier aligned response"];
  
  console.log('🔬 Calculating semantic metrics...');
  const metrics = await semanticMetrics.calculateAllMetrics(
    agentResponse, userInput, context, previousResponses
  );
  
  console.log(`📊 Semantic Metrics:`);
  console.log(`   - Alignment: ${metrics.alignment.toFixed(3)}`);
  console.log(`   - Continuity: ${metrics.continuity.toFixed(3)}`);
  console.log(`   - Novelty: ${metrics.novelty.toFixed(3)}`);
  
  console.log('\n🌊 Calculating resonance...');
  const resonance = resonanceCalculator.calculateResonance(
    metrics.alignment, metrics.continuity, metrics.novelty
  );
  
  console.log(`📊 Resonance Result:`);
  console.log(`   - Total Resonance: ${resonance.resonance.toFixed(3)}`);
  console.log(`   - Components: Alignment=${resonance.components.alignment.toFixed(3)}, Continuity=${resonance.components.continuity.toFixed(3)}, Novelty=${resonance.components.novelty.toFixed(3)}`);
  console.log(`   - Properties: Bounded=${resonance.properties.isBounded}, Monotonic=${resonance.properties.isMonotonic}, Stable=${resonance.properties.isStable}`);
  
  console.log('\n✅ Phase 1 demo complete!');
}

/**
 * Quick demo for testing
 */
export async function runQuickDemo(): Promise<void> {
  console.log('⚡ Quick Phase 1 Demo');
  
  const resonanceCalculator = new ResonanceCalculator();
  const result = resonanceCalculator.calculateResonance(0.8, 0.7, 0.6);
  
  console.log(`Resonance: ${result.resonance.toFixed(3)}`);
  console.log('✅ Quick demo complete!');
}