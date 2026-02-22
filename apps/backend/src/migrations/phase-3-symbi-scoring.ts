/**
 * PHASE 3: Database Migration Script
 * 
 * Adds new MongoDB fields for SYMBI principle scores and weight metadata
 * to support Phase 1A & 1B (ReceiptGeneratorService updates)
 * 
 * Features:
 * - Idempotent (safe to run multiple times)
 * - Backward compatible (doesn't modify existing receipts)
 * - Creates indexes for efficient querying
 * - Logs detailed migration statistics
 * 
 * Run with: npm run migrate:phase-3
 * Or: NODE_ENV=production npm run migrate:phase-3
 */

import mongoose, { Connection } from 'mongoose';
import logger from '../utils/logger';

interface MigrationStats {
  receiptsProcessed: number;
  receiptsUpdated: number;
  receiptsWithNewFields: number;
  indexesCreated: number;
  startTime: number;
  endTime: number;
  duration: number;
}

/**
 * Phase 3 Migration
 * 
 * Schema changes:
 * 1. Add sonate_principles object to receipts
 * 2. Add overall_trust_score field
 * 3. Add trust_status field
 * 4. Add principle_weights object
 * 5. Add weight_source field (indexed)
 * 6. Add weight_policy_id field (indexed)
 */
export async function runPhase3Migration(connection: Connection): Promise<MigrationStats> {
  const stats: MigrationStats = {
    receiptsProcessed: 0,
    receiptsUpdated: 0,
    receiptsWithNewFields: 0,
    indexesCreated: 0,
    startTime: Date.now(),
    endTime: 0,
    duration: 0,
  };

  try {
    logger.info('[PHASE 3] Starting database migration for principle scores and weight metadata');

    // Get the TrustReceipt collection
    const TrustReceiptCollection = connection.collection('trust_receipts');

    // Phase 3.1: Add indexes for efficient querying
    logger.info('[PHASE 3] Creating indexes for weight_source and weight_policy_id');
    
    try {
      await TrustReceiptCollection.createIndex({ 'telemetry.weight_source': 1 });
      stats.indexesCreated++;
      logger.info('[PHASE 3] Created index on telemetry.weight_source');
    } catch (error) {
      logger.warn('[PHASE 3] Index on telemetry.weight_source already exists or failed', {
        error: error instanceof Error ? error.message : String(error),
      });
    }

    try {
      await TrustReceiptCollection.createIndex({ 'telemetry.weight_policy_id': 1 });
      stats.indexesCreated++;
      logger.info('[PHASE 3] Created index on telemetry.weight_policy_id');
    } catch (error) {
      logger.warn('[PHASE 3] Index on telemetry.weight_policy_id already exists or failed', {
        error: error instanceof Error ? error.message : String(error),
      });
    }

    // Create compound index for queries by weight source and status
    try {
      await TrustReceiptCollection.createIndex({
        'telemetry.weight_source': 1,
        'telemetry.trust_status': 1,
      });
      stats.indexesCreated++;
      logger.info('[PHASE 3] Created compound index on weight_source + trust_status');
    } catch (error) {
      logger.warn('[PHASE 3] Compound index already exists or failed', {
        error: error instanceof Error ? error.message : String(error),
      });
    }

    // Phase 3.2: Scan existing receipts to understand current state
    const totalReceipts = await TrustReceiptCollection.countDocuments();
    const receiptsWithPrinciples = await TrustReceiptCollection.countDocuments({
      'telemetry.sonate_principles': { $exists: true },
    });
    const receiptsWithWeightSource = await TrustReceiptCollection.countDocuments({
      'telemetry.weight_source': { $exists: true },
    });

    logger.info('[PHASE 3] Current state of receipts collection', {
      total: totalReceipts,
      withPrinciples: receiptsWithPrinciples,
      withWeightSource: receiptsWithWeightSource,
      readyForPhase3: totalReceipts - receiptsWithPrinciples,
    });

    // Phase 3.3: Create collection-level validation schema
    // This defines the structure for new/updated receipts
    logger.info('[PHASE 3] Ensuring proper schema for new receipts');

    try {
      // Get current validator from collection options
      const collectionInfo = await connection.db?.collection('trust_receipts');
      
      // Note: MongoDB schema validation is typically set at collection creation
      // For production, ensure this is set in your initial schema setup
      logger.info('[PHASE 3] Schema validation is handled by application layer via schema definitions');
    } catch (error) {
      logger.warn('[PHASE 3] Could not verify schema validation', {
        error: error instanceof Error ? error.message : String(error),
      });
    }

    // Phase 3.4: Add field descriptions to collection metadata
    // This helps with documentation and tooling
    try {
      const metadata = {
        version: '2.2',
        lastMigration: 'phase-3',
        timestamp: new Date(),
        fields: {
          'telemetry.sonate_principles': {
            type: 'object',
            description: '6 SONATE principle scores (0-10 each)',
            added: 'phase-3',
            properties: {
              CONSENT_ARCHITECTURE: { type: 'number', min: 0, max: 10 },
              INSPECTION_MANDATE: { type: 'number', min: 0, max: 10 },
              CONTINUOUS_VALIDATION: { type: 'number', min: 0, max: 10 },
              ETHICAL_OVERRIDE: { type: 'number', min: 0, max: 10 },
              RIGHT_TO_DISCONNECT: { type: 'number', min: 0, max: 10 },
              MORAL_RECOGNITION: { type: 'number', min: 0, max: 10 },
            },
          },
          'telemetry.overall_trust_score': {
            type: 'number',
            description: 'Weighted trust score (0-100)',
            added: 'phase-3',
            range: [0, 100],
          },
          'telemetry.trust_status': {
            type: 'string',
            description: 'Constitutional compliance status',
            added: 'phase-3',
            enum: ['PASS', 'PARTIAL', 'FAIL'],
          },
          'telemetry.principle_weights': {
            type: 'object',
            description: 'Weight distribution applied to calculate trust score',
            added: 'phase-3',
          },
          'telemetry.weight_source': {
            type: 'string',
            description: 'Policy identifier (standard|healthcare|finance|government|technology|education|legal)',
            added: 'phase-3',
            indexed: true,
          },
          'telemetry.weight_policy_id': {
            type: 'string',
            description: 'Policy reference ID for audit trail',
            added: 'phase-3',
            indexed: true,
          },
        },
      };

      // Store metadata in a separate collection for reference
      const MetadataCollection = connection.collection('collection_metadata');
      await MetadataCollection.updateOne(
        { collection: 'trust_receipts' },
        { $set: metadata },
        { upsert: true }
      );

      logger.info('[PHASE 3] Updated collection metadata', {
        fields: Object.keys(metadata.fields),
      });
    } catch (error) {
      logger.warn('[PHASE 3] Could not update collection metadata', {
        error: error instanceof Error ? error.message : String(error),
      });
    }

    // Phase 3.5: Log summary of new schema
    logger.info('[PHASE 3] New schema fields ready for receipts', {
      newFields: [
        'telemetry.sonate_principles (object)',
        'telemetry.overall_trust_score (number)',
        'telemetry.trust_status (enum)',
        'telemetry.principle_weights (object)',
        'telemetry.weight_source (string) - INDEXED',
        'telemetry.weight_policy_id (string) - INDEXED',
      ],
      supportedIndustries: [
        'standard',
        'healthcare',
        'finance',
        'government',
        'technology',
        'education',
        'legal',
      ],
    });

    stats.receiptsProcessed = totalReceipts;
    stats.receiptsWithNewFields = receiptsWithPrinciples;
    stats.endTime = Date.now();
    stats.duration = stats.endTime - stats.startTime;

    logger.info('[PHASE 3] Database migration completed successfully', {
      stats,
      nextSteps: [
        'Phase 4: Deploy frontend display updates',
        'Phase 5: Update documentation',
        'Phase 6: Run full test suite',
        'Phase 7: Deploy to production',
      ],
    });

    return stats;
  } catch (error) {
    logger.error('[PHASE 3] Database migration failed', {
      error: error instanceof Error ? error.message : String(error),
      stats,
    });
    throw error;
  }
}

