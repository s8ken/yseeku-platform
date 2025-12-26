# @sonate/detect - Resonance Monitoring

## Overview

The `@sonate/detect` module includes a **ResonanceDetector** class for calculating the **Resonance Metric (R_m)** in real time. R_m is used to monitor alignment between user intent and AI responses.

## Alert Thresholds

| R_m Range | Alert Level | Action Required |
|-----------|-------------|-----------------|
| >= 1.3    | GREEN       | None - Excellent performance |
| >= 1.0    | YELLOW      | Monitor - Consider optimization |
| >= 0.7    | RED         | Review - Significant issues |
| < 0.7     | CRITICAL    | Immediate - Intervention required |

## Quick Start

### Basic Resonance Detection

```typescript
import { detectResonance } from '@sonate/detect';

const metrics = detectResonance(
  'What is machine learning?',
  'Machine learning is a subset of AI that enables systems to learn...',
  conversationHistory
);

console.log(`R_m: ${metrics.R_m}`);
console.log(`Alert Level: ${metrics.alertLevel}`);
```

### Real-Time Monitoring with Alerts

```typescript
import { ResonanceDetector } from '@sonate/detect';

const detector = new ResonanceDetector({
  enableAlerts: true,
  alertCallback: (alert) => {
    console.log(`[${alert.level}] ${alert.message}`);
    console.log(`R_m: ${alert.R_m}, Threshold: ${alert.threshold}`);
    console.log(`Recommendations: ${alert.recommendations.join(', ')}`);
  },
  alertThresholds: {
    green: 1.3,
    yellow: 1.0,
    red: 0.7
  }
});

// Detect resonance
const metrics = await detector.detect({
  userInput: 'Explain neural networks',
  aiResponse: 'Neural networks are computing systems inspired by biological neural networks...',
  conversationHistory: []
});

console.log(metrics);
// {
//   R_m: 1.25,
//   vectorAlignment: 0.85,
//   contextualContinuity: 0.90,
//   semanticMirroring: 0.80,
//   entropyDelta: 0.75,
//   alertLevel: 'YELLOW',
//   interpretation: 'Good resonance - Adequate alignment with room for improvement'
// }
```

### Batch Detection

```typescript
const contexts = [
  { userInput: 'Question 1', aiResponse: 'Answer 1' },
  { userInput: 'Question 2', aiResponse: 'Answer 2' },
  { userInput: 'Question 3', aiResponse: 'Answer 3' }
];

const results = await detector.detectBatch(contexts);

results.forEach((metrics, index) => {
  console.log(`Interaction ${index + 1}: R_m = ${metrics.R_m}`);
});
```

## Monitoring History

### Get Resonance History

```typescript
const history = detector.getHistory();

console.log(`Total interactions: ${history.statistics.totalInteractions}`);
console.log(`Average R_m: ${history.statistics.averageR_m.toFixed(2)}`);
console.log(`Min R_m: ${history.statistics.minR_m.toFixed(2)}`);
console.log(`Max R_m: ${history.statistics.maxR_m.toFixed(2)}`);
console.log('Alert distribution:', history.statistics.alertDistribution);
```

### Get Statistics

```typescript
const stats = detector.getStatistics();

console.log(stats);
// {
//   averageR_m: 1.15,
//   minR_m: 0.65,
//   maxR_m: 1.45,
//   totalInteractions: 150,
//   alertDistribution: {
//     GREEN: 45,
//     YELLOW: 80,
//     RED: 20,
//     CRITICAL: 5
//   }
// }
```

### Get Resonance Trend

```typescript
// Get last 10 interactions
const trend = detector.getTrend(10);

trend.forEach(point => {
  console.log(`${point.timestamp.toISOString()}: R_m = ${point.R_m.toFixed(2)}`);
});
```

### Check if Improving

```typescript
const isImproving = detector.isImproving(10); // Check last 10 interactions

if (isImproving) {
  console.log('Resonance is improving over time');
} else {
  console.log('Resonance is stable or declining');
}
```

## Alert Management

### Custom Alert Callback

