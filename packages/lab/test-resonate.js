#!/usr/bin/env node

/**
 * CLI for running comprehensive resonate feature tests
 * 
 * Usage: npm run test:resonate
 * 
 * This script executes the complete validation and benchmarking suite
 * using historical conversation archives.
 */

import { runComprehensiveTests } from './dist/test-runner.js';

async function main() {
  console.log('🚀 SYMBI Resonate Feature Testing CLI');
  console.log('=====================================\n');
  
  try {
    await runComprehensiveTests();
    console.log('\n✅ All tests completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test execution failed:', error);
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

main();