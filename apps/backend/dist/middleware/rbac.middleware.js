"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireScopes = requireScopes;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const platform_api_key_model_1 = require("../models/platform-api-key.model");
const prom_client_1 = require("prom-client");
const error_utils_1 = require("../utils/error-utils");
const rbacDenials = new prom_client_1.Counter({ name: 'security_denials_total', help: 'Total RBAC denials', labelNames: ['reason', 'route'] });
function getRoleScopes(role) {
    const demo = process.env.DEMO_MODE === 'true';
    const base = {
        admin: ['read:all', 'llm:generate', 'llm:code-review', 'gateway:manage', 'secrets:manage'],
        editor: ['read:all', 'llm:generate', 'llm:code-review'],
        viewer: ['read:all'],
    };
    if (demo) {
        base.viewer = ['read:all', 'llm:generate'];
    }
    return base[role] || base.viewer;
}
function hasAllScopes(available, required) {
    const set = new Set(available);
    return required.every(s => set.has(s));
}
function requireScopes(required) {
    return async function (req, res, next) {
        const routeId = req.path || 'unknown';
        const apiKey = req.header('x-api-key');
        // If API key provided, validate and check scopes
        if (apiKey) {
            try {
                const keys = await platform_api_key_model_1.PlatformApiKey.find({ tenantId: req.userTenant || 'default', status: 'active' }).select('+keyHash');
                for (const k of keys) {
                    const match = await bcryptjs_1.default.compare(apiKey, k.keyHash);
                    if (match) {
                        req.platformKeyScopes = k.scopes || [];
                        if (!hasAllScopes(req.platformKeyScopes, required)) {
                            rbacDenials.inc({ reason: 'scope_mismatch', route: routeId });
                            res.status(403).json({ success: false, message: 'API key lacks required scopes', required });
                            return;
                        }
                        return next();
                    }
                }
                rbacDenials.inc({ reason: 'api_key_invalid', route: routeId });
                res.status(401).json({ success: false, message: 'Invalid API key' });
                return;
            }
            catch (e) {
                rbacDenials.inc({ reason: 'api_key_error', route: routeId });
                res.status(500).json({ success: false, message: 'API key validation error', error: (0, error_utils_1.getErrorMessage)(e) });
                return;
            }
        }
        // Fallback to user role-based scopes
        const role = (req.user && req.user.role) || 'viewer';
        const scopes = getRoleScopes(role);
        if (!hasAllScopes(scopes, required)) {
            rbacDenials.inc({ reason: 'role_denied', route: routeId });
            res.status(403).json({ success: false, message: 'Insufficient role permissions', required, role });
            return;
        }
        next();
    };
}
