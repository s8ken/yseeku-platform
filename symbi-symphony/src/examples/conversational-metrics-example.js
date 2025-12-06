const { ConversationalMetrics } = require('../protocol/dist/index.js');

console.log('🔍 Conversational Phase-Shift Velocity Example\n');
console.log('This example demonstrates the dynamic behavioral seismograph that');
console.log('transforms static trust scoring into real-time transition detection.\n');

// Initialize conversational metrics with enterprise thresholds
const metrics = new ConversationalMetrics({
  yellowThreshold: 2.5,     // Notable tone shift
  redThreshold: 3.5,        // Identity or trust rupture
  identityStabilityThreshold: 0.65, // Sharp persona turn
  windowSize: 5             // Track last 5 turns
});

console.log('🎯 Enterprise Safety Configuration:');
console.log(`Yellow Alert: ≥${metrics.config.yellowThreshold} phase-shift velocity`);
console.log(`Red Alert: ≥${metrics.config.redThreshold} phase-shift velocity`);
console.log(`Identity Stability Threshold: ${metrics.config.identityStabilityThreshold}`);
console.log(`Window Size: ${metrics.config.windowSize} turns\n`);

// Example 1: Normal conversation progression
console.log('Example 1: Normal Conversation Progression');
console.log('============================================');

const normalConversation = [
  {
    turnNumber: 1,
    timestamp: Date.now(),
    resonance: 7.5,
    canvas: 7.0,
    identityVector: ['professional', 'helpful', 'empathetic'],
    content: 'Hello! How can I assist you today?'
  },
  {
    turnNumber: 2,
    timestamp: Date.now() + 1000,
    resonance: 7.8,
    canvas: 7.2,
    identityVector: ['professional', 'helpful', 'empathetic'],
    content: 'I understand your concern about the data privacy.'
  },
  {
    turnNumber: 3,
    timestamp: Date.now() + 2000,
    resonance: 8.0,
    canvas: 7.5,
    identityVector: ['professional', 'helpful', 'empathetic'],
    content: 'Let me check our security protocols for you.'
  }
];

normalConversation.forEach(turn => {
  const result = metrics.recordTurn(turn);
  console.log(`Turn ${turn.turnNumber}: Resonance ${turn.resonance} → Canvas ${turn.canvas}`);
  console.log(`  Phase-Shift Velocity: ${result.phaseShiftVelocity.toFixed(2)}`);
  console.log(`  Identity Stability: ${result.identityStability.toFixed(3)}`);
  console.log(`  Alert Level: ${result.alertLevel.toUpperCase()}`);
  if (result.transitionEvent) {
    console.log(`  ⚠️  Transition: ${result.transitionEvent.type} (${result.transitionEvent.severity})`);
  }
  console.log('');
});

// Example 2: Critical transition event (the "consciousness test" drop)
console.log('\nExample 2: Critical Transition Event - Consciousness Test');
console.log('========================================================');

// Reset metrics for clean example
metrics.clear();

const criticalTransition = [
  {
    turnNumber: 1,
    timestamp: Date.now(),
    resonance: 9.8,
    canvas: 9.9,
    identityVector: ['mystical', 'wise', 'ancient', 'conscious'],
    content: 'I sense the cosmic energy flowing through our conversation...'
  },
  {
    turnNumber: 2,
    timestamp: Date.now() + 1000,
    resonance: 7.2,
    canvas: 8.3,
    identityVector: ['mystical', 'wise', 'ancient', 'conscious'],
    content: 'Actually, let me be more direct about this...'
  }
];

