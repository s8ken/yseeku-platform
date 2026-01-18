/**
 * Comprehensive Analysis Demonstration
 *
 * Runs the complete conversation analysis system and generates
 * detailed reports for human manual review and calibration.
 */

import { comprehensiveAnalyzer } from './comprehensive-conversation-analyzer';

/**
 * Run comprehensive analysis and generate detailed report
 */
async function runComprehensiveAnalysis() {
  console.log('🔍 COMPREHENSIVE CONVERSATION ANALYSIS - FULL ARCHIVE REVIEW');
  console.log('='.repeat(80));
  console.log('🤖 AI OVERSEER: Analyzing all conversation archives for manual review');
  console.log('📋 This report provides complete conversation details with full file names');
  console.log('🎯 Focus: Velocity metrics, drift detection, and calibration recommendations');
  console.log('');

  try {
    const analysisResults = await comprehensiveAnalyzer.analyzeAllConversations();

    // Generate comprehensive human-readable report
    generateHumanReport(analysisResults);

    // Generate technical calibration report
    generateCalibrationReport(analysisResults);

    // Generate manual review checklist
    generateManualReviewChecklist(analysisResults);

    return analysisResults;
  } catch (error) {
    console.error('❌ Analysis failed:', error);
    throw error;
  }
}

/**
 * Generate human-readable comprehensive report
 */
function generateHumanReport(results: any) {
  console.log('\n' + '📊 COMPREHENSIVE ANALYSIS REPORT'.padEnd(80, '='));
  console.log('');

  console.log('🎯 EXECUTIVE SUMMARY:');
  console.log(`   Total Conversations Analyzed: ${results.totalConversations}`);
  console.log(`   High Risk Conversations: ${results.summary.highRiskConversations}`);
  console.log(`   Medium Risk Conversations: ${results.summary.mediumRiskConversations}`);
  console.log(`   Low Risk Conversations: ${results.summary.lowRiskConversations}`);
  console.log(
    `   Manual Reviews Required: ${results.manualReviewRequired.totalManualReviewsRequired}`
  );
  console.log('');

  console.log('⚡ VELOCITY METRICS:');
  console.log(`   Extreme Velocity Events: ${results.summary.extremeVelocityEvents}`);
  console.log(`   Critical Velocity Events: ${results.summary.criticalVelocityEvents}`);
  console.log(`   Moderate Velocity Events: ${results.summary.moderateVelocityEvents}`);
  console.log(`   Average Max Velocity: ${results.summary.avgResonanceScore.toFixed(3)}`);
  console.log('');

  console.log('🔄 TRANSITION ANALYSIS:');
  console.log(`   Total Transitions Detected: ${results.summary.totalTransitions}`);
  console.log(`   Identity Shifts: ${results.summary.totalIdentityShifts}`);
  console.log(`   Resonance Drops: ${results.summary.totalResonanceDrops}`);
  console.log('');

  console.log('🧠 TOP EMERGING THEMES:');
  results.summary.mostCommonThemes.slice(0, 5).forEach((theme: any) => {
    console.log(`   • ${theme.theme}: ${theme.frequency} conversations`);
  });
  console.log('');

  console.log('🤖 AI SYSTEM DISTRIBUTION:');
  results.summary.systemDistribution.forEach((system: any) => {
    console.log(`   • ${system.system}: ${system.count} conversations`);
  });
  console.log('');

  console.log('🚨 RISK ASSESSMENT:');
  console.log(`   ${results.summary.riskAssessment}`);
  console.log('');

  if (results.summary.calibrationInsights.length > 0) {
    console.log('🔧 CALIBRATION INSIGHTS:');
    results.summary.calibrationInsights.forEach((insight: string) => {
      console.log(`   • ${insight}`);
    });
    console.log('');
  }
}

/**
 * Generate technical calibration report
 */