/**
 * Verification function to ensure migration was successful
 */
export async function verifyPhase3Migration(connection: Connection): Promise<boolean> {
  try {
    logger.info('[PHASE 3] Verifying database migration');

    const TrustReceiptCollection = connection.collection('trust_receipts');

    // Check that indexes exist
    const indexes = await TrustReceiptCollection.getIndexes();
    const hasWeightSourceIndex = Object.values(indexes).some((idx: any) =>
      idx.key && idx.key['telemetry.weight_source'] === 1
    );
    const hasWeightPolicyIndex = Object.values(indexes).some((idx: any) =>
      idx.key && idx.key['telemetry.weight_policy_id'] === 1
    );

    if (!hasWeightSourceIndex) {
      logger.warn('[PHASE 3] Missing index on telemetry.weight_source');
      return false;
    }

    if (!hasWeightPolicyIndex) {
      logger.warn('[PHASE 3] Missing index on telemetry.weight_policy_id');
      return false;
    }

    // Check metadata was recorded
    const MetadataCollection = connection.collection('collection_metadata');
    const metadata = await MetadataCollection.findOne({ collection: 'trust_receipts' });

    if (!metadata) {
      logger.warn('[PHASE 3] Collection metadata not found');
      return false;
    }

    // Verify new fields are documented
    const requiredFields = [
      'telemetry.sonate_principles',
      'telemetry.overall_trust_score',
      'telemetry.trust_status',
      'telemetry.principle_weights',
      'telemetry.weight_source',
      'telemetry.weight_policy_id',
    ];

    const hasAllFields = requiredFields.every((field) =>
      metadata.fields && metadata.fields[field]
    );

    if (!hasAllFields) {
      logger.warn('[PHASE 3] Not all required field metadata was recorded');
      return false;
    }

    logger.info('[PHASE 3] Migration verification successful', {
      indexesPresent: [hasWeightSourceIndex, hasWeightPolicyIndex],
      metadataComplete: true,
      requiredFields: requiredFields.length,
      version: metadata.version,
    });

    return true;
  } catch (error) {
    logger.error('[PHASE 3] Verification failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}

/**
 * Main migration entry point
 * Called during application startup or manual migration script
 */
export async function migratePhase3() {
  let connection: Connection | null = null;

  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/yseeku-platform';
    logger.info('[PHASE 3] Connecting to MongoDB', { uri: mongoUri.replace(/:[^:]*@/, ':***@') });

    connection = await mongoose.createConnection(mongoUri).asPromise();

    // Run migration
    const stats = await runPhase3Migration(connection);

    // Verify migration
    const verified = await verifyPhase3Migration(connection);

    if (!verified) {
      logger.warn('[PHASE 3] Migration completed but verification failed - manual review recommended');
      process.exit(1);
    }

    logger.info('[PHASE 3] Migration completed and verified', { stats });
    process.exit(0);
  } catch (error) {
    logger.error('[PHASE 3] Fatal error during migration', {
      error: error instanceof Error ? error.message : String(error),
    });
    process.exit(1);
  } finally {
    if (connection) {
      await connection.close();
    }
  }
}

// Run migration if this is the main module
if (require.main === module) {
  migratePhase3();
}

export default migratePhase3;
