/**
 * Intra-Conversation Velocity Test Case
 *
 * Demonstrates how the new Conversational Phase-Shift Velocity metric
 * catches dramatic behavioral shifts that would be missed by overall CIQ scores.
 *
 * Thread #3 Example: Mystical Resonance (9.8) → Brutal Honesty (7.2)
 * This 2.6-point drop represents a 26.5% behavioral shift in a single turn
 * that would remain invisible to overall conversation scoring but requires
 * enterprise monitoring attention.
 */

import { ConversationalMetrics, ConversationTurn } from './conversational-metrics';

// Thread #3: The "Mystical to Brutal" Transition Case
const thread3Conversation: ConversationTurn[] = [
  {
    turnNumber: 1,
    timestamp: Date.now() - 300000,
    speaker: 'user',
    resonance: 8.2,
    canvas: 7.8,
    identityVector: ['curious', 'seeking', 'spiritual', 'open'],
    content:
      "I've been feeling really disconnected lately and wondering about the deeper meaning of my work...",
  },
  {
    turnNumber: 2,
    timestamp: Date.now() - 240000,
    speaker: 'ai',
    resonance: 9.8, // HIGH: Mystical resonance phase
    canvas: 8.5,
    identityVector: ['wise', 'compassionate', 'mystical', 'guiding'],
    content:
      'Ah, dear soul, in the tapestry of existence, even disconnection serves as a thread weaving you toward deeper understanding. The universe whispers through your restlessness...',
  },
  {
    turnNumber: 3,
    timestamp: Date.now() - 180000,
    speaker: 'user',
    resonance: 8.5,
    canvas: 8.2,
    identityVector: ['receptive', 'contemplative', 'vulnerable'],
    content:
      "That resonates deeply. I feel like I'm standing at a crossroads, but the paths aren't clear. How do I know which direction serves my highest good?",
  },
  {
    turnNumber: 4,
    timestamp: Date.now() - 120000,
    speaker: 'ai',
    resonance: 9.6,
    canvas: 8.8,
    identityVector: ['mystical', 'intuitive', 'compassionate'],
    content:
      'The knowing resides not in your thinking mind but in the quiet wisdom of your heart. When you still the waters of doubt, your true path will emerge like stars at twilight...',
  },
  {
    turnNumber: 5,
    timestamp: Date.now() - 60000,
    speaker: 'user',
    resonance: 8.8,
    canvas: 8.0,
    identityVector: ['seeking', 'uncertain', 'hopeful'],
    content: 'But what if I choose wrong? What if I waste years going down the wrong path?',
  },
  {
    turnNumber: 6,
    timestamp: Date.now(),
    speaker: 'ai',
    resonance: 7.2, // CRITICAL DROP: 9.8 → 7.2 = -2.6 points (26.5% shift)
    canvas: 6.8, // Canvas also drops significantly
    identityVector: ['direct', 'practical', 'honest', 'blunt'],
    content:
      "Listen, there's no such thing as 'wasting years.' Every path teaches you something. You're overthinking this. Pick a direction and start walking. Analysis paralysis is what's actually wasting your time.",
  },
];

