import { AlertModel, IAlert } from '../models/alert.model';
import { ioInstance as io } from '../utils/socket'; // Socket.IO instance

export class AlertsService {
  static async createAlert(data: Partial<IAlert>): Promise<IAlert> {
    const alert = await AlertModel.create(data);
    
    // Emit real-time update
    if (io) {
      io.to(`tenant:${data.tenant_id}`).emit('alert:new', alert);
    }
    
    return alert;
  }

  static async getAlerts(tenantId: string, options: {
    status?: string;
    severity?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<{ alerts: IAlert[]; total: number }> {
    const query: any = { tenant_id: tenantId };
    if (options.status) query.status = options.status;
    if (options.severity) query.severity = options.severity;

    const [alerts, total] = await Promise.all([
      AlertModel.find(query)
        .sort({ created_at: -1 })
        .skip(options.offset || 0)
        .limit(options.limit || 50),
      AlertModel.countDocuments(query),
    ]);

    return { alerts, total };
  }

  static async acknowledgeAlert(alertId: string, userId: string): Promise<IAlert | null> {
    const alert = await AlertModel.findByIdAndUpdate(
      alertId,
      {
        status: 'acknowledged',
        acknowledged_by: userId,
        acknowledged_at: new Date(),
      },
      { new: true }
    );

    if (alert && io) {
      io.to(`tenant:${alert.tenant_id}`).emit('alert:updated', alert);
    }

    return alert;
  }

  static async resolveAlert(alertId: string): Promise<IAlert | null> {
    const alert = await AlertModel.findByIdAndUpdate(
      alertId,
      {
        status: 'resolved',
        resolved_at: new Date(),
      },
      { new: true }
    );

    if (alert && io) {
      io.to(`tenant:${alert.tenant_id}`).emit('alert:updated', alert);
    }

    return alert;
  }

  static async getAlertStats(tenantId: string): Promise<{
    total: number;
    active: number;
    critical: number;
    byType: Record<string, number>;
  }> {
    const [total, active, critical, byType] = await Promise.all([
      AlertModel.countDocuments({ tenant_id: tenantId }),
      AlertModel.countDocuments({ tenant_id: tenantId, status: 'active' }),
      AlertModel.countDocuments({ tenant_id: tenantId, severity: 'critical', status: 'active' }),
      AlertModel.aggregate([
        { $match: { tenant_id: tenantId } },
        { $group: { _id: '$type', count: { $sum: 1 } } },
      ]),
    ]);

    return {
      total,
      active,
      critical,
      byType: byType.reduce((acc, { _id, count }) => ({ ...acc, [_id]: count }), {}),
    };
  }
}

export const alertsService = AlertsService;
