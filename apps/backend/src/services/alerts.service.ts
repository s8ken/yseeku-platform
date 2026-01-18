/**
 * Alerts Service - Database-Backed Alert Management
 *
 * Manages system alerts with MongoDB persistence for reliability
 * across restarts and horizontal scaling.
 */

import { AlertModel, IAlert, AlertSeverity, AlertStatus } from '../models/alert.model';
import logger from '../utils/logger';

export interface Alert {
  id: string;
  timestamp: string;
  type: string;
  title: string;
  description: string;
  severity: AlertSeverity;
  status: AlertStatus;
  details?: Record<string, any>;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  resolvedBy?: string;
  resolvedAt?: string;
  userId?: string;
  agentId?: string;
  conversationId?: string;
  tenantId?: string;
}

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

/**
 * Convert MongoDB document to Alert interface
 */
function toAlert(doc: IAlert): Alert {
  return {
    id: doc._id.toString(),
    timestamp: doc.timestamp.toISOString(),
    type: doc.type,
    title: doc.title,
    description: doc.description,
    severity: doc.severity,
    status: doc.status,
    details: doc.details,
    acknowledgedBy: doc.acknowledgedBy,
    acknowledgedAt: doc.acknowledgedAt?.toISOString(),
    resolvedBy: doc.resolvedBy,
    resolvedAt: doc.resolvedAt?.toISOString(),
    userId: doc.userId,
    agentId: doc.agentId,
    conversationId: doc.conversationId,
    tenantId: doc.tenantId,
  };
}

