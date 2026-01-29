"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const api_keys_1 = require("../security/api-keys");
const audit_1 = require("../security/audit");
const rate_limiter_1 = require("../security/rate-limiter");
const rbac_1 = require("../security/rbac");
function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}
async function testAPIKeys() {
    const mgr = (0, api_keys_1.getAPIKeyManager)();
    const { key, rawKey } = await mgr.generateKey('user-1', 'test-key', { scopes: ['read'] });
    const ok = await mgr.validateKey(rawKey);
    assert(ok.valid, 'API key should validate');
    const revoked = await mgr.revokeKey(key.id, 'user-1');
    assert(revoked, 'API key should revoke');
    const bad = await mgr.validateKey(rawKey);
    assert(!bad.valid, 'Revoked key should not validate');
}
async function testAudit() {
    (0, audit_1.initializeAuditLogger)(new audit_1.InMemoryAuditStorage());
    const audit = (0, audit_1.getAuditLogger)();
    await audit.log(audit_1.AuditEventType.SYSTEM_STARTED, 'system start', 'success', {
        severity: audit_1.AuditSeverity.INFO,
    });
    const items = await audit.query({ limit: 10 });
    assert(items.length >= 1, 'Audit log should contain events');
}
async function testRBAC() {
    const rbac = (0, rbac_1.getRBACManager)();
    const user = { id: 'u1', username: 'alice', email: 'a@example.com', roles: [rbac_1.Role.OPERATOR] };
    const canExecute = rbac.hasPermission(user, rbac_1.Permission.AGENT_EXECUTE);
    assert(canExecute, 'Operator should have AGENT_EXECUTE');
    const canAdmin = rbac.hasPermission(user, rbac_1.Permission.SYSTEM_ADMIN);
    assert(!canAdmin, 'Operator should not have SYSTEM_ADMIN');
}
async function testRateLimiterBasic() {
    const store = new rate_limiter_1.InMemoryRateLimitStore();
    const config = {
        windowMs: 1000,
        maxRequests: 2,
        identifier: 'test',
        identifierType: 'ip',
    };
    const limiter = (0, rate_limiter_1.createRateLimiter)(store);
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
    ];
    const results = [];
    for (const [name, fn] of tests) {
        try {
            await fn();
            results.push(`PASS: ${name}`);
        }
        catch (e) {
            results.push(`FAIL: ${name} -> ${e?.message || e}`);
            console.error(results.join('\n'));
            process.exitCode = 1;
            return;
        }
    }
    console.log(results.join('\n'));
}
main();
