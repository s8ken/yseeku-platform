import { context, trace, SpanOptions, Attributes } from '@opentelemetry/api';

export const tracer = trace.getTracer('yseeku-backend');

export async function withSpan<T>(name: string, fn: () => Promise<T>, options?: SpanOptions, attributes?: Attributes): Promise<T> {
  const span = tracer.startSpan(name, options);
  if (attributes) span.setAttributes(attributes);
  try {
    return await context.with(trace.setSpan(context.active(), span), fn);
  } finally {
    span.end();
  }
}

export function annotateActiveSpan(attrs: Attributes) {
  const span = trace.getActiveSpan();
  if (span) span.setAttributes(attrs);
}

