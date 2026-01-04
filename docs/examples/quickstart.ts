/**
 * SONATE Platform - Quick Start Example
 * 
 * This example demonstrates basic usage of the SONATE platform,
 * including trust receipt generation, workflow execution, and monitoring.
 */

import {
  TrustProtocol,
  log,
  healthCheckManager,
  PerformanceTimer,
  getMetrics,
} from '@sonate/core';

import {
  AgentOrchestrator,
  WorkflowEngine,
  TacticalCommand,
} from '@sonate/orchestrate';

import { ResonanceClient } from '@sonate/detect';

// ============================================================================
// 1. Trust Protocol Usage
// ============================================================================

async function generateTrustReceipt() {
  const trustProtocol = new TrustProtocol();

  const receipt = await trustProtocol.generateReceipt({
    session_id: 'session_quickstart_001',
    mode: 'production',
    ciq: {
      clarity: 0.92,
      integrity: 0.88,
      quality: 0.90,
    },
    previous_hash: '0000000000000000000000000000000000000000000000000000000000000000',
  });

  log.info('Trust receipt generated', {
    receiptHash: receipt.self_hash,
    trustScore: receipt.ciq.quality,
    module: 'QuickStart',
  });

  // Verify receipt
  const isValid = await trustProtocol.verifyReceipt(receipt);
  console.log('Receipt valid:', isValid);

  return receipt;
}

// ============================================================================
// 2. Agent Orchestration
// ============================================================================

async function orchestrateAgents() {
  const orchestrator = new AgentOrchestrator();

  // Register agents
  const dataAgent = await orchestrator.registerAgent({
    id: 'agent-data-001',
    name: 'Data Processing Agent',
    capabilities: ['data-fetch', 'data-transform'],
    metadata: { team: 'backend' },
  });

  const analysisAgent = await orchestrator.registerAgent({
    id: 'agent-analysis-001',
    name: 'Analysis Agent',
    capabilities: ['ml-inference', 'statistical-analysis'],
    metadata: { team: 'ml' },
  });

  log.info('Agents registered', {
    count: 2,
    agents: [dataAgent.id, analysisAgent.id],
  });

  // Create workflow
  const workflow = {
    id: 'wf-quickstart-001',
    name: 'Data Analysis Pipeline',
    description: 'Fetch data and run analysis',
    steps: [
      {
        id: 'step-1',
        agent_id: dataAgent.id,
        action: 'fetch-data',
        input: { source: 'database', query: 'SELECT * FROM users' },
        status: 'pending' as const,
      },
      {
        id: 'step-2',
        agent_id: analysisAgent.id,
        action: 'analyze-data',
        input: { algorithm: 'regression' },
        status: 'pending' as const,
      },
    ],
    status: 'pending' as const,
  };

  // Execute workflow (with automatic metrics)
  const result = await orchestrator.executeWorkflow(workflow);

  log.info('Workflow completed', {
    workflowId: result.id,
    status: result.status,
    steps: result.steps.length,
  });

  return result;
}

// ============================================================================
// 3. Resonance Detection
// ============================================================================

async function detectResonance() {
  const resonanceClient = new ResonanceClient('http://localhost:8000');

  // Check if resonance engine is available
  const isHealthy = await resonanceClient.healthCheck();
  
  if (!isHealthy) {
    log.warn('Resonance engine not available', {
      module: 'QuickStart',
    });
    return null;
  }

  // Generate resonance receipt
  const receipt = await resonanceClient.generateReceipt({
    user_input: 'What are the ethical implications of AGI?',
    ai_response: 'The ethical implications of AGI span multiple domains...',
    history: [],
  });

  log.info('Resonance receipt generated', {
    interactionId: receipt.interaction_id,
    trustProtocol: receipt.symbi_dimensions.trust_protocol,
    resonanceQuality: receipt.symbi_dimensions.resonance_quality,
    realityIndex: receipt.symbi_dimensions.reality_index,
  });

  return receipt;
}

// ============================================================================
// 4. Performance Monitoring
// ============================================================================

async function demonstrateMonitoring() {
  // Simple timer
  const timer = new PerformanceTimer('demo_operation', {
    operation_type: 'example',
  });

  await new Promise(resolve => setTimeout(resolve, 100)); // Simulate work
  
  const duration = timer.end();
  console.log(`Operation took ${duration} seconds`);

  // Health check
  const health = await healthCheckManager.check();
  console.log('System health:', health.status);
  console.log('Components:', Object.keys(health.components));

  // Get metrics (Prometheus format)
  const metrics = await getMetrics();
  console.log('Metrics available:', metrics.split('\n').length, 'lines');
}

// ============================================================================
// 5. Main Execution
// ============================================================================

async function main() {
  console.log('🚀 SONATE Platform Quick Start\n');

  try {
    // 1. Trust Protocol
    console.log('📝 Generating trust receipt...');
    const trustReceipt = await generateTrustReceipt();
    console.log('✓ Trust receipt:', trustReceipt.self_hash.substring(0, 16) + '...\n');

    // 2. Agent Orchestration
    console.log('🤖 Orchestrating agents...');
    const workflowResult = await orchestrateAgents();
    console.log('✓ Workflow status:', workflowResult.status, '\n');

    // 3. Resonance Detection (optional - requires Python engine)
    console.log('🎯 Detecting resonance...');
    const resonanceReceipt = await detectResonance();
    if (resonanceReceipt) {
      console.log('✓ Resonance quality:', resonanceReceipt.symbi_dimensions.resonance_quality, '\n');
    } else {
      console.log('⚠ Resonance engine not available (optional)\n');
    }

    // 4. Monitoring
    console.log('📊 Checking system metrics...');
    await demonstrateMonitoring();
    console.log('✓ Monitoring active\n');

    console.log('✅ Quick start complete!');
    console.log('\nNext steps:');
    console.log('- Check logs in logs/combined.log');
    console.log('- View metrics at http://localhost:3000/metrics');
    console.log('- Check health at http://localhost:3000/health');

  } catch (error) {
    log.error('Quick start failed', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

export { main };
