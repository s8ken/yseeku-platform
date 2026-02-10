'use client';

/**
 * Alert Feed Component
 * 
 * Displays real-time policy violations and alerts
 */

import React, { useMemo } from 'react';

export interface Alert {
  id: string;
  type: 'policy_violation' | 'anomaly_detected' | 'coherence_change' | 'resonance_update' | 'metrics_snapshot';
  severity: 'info' | 'warning' | 'critical';
  agentDid: string;
  receiptId: string;
  message: string;
  data: any;
  timestamp: string;
}

interface AlertFeedProps {
  alerts: Alert[];
  timeRange: '1h' | '24h' | '7d';
}

export const AlertFeed: React.FC<AlertFeedProps> = ({ alerts, timeRange }) => {
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return '🔴';
      case 'warning':
        return '🟡';
      default:
        return '🔵';
    }
  };

  const getSeverityClass = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'border-red-500 bg-red-50';
      case 'warning':
        return 'border-yellow-500 bg-yellow-50';
      default:
        return 'border-blue-500 bg-blue-50';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'policy_violation':
        return '⚠️';
      case 'anomaly_detected':
        return '🔍';
      case 'coherence_change':
        return '📊';
      case 'resonance_update':
        return '📈';
      default:
        return '📌';
    }
  };

  const filteredAlerts = useMemo(() => {
    const now = new Date();
    let cutoffTime = new Date();

    switch (timeRange) {
      case '1h':
        cutoffTime.setHours(now.getHours() - 1);
        break;
      case '24h':
        cutoffTime.setDate(now.getDate() - 1);
        break;
      case '7d':
        cutoffTime.setDate(now.getDate() - 7);
        break;
    }

    return alerts
      .filter((a) => new Date(a.timestamp) >= cutoffTime)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 50);
  }, [alerts, timeRange]);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold mb-4">Recent Alerts ({filteredAlerts.length})</h2>

      {filteredAlerts.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No alerts in this time range</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`border-l-4 p-3 rounded transition hover:shadow ${getSeverityClass(
                alert.severity
              )}`}
            >
              <div className="flex items-start gap-2">
                <span>{getSeverityIcon(alert.severity)}</span>
                <span>{getTypeIcon(alert.type)}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">{alert.message}</p>
                  <div className="flex items-center gap-2 mt-1 text-xs text-gray-600">
                    <code className="bg-gray-100 px-2 py-1 rounded truncate">
                      {alert.agentDid.slice(0, 20)}...
                    </code>
                    <span>{new Date(alert.timestamp).toLocaleTimeString()}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
