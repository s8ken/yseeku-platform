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

import { Router } from 'express';
import { demoGuard } from './middleware';
import coreRoutes from './core.routes';
import entitiesRoutes from './entities.routes';
import metricsRoutes from './metrics.routes';
import dataRoutes from './data.routes';

const router = Router();

// Apply demo guard to all routes in this router
router.use(demoGuard);

// Mount sub-routers
router.use(coreRoutes);
router.use(entitiesRoutes);
router.use(metricsRoutes);
router.use(dataRoutes);

export default router;
