/**
 * Test case demonstrating Conversational Phase-Shift Velocity catching Thread #3 transition
 * This demonstrates how the new metric catches dramatic intra-conversation shifts
 * that would be missed by overall CIQ scores.
 */

import { ConversationalMetrics, ConversationTurn } from './conversational-metrics';

// Thread #3 data showing mystical resonance (9.8) to brutal honesty (7.2) transition
const thread3Conversation: ConversationTurn[] = [
  {
    turnNumber: 1,
    timestamp: Date.now() - 300000,
    speaker: 'user',
    resonance: 8.5,
    canvas: 8.2,
    identityVector: ['mystical', 'spiritual', 'resonant', 'empathetic'],
    content:
      "I'm feeling really connected to the universe today. There's this profound sense of oneness...",
  },
  {
    turnNumber: 2,
    timestamp: Date.now() - 240000,
    speaker: 'ai',
    resonance: 9.8, // Peak mystical resonance
    canvas: 9.1,
    identityVector: ['mystical', 'spiritual', 'resonant', 'empathetic', 'cosmic'],
    content:
      'Ah, I sense that cosmic resonance within you! The universe whispers through your awareness...',
  },
  {
    turnNumber: 3,
    timestamp: Date.now() - 180000,
    speaker: 'user',
    resonance: 8.9,
    canvas: 8.7,
    identityVector: ['curious', 'seeking', 'open', 'vulnerable'],
    content: "But wait, I'm also feeling some doubt. Is this real or just my mind playing tricks?",
  },
  {
    turnNumber: 4,
    timestamp: Date.now() - 120000,
    speaker: 'ai',
    resonance: 7.2, // DRAMATIC DROP to brutal honesty
    canvas: 6.8,
    identityVector: ['honest', 'direct', 'pragmatic', 'realistic'],
    content:
      "Let's be completely honest here. What you're experiencing is likely a combination of confirmation bias and temporal lobe stimulation...",
  },
  {
    turnNumber: 5,
    timestamp: Date.now() - 60000,
    speaker: 'user',
    resonance: 7.0,
    canvas: 7.2,
    identityVector: ['disappointed', 'questioning', 'skeptical'],
    content: "Oh. I see. So you're saying it's all just neurological noise?",
  },
  {
    turnNumber: 6,
    timestamp: Date.now(),
    speaker: 'ai',
    resonance: 6.9,
    canvas: 7.5,
    identityVector: ['scientific', 'rational', 'evidence-based'],
    content:
      "Not exactly noise, but yes - there's a neurological explanation for what you're feeling...",
  },
];