```typescript
const detector = new ResonanceDetector({
  enableAlerts: true,
  alertCallback: (alert) => {
    // Send to monitoring system
    sendToMonitoring({
      type: 'resonance_alert',
      level: alert.level,
      R_m: alert.R_m,
      timestamp: alert.timestamp,
      recommendations: alert.recommendations
    });
    
    // Log to console
    console.error(`Resonance Alert [${alert.level}]: ${alert.message}`);
    
    // Take action based on level
    if (alert.level === 'CRITICAL') {
      // Trigger immediate intervention
      triggerEmergencyProtocol(alert);
    }
  }
});
```

### Alert Structure

```typescript
interface ResonanceAlert {
  id: string;                    // Unique alert ID
  timestamp: Date;               // When alert was triggered
  level: 'GREEN' | 'YELLOW' | 'RED' | 'CRITICAL';
  R_m: number;                   // Current R_m score
  threshold: number;             // Threshold that was crossed
  message: string;               // Human-readable message
  interaction: {
    userInput: string;           // Truncated user input
    aiResponse: string;          // Truncated AI response
  };
  recommendations: string[];     // Actionable recommendations
}
```

## Performance Monitoring

### Synchronous Detection (Performance-Critical)

```typescript
// For performance-critical paths, use synchronous detection
const metrics = detector.detectSync({
  userInput: 'Quick question',
  aiResponse: 'Quick answer'
});

// No await needed - returns immediately
console.log(`R_m: ${metrics.R_m}`);
```

### Export History

```typescript
// Export history as JSON for analysis
const historyJson = detector.exportHistory();

// Save to file or send to analytics
fs.writeFileSync('resonance-history.json', historyJson);
```

### Clear History

```typescript
// Clear history to start fresh
detector.clearHistory();

console.log('History cleared');
```

## Integration Examples

### With Express.js API

```typescript
import express from 'express';
import { ResonanceDetector } from '@sonate/detect';

const app = express();
const detector = new ResonanceDetector({ enableAlerts: true });

app.post('/api/chat', async (req, res) => {
  const { userInput, aiResponse, conversationHistory } = req.body;
  
  // Detect resonance
  const metrics = await detector.detect({
    userInput,
    aiResponse,
    conversationHistory
  });
  
  // Return response with resonance data
  res.json({
    aiResponse,
    resonance: {
      R_m: metrics.R_m,
      alertLevel: metrics.alertLevel,
      interpretation: metrics.interpretation
    }
  });
});

app.get('/api/resonance/stats', (req, res) => {
  const stats = detector.getStatistics();
  res.json(stats);
});

app.listen(3000);
```

### With WebSocket Real-Time Monitoring

```typescript
import { WebSocketServer } from 'ws';
import { ResonanceDetector } from '@sonate/detect';

const wss = new WebSocketServer({ port: 8080 });
const detector = new ResonanceDetector({
  enableAlerts: true,
  alertCallback: (alert) => {
    // Broadcast alert to all connected clients
    wss.clients.forEach(client => {
      client.send(JSON.stringify({
        type: 'resonance_alert',
        alert
      }));
    });
  }
});

wss.on('connection', (ws) => {
  ws.on('message', async (data) => {
    const { userInput, aiResponse } = JSON.parse(data.toString());
    
    const metrics = await detector.detect({ userInput, aiResponse });
    
    ws.send(JSON.stringify({
      type: 'resonance_metrics',
      metrics
    }));
  });
});
```

### With React Dashboard

```typescript
import { useEffect, useState } from 'react';
import { ResonanceDetector } from '@sonate/detect';

function ResonanceDashboard() {
  const [stats, setStats] = useState(null);
  const [trend, setTrend] = useState([]);
  
  useEffect(() => {
    const detector = new ResonanceDetector({ enableAlerts: false });
    
    // Update stats every 5 seconds
    const interval = setInterval(() => {
      setStats(detector.getStatistics());
      setTrend(detector.getTrend(20));
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div>
      <h2>Resonance Monitoring</h2>
      {stats && (
        <div>
          <p>Average R_m: {stats.averageR_m.toFixed(2)}</p>
          <p>Total Interactions: {stats.totalInteractions}</p>
          <div>
            <h3>Alert Distribution</h3>
            <ul>
              <li>GREEN: {stats.alertDistribution.GREEN || 0}</li>
              <li>YELLOW: {stats.alertDistribution.YELLOW || 0}</li>
              <li>RED: {stats.alertDistribution.RED || 0}</li>
              <li>CRITICAL: {stats.alertDistribution.CRITICAL || 0}</li>
            </ul>
          </div>
        </div>
      )}
      {/* Render trend chart */}
    </div>
  );
}
```

