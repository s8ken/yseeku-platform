import { NextRequest, NextResponse } from 'next/server';
import { getAuditLogger, AuditSeverity, AuditEventType } from '@sonate/orchestrate';

export async function GET(request: NextRequest) {
  try {
    // Get tenant from header or query param
    const tenant = request.headers.get('x-tenant-id') || request.nextUrl.searchParams.get('tenant') || 'default';

    // Get audit logger
    const auditLogger = getAuditLogger();

    // Query for recent critical and error alerts
    const criticalAlerts = await auditLogger.query({
      severity: AuditSeverity.CRITICAL,
      limit: 10,
      startDate: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
    });

    const errorAlerts = await auditLogger.query({
      severity: AuditSeverity.ERROR,
      limit: 10,
      startDate: new Date(Date.now() - 24 * 60 * 60 * 1000)
    });

    const warningAlerts = await auditLogger.query({
      severity: AuditSeverity.WARNING,
      limit: 5,
      startDate: new Date(Date.now() - 6 * 60 * 60 * 1000) // Last 6 hours
    });

    // Combine and sort by timestamp (most recent first)
    const allAlerts = [...criticalAlerts, ...errorAlerts, ...warningAlerts]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 20); // Top 20 alerts

    // Transform alerts for frontend
    const alerts = allAlerts.map(alert => ({
      id: alert.id,
      timestamp: alert.timestamp,
      type: alert.severity.toUpperCase(),
      title: alert.action,
      description: `${alert.eventType}: ${alert.outcome}`,
      severity: alert.severity,
      details: alert.details,
      userId: alert.userId,
      resourceType: alert.resourceType,
      resourceId: alert.resourceId
    }));

    // Summary counts
    const summary = {
      critical: criticalAlerts.length,
      error: errorAlerts.length,
      warning: warningAlerts.length,
      total: allAlerts.length
    };

    return NextResponse.json({
      success: true,
      data: {
        tenant,
        summary,
        alerts
      }
    });

  } catch (error) {
    console.error('Alerts error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}