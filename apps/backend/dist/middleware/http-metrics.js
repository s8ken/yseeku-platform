"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.httpMetrics = httpMetrics;
const metrics_1 = require("../observability/metrics");
function httpMetrics(req, res, next) {
    const start = process.hrtime.bigint();
    res.on('finish', () => {
        const end = process.hrtime.bigint();
        const durationNs = Number(end - start);
        const durationSec = durationNs / 1e9;
        const route = (req.route && req.route.path) || req.path || 'unknown';
        (0, metrics_1.recordHttpRequest)(req.method, route, res.statusCode, durationSec);
    });
    next();
}
