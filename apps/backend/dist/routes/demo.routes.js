"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.demoGuard = exports.DEMO_TENANT_ID = exports.default = void 0;
var demo_1 = require("./demo");
Object.defineProperty(exports, "default", { enumerable: true, get: function () { return __importDefault(demo_1).default; } });
var middleware_1 = require("./demo/middleware");
Object.defineProperty(exports, "DEMO_TENANT_ID", { enumerable: true, get: function () { return middleware_1.DEMO_TENANT_ID; } });
Object.defineProperty(exports, "demoGuard", { enumerable: true, get: function () { return middleware_1.demoGuard; } });
