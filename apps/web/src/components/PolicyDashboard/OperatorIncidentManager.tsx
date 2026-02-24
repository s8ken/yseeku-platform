'use client';

import React, { useState } from 'react';
import type { Alert } from './AlertFeed';

interface OperatorIncidentManagerProps {
  alerts: Alert[];
}

export const OperatorIncidentManager: React.FC<OperatorIncidentManagerProps> = ({ alerts }) => {
  const [incidents, setIncidents] = useState<Record<string, boolean>>({});

  const criticalAlerts = alerts.filter((a) => a.severity === 'critical');

  const toggleIncident = (alertId: string) => {
    setIncidents((prev) => ({
      ...prev,
      [alertId]: !prev[alertId],
    }));
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
      <h2 className="text-xl font-bold mb-4">Critical Incidents</h2>

      {criticalAlerts.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-green-600 font-semibold">✓ No critical incidents</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {criticalAlerts.slice(0, 10).map((alert) => (
            <div
              key={alert.id}
              className={`border rounded p-3 cursor-pointer transition ${
                incidents[alert.id]
                  ? 'border-red-500 bg-red-50'
                  : 'border-gray-300 bg-gray-50 hover:border-red-400'
              }`}
              onClick={() => toggleIncident(alert.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="font-semibold text-red-700 text-sm">{alert.message}</p>
                  <div className="text-xs text-gray-600 mt-1">
                    {new Date(alert.timestamp).toLocaleString()}
                  </div>
                </div>
                <button
                  className="text-xs px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.alert('Escalation would be handled here');
                  }}
                >
                  Escalate
                </button>
              </div>
              {incidents[alert.id] && (
                <div className="mt-2 pt-2 border-t text-xs text-gray-600">
                  <p>
                    <strong>Agent:</strong> {alert.agentDid}
                  </p>
                  <p>
                    <strong>Receipt:</strong> {alert.receiptId}
                  </p>
                  <p>
                    <strong>Details:</strong> {JSON.stringify(alert.data).slice(0, 100)}...
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
