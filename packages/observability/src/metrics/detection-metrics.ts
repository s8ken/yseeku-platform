/**
 * Detection Metrics for SONATE Platform
 */

import { metrics } from '@opentelemetry/api';
import { DetectionObservabilityData } from '../types';

/**
 * Detection performance metrics collector
 */
export class DetectionMetrics {
  private meter = metrics.getMeter('sonate-detect');
  
  private detectionLatencyHistogram = this.meter.createHistogram('sonate_detection_latency_ms', {
    description: 'Detection processing latency in milliseconds',
    unit: 'ms',
  });
  
  private detectionThroughputCounter = this.meter.createCounter('sonate_detection_throughput_total', {
    description: 'Total number of detections processed',
  });
  
  private bedauIndexHistogram = this.meter.createHistogram('sonate_bedau_index', {
    description: 'Bedau Index values for emergence detection',
    unit: 'index',
  });
  
  private emergenceDetectedCounter = this.meter.createCounter('sonate_emergence_detected_total', {
    description: 'Total number of emergence detections',
  });
  
  private algorithmPerformanceHistogram = this.meter.createHistogram('sonate_detection_algorithm_performance_ms', {
    description: 'Performance metrics by detection algorithm',
    unit: 'ms',
  });

  /**
   * Record detection performance
   */
  recordDetectionPerformance(data: DetectionObservabilityData): void {
    // Record latency
    this.detectionLatencyHistogram.record(data.latency, {
      'sonate.tenant': data.tenant || 'unknown',
      'sonate.detection.algorithm': data.algorithm,
    });

    // Record throughput
    this.detectionThroughputCounter.add(1, {
      'sonate.tenant': data.tenant || 'unknown',
      'sonate.detection.algorithm': data.algorithm,
    });

    // Record algorithm performance
    this.algorithmPerformanceHistogram.record(data.latency, {
      'sonate.detection.algorithm': data.algorithm,
      'sonate.tenant': data.tenant || 'unknown',
    });

    // Record Bedau Index if available
    if (data.bedauIndex !== undefined) {
      this.bedauIndexHistogram.record(data.bedauIndex, {
        'sonate.tenant': data.tenant || 'unknown',
        'sonate.detection.algorithm': data.algorithm,
      });
    }

    // Record emergence detection
    if (data.emergenceType && data.emergenceType !== 'LINEAR') {
      this.emergenceDetectedCounter.add(1, {
        'sonate.tenant': data.tenant || 'unknown',
        'sonate.detection.algorithm': data.algorithm,
        'sonate.emergence.type': data.emergenceType,
      });
    }
  }

  /**
   * Record batch detection performance
   */
  recordBatchDetectionPerformance(batchData: DetectionObservabilityData[]): void {
    const totalLatency = batchData.reduce((sum, data) => sum + data.latency, 0);
    const avgLatency = totalLatency / batchData.length;
    
    const algorithms = [...new Set(batchData.map(d => d.algorithm))];
    const emergenceTypes = batchData.filter(d => d.emergenceType && d.emergenceType !== 'LINEAR');

    // Record batch metrics
    this.detectionLatencyHistogram.record(avgLatency, {
      'sonate.tenant': batchData[0]?.tenant || 'unknown',
      'sonate.detection.batch_size': batchData.length.toString(),
    });

    this.detectionThroughputCounter.add(batchData.length, {
      'sonate.tenant': batchData[0]?.tenant || 'unknown',
      'sonate.detection.batch': 'true',
    });

    // Record algorithm distribution
    algorithms.forEach(algorithm => {
      const count = batchData.filter(d => d.algorithm === algorithm).length;
      this.detectionThroughputCounter.add(count, {
        'sonate.tenant': batchData[0]?.tenant || 'unknown',
        'sonate.detection.algorithm': algorithm,
      });
    });

    // Record emergence types
    emergenceTypes.forEach(data => {
      if (data.emergenceType) {
        this.emergenceDetectedCounter.add(1, {
          'sonate.tenant': data.tenant || 'unknown',
          'sonate.emergence.type': data.emergenceType,
        });
      }
    });
  }

  /**
   * Get the meter for custom detection metrics
   */
  getMeter() {
    return this.meter;
  }
}
