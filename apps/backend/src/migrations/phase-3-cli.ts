#!/usr/bin/env node
/**
 * Phase 3 Migration CLI Runner
 * 
 * Runs the Phase 3 database migration for SYMBI scoring updates
 * 
 * Usage:
 *   npm run migrate:phase-3                    (default environment)
 *   NODE_ENV=production npm run migrate:phase-3 (production environment)
 *   npm run migrate:phase-3 -- --verify       (verify only, no changes)
 *   npm run migrate:phase-3 -- --noop         (dry run, show what would happen)
 */

import * as fs from 'fs';
import * as path from 'path';
import { createConnection } from 'mongoose';
import logger from '../utils/logger';

interface MigrationOptions {
  verify: boolean;
  noop: boolean;
  force: boolean;
}

async function parseArgs(): Promise<MigrationOptions> {
  const args = process.argv.slice(2);
  return {
    verify: args.includes('--verify'),
    noop: args.includes('--noop'),
    force: args.includes('--force'),
  };
}

async function runMigration() {
  const options = await parseArgs();
  const env = process.env.NODE_ENV || 'development';

  console.log(`\n${'═'.repeat(60)}`);
  console.log('  PHASE 3: SYMBI Scoring Database Migration');
  console.log(`${'═'.repeat(60)}\n`);

  console.log(`Environment: ${env}`);
  console.log(`Verify only: ${options.verify}`);
  console.log(`Dry run: ${options.noop}`);
  console.log(`Force: ${options.force}\n`);

  // Safety check for production
  if (!options.force && env === 'production') {
    console.warn('⚠️  Production environment detected!');
    console.warn('   To run migration in production, use: --force\n');
    console.warn('   Before running, ensure:');
    console.warn('   ✓ MongoDB backups are in place');
    console.warn('   ✓ All your services are healthy');
    console.warn('   ✓ You have deployment rollback plan\n');
    process.exit(1);
  }

  try {
    // Load the migration module
    const migrationPath = path.join(__dirname, './phase-3-symbi-scoring');
    let migrateModule: any;

    try {
      migrateModule = require(migrationPath);
    } catch (error) {
      // Try with .ts extension
      console.log('Attempting TypeScript import...');
      try {
        // Dynamic import for TypeScript files
        const { runPhase3Migration, verifyPhase3Migration } = await import('./phase-3-symbi-scoring');
        migrateModule = { runPhase3Migration, verifyPhase3Migration };
      } catch (e) {
        throw new Error(`Failed to load migration module: ${error}`);
      }
    }

    const { runPhase3Migration, verifyPhase3Migration } = migrateModule;

    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/yseeku-platform';
    console.log('Connecting to MongoDB...');

    const connection = await createConnection(mongoUri).asPromise();

    try {
      if (options.verify) {
        // Verification only
        console.log('Running verification only (no changes)...\n');
        const verified = await verifyPhase3Migration(connection);
        
        if (verified) {
          console.log(`\n${'✓'.repeat(60)}`);
          console.log('✓ Migration verification PASSED');
          console.log(`${'✓'.repeat(60)}\n`);
          process.exit(0);
        } else {
          console.log(`\n${'✗'.repeat(60)}`);
          console.log('✗ Migration verification FAILED');
          console.log(`${'✗'.repeat(60)}\n`);
          process.exit(1);
        }
      } else if (options.noop) {
        // Dry run
        console.log('DRY RUN: Showing what would be changed...');
        console.log('(No actual database modifications will be made)\n');
        console.log('Migration steps:');
        console.log('1. Create index on telemetry.weight_source');
        console.log('2. Create index on telemetry.weight_policy_id');
        console.log('3. Create compound index on weight_source + trust_status');
        console.log('4. Update collection metadata');
        console.log('5. Verify indexes and metadata\n');
        console.log('To run actual migration, use: npm run migrate:phase-3\n');
        process.exit(0);
      } else {
        // Actual migration
        console.log('Running Phase 3 migration...\n');
        const stats = await runPhase3Migration(connection);

        console.log('\nMigration Statistics:');
        console.log(`  Receipts processed: ${stats.receiptsProcessed}`);
        console.log(`  Receipts with new fields: ${stats.receiptsWithNewFields}`);
        console.log(`  Indexes created: ${stats.indexesCreated}`);
        console.log(`  Duration: ${stats.duration}ms\n`);

        // Verify migration
        console.log('Verifying migration...');
        const verified = await verifyPhase3Migration(connection);

        if (verified) {
          console.log(`\n${'✓'.repeat(60)}`);
          console.log('✓ Phase 3 Migration SUCCESSFUL');
          console.log(`${'✓'.repeat(60)}\n`);
          
          console.log('Next steps:');
          console.log('  Phase 4: Deploy frontend display updates');
          console.log('  Phase 5: Update documentation');
          console.log('  Phase 6: Run full test suite');
          console.log('  Phase 7: Deploy to production\n');
          
          process.exit(0);
        } else {
          console.log(`\n${'✗'.repeat(60)}`);
          console.log('✗ Phase 3 Migration FAILED verification');
          console.log(`${'✗'.repeat(60)}\n`);
          process.exit(1);
        }
      }
    } finally {
      await connection.close();
    }
  } catch (error) {
    console.error('\n✗ Migration failed:', error instanceof Error ? error.message : String(error));
    console.error('\nFor help, check:');
    console.error('  - MongoDB connection string (MONGODB_URI)');
    console.error('  - MongoDB server is running');
    console.error('  - Database credentials are correct');
    console.error('  - Network connectivity to database\n');
    process.exit(1);
  }
}

// Run the migration if this is the main module
if (require.main === module) {
  runMigration();
}

export { runMigration };
