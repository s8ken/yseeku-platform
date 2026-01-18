import { getPool, ensureSchema } from '@sonate/persistence';

import { getLogger } from '../observability/logger';

import { initializeAuditLogger, DatabaseAuditStorage, InMemoryAuditStorage } from './audit';

const logger = getLogger('AuditInit');

export async function initializeAuditPersistence(): Promise<void> {
  try {
    const pool = getPool();
    if (!pool) {
      initializeAuditLogger(new InMemoryAuditStorage());
      logger.warn('No DATABASE_URL; using in-memory audit storage');
      return;
    }
    await ensureSchema();
    initializeAuditLogger(new DatabaseAuditStorage(pool));
    logger.info('Audit logger initialized with PostgreSQL storage');
  } catch (err) {
    initializeAuditLogger(new InMemoryAuditStorage());
    logger.error('Failed to initialize database audit storage; falling back to memory', { err });
  }
}
