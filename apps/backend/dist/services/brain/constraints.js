"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkKernelConstraints = checkKernelConstraints;
const allowedActionTypes = new Set([
    'alert',
    'adjust_threshold',
    'ban_agent',
    'restrict_agent',
    'quarantine_agent',
    'unban_agent',
]);
const executoryTypes = new Set([
    'adjust_threshold',
    'ban_agent',
    'restrict_agent',
    'quarantine_agent',
    'unban_agent',
]);
function checkKernelConstraints(tenantId, mode, action) {
    if (!tenantId) {
        return { ok: false, rule: 'no_tenant_context', reason: 'Tenant context required' };
    }
    if (!allowedActionTypes.has(action.type)) {
        return { ok: false, rule: 'unknown_action_type', reason: `Action ${action.type} not permitted` };
    }
    if (executoryTypes.has(action.type) && mode === 'advisory') {
        return { ok: false, rule: 'advisory_no_execution', reason: 'Executory actions require enforced mode' };
    }
    if ((action.severity === 'high' || action.severity === 'critical') && !action.reason) {
        return { ok: false, rule: 'critical_requires_reason', reason: 'Critical/high actions require explicit reason' };
    }
    if ((action.type === 'ban_agent' || action.type === 'quarantine_agent') && !action.reason) {
        return { ok: false, rule: 'enforcement_requires_reason', reason: `${action.type} requires explicit reason` };
    }
    return { ok: true };
}
