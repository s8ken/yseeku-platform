import { initializeAuditLogger, getAuditLogger, InMemoryAuditStorage, AuditEventType, AuditSeverity } from '../security/audit';

describe('AuditLogger', () => {
  beforeEach(() => {
    initializeAuditLogger(new InMemoryAuditStorage());
  });

  test('should log and query audit events', async () => {
    const audit = getAuditLogger();

    await audit.log(AuditEventType.SYSTEM_STARTED, 'system start', 'success', { severity: AuditSeverity.INFO });

    const items = await audit.query({ limit: 10 });
    expect(items.length).toBeGreaterThanOrEqual(1);
  });
});