export const alertsService = {
  /**
   * List all alerts for a tenant
   */
  async list(tenantId: string = 'default', options?: {
    status?: AlertStatus;
    severity?: AlertSeverity;
    type?: string;
    limit?: number;
    offset?: number;
  }): Promise<Alert[]> {
    try {
      const query: any = { tenantId };

      if (options?.status) query.status = options.status;
      if (options?.severity) query.severity = options.severity;
      if (options?.type) query.type = options.type;

      const alerts = await AlertModel
        .find(query)
        .sort({ timestamp: -1 })
        .skip(options?.offset || 0)
        .limit(options?.limit || 100)
        .lean();

      return alerts.map(doc => toAlert(doc as unknown as IAlert));
    } catch (error: any) {
      logger.error('Failed to list alerts', { error: error.message, tenantId });
      return [];
    }
  },

  /**
   * Create a new alert
   */
  async create(input: Omit<Alert, 'id' | 'timestamp' | 'status'> & Partial<Pick<Alert, 'status'>>, tenantId: string = 'default'): Promise<Alert> {
    try {
      const alert = await AlertModel.create({
        timestamp: new Date(),
        status: input.status || 'active',
        type: input.type,
        title: input.title,
        description: input.description,
        severity: input.severity,
        details: input.details,
        userId: input.userId,
        agentId: input.agentId,
        conversationId: input.conversationId,
        tenantId,
      });

      logger.info('Alert created', {
        alertId: alert._id,
        type: input.type,
        severity: input.severity,
        tenantId,
      });

      return toAlert(alert);
    } catch (error: any) {
      logger.error('Failed to create alert', { error: error.message, tenantId });
      throw error;
    }
  },

  /**
   * Acknowledge an alert
   */
  async acknowledge(id: string, by: string, tenantId: string = 'default'): Promise<Alert | null> {
    try {
      const alert = await AlertModel.findOneAndUpdate(
        { _id: id, tenantId },
        {
          status: 'acknowledged',
          acknowledgedBy: by,
          acknowledgedAt: new Date(),
        },
        { new: true }
      );

      if (!alert) return null;

      logger.info('Alert acknowledged', { alertId: id, by, tenantId });
      return toAlert(alert);
    } catch (error: any) {
      logger.error('Failed to acknowledge alert', { error: error.message, id, tenantId });
      return null;
    }
  },

  /**
   * Resolve an alert
   */
  async resolve(id: string, by: string, tenantId: string = 'default'): Promise<Alert | null> {
    try {
      const alert = await AlertModel.findOneAndUpdate(
        { _id: id, tenantId },
        {
          status: 'resolved',
          resolvedBy: by,
          resolvedAt: new Date(),
        },
        { new: true }
      );

      if (!alert) return null;

      logger.info('Alert resolved', { alertId: id, by, tenantId });
      return toAlert(alert);
    } catch (error: any) {
      logger.error('Failed to resolve alert', { error: error.message, id, tenantId });
      return null;
    }
  },

  /**
   * Suppress an alert
   */
  async suppress(id: string, by: string, tenantId: string = 'default'): Promise<Alert | null> {
    try {
      const alert = await AlertModel.findOneAndUpdate(
        { _id: id, tenantId },
        {
          status: 'suppressed',
          acknowledgedBy: by,
          acknowledgedAt: new Date(),
        },
        { new: true }
      );

      if (!alert) return null;

      logger.info('Alert suppressed', { alertId: id, by, tenantId });
      return toAlert(alert);
    } catch (error: any) {
      logger.error('Failed to suppress alert', { error: error.message, id, tenantId });
      return null;
    }
  },

  /**
   * Get a single alert by ID
   */
  async get(id: string, tenantId: string = 'default'): Promise<Alert | null> {
    try {
      const alert = await AlertModel.findOne({ _id: id, tenantId }).lean();
      if (!alert) return null;
      return toAlert(alert as unknown as IAlert);
    } catch (error: any) {
      logger.error('Failed to get alert', { error: error.message, id, tenantId });
      return null;
    }
  },

  /**
   * Seed demo alerts for showcase purposes
   */
  async seedDemoAlerts(tenantId: string = 'demo'): Promise<void> {
    try {
      // Clear existing demo alerts for this tenant
      await AlertModel.deleteMany({ tenantId });

      // Create demo alerts
      const alertDocs = demoAlerts.map(demoAlert => ({
        timestamp: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000),
        tenantId,
        ...demoAlert,
        acknowledgedAt: demoAlert.acknowledgedAt ? new Date(demoAlert.acknowledgedAt) : undefined,
      }));

      await AlertModel.insertMany(alertDocs);
      logger.info('Demo alerts seeded', { tenantId, count: alertDocs.length });
    } catch (error: any) {
      logger.error('Failed to seed demo alerts', { error: error.message, tenantId });
    }
  },

  /**
   * Clear all alerts for a tenant
   */
  async clear(tenantId: string = 'default'): Promise<void> {
    try {
      const result = await AlertModel.deleteMany({ tenantId });
      logger.info('Alerts cleared', { tenantId, count: result.deletedCount });
    } catch (error: any) {
      logger.error('Failed to clear alerts', { error: error.message, tenantId });
    }
  },

  /**
   * Get summary stats for a tenant
   */
  async getSummary(tenantId: string = 'default'): Promise<{
    total: number;
    critical: number;
    error: number;
    warning: number;
    info: number;
    active: number;
    acknowledged: number;
    resolved: number;
  }> {
    try {
      const [stats] = await AlertModel.aggregate([
        { $match: { tenantId } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            critical: { $sum: { $cond: [{ $and: [{ $eq: ['$severity', 'critical'] }, { $eq: ['$status', 'active'] }] }, 1, 0] } },
            error: { $sum: { $cond: [{ $and: [{ $eq: ['$severity', 'error'] }, { $eq: ['$status', 'active'] }] }, 1, 0] } },
            warning: { $sum: { $cond: [{ $and: [{ $eq: ['$severity', 'warning'] }, { $eq: ['$status', 'active'] }] }, 1, 0] } },
            info: { $sum: { $cond: [{ $and: [{ $eq: ['$severity', 'info'] }, { $eq: ['$status', 'active'] }] }, 1, 0] } },
            active: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
            acknowledged: { $sum: { $cond: [{ $eq: ['$status', 'acknowledged'] }, 1, 0] } },
            resolved: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } },
          },
        },
      ]);

      return stats || {
        total: 0,
        critical: 0,
        error: 0,
        warning: 0,
        info: 0,
        active: 0,
        acknowledged: 0,
        resolved: 0,
      };
    } catch (error: any) {
      logger.error('Failed to get alert summary', { error: error.message, tenantId });
      return {
        total: 0,
        critical: 0,
        error: 0,
        warning: 0,
        info: 0,
        active: 0,
        acknowledged: 0,
        resolved: 0,
      };
    }
  },

  /**
   * Count alerts matching criteria
   */
  async count(tenantId: string = 'default', options?: {
    status?: AlertStatus;
    severity?: AlertSeverity;
    type?: string;
  }): Promise<number> {
    try {
      const query: any = { tenantId };
      if (options?.status) query.status = options.status;
      if (options?.severity) query.severity = options.severity;
      if (options?.type) query.type = options.type;

      return await AlertModel.countDocuments(query);
    } catch (error: any) {
      logger.error('Failed to count alerts', { error: error.message, tenantId });
      return 0;
    }
  },
};

export type { AlertSeverity, AlertStatus };
