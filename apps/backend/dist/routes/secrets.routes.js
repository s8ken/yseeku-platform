"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const rbac_middleware_1 = require("../middleware/rbac.middleware");
const secrets_service_1 = require("../services/secrets.service");
const metrics_1 = require("../observability/metrics");
const error_utils_1 = require("../utils/error-utils");
const router = (0, express_1.Router)();
router.post('/', auth_middleware_1.protect, (0, rbac_middleware_1.requireScopes)(['secrets:manage']), async (req, res) => {
    try {
        const { name, value } = req.body;
        if (!name || !value) {
            res.status(400).json({ success: false, message: 'name and value required' });
            return;
        }
        const result = await (0, secrets_service_1.putSecret)(name, value);
        if (!result) {
            metrics_1.secretsOperationsTotal.inc({ operation: 'put', provider: 'env', status: 'skipped' });
            res.status(200).json({ success: true, message: 'Using env provider; store value in environment', data: { hint: `${name}_ENCRYPTED for KMS` } });
            return;
        }
        metrics_1.secretsOperationsTotal.inc({ operation: 'put', provider: result.provider, status: 'ok' });
        res.status(201).json({ success: true, data: result });
    }
    catch (e) {
        metrics_1.secretsOperationsTotal.inc({ operation: 'put', provider: 'unknown', status: 'error' });
        res.status(500).json({ success: false, message: 'Failed to store secret', error: (0, error_utils_1.getErrorMessage)(e) });
    }
});
router.get('/:name', auth_middleware_1.protect, (0, rbac_middleware_1.requireScopes)(['secrets:manage']), async (req, res) => {
    try {
        const name = String(req.params.name);
        const value = await (0, secrets_service_1.getSecret)(name);
        if (value == null) {
            metrics_1.secretsOperationsTotal.inc({ operation: 'get', provider: 'unknown', status: 'miss' });
            res.status(404).json({ success: false, message: 'Secret not found' });
            return;
        }
        metrics_1.secretsOperationsTotal.inc({ operation: 'get', provider: 'unknown', status: 'ok' });
        res.json({ success: true, data: { name, valuePresent: true } });
    }
    catch (e) {
        metrics_1.secretsOperationsTotal.inc({ operation: 'get', provider: 'unknown', status: 'error' });
        res.status(500).json({ success: false, message: 'Failed to read secret', error: (0, error_utils_1.getErrorMessage)(e) });
    }
});
exports.default = router;
