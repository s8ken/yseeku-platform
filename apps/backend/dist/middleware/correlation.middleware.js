"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.correlationMiddleware = correlationMiddleware;
const uuid_1 = require("uuid");
function correlationMiddleware(req, res, next) {
    const headerId = req.headers['x-correlation-id'] || '';
    const id = headerId && headerId.trim().length > 0 ? headerId : (0, uuid_1.v4)();
    req.correlationId = id;
    res.setHeader('x-correlation-id', id);
    next();
}
