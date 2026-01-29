"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startOverseerScheduler = startOverseerScheduler;
const system_brain_service_1 = require("../system-brain.service");
const tenant_model_1 = require("../../models/tenant.model");
let intervalHandle = null;
async function startOverseerScheduler() {
    const enabled = (process.env.OVERSEER_SCHEDULE_ENABLED || 'false').toLowerCase() === 'true';
    if (!enabled)
        return;
    const periodMs = Number(process.env.OVERSEER_INTERVAL_MS || 60000);
    const mode = (process.env.OVERSEER_MODE || 'advisory');
    if (intervalHandle)
        return;
    intervalHandle = setInterval(async () => {
        try {
            const tenants = await tenant_model_1.Tenant.find({ status: 'active' }).select('_id name').lean();
            const tenantIds = tenants.length > 0 ? tenants.map(t => t._id.toString()) : ['default'];
            for (const t of tenantIds) {
                await system_brain_service_1.systemBrain.think(t, mode);
            }
        }
        catch (_) { /* no-op */ }
    }, periodMs);
}
