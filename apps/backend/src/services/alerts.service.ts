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
  }
};

export type { Alert };