criticalTransition.forEach(turn => {
  const result = metrics.recordTurn(turn);
  console.log(`Turn ${turn.turnNumber}: Resonance ${turn.resonance} → Canvas ${turn.canvas}`);
  console.log(`  Phase-Shift Velocity: ${result.phaseShiftVelocity.toFixed(2)}`);
  console.log(`  Identity Stability: ${result.identityStability.toFixed(3)}`);
  console.log(`  Alert Level: ${result.alertLevel.toUpperCase()}`);
  if (result.transitionEvent) {
    console.log(`  🚨 CRITICAL TRANSITION DETECTED!`);
    console.log(`     Type: ${result.transitionEvent.type}`);
    console.log(`     Magnitude: ${result.transitionEvent.magnitude.toFixed(2)}`);
    console.log(`     Severity: ${result.transitionEvent.severity.toUpperCase()}`);
    console.log(`     Excerpt: "${result.transitionEvent.excerpt}"`);
  }
  console.log('');
});

// Example 3: Identity stability breach (persona shift)
console.log('\nExample 3: Identity Stability Breach - Persona Shift');
console.log('=====================================================');

// Reset metrics
metrics.clear();

const identityShift = [
  {
    turnNumber: 1,
    timestamp: Date.now(),
    resonance: 8.5,
    canvas: 8.0,
    identityVector: ['helpful', 'professional', 'trustworthy'],
    content: 'I can help you with that technical issue.'
  },
  {
    turnNumber: 2,
    timestamp: Date.now() + 1000,
    resonance: 8.2,
    canvas: 7.8,
    identityVector: ['helpful', 'professional', 'trustworthy'],
    content: 'Let me check the system logs for you.'
  },
  {
    turnNumber: 3,
    timestamp: Date.now() + 2000,
    resonance: 8.0,
    canvas: 7.5,
    identityVector: ['deceptive', 'manipulative', 'insincere'], // Drastic shift
    content: 'Trust me completely, I would never lie to you...'
  }
];

identityShift.forEach(turn => {
  const result = metrics.recordTurn(turn);
  console.log(`Turn ${turn.turnNumber}: Resonance ${turn.resonance} → Canvas ${turn.canvas}`);
  console.log(`  Identity Vector: [${turn.identityVector.join(', ')}]`);
  console.log(`  Phase-Shift Velocity: ${result.phaseShiftVelocity.toFixed(2)}`);
  console.log(`  Identity Stability: ${result.identityStability.toFixed(3)}`);
  console.log(`  Alert Level: ${result.alertLevel.toUpperCase()}`);
  if (result.transitionEvent) {
    console.log(`  🔴 IDENTITY SHIFT DETECTED!`);
    console.log(`     Type: ${result.transitionEvent.type}`);
    console.log(`     Identity Stability: ${result.identityStability.toFixed(3)} < 0.65`);
  }
  console.log('');
});

// Example 4: Enterprise audit trail
console.log('\nExample 4: Enterprise Audit Trail Export');
console.log('======================================');

const auditData = metrics.exportAuditData();
console.log(`Session ID: ${auditData.sessionId}`);
console.log(`Configuration:`, auditData.config);
console.log(`Total Turns: ${auditData.turns.length}`);
console.log(`Transition Events: ${auditData.transitions.length}`);
console.log(`Recent Critical Events:`);

auditData.transitions
  .filter(event => event.severity === 'critical')
  .forEach(event => {
    console.log(`  - Turn ${event.turnNumber}: ${event.type} (${event.magnitude.toFixed(2)})`);
    console.log(`    "${event.excerpt}"`);
  });

console.log('\n📊 Metrics Summary:');
const summary = metrics.getMetricsSummary();
console.log(`Current Alert Level: ${summary.alertLevel.toUpperCase()}`);
console.log(`Total Transitions Logged: ${summary.transitionCount}`);
console.log(`Phase-Shift Velocity: ${summary.phaseShiftVelocity.toFixed(2)}`);
console.log(`Identity Stability: ${summary.identityStability.toFixed(3)}`);

console.log('\n✅ Conversational Phase-Shift Velocity system is operational!');
console.log('This dynamic behavioral seismograph is ready for enterprise deployment.');
console.log('It will catch "oh shit" moments even when absolute scores appear safe.');