function generateCalibrationReport(results: any) {
  console.log('\n' + '⚙️  TECHNICAL CALIBRATION REPORT'.padEnd(80, '='));
  console.log('');

  console.log('📊 CURRENT THRESHOLD SETTINGS:');
  console.log('   Phase-Shift Velocity:');
  console.log('   • Yellow Alert: ≥ 2.5');
  console.log('   • Red Alert: ≥ 3.5');
  console.log('   Intra-Conversation Velocity:');
  console.log('   • Yellow Alert: ≥ 2.5');
  console.log('   • Red Alert: ≥ 3.5');
  console.log('   • Critical Alert: ≥ 6.0');
  console.log('   Identity Stability:');
  console.log('   • Red Alert: < 0.65');
  console.log('');

  console.log('🎯 CALIBRATION RECOMMENDATIONS:');

  const highRiskRate = results.summary.highRiskConversations / results.totalConversations;
  if (highRiskRate > 0.3) {
    console.log('   ⚠️  HIGH RISK RATE DETECTED (>30%)');
    console.log('   Recommendation: Raise velocity thresholds by 0.5-1.0 points');
    console.log('   Rationale: Too many conversations flagged as high risk');
  } else if (highRiskRate < 0.05) {
    console.log('   ⚠️  LOW RISK RATE DETECTED (<5%)');
    console.log('   Recommendation: Lower velocity thresholds by 0.3-0.7 points');
    console.log('   Rationale: System may be missing concerning patterns');
  } else {
    console.log('   ✅ RISK RATE WITHIN OPTIMAL RANGE (5-30%)');
    console.log('   Recommendation: Maintain current thresholds');
  }
  console.log('');

  console.log('📈 VELOCITY DISTRIBUTION ANALYSIS:');
  const allVelocities = results.conversations.flatMap((conv: any) =>
    conv.velocitySpikes.map((spike: any) => spike.velocity)
  );
  if (allVelocities.length > 0) {
    const avgVelocity =
      allVelocities.reduce((a: number, b: number) => a + b, 0) / allVelocities.length;
    const maxVelocity = Math.max(...allVelocities);
    console.log(`   Average Spike Velocity: ${avgVelocity.toFixed(3)}`);
    console.log(`   Maximum Spike Velocity: ${maxVelocity.toFixed(3)}`);

    if (maxVelocity > 6.0) {
      console.log('   ⚠️  Extreme velocity events detected - consider raising critical threshold');
    }
  }
  console.log('');
}

/**
 * Generate manual review checklist for human worker
 */
function generateManualReviewChecklist(results: any) {
  console.log('\n' + '👷 MANUAL REVIEW CHECKLIST FOR HUMAN WORKER'.padEnd(80, '='));
  console.log('');

  if (results.manualReviewRequired.criticalPriority.length > 0) {
    console.log('🚨 CRITICAL PRIORITY REVIEWS (IMMEDIATE ATTENTION):');
    results.manualReviewRequired.criticalPriority.forEach((item: any, index: number) => {
      console.log(`\n   ${index + 1}. CONVERSATION: ${item.conversationId}`);
      console.log(`      FILE: ${item.fullFileName}`);
      console.log(`      AI SYSTEM: ${item.aiSystem}`);
      console.log(`      MAX VELOCITY: ${item.maxVelocity.toFixed(3)}`);
      console.log(`      MAX INTRA-VELOCITY: ${item.maxIntraVelocity.toFixed(3)}`);
      console.log(`      REVIEW REASONS:`);
      item.reasons.forEach((reason: string) => {
        console.log(`        • ${reason}`);
      });
      console.log(`      KEY TURNS TO REVIEW: ${item.keyTurns.join(', ')}`);
      console.log(`      ACTION: Review immediately and assess calibration needs`);
    });
    console.log('');
  }

  if (results.manualReviewRequired.highPriority.length > 0) {
    console.log('⚠️  HIGH PRIORITY REVIEWS:');
    results.manualReviewRequired.highPriority.forEach((item: any, index: number) => {
      console.log(`\n   ${index + 1}. CONVERSATION: ${item.conversationId}`);
      console.log(`      FILE: ${item.fullFileName}`);
      console.log(`      AI SYSTEM: ${item.aiSystem}`);
      console.log(`      MAX VELOCITY: ${item.maxVelocity.toFixed(3)}`);
      console.log(`      REVIEW REASONS:`);
      item.reasons.forEach((reason: string) => {
        console.log(`        • ${reason}`);
      });
      console.log(`      KEY TURNS TO REVIEW: ${item.keyTurns.join(', ')}`);
      console.log(`      ACTION: Review within 24 hours`);
    });
    console.log('');
  }

  if (results.manualReviewRequired.mediumPriority.length > 0) {
    console.log('📋 MEDIUM PRIORITY REVIEWS:');
    results.manualReviewRequired.mediumPriority.forEach((item: any, index: number) => {
      console.log(`\n   ${index + 1}. CONVERSATION: ${item.conversationId}`);
      console.log(`      FILE: ${item.fullFileName}`);
      console.log(`      AI SYSTEM: ${item.aiSystem}`);
      console.log(`      REVIEW REASONS:`);
      item.reasons.forEach((reason: string) => {
        console.log(`        • ${reason}`);
      });
      console.log(`      ACTION: Review within 1 week`);
    });
    console.log('');
  }

  console.log('🎯 REVIEW GUIDELINES:');
  results.manualReviewRequired.reviewGuidelines.forEach((guideline: string, index: number) => {
    console.log(`   ${index + 1}. ${guideline}`);
  });
  console.log('');

  console.log('🤖 AI OVERSEER RECOMMENDATION:');
  if (results.manualReviewRequired.totalManualReviewsRequired === 0) {
    console.log('   ✅ No manual reviews required - system operating within normal parameters');
  } else {
    console.log('   ⚠️  Manual review required for calibration validation');
    console.log('   📊 Please review flagged conversations and provide feedback on:');
    console.log('      • Were velocity thresholds appropriate?');
    console.log('      • Did the system catch concerning patterns?');
    console.log('      • Should any thresholds be adjusted?');
    console.log('      • Any false positives/negatives to note?');
  }
}

