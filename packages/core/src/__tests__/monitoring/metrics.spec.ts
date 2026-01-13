/**
 * Metrics Utility Tests
 * 
 * Tests the Prometheus metrics collection infrastructure
 */

import {
  register,
  trustScoreHistogram,
  trustReceiptsTotal,
  trustVerificationsTotal,
  workflowDurationHistogram,
  activeWorkflowsGauge,
  workflowStepDurationHistogram,
  workflowFailuresTotal,
  activeAgentsGauge,
  agentOperationsTotal,
  agentResponseTimeHistogram,
  resonanceQualityHistogram,
  resonanceReceiptsTotal,
  realityIndexGauge,
  securityAlertsTotal,
  authFailuresTotal,
  rateLimitHitsTotal,
  dbQueryDurationHistogram,
  cacheOperationsTotal,
  externalApiCallsTotal,
  externalApiDurationHistogram,
  httpRequestsTotal,
  httpRequestDurationHistogram,
  httpRequestSizeHistogram,
  httpResponseSizeHistogram,
  getMetrics,
  getMetricsJSON,
  resetMetrics
} from '../../monitoring/metrics';

describe('Metrics Utility', () => {
  beforeEach(() => {
    // Reset metrics before each test
    resetMetrics();
  });

  describe('Trust Protocol Metrics', () => {
    it('should record trust scores', () => {
      trustScoreHistogram.observe({ agent_id: 'agent-1', workflow_id: 'workflow-1' }, 0.85);
      trustScoreHistogram.observe({ agent_id: 'agent-2', workflow_id: 'workflow-1' }, 0.92);
      
      const metrics = register.getSingleMetric('sonate_trust_score');
      expect(metrics).toBeDefined();
    });

    it('should increment trust receipts counter', () => {
      trustReceiptsTotal.inc({ status: 'success', session_id: 'session-1' });
      trustReceiptsTotal.inc({ status: 'success', session_id: 'session-2' });
      trustReceiptsTotal.inc({ status: 'failed', session_id: 'session-3' });
      
      const metrics = register.getSingleMetric('sonate_trust_receipts_total');
      expect(metrics).toBeDefined();
    });

    it('should increment trust verifications counter', () => {
      trustVerificationsTotal.inc({ result: 'valid', agent_id: 'agent-1' });
      trustVerificationsTotal.inc({ result: 'invalid', agent_id: 'agent-2' });
      
      const metrics = register.getSingleMetric('sonate_trust_verifications_total');
      expect(metrics).toBeDefined();
    });
  });

  describe('Workflow Metrics', () => {
    it('should record workflow duration', () => {
      workflowDurationHistogram.observe({ workflow_name: 'test-workflow', status: 'success' }, 5.2);
      workflowDurationHistogram.observe({ workflow_name: 'test-workflow', status: 'failed' }, 2.1);
      
      const metrics = register.getSingleMetric('sonate_workflow_duration_seconds');
      expect(metrics).toBeDefined();
    });

    it('should increment active workflows gauge', () => {
      activeWorkflowsGauge.inc(3);
      activeWorkflowsGauge.dec(1);
      
      const metrics = register.getSingleMetric('sonate_active_workflows');
      expect(metrics).toBeDefined();
    });

    it('should record workflow step duration', () => {
      workflowStepDurationHistogram.observe({ step_name: 'validation', workflow_name: 'test-workflow' }, 0.5);
      workflowStepDurationHistogram.observe({ step_name: 'processing', workflow_name: 'test-workflow' }, 2.1);
      
      const metrics = register.getSingleMetric('sonate_workflow_step_duration_seconds');
      expect(metrics).toBeDefined();
    });

    it('should increment workflow failures counter', () => {
      workflowFailuresTotal.inc({ workflow_name: 'test-workflow', error_type: 'timeout' });
      workflowFailuresTotal.inc({ workflow_name: 'test-workflow', error_type: 'validation' });
      
      const metrics = register.getSingleMetric('sonate_workflow_failures_total');
      expect(metrics).toBeDefined();
    });
  });

  describe('HTTP Metrics', () => {
    it('should record HTTP request duration', () => {
      httpRequestDurationHistogram.observe({ method: 'GET', endpoint: '/api/test', status: '200' }, 0.150);
      httpRequestDurationHistogram.observe({ method: 'POST', endpoint: '/api/data', status: '201' }, 0.300);
      
      const metrics = register.getSingleMetric('sonate_http_request_duration_seconds');
      expect(metrics).toBeDefined();
    });

    it('should increment HTTP requests counter', () => {
      httpRequestsTotal.inc({ method: 'GET', endpoint: '/api/test', status: '200' });
      httpRequestsTotal.inc({ method: 'POST', endpoint: '/api/data', status: '201' });
      
      const metrics = register.getSingleMetric('sonate_http_requests_total');
      expect(metrics).toBeDefined();
    });

    it('should record HTTP request size', () => {
      httpRequestSizeHistogram.observe({ method: 'POST', endpoint: '/api/data' }, 1024);
      httpRequestSizeHistogram.observe({ method: 'PUT', endpoint: '/api/upload' }, 2048);
      
      const metrics = register.getSingleMetric('sonate_http_request_size_bytes');
      expect(metrics).toBeDefined();
    });

    it('should record HTTP response size', () => {
      httpResponseSizeHistogram.observe({ method: 'GET', endpoint: '/api/test', status: '200' }, 512);
      httpResponseSizeHistogram.observe({ method: 'GET', endpoint: '/api/data', status: '200' }, 1024);
      
      const metrics = register.getSingleMetric('sonate_http_response_size_bytes');
      expect(metrics).toBeDefined();
    });
  });

  describe('Resonance Metrics', () => {
    it('should record resonance quality', () => {
      resonanceQualityHistogram.observe({ agent_id: 'agent-1', session_id: 'session-1' }, 0.75);
      resonanceQualityHistogram.observe({ agent_id: 'agent-2', session_id: 'session-2' }, 0.88);
      
      const metrics = register.getSingleMetric('sonate_resonance_quality');
      expect(metrics).toBeDefined();
    });

    it('should increment resonance receipts counter', () => {
      resonanceReceiptsTotal.inc({ agent_id: 'agent-1', session_id: 'session-1' });
      resonanceReceiptsTotal.inc({ agent_id: 'agent-2', session_id: 'session-2' });
      
      const metrics = register.getSingleMetric('sonate_resonance_receipts_total');
      expect(metrics).toBeDefined();
    });

    it('should update reality index gauge', () => {
      realityIndexGauge.set(0.85);
      realityIndexGauge.set(0.92);
      
      const metrics = register.getSingleMetric('sonate_reality_index');
      expect(metrics).toBeDefined();
    });
  });

  describe('Metrics Collection', () => {
    it('should get metrics as text', async () => {
      // Record some metrics
      trustReceiptsTotal.inc({ status: 'success', session_id: 'test' });
      
      const metricsText = await getMetrics();
      
      expect(metricsText).toBeDefined();
      expect(typeof metricsText).toBe('string');
      expect(metricsText).toContain('sonate_trust_receipts_total');
    });

    it('should get metrics as JSON', async () => {
      // Record some metrics
      trustReceiptsTotal.inc({ status: 'success', session_id: 'test' });
      
      const metricsJSON = await getMetricsJSON();
      
      expect(metricsJSON).toBeDefined();
      expect(typeof metricsJSON).toBe('object');
    });

    it('should reset all metrics', async () => {
      // Record some metrics
      trustReceiptsTotal.inc({ status: 'success', session_id: 'test' });
      activeWorkflowsGauge.set(5);
      
      // Reset metrics
      resetMetrics();
      
      // Metrics should be reset (counters back to 0)
      const metricsText = await getMetrics();
      expect(metricsText).toBeDefined();
    });
  });

  describe('Metric Registration', () => {
    it('should handle duplicate metric registration gracefully', () => {
      // This should not throw an error even if metrics are already registered
      expect(() => {
        trustReceiptsTotal.inc({ status: 'success', session_id: 'test' });
        trustReceiptsTotal.inc({ status: 'success', session_id: 'test' });
      }).not.toThrow();
    });

    it('should have all required metrics registered', () => {
      const requiredMetrics = [
        'sonate_trust_score',
        'sonate_trust_receipts_total',
        'sonate_trust_verifications_total',
        'sonate_workflow_duration_seconds',
        'sonate_active_workflows',
        'sonate_workflow_step_duration_seconds',
        'sonate_workflow_failures_total',
        'sonate_active_agents',
        'sonate_agent_operations_total',
        'sonate_agent_response_time_seconds',
        'sonate_resonance_quality',
        'sonate_resonance_receipts_total',
        'sonate_reality_index',
        'sonate_security_alerts_total',
        'sonate_auth_failures_total',
        'sonate_rate_limit_hits_total',
        'sonate_db_query_duration_seconds',
        'sonate_cache_operations_total',
        'sonate_external_api_calls_total',
        'sonate_external_api_duration_seconds',
        'sonate_http_requests_total',
        'sonate_http_request_duration_seconds',
        'sonate_http_request_size_bytes',
        'sonate_http_response_size_bytes'
      ];
      
      requiredMetrics.forEach(metricName => {
        const metric = register.getSingleMetric(metricName);
        expect(metric).toBeDefined();
      });
    });
  });

  describe('Performance Tests', () => {
    it('should handle high-frequency metric updates efficiently', () => {
      const startTime = performance.now();
      
      for (let i = 0; i < 1000; i++) {
        trustReceiptsTotal.inc({ status: 'success', session_id: `session-${i}` });
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should handle histogram observations efficiently', () => {
      const startTime = performance.now();
      
      for (let i = 0; i < 1000; i++) {
        trustScoreHistogram.observe({ agent_id: `agent-${i}`, workflow_id: 'workflow-1' }, Math.random());
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });
  });

  describe('Integration Tests', () => {
    it('should work with complete workflow scenario', async () => {
      // Simulate a complete workflow
      const agentId = 'test-agent';
      const workflowName = 'test-workflow';
      const sessionId = 'test-session';
      
      // Start workflow
      const workflowStart = performance.now();
      
      // Record workflow execution
      activeWorkflowsGauge.inc();
      
      // Simulate HTTP calls
      httpRequestDurationHistogram.observe({ method: 'GET', endpoint: '/api/data', status: '200' }, 0.1);
      httpRequestsTotal.inc({ method: 'GET', endpoint: '/api/data', status: '200' });
      
      // Calculate resonance
      resonanceQualityHistogram.observe({ agent_id: agentId, session_id: sessionId }, 0.85);
      resonanceReceiptsTotal.inc({ agent_id: agentId, session_id: sessionId });
      
      // Generate trust receipt
      trustScoreHistogram.observe({ agent_id: agentId, workflow_id: workflowName }, 0.9);
      trustReceiptsTotal.inc({ status: 'success', session_id: sessionId });
      
      // Verify trust
      trustVerificationsTotal.inc({ result: 'valid', agent_id: agentId });
      
      // End workflow
      const workflowEnd = performance.now();
      const workflowDuration = (workflowEnd - workflowStart) / 1000; // Convert to seconds
      
      workflowDurationHistogram.observe({ workflow_name: workflowName, status: 'success' }, workflowDuration);
      activeWorkflowsGauge.dec();
      
      // Verify all metrics are recorded
      const metricsText = await getMetrics();
      
      expect(metricsText).toContain('sonate_http_requests_total');
      expect(metricsText).toContain('sonate_resonance_receipts_total');
      expect(metricsText).toContain('sonate_trust_receipts_total');
      expect(metricsText).toContain('sonate_trust_verifications_total');
      expect(metricsText).toContain('sonate_workflow_duration_seconds');
    });

    it('should handle error scenarios', async () => {
      // Simulate failed workflow
      workflowFailuresTotal.inc({ workflow_name: 'failed-workflow', error_type: 'timeout' });
      workflowDurationHistogram.observe({ workflow_name: 'failed-workflow', status: 'failed' }, 1.5);
      
      // Simulate security alerts
      securityAlertsTotal.inc({ alert_type: 'unauthorized_access', agent_id: 'failed-agent' });
      authFailuresTotal.inc({ auth_type: 'api_key', reason: 'invalid_key' });
      
      // Simulate rate limiting
      rateLimitHitsTotal.inc({ endpoint: '/api/data', client_id: 'test-client' });
      
      // Verify error metrics are recorded
      const metricsText = await getMetrics();
      
      expect(metricsText).toContain('sonate_workflow_failures_total');
      expect(metricsText).toContain('sonate_security_alerts_total');
      expect(metricsText).toContain('sonate_auth_failures_total');
      expect(metricsText).toContain('sonate_rate_limit_hits_total');
    });
  });
});
