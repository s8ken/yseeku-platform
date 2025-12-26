import { APIKeyManager, getAPIKeyManager } from '../security/api-keys';
import { initializeAuditLogger, getAuditLogger, InMemoryAuditStorage, AuditEventType, AuditSeverity } from '../security/audit';
import { getRBACManager, Permission, Role } from '../security/rbac';
import { InMemoryRateLimitStore, createRateLimiter, RateLimitConfig } from '../security/rate-limiter';

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

async function testAPIKeys() {
  const mgr = getAPIKeyManager();
  const { key, rawKey } = await mgr.generateKey('user-1', 'test-key', { scopes: ['read'] });
  const ok = await mgr.validateKey(rawKey);
  assert(ok.valid, 'API key should validate');
  const revoked = await mgr.revokeKey(key.id, 'user-1');
  assert(revoked, 'API key should revoke');
  const bad = await mgr.validateKey(rawKey);
  assert(!bad.valid, 'Revoked key should not validate');
}

async function testAudit() {
  initializeAuditLogger(new InMemoryAuditStorage());
  const audit = getAuditLogger();
  await audit.log(AuditEventType.SYSTEM_STARTED, 'system start', 'success', { severity: AuditSeverity.INFO });
  const items = await audit.query({ limit: 10 });
  assert(items.length >= 1, 'Audit log should contain events');
}

async function testRBAC() {
  const rbac = getRBACManager();
  const user = { id: 'u1', username: 'alice', email: 'a@example.com', roles: [Role.OPERATOR] };
  const canExecute = rbac.hasPermission(user, Permission.AGENT_EXECUTE);
  assert(canExecute, 'Operator should have AGENT_EXECUTE');
  const canAdmin = rbac.hasPermission(user, Permission.SYSTEM_ADMIN);
  assert(!canAdmin, 'Operator should not have SYSTEM_ADMIN');
}

async function testRateLimiterBasic() {
  const store = new InMemoryRateLimitStore();
  const config: RateLimitConfig = { windowMs: 1000, maxRequests: 2, identifier: 'test', identifierType: 'ip' };
  const limiter = createRateLimiter(store);
  const r1 = await limiter.checkLimit(config);
  const r2 = await limiter.checkLimit(config);
  const r3 = await limiter.checkLimit(config);
  assert(r1.allowed && r2.allowed && !r3.allowed, 'Rate limiter did not block on third request');
}

async function main() {
  const tests = [
    ['API keys generate/validate/revoke', testAPIKeys],
    ['Audit logger basic flow', testAudit],
    ['RBAC permissions', testRBAC],
    ['Rate limiter basic', testRateLimiterBasic],
  ] as const;
  const results: string[] = [];
  for (const [name, fn] of tests) {
    try { await fn(); results.push(`PASS: ${name}`); } catch (e: any) { results.push(`FAIL: ${name} -> ${e?.message || e}`); console.error(results.join('\n')); process.exitCode = 1; return; }
  }
  console.log(results.join('\n'));
}

main();