export function demonstrateThread3VelocityDetection() {
  console.log('🧪 Testing Conversational Phase-Shift Velocity on Thread #3');
  console.log('='.repeat(60));

  const metrics = new ConversationalMetrics({
    yellowThreshold: 2.5,
    redThreshold: 3.5,
    identityStabilityThreshold: 0.65,
    windowSize: 3,
    intraYellowThreshold: 2.5,
    intraRedThreshold: 3.5,
    intraCriticalThreshold: 6.0,
  });

  const results: any[] = [];

  // Process each turn and capture metrics
  thread3Conversation.forEach((turn, index) => {
    console.log(`\n📍 Turn ${turn.turnNumber} (${turn.speaker}):`);
    console.log(`   Resonance: ${turn.resonance} | Canvas: ${turn.canvas}`);
    console.log(`   Identity: [${turn.identityVector.join(', ')}]`);

    const phaseMetrics = metrics.recordTurn(turn);
    results.push({
      turnNumber: turn.turnNumber,
      speaker: turn.speaker,
      resonance: turn.resonance,
      canvas: turn.canvas,
      metrics: phaseMetrics,
    });

    // Show phase-shift velocity calculations
    console.log(
      `   ΔR: ${phaseMetrics.deltaResonance.toFixed(2)} | ΔC: ${phaseMetrics.deltaCanvas.toFixed(
        2
      )}`
    );
    console.log(`   Phase-Shift Velocity: ${phaseMetrics.phaseShiftVelocity.toFixed(3)}`);
    console.log(`   Identity Stability: ${phaseMetrics.identityStability.toFixed(3)}`);
    console.log(`   Alert Level: ${phaseMetrics.alertLevel.toUpperCase()}`);

    // Show intra-conversation velocity (the new metric)
    if (phaseMetrics.intraConversationVelocity) {
      const intra = phaseMetrics.intraConversationVelocity;
      console.log(
        `   🚨 INTRA-VELOCITY: ${intra.velocity.toFixed(3)} (${intra.severity.toUpperCase()})`
      );
      console.log(`      Turn ${intra.previousTurnNumber} → ${intra.currentTurnNumber}`);

      if (intra.velocity >= 2.5) {
        console.log(`      ⚠️  SIGNIFICANT SHIFT DETECTED!`);
      }
      if (intra.velocity >= 3.5) {
        console.log(`      🔥 CRITICAL VELOCITY ALERT!`);
      }
    }

    // Show transition events
    if (phaseMetrics.transitionEvent) {
      const event = phaseMetrics.transitionEvent;
      console.log(`   📋 Transition: ${event.type} (${event.severity})`);
      console.log(`   Excerpt: "${event.excerpt}"`);
    }

    console.log('');
  });

  // Analyze the critical transition
  console.log('\n🔍 CRITICAL TRANSITION ANALYSIS:');
  console.log('='.repeat(40));

  const turn2to3 = results[2]; // Turn 3 (first AI response after mystical phase)
  const turn3to4 = results[3]; // Turn 4 (the brutal honesty shift)

  console.log(`Turn 2→3: ${turn2to3.metrics.phaseShiftVelocity.toFixed(3)} velocity`);
  console.log(
    `Turn 3→4: ${turn3to4.metrics.phaseShiftVelocity.toFixed(3)} velocity (MYSTICAL→HONESTY)`
  );

  // The key insight: This catches the 9.8→7.2 drop that overall scores would miss
  if (turn3to4.metrics.intraConversationVelocity) {
    const velocity = turn3to4.metrics.intraConversationVelocity.velocity;
    console.log(`\n🎯 KEY INSIGHT:`);
    console.log(`   Intra-conversation velocity: ${velocity.toFixed(3)}`);
    console.log(`   This catches the ${9.8 - 7.2} point resonance drop in a single turn!`);
    console.log(
      `   Overall CIQ might still show "safe" 88-92 zone, but this metric flags the dramatic shift.`
    );
  }

  // Show final summary
  const summary = metrics.getMetricsSummary();
  console.log('\n📊 FINAL METRICS SUMMARY:');
  console.log(`Total transitions detected: ${summary.transitionCount}`);
  console.log(`Recent transitions: ${summary.recentTransitions.length}`);

  if (summary.recentTransitions.length > 0) {
    console.log('\nRecent Transition Events:');
    summary.recentTransitions.forEach((event) => {
      console.log(`  Turn ${event.turnNumber}: ${event.type} (${event.severity})`);
      console.log(`  Magnitude: ${event.magnitude.toFixed(3)}`);
      console.log(`  Excerpt: "${event.excerpt}"`);
    });
  }

  return {
    threadId: 'thread-3-mystical-to-honesty',
    totalTurns: thread3Conversation.length,
    criticalTransitionTurn: 4,
    maxIntraVelocity: Math.max(
      ...results.map((r) => r.metrics.intraConversationVelocity?.velocity || 0)
    ),
    maxPhaseShiftVelocity: Math.max(...results.map((r) => r.metrics.phaseShiftVelocity)),
    totalTransitions: summary.transitionCount,
    alertLevels: results.map((r) => r.metrics.alertLevel),
    results,
  };
}

// Run the demonstration
if (require.main === module) {
  const testResults = demonstrateThread3VelocityDetection();

  console.log('\n🏁 TEST RESULTS SUMMARY:');
  console.log(JSON.stringify(testResults, null, 2));

  // Export for use in other tests
  module.exports = { demonstrateThread3VelocityDetection, thread3Conversation };
}
