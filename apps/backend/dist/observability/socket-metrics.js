"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.socketEventsTotal = void 0;
exports.recordSocketEvent = recordSocketEvent;
const prom_client_1 = require("prom-client");
exports.socketEventsTotal = new prom_client_1.Counter({ name: 'socket_events_total', help: 'Total socket events', labelNames: ['event', 'result'] });
function recordSocketEvent(event, result) { exports.socketEventsTotal.inc({ event, result }); }
