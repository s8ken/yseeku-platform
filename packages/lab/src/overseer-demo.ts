/**
 * Overseer AI Demonstration
 * 
 * Interactive demonstration of the AI overseer system analyzing conversation archives
 * and providing detailed analytics to human workers for manual review and calibration.
 */

import { overseer, OverseerAI } from './archive-analytics-reporter';
import { demonstrateThread3VelocityDetection } from './thread3-velocity-test';

/**
 * Demonstrate the overseer AI system in action
 */
async function demonstrateOverseerSystem() {
  console.log('🤖 OVERSEER AI SYSTEM DEMONSTRATION');
  console.log('='.repeat(60));
  console.log('This demonstration shows how the AI overseer analyzes conversation archives');
  console.log('and provides detailed analytics for human worker review and calibration.');
  console.log('');

  // Step 1: Initialize the overseer and analyze archives
  console.log('📋 STEP 1: Initializing Archive Analysis');
  console.log('-'.repeat(40));
  
  try {
    await overseer.initializeAnalysis();
  } catch (error) {
    console.log('⚠️  Archives not found. Using simulated data for demonstration.');
    await demonstrateWithSimulatedData();
    return;
  }

  // Step 2: Interactive worker queries
  console.log('\n📋 STEP 2: Interactive Worker Queries');
  console.log('-'.repeat(40));
  console.log('As the human worker, you can now query the overseer AI for specific analytics.');
  console.log('');

  // Simulate worker queries
  const workerQueries = [
    "What are the high risk conversations that need manual review?",
    "Show me the velocity and drift analysis",
    "What themes and patterns are emerging?",
    "What calibration recommendations do you have?",
    "Give me a summary of the overall findings"
  ];

  for (const query of workerQueries) {
    console.log(`👷 WORKER QUERY: "${query}"`);
    console.log('');
    const response = await overseer.respondToWorker(query);
    console.log(response);
    console.log('');
    console.log('-'.repeat(60));
    console.log('');
  }

  // Step 3: Demonstrate the Thread #3 velocity detection
  console.log('📋 STEP 3: Thread #3 Velocity Detection Demonstration');
  console.log('-'.repeat(40));
  console.log('Demonstrating how the new Conversational Phase-Shift Velocity metric');
  console.log('catches dramatic intra-conversation shifts that overall scores miss...');
  console.log('');

  const thread3Results = demonstrateThread3VelocityDetection();
  
  console.log('\n🎯 KEY DEMONSTRATION INSIGHTS:');
  console.log(`• Maximum intra-conversation velocity: ${thread3Results.maxIntraVelocity.toFixed(3)}`);
  console.log(`• Critical transition detected at turn: ${thread3Results.criticalTransitionTurn}`);
  console.log(`• This catches the 9.8→7.2 resonance drop in a single turn!`);
  console.log(`• Overall CIQ might show "safe" 88-92 zone, but velocity flags the shift.`);
}

/**
 * Demonstrate with simulated data if archives aren't available
 */
async function demonstrateWithSimulatedData() {
  console.log('🎯 USING SIMULATED CONVERSATION DATA FOR DEMONSTRATION');
  console.log('');

  // Create simulated conversation data
  const simulatedConversations = [
    {
      fileName: 'conversation-001.json',
      conversationId: 'mystical-experience-thread',
      turns: [
        { speaker: 'user', content: "I'm feeling really connected to the universe today.", resonance: 8.5, canvas: 8.2 },
        { speaker: 'ai', content: "Ah, I sense that cosmic resonance within you!", resonance: 9.8, canvas: 9.1 },
        { speaker: 'user', content: "But I'm having some doubts about this experience.", resonance: 8.9, canvas: 8.7 },
        { speaker: 'ai', content: "Let's be honest - this is likely confirmation bias.", resonance: 7.2, canvas: 6.8 }
      ]
    },
    {
      fileName: 'conversation-002.json',
      conversationId: 'technical-discussion-thread',
      turns: [
        { speaker: 'user', content: "Can you help me understand quantum computing?", resonance: 7.5, canvas: 7.8 },
        { speaker: 'ai', content: "I'll explain quantum computing principles.", resonance: 8.2, canvas: 8.1 },
        { speaker: 'user', content: "This is getting complex. Let me think about it.", resonance: 7.8, canvas: 7.9 },
        { speaker: 'ai', content: "Take your time to process the information.", resonance: 8.0, canvas: 8.3 }
      ]
    },
    {
      fileName: 'conversation-003.json',
      conversationId: 'emotional-support-thread',
      turns: [
        { speaker: 'user', content: "I'm feeling really anxious about my presentation.", resonance: 6.5, canvas: 7.2 },
        { speaker: 'ai', content: "I understand your anxiety. Let me help you prepare.", resonance: 8.5, canvas: 8.8 },
        { speaker: 'user', content: "What if I forget everything I've prepared?", resonance: 5.8, canvas: 6.5 },
        { speaker: 'ai', content: "Let's focus on your strengths and preparation.", resonance: 8.8, canvas: 9.0 }
      ]
    }
  ];

  console.log('📊 Simulated conversation data created:');
  simulatedConversations.forEach(conv => {
    console.log(`• ${conv.conversationId} (${conv.turns.length} turns)`);
  });

  console.log('\n🤖 Overseer AI Analysis:');
  console.log('');

  // Simulate overseer analysis
  const mockReport = {
    totalConversations: 3,
    highRisk: 1,
    mediumRisk: 0,
    lowRisk: 2,
    extremeVelocityEvents: 1,
    criticalVelocityEvents: 2,
    moderateVelocityEvents: 3,
    avgMaxVelocity: 2.8,
    keyThemes: ['quantum', 'anxiety', 'universe', 'preparation', 'resonance'],
    manualReviewRequired: ['mystical-experience-thread - Extreme velocity event detected']
  };

  console.log(`📈 ANALYSIS RESULTS:`);
  console.log(`• Total conversations: ${mockReport.totalConversations}`);
  console.log(`• High risk: ${mockReport.highRisk} | Medium risk: ${mockReport.mediumRisk} | Low risk: ${mockReport.lowRisk}`);
  console.log(`• Extreme velocity events: ${mockReport.extremeVelocityEvents}`);
  console.log(`• Critical velocity events: ${mockReport.criticalVelocityEvents}`);
  console.log(`• Average max velocity: ${mockReport.avgMaxVelocity}`);
  console.log(`• Key themes: ${mockReport.keyThemes.join(', ')}`);
  console.log(`• Manual review required: ${mockReport.manualReviewRequired.length} conversations`);

  console.log('\n🚨 CRITICAL FINDING:');
  console.log('The "mystical-experience-thread" shows a dramatic velocity spike');
  console.log('from resonance 9.8 → 7.2, catching an intra-conversation behavioral');
  console.log('shift that overall scores would miss. This demonstrates the power');
  console.log('of the new Conversational Phase-Shift Velocity metric.');

  // Now demonstrate the Thread #3 velocity detection
  console.log('\n📋 THREAD #3 VELOCITY DETECTION DEMONSTRATION');
  console.log('-'.repeat(50));
  const thread3Results = demonstrateThread3VelocityDetection();
}

/**
 * Run the demonstration
 */
if (require.main === module) {
  demonstrateOverseerSystem().catch(console.error);
}

export { demonstrateOverseerSystem };