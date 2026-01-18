/**
 * Observability Manager for SONATE Platform
 * 
 * Central management for metrics, traces, and monitoring
 */

import { trace, metrics, Context, Span, SpanStatusCode } from '@opentelemetry/api';
import { TrustObservabilityData, DetectionObservabilityData, AgentObservabilityData, PerformanceObservabilityData, SonateSpanAttributes } from './types';

/**
 * Main observability manager class
 */
export class ObservabilityManager {
  private tracer = trace.getTracer('sonate-platform');
  private meter = metrics.getMeter('sonate-platform');

  // Trust metrics
  private trustScoreHistogram = this.meter.createHistogram('sonate_trust_score', {
    description: 'Trust score distribution',
    unit: 'score',
  });
  
  private trustViolationsCounter = this.meter.createCounter('sonate_trust_violations_total', {
    description: 'Total number of trust violations',
  });

  // Detection metrics
  private detectionLatencyHistogram = this.meter.createHistogram('sonate_detection_latency_ms', {
    description: 'Detection processing latency',
    unit: 'ms',
  });

  private detectionThroughputCounter = this.meter.createCounter('sonate_detection_throughput_total', {
    description: 'Total number of detections processed',
  });

  // Agent metrics
  private agentTaskCounter = this.meter.createCounter('sonate_agent_tasks_total', {
    description: 'Total number of agent tasks executed',
  });

  private agentErrorCounter = this.meter.createCounter('sonate_agent_errors_total', {
    description: 'Total number of agent errors',
  });

  // Performance metrics
  private cpuUsageGauge = this.meter.createObservableGauge('sonate_cpu_usage_percent', {
    description: 'CPU usage percentage',
    unit: '%',
  });

  private memoryUsageGauge = this.meter.createObservableGauge('sonate_memory_usage_bytes', {
    description: 'Memory usage in bytes',
    unit: 'bytes',
  });

  /**
   * Record trust score metrics
   */
  recordTrustScore(data: TrustObservabilityData): void {
    const span = this.tracer.startSpan('sonate.trust.score_recording');
    
    try {
      // Record histogram
      this.trustScoreHistogram.record(data.trustScore, {
        'sonate.tenant': data.tenant,
        'sonate.agent.id': data.agentId,
        'sonate.interaction.id': data.interactionId,
      });

      // Record violations if any
      if (data.violations.length > 0) {
        this.trustViolationsCounter.add(data.violations.length, {
          'sonate.tenant': data.tenant,
          'sonate.agent.id': data.agentId,
          'sonate.trust.violations': data.violations.join(','),
        });
      }

      // Add span attributes
      span.setAttributes({
        'sonate.trust.score': data.trustScore,
        'sonate.trust.violations': data.violations.length.toString(),
        'sonate.tenant': data.tenant || 'unknown',
        'sonate.agent.id': data.agentId || 'unknown',
      });

      span.setStatus({ code: SpanStatusCode.OK });
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus({ code: SpanStatusCode.ERROR });
      throw error;
    } finally {
      span.end();
    }
  }

  /**
   * Record detection performance metrics
   */
  recordDetectionPerformance(data: DetectionObservabilityData): void {
    const span = this.tracer.startSpan('sonate.detection.performance_recording');
    
    try {
      // Record latency
      this.detectionLatencyHistogram.record(data.latency, {
        'sonate.tenant': data.tenant,
        'sonate.detection.algorithm': data.algorithm,
      });

      // Record throughput
      this.detectionThroughputCounter.add(1, {
        'sonate.tenant': data.tenant,
        'sonate.detection.algorithm': data.algorithm,
      });

      // Add span attributes
      span.setAttributes({
        'sonate.detection.latency': data.latency,
        'sonate.detection.algorithm': data.algorithm,
        'sonate.tenant': data.tenant || 'unknown',
      });

      if (data.bedauIndex !== undefined) {
        span.setAttribute('sonate.bedau_index', data.bedauIndex);
      }

      if (data.emergenceType) {
        span.setAttribute('sonate.emergence.type', data.emergenceType);
      }

      span.setStatus({ code: SpanStatusCode.OK });
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus({ code: SpanStatusCode.ERROR });
      throw error;
    } finally {
      span.end();
    }
  }

  /**
   * Record agent orchestration metrics
   */
  recordAgentActivity(data: AgentObservabilityData): void {
    const span = this.tracer.startSpan('sonate.agent.activity_recording');
    
    try {
      // Record task count
      this.agentTaskCounter.add(data.taskCount, {
        'sonate.agent.id': data.agentId,
        'sonate.agent.type': data.agentType,
        'sonate.tenant': data.tenant,
      });

      // Record errors if any
      if (data.errors > 0) {
        this.agentErrorCounter.add(data.errors, {
          'sonate.agent.id': data.agentId,
          'sonate.agent.type': data.agentType,
          'sonate.tenant': data.tenant,
        });
      }

      // Add span attributes
      span.setAttributes({
        'sonate.agent.id': data.agentId,
        'sonate.agent.type': data.agentType,
        'sonate.agent.status': data.status,
        'sonate.agent.tasks': data.taskCount,
        'sonate.agent.errors': data.errors,
        'sonate.tenant': data.tenant || 'unknown',
      });

      span.setStatus({ code: SpanStatusCode.OK });
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus({ code: SpanStatusCode.ERROR });
      throw error;
    } finally {
      span.end();
    }
  }

  /**
   * Create a custom span with SONATE attributes
   */
  createSpan(name: string, attributes?: SonateSpanAttributes): Span {
    const span = this.tracer.startSpan(name);
    
    if (attributes) {
      span.setAttributes(attributes);
    }
    
    return span;
  }

  /**
   * Get the tracer for custom instrumentation
   */
  getTracer(name: string = 'sonate-platform') {
    return trace.getTracer(name);
  }

  /**
   * Get the meter for custom metrics
   */
  getMeter(name: string = 'sonate-platform') {
    return metrics.getMeter(name);
  }

  /**
   * Record an error with observability context
   */
  recordError(error: Error, context?: SonateSpanAttributes): void {
    const span = this.tracer.startSpan('sonate.error');
    
    try {
      span.recordException(error);
      span.setStatus({ code: SpanStatusCode.ERROR });
      
      if (context) {
        span.setAttributes(context);
      }
      
      span.setAttribute('sonate.error.type', error.constructor.name);
      span.setAttribute('sonate.error.message', error.message);
    } finally {
      span.end();
    }
  }
}

/**
 * Singleton instance
 */
export const observabilityManager = new ObservabilityManager();
