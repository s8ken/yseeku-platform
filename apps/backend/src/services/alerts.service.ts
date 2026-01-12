interface Alert {
  id: string;
  timestamp: string;
  type: string;
  title: string;
  description: string;
  severity: 'critical' | 'error' | 'warning' | 'info';
  status: 'active' | 'acknowledged' | 'resolved' | 'suppressed';
  details?: Record<string, any>;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  resolvedBy?: string;
  resolvedAt?: string;
  userId?: string;
  agentId?: string;
  conversationId?: string;
}

const alerts: Alert[] = [];

// Demo alerts for showcase purposes
const demoAlerts: Omit<Alert, 'id' | 'timestamp'>[] = [
  {
    type: 'trust_violation',
    title: 'Trust Score Below Threshold',
    description: 'Agent "Nova - Creative Writer" trust score dropped to 3.2 in conversation #1247',
    severity: 'critical',
    status: 'active',
    agentId: 'demo-agent-nova',
    conversationId: 'demo-conv-1247',
  },
  {
    type: 'ethical_override',
    title: 'Ethical Override Triggered',
    description: 'Constitutional AI blocked potentially harmful content generation',
    severity: 'warning',
    status: 'acknowledged',
    acknowledgedBy: 'demo@yseeku.com',
    acknowledgedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    agentId: 'demo-agent-quantum',
  },
  {
    type: 'pattern_detection',
    title: 'Unusual Interaction Pattern',
    description: 'Detected 47% increase in user prompts attempting to bypass safety guidelines',
    severity: 'warning',
    status: 'active',
    details: { patternType: 'jailbreak_attempts', increase: 47 },
  },
  {
    type: 'emergence_detected',
    title: 'Emergence Event Flagged',
    description: 'Bedau Index spike (7.8) detected in multi-agent coordination scenario',
    severity: 'warning',
    status: 'active',
    details: { bedauIndex: 7.8, scenario: 'multi-agent-collab' },
  },
  {
    type: 'compliance',
    title: 'Compliance Review Due',
    description: 'Monthly trust framework compliance audit scheduled for review',
    severity: 'info',
    status: 'active',
    details: { dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() },
  },
];

export const alertsService = {
  list(): Alert[] { return alerts; },
  create(input: Omit<Alert,'id'|'timestamp'|'status'> & Partial<Pick<Alert,'status'>>): Alert {
    const alert: Alert = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
      timestamp: new Date().toISOString(),
      status: input.status || 'active',
      type: input.type,
      title: input.title,
      description: input.description,
      severity: input.severity,
      details: input.details,
      userId: input.userId,
      agentId: input.agentId,
      conversationId: input.conversationId,
    };
    alerts.unshift(alert);
    return alert;
  },
  acknowledge(id: string, by: string): Alert | null {
    const a = alerts.find(x => x.id === id);
    if (!a) return null;
    a.status = 'acknowledged';
    a.acknowledgedBy = by;
    a.acknowledgedAt = new Date().toISOString();
    return a;
  },
  resolve(id: string, by: string): Alert | null {
    const a = alerts.find(x => x.id === id);
    if (!a) return null;
    a.status = 'resolved';
    a.resolvedBy = by;
    a.resolvedAt = new Date().toISOString();
    return a;
  },

  /**
   * Seed demo alerts for showcase purposes
   */
  seedDemoAlerts(): void {
    // Clear existing alerts and add demo data
    alerts.length = 0;
    for (const demoAlert of demoAlerts) {
      const alert: Alert = {
        id: `demo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        timestamp: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
        ...demoAlert,
      };
      alerts.push(alert);
    }
  },

  /**
   * Clear all alerts
   */
  clear(): void {
    alerts.length = 0;
  },

  /**
   * Get summary stats
   */
  getSummary(): { total: number; critical: number; warning: number; info: number; active: number } {
    const active = alerts.filter(a => a.status === 'active');
    return {
      total: alerts.length,
      critical: active.filter(a => a.severity === 'critical').length,
      warning: active.filter(a => a.severity === 'warning').length,
      info: active.filter(a => a.severity === 'info').length,
      active: active.length,
    };
  }
};

export type { Alert };