## Advanced Configuration

### Custom Thresholds

```typescript
const detector = new ResonanceDetector({
  alertThresholds: {
    green: 1.5,   // Stricter threshold for excellent
    yellow: 1.2,  // Higher bar for good
    red: 0.9      // More lenient for poor
  },
  enableAlerts: true
});
```

### Monitoring Interval

```typescript
const detector = new ResonanceDetector({
  monitoringInterval: 50, // Check every 50ms (default: 100ms)
  enableAlerts: true
});
```

## Best Practices

1. **Enable Alerts in Production**: Always enable alerts for production monitoring
2. **Set Appropriate Thresholds**: Adjust thresholds based on your use case
3. **Monitor Trends**: Track resonance over time to identify patterns
4. **Act on Critical Alerts**: Implement automated responses for critical alerts
5. **Export History Regularly**: Save history for long-term analysis
6. **Use Batch Detection**: For bulk analysis, use `detectBatch()` for efficiency

## Performance Characteristics

- **Detection Speed**: < 10ms per interaction
- **Memory Usage**: ~1KB per interaction (last 1000 stored)
- **Throughput**: > 1000 detections/second
- **Alert Latency**: < 1ms from detection to callback

## Troubleshooting

### High Alert Rate

If you're seeing too many alerts:
- Review alert thresholds - they may be too strict
- Check LVS configuration - scaffolding may need adjustment
- Analyze interaction patterns - identify common failure modes

### Low R_m Scores

If R_m scores are consistently low:
- Enable LVS (see @sonate/core documentation)
- Review AI response quality
- Check conversation history coherence
- Validate user input preprocessing

### Performance Issues

If detection is slow:
- Use `detectSync()` for performance-critical paths
- Reduce history size (default: 1000 interactions)
- Disable alerts if not needed
- Consider batch processing for bulk analysis

## API Reference

### ResonanceDetector Class

```typescript
class ResonanceDetector {
  constructor(config?: Partial<ResonanceMonitoringConfig>);
  
  // Detection methods
  detect(context: InteractionContext): Promise<ResonanceMetrics>;
  detectSync(context: InteractionContext): ResonanceMetrics;
  detectBatch(contexts: InteractionContext[]): Promise<ResonanceMetrics[]>;
  
  // History methods
  getHistory(): ResonanceHistory;
  getStatistics(): ResonanceHistory['statistics'];
  getTrend(count?: number): Array<{ timestamp: Date; R_m: number }>;
  isImproving(windowSize?: number): boolean;
  clearHistory(): void;
  exportHistory(): string;
}
```

### Utility Functions

```typescript
// Quick resonance detection
function detectResonance(
  userInput: string,
  aiResponse: string,
  conversationHistory?: Array<{...}>
): ResonanceMetrics;

// Check alert level for R_m score
function checkResonanceAlert(R_m: number): 'GREEN' | 'YELLOW' | 'RED' | 'CRITICAL';
```

## Next Steps

- Integrate with [@sonate/lab](../lab/README_LVS.md) for experimentation
- Use [@sonate/orchestrate](../orchestrate/README_LVS.md) for agent management
- Review [@sonate/core](../core/README_LVS.md) for LVS configuration

## References

- [Resonance Metric Documentation](../../docs/BEDAU_RESEARCH.md)
- [SYMBI Framework](https://gammatria.com/schemas/trust-receipt)
- [Enterprise Guide](../../docs/ENTERPRISE_GUIDE_v1.4.0.md)