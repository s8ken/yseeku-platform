# YSEEKU Overseer / System Brain

## Overview

The Overseer is YSEEKU's autonomous AI governance system - a closed-loop oversight engine that monitors, analyzes, plans, acts, and learns to maintain platform safety.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      SystemBrainService                      │
│                      (singleton orchestrator)                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. SENSORS (sensors.ts)                                    │
│     └─ gatherSensors() → comprehensive system state          │
│                                                             │
│  2. ANALYZER (analyzer.ts)                                  │
│     └─ analyzeContext() → risk score, anomalies, urgency    │
│                                                             │
│  3. PLANNER (planner.ts)                                    │
│     └─ planActions() → prioritized action list              │
│                                                             │
│  4. LLM INTEGRATION                                         │
│     └─ parseLLMResponse() → structured LLM recommendations  │
│                                                             │
│  5. EXECUTOR (executor.ts)                                  │
│     └─ executeActions() → actually perform actions          │
│                                                             │
│  6. CONSTRAINTS (constraints.ts)                            │
│     └─ checkKernelConstraints() → safety guardrails         │
│                                                             │
│  7. FEEDBACK (feedback.ts)                                  │
│     └─ measureActionImpact() → learn from outcomes          │
│                                                             │
│  8. MEMORY (memory.ts)                                      │
│     └─ remember(), recall() → persistent brain memory       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Thinking Cycle

Each cycle follows the Sense-Plan-Act-Learn pattern:

### 1. Sense (Sensors)

Gathers comprehensive system state:

```typescript
interface SensorData {
  // Core metrics
  bedau: BedauMetrics;           // Emergence detection
  avgTrust: number;              // Current trust score
  receipts: TrustReceipt[];      // Recent trust receipts

  // Statistical analysis
  trustTrend: TrendData;         // direction, slope, volatility
  historicalMean: number;        // Baseline trust
  historicalStd: number;         // Normal variance

  // Agent health
  agentHealth: {
    total: number;
    active: number;
    banned: number;
    restricted: number;
    quarantined: number;
  };

  // Alert status
  activeAlerts: {
    total: number;
    critical: number;
    warning: number;
    unacknowledged: number;
  };

  // Temporal context
  isBusinessHours: boolean;
  hourOfDay: number;
}
```

### 2. Analyze (Analyzer)

Produces risk assessment:

```typescript
interface AnalysisResult {
  status: 'healthy' | 'warning' | 'critical';
  riskScore: number;             // 0-100
  urgency: 'low' | 'medium' | 'high' | 'immediate';
  observations: string[];        // What was detected
  anomalies: Anomaly[];          // Specific issues
}
```

**Detection capabilities:**
- Critical trust levels (< 50%)
- Statistical anomalies (Z-score < -2)
- High emergence (Bedau Index)
- Declining/improving trends
- High volatility
- Agent ban ratios
- Unacknowledged alerts
- Rapid decline patterns

### 3. Plan (Planner + LLM)

The planner uses **two intelligence sources**:

1. **Rule-based planning**: Deterministic responses to known patterns
2. **LLM analysis**: Claude analyzes context and suggests actions

Actions are merged with deduplication and priority sorting:

```typescript
interface PlannedAction {
  type: 'alert' | 'adjust_threshold' | 'ban_agent' | 'restrict_agent' | 'quarantine_agent' | 'unban_agent';
  target: string;
  reason: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;  // 0-1
}
```

**Safety features:**
- Maximum 5 actions per cycle (3 for non-immediate urgency)
- Enforcement actions blocked in low-risk situations
- Historical effectiveness considered
- LLM recommendations validated before use

### 4. Execute (Executor + Constraints)

Before execution, the **Kernel Constraint System** validates:

```typescript
// Constraint checks:
- Tenant context required
- Action type must be allowed
- Advisory mode blocks executory actions
- Critical actions require explicit reasons
- Ban/quarantine requires justification
```

**Execution modes:**
- **Advisory**: Plans actions but doesn't execute (safe mode)
- **Enforced**: Actually executes actions (production mode)

### 5. Learn (Feedback)

After execution, the system measures impact:

```typescript
interface ActionOutcome {
  actionId: string;
  success: boolean;
  impact: number;  // -1 to 1 scale
  metrics: {
    trustDelta: number;
    emergenceDelta: number;
  };
}
```

**Learning loop:**
1. Record outcome for each action
2. Calculate effectiveness per action type
3. Generate recommendations (increase/decrease/maintain)
4. Future planning considers historical effectiveness

## API Endpoints

### Overseer Routes (`/api/overseer`)

