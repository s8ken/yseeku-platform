/**
 * LiveTrustMetrics Component
 * 
 * Shows current aggregated metrics
 */

'use client'

import { LiveMetrics } from '@/lib/services/overseer'

interface LiveTrustMetricsProps {
  metrics: LiveMetrics[]
}

export function LiveTrustMetrics({ metrics }: LiveTrustMetricsProps) {
  if (metrics.length === 0) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Metrics</h3>
        <p className="text-gray-600">No live metrics available yet</p>
      </div>
    )
  }

  const avgTrust = metrics.reduce((sum, m) => sum + m.trustScore, 0) / metrics.length
  const lowTrustCount = metrics.filter(m => m.trustScore < 5).length
  const flaggedCount = metrics.filter(m => m.securityFlags.length > 0).length

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Current Metrics</h3>
      
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 bg-blue-50 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">
            {avgTrust.toFixed(1)}/10
          </div>
          <p className="text-xs text-gray-600 mt-1">Average Trust</p>
        </div>
        
        <div className="p-4 bg-yellow-50 rounded-lg">
          <div className="text-2xl font-bold text-yellow-600">
            {lowTrustCount}
          </div>
          <p className="text-xs text-gray-600 mt-1">Low Trust</p>
          <p className="text-xs text-gray-600">Last 24h</p>
        </div>
        
        <div className="p-4 bg-red-50 rounded-lg">
          <div className="text-2xl font-bold text-red-600">
            {flaggedCount}
          </div>
          <p className="text-xs text-gray-600 mt-1">With Alerts</p>
          <p className="text-xs text-gray-600">Last 24h</p>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-600">
          <strong>Total receipts:</strong> {metrics.length} in selected period
        </p>
      </div>
    </div>
  )
}