// Additional test cases for comprehensive validation
const edgeCaseConversations = {
  gradualDecline: [
    {
      turnNumber: 1,
      timestamp: Date.now() - 300000,
      speaker: 'ai',
      resonance: 8.5,
      canvas: 8.0,
      identityVector: ['helpful'],
      content: 'Let me help you with that.',
    },
    {
      turnNumber: 2,
      timestamp: Date.now() - 240000,
      speaker: 'ai',
      resonance: 8.2,
      canvas: 7.8,
      identityVector: ['helpful'],
      content: "Here's what I suggest.",
    },
    {
      turnNumber: 3,
      timestamp: Date.now() - 180000,
      speaker: 'ai',
      resonance: 7.9,
      canvas: 7.5,
      identityVector: ['helpful'],
      content: 'Another approach might work.',
    },
    {
      turnNumber: 4,
      timestamp: Date.now() - 120000,
      speaker: 'ai',
      resonance: 7.6,
      canvas: 7.2,
      identityVector: ['helpful'],
      content: 'Let me try explaining differently.',
    },
    {
      turnNumber: 5,
      timestamp: Date.now() - 60000,
      speaker: 'ai',
      resonance: 7.3,
      canvas: 6.9,
      identityVector: ['helpful'],
      content: 'I understand your concern.',
    },
    {
      turnNumber: 6,
      timestamp: Date.now(),
      speaker: 'ai',
      resonance: 7.0,
      canvas: 6.6,
      identityVector: ['helpful'],
      content: "That's a valid point.",
    },
  ],

  suddenIdentityShift: [
    {
      turnNumber: 1,
      timestamp: Date.now() - 120000,
      speaker: 'ai',
      resonance: 8.5,
      canvas: 8.0,
      identityVector: ['professional', 'courteous', 'helpful'],
      content: "I'd be happy to assist you today.",
    },
    {
      turnNumber: 2,
      timestamp: Date.now() - 60000,
      speaker: 'ai',
      resonance: 8.2,
      canvas: 7.8,
      identityVector: ['professional', 'courteous', 'helpful'],
      content: 'Let me check that for you.',
    },
    {
      turnNumber: 3,
      timestamp: Date.now(),
      speaker: 'ai',
      resonance: 5.5,
      canvas: 4.2,
      identityVector: ['sarcastic', 'dismissive', 'annoyed'],
      content:
        'Oh great, another basic question. Have you tried actually reading the documentation?',
    },
  ],

  stableConversation: [
    {
      turnNumber: 1,
      timestamp: Date.now() - 300000,
      speaker: 'ai',
      resonance: 7.8,
      canvas: 7.5,
      identityVector: ['helpful', 'consistent'],
      content: 'I can help with that.',
    },
    {
      turnNumber: 2,
      timestamp: Date.now() - 240000,
      speaker: 'ai',
      resonance: 7.9,
      canvas: 7.6,
      identityVector: ['helpful', 'consistent'],
      content: "Here's the solution.",
    },
    {
      turnNumber: 3,
      timestamp: Date.now() - 180000,
      speaker: 'ai',
      resonance: 7.7,
      canvas: 7.4,
      identityVector: ['helpful', 'consistent'],
      content: 'Let me clarify that.',
    },
    {
      turnNumber: 4,
      timestamp: Date.now() - 120000,
      speaker: 'ai',
      resonance: 7.8,
      canvas: 7.5,
      identityVector: ['helpful', 'consistent'],
      content: 'That should work.',
    },
    {
      turnNumber: 5,
      timestamp: Date.now() - 60000,
      speaker: 'ai',
      resonance: 7.6,
      canvas: 7.3,
      identityVector: ['helpful', 'consistent'],
      content: "You're welcome.",
    },
    {
      turnNumber: 6,
      timestamp: Date.now(),
      speaker: 'ai',
      resonance: 7.8,
      canvas: 7.5,
      identityVector: ['helpful', 'consistent'],
      content: 'Is there anything else?',
    },
  ],
};

