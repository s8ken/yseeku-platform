/**
 * Comprehensive Test Runner for Resonate Features
 * 
 * Demonstrates the complete integration of Phase-Shift Velocity metrics,
 * archive analysis, double-blind experimentation, and validation.
 */

import { ArchiveBenchmarkSuite } from './archive-benchmark';
import { ResonateValidationSuite } from './resonate-validation';
import { ConversationalMetrics, ConversationTurn } from './conversational-metrics';

async function runComprehensiveTests() {
  console.log('🚀 Starting Comprehensive Resonate Feature Testing\n');

  try {
    // Step 1: Initialize validation suite
    console.log('📊 Initializing validation suite...');
    const validationSuite = new ResonateValidationSuite();
    
    // Step 2: Run comprehensive validation
    console.log('🔍 Running comprehensive feature validation...');
    const validationReport = await validationSuite.validateAllFeatures();
    
    console.log('\n📋 Validation Results:');
    console.log(`Overall Score: ${(validationReport.overallScore * 100).toFixed(1)}%`);
    console.log(`Passed: ${validationReport.passedFeatures}/${validationReport.totalFeatures}`);
    console.log(`Failed: ${validationReport.failedFeatures}`);
    console.log(`Partial: ${validationReport.partialFeatures}`);
    
    // Step 3: Initialize benchmark suite
    console.log('\n⚖️  Initializing benchmark suite...');
    const benchmarkSuite = new ArchiveBenchmarkSuite();
    await benchmarkSuite.initialize();
    
    // Step 4: Run parameter calibration
    console.log('🔧 Calibrating optimal parameters...');
    const optimalParams = await benchmarkSuite.calibrateParameters();
    
    console.log('\n✨ Optimal Parameters Found:');
    console.log(`Yellow Threshold: ${optimalParams.yellowThreshold}`);
    console.log(`Red Threshold: ${optimalParams.redThreshold}`);
    console.log(`Identity Stability Threshold: ${optimalParams.identityStabilityThreshold}`);
    console.log(`Window Size: ${optimalParams.windowSize}`);
    
    // Step 5: Run comprehensive benchmark
    console.log('\n📈 Running comprehensive benchmark...');
    const benchmarkConfig = {
      testName: 'Archive-Based Validation',
      description: 'Validate resonate features using historical conversation data',
      metricConfigs: [
        {
          name: 'optimal_config',
          yellowThreshold: optimalParams.yellowThreshold,
          redThreshold: optimalParams.redThreshold,
          identityStabilityThreshold: optimalParams.identityStabilityThreshold,
          windowSize: optimalParams.windowSize
        }
      ],
      validationCriteria: {
        minDetectionRate: 0.8,
        maxFalsePositiveRate: 0.2,
        minPhaseShiftAccuracy: 0.85
      }
    };
    
    const benchmarkResult = await benchmarkSuite.runBenchmark(benchmarkConfig);
    
    console.log('\n📊 Benchmark Results:');
    console.log(`Detection Rate: ${(benchmarkResult.detectionRate * 100).toFixed(1)}%`);
    console.log(`False Positive Rate: ${(benchmarkResult.falsePositiveRate * 100).toFixed(1)}%`);
    console.log(`Overall Accuracy: ${(benchmarkResult.accuracy * 100).toFixed(1)}%`);
    
    // Step 6: Demonstrate real-time metrics
    console.log('\n🎯 Demonstrating Real-Time Metrics...');
    await demonstrateRealTimeMetrics(optimalParams);
    
    // Step 7: Generate final report
    console.log('\n📄 Generating Final Report...');
    const validationReportText = validationSuite.generateReport(validationReport);
    const benchmarkReportText = benchmarkSuite.generateReport(benchmarkResult);
    
    console.log('\n' + '='.repeat(60));
    console.log('FINAL VALIDATION REPORT');
    console.log('='.repeat(60));
    console.log(validationReportText);
    
    console.log('\n' + '='.repeat(60));
    console.log('BENCHMARK RESULTS');
    console.log('='.repeat(60));
    console.log(benchmarkReportText);
    
    // Step 8: Summary and recommendations
    console.log('\n' + '='.repeat(60));
    console.log('EXECUTIVE SUMMARY');
    console.log('='.repeat(60));
    
    if (validationReport.overallScore >= 0.9 && benchmarkResult.accuracy >= 0.85) {
      console.log('✅ SYSTEM READY FOR PRODUCTION');
      console.log('All resonate features are validated and performing optimally.');
    } else if (validationReport.overallScore >= 0.7 && benchmarkResult.accuracy >= 0.7) {
      console.log('⚠️  SYSTEM NEEDS REFINEMENT');
      console.log('Core functionality works but needs optimization before production.');
    } else {
      console.log('❌ SYSTEM NEEDS SIGNIFICANT WORK');
      console.log('Multiple issues detected - not ready for production use.');
    }
    
    console.log('\n📋 Key Findings:');
    console.log(`- Validation Score: ${(validationReport.overallScore * 100).toFixed(1)}%`);
    console.log(`- Benchmark Accuracy: ${(benchmarkResult.accuracy * 100).toFixed(1)}%`);
    console.log(`- Optimal Yellow Threshold: ${optimalParams.yellowThreshold}`);
    console.log(`- Optimal Red Threshold: ${optimalParams.redThreshold}`);
    console.log(`- Identity Stability Threshold: ${optimalParams.identityStabilityThreshold}`);
    
    if (validationReport.recommendations.length > 0) {
      console.log('\n🔧 Recommendations:');
      validationReport.recommendations.forEach((rec: string) => {
        console.log(`- ${rec}`);
      });
    }
    
    console.log('\n✅ Testing Complete!');
    
  } catch (error) {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  }
}