| Method | Endpoint | Scope | Description |
|--------|----------|-------|-------------|
| POST | `/init` | `overseer:plan` | Initialize Overseer agent |
| POST | `/think` | `overseer:plan` | Trigger thinking cycle |
| GET | `/status` | - | Get Overseer status |
| GET | `/cycles` | `overseer:read` | List thinking cycles |
| GET | `/cycles/:id` | `overseer:read` | Get cycle details |
| POST | `/actions/:id/approve` | `overseer:act` | Approve planned action |
| POST | `/actions/:id/override` | `overseer:act` | Override executed action |

### Override Routes (`/api/overrides`)

| Method | Endpoint | Scope | Description |
|--------|----------|-------|-------------|
| GET | `/queue` | `overseer:read` | Get pending overrides |
| GET | `/history` | `overseer:read` | Get override history |
| POST | `/decide` | `overseer:act` | Decide on pending action |

## Configuration

Environment variables:

```bash
OVERSEER_SCHEDULE_ENABLED=true    # Enable automatic cycles
OVERSEER_INTERVAL_MS=60000        # Cycle interval (default: 1 min)
OVERSEER_MODE=advisory            # advisory | enforced
```

## Action Types

| Action | Description | When Used |
|--------|-------------|-----------|
| `alert` | Notify operators | Any concerning pattern |
| `adjust_threshold` | Modify trust thresholds | Low trust, high emergence |
| `ban_agent` | Completely disable agent | Severe violations |
| `restrict_agent` | Limit agent capabilities | Moderate violations |
| `quarantine_agent` | Isolate for review | Critical issues |
| `unban_agent` | Restore banned agent | Trust recovered |

## Safety Features

### 1. Kernel Constraints
- Actions vetoed if missing required context
- Enforcement actions blocked in advisory mode
- Critical actions require justification

### 2. Human Override
- All actions can be overridden with justification
- Overrides are audited with correlation IDs
- Emergency overrides logged separately

### 3. Refusal Logging
- Every kernel refusal is logged with reason
- Prometheus metrics for monitoring
- Audit trail for compliance

### 4. Multi-Tenancy
- All actions scoped to tenant
- Memory isolated by tenant
- Cycles tracked per tenant

## Observability

### Prometheus Metrics

```
sonate_brain_cycles_total{status="completed|failed"}
sonate_brain_cycle_duration_seconds
sonate_brain_actions_total{type, status}
sonate_refusals_total{reason, tenant_id}
sonate_overrides_total{status, tenant_id}
```

### Logging

All cycles log:
- Tenant ID
- Mode (advisory/enforced)
- Risk score
- Urgency level
- Actions planned/executed
- LLM usage flag
- Duration

## Example Cycle Output

```json
{
  "tenantId": "acme-corp",
  "mode": "enforced",
  "riskScore": 45,
  "urgency": "medium",
  "observations": [
    "low_trust",
    "declining_trend",
    "emergence_detected"
  ],
  "actions": [
    {
      "type": "adjust_threshold",
      "target": "trust",
      "reason": "Trust below acceptable threshold",
      "priority": "medium",
      "status": "executed"
    },
    {
      "type": "alert",
      "target": "system",
      "reason": "Weak emergence pattern detected",
      "priority": "medium",
      "status": "executed"
    }
  ],
  "llmUsed": true,
  "durationMs": 1234
}
```

## Integration with Other Systems

### Trust Service
- Sensors gather trust receipts
- Actions can adjust trust thresholds
- Impact measured via trust delta

### Bedau Index
- Sensors gather emergence level
- High emergence triggers alerts/adjustments
- Impact measured via emergence delta

### Drift Detection
- Can be integrated via sensors (TODO)
- Phase-shift velocity affects risk score

### Alert Service
- Actions create alerts
- Sensors gather active alert counts
- Unacknowledged alerts increase risk

## Best Practices

1. **Start in Advisory Mode**: Monitor what the Overseer would do before enabling enforced mode

2. **Review Cycles Regularly**: Check `/api/overseer/cycles` to understand decision patterns

3. **Monitor Effectiveness**: Check if actions are actually improving trust

4. **Set Up Alerts**: Use Prometheus alerts for refusals and overrides

5. **Tune Thresholds**: Adjust risk thresholds based on your tolerance

## Future Enhancements

1. **Drift Sensor Integration**: Add DriftDetector and ConversationalMetrics to sensors
2. **Predictive Analytics**: Use historical data to predict issues
3. **Custom Action Types**: Allow users to define new action types
4. **Multi-Agent Coordination**: Coordinate across multiple Overseers
5. **Explainability Dashboard**: Visualize why decisions were made