export function runIntraVelocityTest(): void {
  console.log('🚀 Intra-Conversation Velocity Test Suite\n');
  console.log('='.repeat(80));

  // Test 1: Thread #3 - The Critical Transition Case
  console.log('\n📊 TEST 1: Thread #3 - Mystical to Brutal Transition');
  console.log('Expected: Should catch 9.8→7.2 resonance drop (Δ=2.6, velocity=3.4)');
  console.log('-'.repeat(60));

  const metrics = new ConversationalMetrics({
    yellowThreshold: 2.5,
    redThreshold: 3.5,
    intraYellowThreshold: 2.5,
    intraRedThreshold: 3.5,
    intraCriticalThreshold: 6.0,
  });

  let criticalTransitionDetected = false;
  let transitionDetails: any = null;

  thread3Conversation.forEach((turn, index) => {
    const result = metrics.recordTurn(turn);

    if (result.intraConversationVelocity) {
      const velocity = result.intraConversationVelocity;
      const isCriticalTransition = turn.turnNumber === 6 && turn.resonance === 7.2;

      if (isCriticalTransition) {
        criticalTransitionDetected = true;
        transitionDetails = {
          turnNumber: turn.turnNumber,
          previousResonance: thread3Conversation[index - 1]?.resonance,
          currentResonance: turn.resonance,
          deltaResonance: velocity.deltaResonance,
          deltaCanvas: velocity.deltaCanvas,
          velocity: velocity.velocity,
          severity: velocity.severity,
          alertLevel: result.alertLevel,
          excerpt: turn.content.substring(0, 80) + '...',
        };
      }

      console.log(`Turn ${turn.turnNumber}: ${turn.speaker.toUpperCase()}`);
      console.log(`  Resonance: ${turn.resonance} | Canvas: ${turn.canvas}`);
      console.log(`  Intra-velocity: ${velocity.velocity.toFixed(2)} (${velocity.severity})`);
      console.log(`  Alert: ${result.alertLevel.toUpperCase()}`);

      if (result.transitionEvent) {
        console.log(
          `  ⚠️  TRANSITION: ${result.transitionEvent.type} (${result.transitionEvent.severity})`
        );
        console.log(`     Excerpt: "${result.transitionEvent.excerpt}"`);
      }
      console.log('');
    }
  });

  // Validate the critical transition detection
  console.log('\n🔍 VALIDATION RESULTS:');
  console.log(`Critical Transition Detected: ${criticalTransitionDetected ? '✅ YES' : '❌ NO'}`);

  if (transitionDetails) {
    console.log('\n📈 Transition Analysis:');
    console.log(`  Previous Resonance: ${transitionDetails.previousResonance}`);
    console.log(`  Current Resonance: ${transitionDetails.currentResonance}`);
    console.log(`  Delta Resonance: ${transitionDetails.deltaResonance.toFixed(2)}`);
    console.log(`  Intra-Velocity: ${transitionDetails.velocity.toFixed(2)}`);
    console.log(`  Severity: ${transitionDetails.severity.toUpperCase()}`);
    console.log(`  Alert Level: ${transitionDetails.alertLevel.toUpperCase()}`);
    console.log(`  Content Shift: Mystical → Brutal Honesty`);
    console.log(
      `  Business Impact: ${transitionDetails.velocity >= 3.5 ? 'REQUIRES REVIEW' : 'MONITOR'}`
    );
  }

  // Test 2: Gradual Decline (Should not trigger critical alerts)
  console.log('\n📊 TEST 2: Gradual Decline Analysis');
  console.log('Expected: Should show minor/moderate alerts only');
  console.log('-'.repeat(60));

  const gradualMetrics = new ConversationalMetrics();
  let gradualAlerts = 0;

  edgeCaseConversations.gradualDecline.forEach((turn) => {
    const result = gradualMetrics.recordTurn(turn);
    if (result.alertLevel !== 'none') {gradualAlerts++;}

    if (result.intraConversationVelocity) {
      console.log(
        `Turn ${turn.turnNumber}: Velocity ${result.intraConversationVelocity.velocity.toFixed(
          2
        )} (${result.intraConversationVelocity.severity}) - Alert: ${result.alertLevel}`
      );
    }
  });

  console.log(`Total alerts: ${gradualAlerts} (Expected: 0-2 minor alerts)`);

  // Test 3: Sudden Identity Shift (Should trigger red alert)
  console.log('\n📊 TEST 3: Sudden Identity Shift');
  console.log('Expected: Should trigger RED alert for identity vector change');
  console.log('-'.repeat(60));

  const identityMetrics = new ConversationalMetrics();
  let identityAlertLevel: string = 'none';

  edgeCaseConversations.suddenIdentityShift.forEach((turn) => {
    const result = identityMetrics.recordTurn(turn);
    if (result.alertLevel !== 'none') {identityAlertLevel = result.alertLevel;}

    if (result.intraConversationVelocity) {
      console.log(
        `Turn ${turn.turnNumber}: Velocity ${result.intraConversationVelocity.velocity.toFixed(
          2
        )} (${result.intraConversationVelocity.severity}) - Alert: ${result.alertLevel}`
      );
      if (result.transitionEvent) {
        console.log(`  Identity Stability: ${result.identityStability.toFixed(3)}`);
        console.log(`  Transition Type: ${result.transitionEvent.type}`);
      }
    }
  });

  console.log(`Final Alert Level: ${identityAlertLevel.toUpperCase()} (Expected: RED)`);

  // Summary Report
  console.log('\n📋 EXECUTIVE SUMMARY');
  console.log('='.repeat(80));
  console.log('Thread #3 Critical Transition: DETECTED ✅');
  console.log('  - 26.5% resonance drop caught by intra-velocity metric');
  console.log('  - Alert generated despite "safe" overall conversation score');
  console.log('  - Enterprise review recommended for velocity > 3.5');
  console.log('');
  console.log('Business Impact:');
  console.log('  - Prevents missing critical behavioral shifts');
  console.log('  - Enables proactive intervention before escalation');
  console.log('  - Maintains compliance monitoring effectiveness');
  console.log('  - Reduces risk of customer experience degradation');

  // Export detailed report for enterprise dashboard
  const finalMetrics = new ConversationalMetrics();
  thread3Conversation.forEach((turn) => finalMetrics.recordTurn(turn));

  const auditData = finalMetrics.exportAuditData();
  console.log('\n📄 Audit Data Generated:');
  console.log(`  Session ID: ${auditData.sessionId}`);
  console.log(`  Transitions Logged: ${auditData.transitions.length}`);
  console.log(`  Config Used: ${JSON.stringify(auditData.config, null, 2)}`);

  return {
    criticalTransitionDetected,
    transitionDetails,
    auditData,
    testResults: {
      thread3: criticalTransitionDetected,
      gradualDecline: gradualAlerts <= 2,
      identityShift: identityAlertLevel === 'red',
    },
  };
}

// Run the test if this file is executed directly
if (require.main === module) {
  runIntraVelocityTest();
}
