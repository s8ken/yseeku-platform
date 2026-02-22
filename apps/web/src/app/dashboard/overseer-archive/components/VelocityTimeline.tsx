/**
 * VelocityTimeline Component
 * 
 * Displays drift velocity events timeline
 */

'use client'

import { DriftMetrics } from '@/lib/services/overseer'

interface VelocityTimelineProps {
  metrics: DriftMetrics
}

export function VelocityTimeline({ metrics }: VelocityTimelineProps) {
  const total = metrics.extreme + metrics.critical + metrics.moderate
  const extremePercent = ((metrics.extreme / total) * 100).toFixed(1)
  const criticalPercent = ((metrics.critical / total) * 100).toFixed(1)
  const moderatePercent = ((metrics.moderate / total) * 100).toFixed(1)

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Velocity Events (Drift Detection)</h3>
      
      <div className="space-y-4">
        {/* Extreme */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-100">
                <span className="w-3 h-3 bg-red-500 rounded-full"></span>
              </span>
              <span className="text-sm font-medium text-red-700">Extreme (velocity &gt; 0.8)</span>
            </div>
            <span className="text-sm font-bold text-gray-900">{metrics.extreme}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-red-600 h-3 rounded-full transition-all"
              style={{ width: `${extremePercent}%` }}
            />
          </div>
        </div>

        {/* Critical */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-orange-100">
                <span className="w-3 h-3 bg-orange-500 rounded-full"></span>
              </span>
              <span className="text-sm font-medium text-orange-700">Critical (0.6-0.8)</span>
            </div>
            <span className="text-sm font-bold text-gray-900">{metrics.critical}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-orange-500 h-3 rounded-full transition-all"
              style={{ width: `${criticalPercent}%` }}
            />
          </div>
        </div>

        {/* Moderate */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-yellow-100">
                <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
              </span>
              <span className="text-sm font-medium text-yellow-700">Moderate (0.4-0.6)</span>
            </div>
            <span className="text-sm font-bold text-gray-900">{metrics.moderate}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-yellow-500 h-3 rounded-full transition-all"
              style={{ width: `${moderatePercent}%` }}
            />
          </div>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="text-xs text-gray-600">
          <p className="mb-2"><strong>Total Drift Events:</strong> {total}</p>
          <p><strong>Event Rate:</strong> {((total / 486) * 100).toFixed(1)}% of conversations</p>
        </div>
      </div>
    </div>
  )
}
