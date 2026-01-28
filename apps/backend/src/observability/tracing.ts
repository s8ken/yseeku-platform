// OpenTelemetry tracing disabled - providing no-op stubs

// No-op span that does nothing but accepts all args
const noopSpan = {
  setAttributes: (..._args: unknown[]) => noopSpan,
  setAttribute: (..._args: unknown[]) => noopSpan,
  addEvent: (..._args: unknown[]) => noopSpan,
  end: () => {},
  spanContext: () => ({ traceId: '' }),
};

// No-op tracer that accepts all args
const noopTracer = {
  startSpan: (..._args: unknown[]) => noopSpan,
};

export const tracer = noopTracer;

export async function withSpan<T>(_name: string, fn: () => Promise<T>, ..._args: unknown[]): Promise<T> {
  return fn();
}

export function annotateActiveSpan(_attrs: Record<string, unknown>) {
  // No-op
}

