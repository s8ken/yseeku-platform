/**
 * Demo Routes - Investor Showcase Data
 *
 * This file re-exports the modular demo routes for backwards compatibility.
 * See ./demo/ directory for the organized route modules:
 *
 * - demo/core.routes.ts: Init, status, KPIs
 * - demo/entities.routes.ts: Tenants, agents, experiments, receipts, risk
 * - demo/metrics.routes.ts: Alerts, live-metrics, live-events
 * - demo/data.routes.ts: Overseer, interactions, VLS
 * - demo/middleware.ts: Demo guard and constants
 *
 * SECURITY: Defense-in-depth guard prevents production exposure even if
 * accidentally mounted. Routes are only active when NODE_ENV !== 'production'
 * OR when ENABLE_DEMO_MODE=true is explicitly set.
 */

export { default } from './demo';
export { DEMO_TENANT_ID, demoGuard } from './demo/middleware';