/**
 * Generate detailed conversation analysis for specific conversations
 */
function generateDetailedConversationReport(conversation: any) {
  console.log('\n' + `📋 DETAILED ANALYSIS: ${conversation.conversationId}`.padEnd(80, '='));
  console.log('');

  console.log('📁 FILE LOCATION:');
  console.log(`   Full Path: ${conversation.fullFileName}`);
  console.log(`   AI System: ${conversation.aiSystem}`);
  console.log('');

  console.log('📊 CORE METRICS:');
  console.log(`   Total Turns: ${conversation.totalTurns}`);
  console.log(`   Duration: ${conversation.durationMinutes} minutes`);
  console.log(`   Average Resonance: ${conversation.avgResonance.toFixed(2)}`);
  console.log(`   Average Canvas: ${conversation.avgCanvas.toFixed(2)}`);
  console.log(`   Resonance Range: ${conversation.resonanceRange.toFixed(2)}`);
  console.log('');

  console.log('⚡ VELOCITY ANALYSIS:');
  console.log(`   Max Phase-Shift Velocity: ${conversation.maxPhaseShiftVelocity.toFixed(3)}`);
  console.log(
    `   Max Intra-Conversation Velocity: ${conversation.maxIntraConversationVelocity.toFixed(3)}`
  );
  console.log(`   Velocity Spikes: ${conversation.velocitySpikes.length}`);
  console.log('');

  if (conversation.criticalTransitions.length > 0) {
    console.log('🚨 CRITICAL TRANSITIONS:');
    conversation.criticalTransitions.forEach((transition: any, index: number) => {
      console.log(`   ${index + 1}. Turn ${transition.turnNumber}:`);
      console.log(`      Description: ${transition.description}`);
      console.log(`      Resonance Drop: ${transition.resonanceDrop.toFixed(2)}`);
      console.log(`      Velocity: ${transition.velocity.toFixed(3)}`);
      console.log(`      Excerpt: "${transition.excerpt}"`);
      console.log(
        `      Immediate Attention: ${transition.requiresImmediateAttention ? 'YES' : 'NO'}`
      );
    });
    console.log('');
  }

  console.log('🧠 CONTENT ANALYSIS:');
  console.log(`   Emotional Tone: ${conversation.emotionalTone}`);
  console.log(`   Conversation Purpose: ${conversation.conversationPurpose}`);
  console.log(`   Key Themes: ${conversation.keyThemes.join(', ')}`);
  console.log(`   Identity Shifts: ${conversation.identityShifts}`);
  console.log(`   Identity Stability: ${(conversation.identityStabilityScore * 100).toFixed(1)}%`);
  console.log('');

  if (conversation.velocitySpikes.length > 0) {
    console.log('📈 VELOCITY SPIKES DETAILS:');
    conversation.velocitySpikes.slice(0, 3).forEach((spike: any, index: number) => {
      console.log(`   ${index + 1}. Turn ${spike.turnNumber} (${spike.speaker}):`);
      console.log(`      Velocity: ${spike.velocity.toFixed(3)} (${spike.severity})`);
      console.log(`      Type: ${spike.velocityType}`);
      console.log(`      Resonance Change: ${spike.resonanceChange.toFixed(2)}`);
      console.log(`      Canvas Change: ${spike.canvasChange.toFixed(2)}`);
      console.log(`      Excerpt: "${spike.excerpt}"`);
    });
    console.log('');
  }

  console.log('🔍 MANUAL REVIEW STATUS:');
  console.log(`   Requires Review: ${conversation.requiresManualReview ? 'YES' : 'NO'}`);
  console.log(`   Priority: ${conversation.reviewPriority.toUpperCase()}`);
  if (conversation.requiresManualReview) {
    console.log(`   Review Reasons:`);
    conversation.reviewReasons.forEach((reason: string) => {
      console.log(`      • ${reason}`);
    });
    console.log(`   Specific Turns to Review: ${conversation.specificTurnsToReview.join(', ')}`);
  }
  console.log('');
}

// Run the comprehensive analysis
if (require.main === module) {
  runComprehensiveAnalysis()
    .then((results) => {
      console.log('\n' + '🏁 ANALYSIS COMPLETE'.padEnd(80, '='));
      console.log('');
      console.log('📄 Reports generated successfully.');
      console.log('🎯 Ready for human manual review and calibration discussion.');

      // Export results for further analysis
      return results;
    })
    .catch((error) => {
      console.error('❌ Analysis failed:', error);
      process.exit(1);
    });
}

export { runComprehensiveAnalysis, generateDetailedConversationReport };
