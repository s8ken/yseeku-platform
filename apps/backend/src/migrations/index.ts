/**
 * Migrations Index
 * 
 * Central entry point for all database migrations
 * Each migration is idempotent and can be run independently
 */

import { Connection } from 'mongoose';
import { runPhase3Migration, verifyPhase3Migration } from './phase-3-symbi-scoring';

export interface MigrationResult {
  name: string;
  version: string;
  success: boolean;
  stats?: any;
  error?: string;
  timestamp: string;
}

/**
 * All available migrations in order
 */
export const migrations = [
  {
    name: 'phase-3-symbi-scoring',
    version: '2.2.0',
    description: 'Add SYMBI principle scores and weight metadata to receipts',
    run: runPhase3Migration,
    verify: verifyPhase3Migration,
  },
];

/**
 * Run all pending migrations
 */
export async function runAllMigrations(connection: Connection): Promise<MigrationResult[]> {
  const results: MigrationResult[] = [];

  for (const migration of migrations) {
    try {
      console.log(`Running migration: ${migration.name} (v${migration.version})`);
      const stats = await migration.run(connection);
      const verified = await migration.verify(connection);

      results.push({
        name: migration.name,
        version: migration.version,
        success: verified,
        stats,
        timestamp: new Date().toISOString(),
      });

      if (verified) {
        console.log(`✓ ${migration.name} completed successfully\n`);
      } else {
        console.warn(`⚠ ${migration.name} completed but verification failed\n`);
      }
    } catch (error) {
      results.push({
        name: migration.name,
        version: migration.version,
        success: false,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      });
      console.error(`✗ ${migration.name} failed: ${error}\n`);
    }
  }

  return results;
}

/**
 * Run a specific migration by name
 */
export async function runMigrationByName(
  name: string,
  connection: Connection
): Promise<MigrationResult | null> {
  const migration = migrations.find((m) => m.name === name);

  if (!migration) {
    console.error(`Migration not found: ${name}`);
    console.log(`Available migrations: ${migrations.map((m) => m.name).join(', ')}`);
    return null;
  }

  try {
    const stats = await migration.run(connection);
    const verified = await migration.verify(connection);

    return {
      name: migration.name,
      version: migration.version,
      success: verified,
      stats,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      name: migration.name,
      version: migration.version,
      success: false,
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Verify all migrations
 */
export async function verifyAllMigrations(connection: Connection): Promise<Record<string, boolean>> {
  const results: Record<string, boolean> = {};

  for (const migration of migrations) {
    try {
      results[migration.name] = await migration.verify(connection);
    } catch (error) {
      results[migration.name] = false;
      console.error(`Verification failed for ${migration.name}:`, error);
    }
  }

  return results;
}

/**
 * Get migration info
 */
export function getMigrationInfo() {
  return migrations.map((m) => ({
    name: m.name,
    version: m.version,
    description: m.description,
  }));
}

export default migrations;
