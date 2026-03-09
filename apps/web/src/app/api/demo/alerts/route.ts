/**
 * Demo Alerts API Route
 *
 * Returns the canonical demo alert list from demo-seed.ts.
 * Alert counts are consistent with:
 * - /api/demo/kpis (alertsCount = DEMO_ALERT_SUMMARY.total = 3)
 * - /api/demo/live-metrics (alerts.warning/info counts match)
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  DEMO_ALERTS,
  DEMO_ALERT_SUMMARY,
  resolveTimestamp,
} from '@/lib/demo-seed';

export async function GET(_request: NextRequest) {
  try {
    const alerts = DEMO_ALERTS.map((alert) => ({
      id: alert.id,
      timestamp: resolveTimestamp(alert.timestampOffset),
      type: alert.type,
      title: alert.title,
      description: alert.description,
      severity: alert.severity,
      status: alert.status,
      details: { ...alert.details },
    }));

    return NextResponse.json({
      success: true,
      data: {
        alerts,
        summary: {
          critical: DEMO_ALERT_SUMMARY.critical,
          error: DEMO_ALERT_SUMMARY.error,
          warning: DEMO_ALERT_SUMMARY.warning,
          info: DEMO_ALERT_SUMMARY.info,
          total: DEMO_ALERT_SUMMARY.total,
        },
      },
    });
  } catch (error) {
    console.error('Demo alerts error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch demo alerts' },
      { status: 500 }
    );
  }
}