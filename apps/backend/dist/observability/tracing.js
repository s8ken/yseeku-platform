"use strict";
// OpenTelemetry tracing disabled - providing no-op stubs
Object.defineProperty(exports, "__esModule", { value: true });
exports.tracer = void 0;
exports.withSpan = withSpan;
exports.annotateActiveSpan = annotateActiveSpan;
// No-op span that does nothing but accepts all args
const noopSpan = {
    setAttributes: (..._args) => noopSpan,
    setAttribute: (..._args) => noopSpan,
    addEvent: (..._args) => noopSpan,
    end: () => { },
    spanContext: () => ({ traceId: '' }),
};
// No-op tracer that accepts all args
const noopTracer = {
    startSpan: (..._args) => noopSpan,
};
exports.tracer = noopTracer;
async function withSpan(_name, fn, ..._args) {
    return fn();
}
function annotateActiveSpan(_attrs) {
    // No-op
}
