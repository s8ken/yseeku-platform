// OpenTelemetry is only loaded when OTEL_ENABLED=true
// This prevents crashes from missing peer dependencies in production
const enabled = (process.env.OTEL_ENABLED || 'false').toLowerCase() === 'true';

if (enabled) {
  // Dynamic imports to avoid loading when disabled
  Promise.all([
    import('@opentelemetry/sdk-node'),
    import('@opentelemetry/exporter-trace-otlp-http'),
    import('@opentelemetry/auto-instrumentations-node'),
    import('@opentelemetry/api'),
  ])
    .then(([{ NodeSDK }, { OTLPTraceExporter }, { getNodeAutoInstrumentations }, { diag, DiagConsoleLogger, DiagLogLevel }]) => {
      diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.ERROR);

      const exporter = new OTLPTraceExporter({
        url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318/v1/traces',
      });

      const sdk = new NodeSDK({
        traceExporter: exporter,
        instrumentations: [getNodeAutoInstrumentations()],
        resource: undefined,
      });

      try {
        sdk.start();
        console.log('OpenTelemetry initialized successfully');
      } catch (e) {
        console.error('Failed to start OpenTelemetry:', e);
      }
    })
    .catch((e) => {
      console.error('Failed to load OpenTelemetry modules:', e);
    });
}
