// Optional OpenTelemetry tracing - provides no-op fallbacks when not available
let traceApi: typeof import('@opentelemetry/api') | null = null;

try {
  traceApi = require('@opentelemetry/api');
} catch {
  // OpenTelemetry not available, use no-op fallbacks
}

// No-op tracer that does nothing when OpenTelemetry isn't available
const noopSpan = {
  setAttributes: () => {},
  end: () => {},
};

const noopTracer = {
  startSpan: () => noopSpan,
};

export const tracer = traceApi?.trace?.getTracer('yseeku-backend') ?? noopTracer;

export async function withSpan<T>(name: string, fn: () => Promise<T>, options?: unknown, attributes?: Record<string, unknown>): Promise<T> {
  if (!traceApi) {
    return fn();
  }
  const span = tracer.startSpan(name, options as any);
  if (attributes) (span as any).setAttributes(attributes);
  try {
    return await traceApi.context.with(traceApi.trace.setSpan(traceApi.context.active(), span as any), fn);
  } finally {
    (span as any).end();
  }
}

export function annotateActiveSpan(attrs: Record<string, unknown>) {
  if (!traceApi) return;
  const span = traceApi.trace.getActiveSpan();
  if (span) span.setAttributes(attrs as any);
}

