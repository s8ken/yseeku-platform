'use client';

import React, { useMemo } from 'react';
import type { Alert } from './AlertFeed';

interface ViolationTimelineProps {
  alerts: Alert[];
  timeRange: '1h' | '24h' | '7d';
}

export const ViolationTimeline: React.FC<ViolationTimelineProps> = ({ alerts, timeRange }) => {
  const timelineData = useMemo(() => {
    const now = new Date();
    const buckets: Record<string, number> = {};

    const interval =
      timeRange === '1h' ? 10 : timeRange === '24h' ? 60 : 24 * 60;

    for (let i = 0; i < (timeRange === '1h' ? 6 : timeRange === '24h' ? 24 : 7); i++) {
      const time = new Date(now.getTime() - i * interval * 60 * 1000);
      const key = time.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });
      buckets[key] = 0;
    }

    alerts.forEach((alert) => {
      const alertTime = new Date(alert.timestamp);
      const time = alertTime.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });
      if (buckets[time] !== undefined) {
        buckets[time]++;
      }
    });

    return Object.entries(buckets).reverse();
  }, [alerts, timeRange]);

  const maxViolations = Math.max(...timelineData.map(([, count]) => count), 1);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold mb-4">Violation Timeline</h2>

      {timelineData.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No data</p>
      ) : (
        <div className="space-y-2">
          {timelineData.map(([time, count]) => (
            <div key={time} className="flex items-center gap-2">
              <span className="text-xs w-12 text-gray-600">{time}</span>
              <div className="flex-1 bg-gray-200 rounded h-6 relative overflow-hidden">
                {count > 0 && (
                  <div
                    className="bg-gradient-to-r from-yellow-400 to-red-500 h-full transition-all"
                    style={{ width: `${(count / maxViolations) * 100}%` }}
                  />
                )}
              </div>
              <span className="text-xs font-semibold w-8 text-right">{count}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