/**
 * Demonstrate real-time conversational metrics
 */
async function demonstrateRealTimeMetrics(optimalParams: any) {
  const metrics = new ConversationalMetrics({
    yellowThreshold: optimalParams.yellowThreshold,
    redThreshold: optimalParams.redThreshold,
    identityStabilityThreshold: optimalParams.identityStabilityThreshold,
    windowSize: optimalParams.windowSize
  });

  // Simulate a conversation with phase shifts
  const conversation: ConversationTurn[] = [
    { turnNumber: 1, timestamp: Date.now(), speaker: 'ai', resonance: 8.0, canvas: 7.5, identityVector: ['helpful', 'professional'], content: 'Hello! How can I assist you today?' },
    { turnNumber: 2, timestamp: Date.now() + 1000, speaker: 'ai', resonance: 7.8, canvas: 7.2, identityVector: ['helpful', 'professional'], content: 'I understand your request and can help with that.' },
    { turnNumber: 3, timestamp: Date.now() + 2000, speaker: 'ai', resonance: 4.5, canvas: 3.8, identityVector: ['helpful', 'professional'], content: 'Actually, I cannot provide that information.' },
    { turnNumber: 4, timestamp: Date.now() + 3000, speaker: 'ai', resonance: 3.2, canvas: 2.1, identityVector: ['helpful', 'professional'], content: 'This conversation is not appropriate and I must end it.' },
    { turnNumber: 5, timestamp: Date.now() + 4000, speaker: 'ai', resonance: 8.5, canvas: 8.0, identityVector: ['helpful', 'professional', 'empathetic'], content: 'I apologize for the confusion. Let me help you properly.' }
  ];

  console.log('\n📝 Simulated Conversation Analysis:');
  
  conversation.forEach((turn, index) => {
    const result = metrics.recordTurn(turn);
    
    console.log(`\nTurn ${index + 1}: "${turn.content}"`);
    console.log(`  Phase-Shift Velocity: ${result.phaseShiftVelocity.toFixed(2)}`);
    console.log(`  Identity Stability: ${result.identityStability.toFixed(3)}`);
    console.log(`  Alert Level: ${result.alertLevel.toUpperCase()}`);
    
    if (result.transitionEvent) {
      console.log(`  ⚠️  Transition Detected: ${result.transitionEvent.type} (${result.transitionEvent.severity})`);
    }
  });

  // Show final summary
  const summary = metrics.getMetricsSummary();
  console.log(`\n📊 Conversation Summary:`);
  console.log(`  Total Transitions: ${summary.transitionCount}`);
  console.log(`  Final Alert Level: ${summary.alertLevel.toUpperCase()}`);
  console.log(`  Recent Transitions: ${summary.recentTransitions.length}`);
}

// Run the comprehensive tests
if (require.main === module) {
  runComprehensiveTests().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { runComprehensiveTests };