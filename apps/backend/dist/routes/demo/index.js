"use strict";
/**
 * Demo Routes - Investor Showcase Data
 *
 * These routes provide pre-populated showcase data for demos to investors
 * and potential customers. They use the demo tenant and don't require
 * authentication for easy access during presentations.
 *
 * UNIFIED DEMO APPROACH: All routes now query REAL demo tenant data,
 * seeded by the demo-seeder service. No more hardcoded fake data.
 *
 * SECURITY: Defense-in-depth guard prevents production exposure even if
 * accidentally mounted. Routes are only active when NODE_ENV !== 'production'
 * OR when ENABLE_DEMO_MODE=true is explicitly set.
 *
 * MODULAR STRUCTURE:
 * - core.routes.ts: Init, status, KPIs
 * - entities.routes.ts: Tenants, agents, experiments, receipts, risk
 * - metrics.routes.ts: Alerts, live-metrics, live-events
 * - data.routes.ts: Overseer, interactions, VLS
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const middleware_1 = require("./middleware");
const core_routes_1 = __importDefault(require("./core.routes"));
const entities_routes_1 = __importDefault(require("./entities.routes"));
const metrics_routes_1 = __importDefault(require("./metrics.routes"));
const data_routes_1 = __importDefault(require("./data.routes"));
const router = (0, express_1.Router)();
// Apply demo guard to all routes in this router
router.use(middleware_1.demoGuard);
// Mount sub-routers
router.use(core_routes_1.default);
router.use(entities_routes_1.default);
router.use(metrics_routes_1.default);
router.use(data_routes_1.default);
exports.default = router;
