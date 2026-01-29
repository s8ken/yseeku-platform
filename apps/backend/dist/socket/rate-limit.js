"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.allow = allow;
const buckets = {};
function allow(userId, maxPerSec = Number(process.env.SOCKET_RPS_MAX) || 5) {
    const now = Date.now();
    const b = buckets[userId] || { tokens: maxPerSec, last: now };
    const refill = ((now - b.last) / 1000) * maxPerSec;
    b.tokens = Math.min(maxPerSec, b.tokens + refill);
    b.last = now;
    if (b.tokens >= 1) {
        b.tokens -= 1;
        buckets[userId] = b;
        return true;
    }
    buckets[userId] = b;
    return false;
}
