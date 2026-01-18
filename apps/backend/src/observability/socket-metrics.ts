import { Counter } from 'prom-client';
export const socketEventsTotal = new Counter({ name: 'socket_events_total', help: 'Total socket events', labelNames: ['event','result'] });
export function recordSocketEvent(event: string, result: 'ok'|'error') { socketEventsTotal.inc({ event, result }); }

