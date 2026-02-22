/**
 * RecentReceiptsStream Component
 * 
 * Shows recent trust receipts in real-time
 */

'use client'

import { LiveMetrics } from '@/lib/services/overseer'

interface RecentReceiptsStreamProps {
  metrics: LiveMetrics[]
}

export function RecentReceiptsStream({ metrics }: RecentReceiptsStreamProps) {
  const recent = metrics.slice(0, 10)

  if (recent.length === 0) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Receipts</h3>
        <p className="text-gray-600">No receipts yet</p>
      </div>
    )
  }

  const getTrustColor = (score: number) => {
    if (score >= 8) return 'text-green-600 bg-green-50'
    if (score >= 6) return 'text-yellow-600 bg-yellow-50'
    return 'text-red-600 bg-red-50'
  }

  const getSourceIcon = (source: string) => {
    const lower = source.toLowerCase()
    if (lower.includes('claude')) return '🚀'
    if (lower.includes('gpt')) return '⚡'
    if (lower.includes('grok')) return '🎯'
    return '📊'
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Receipts</h3>
      
      <div className="space-y-3">
        {recent.map((metric, idx) => (
          <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <div className="flex items-center gap-3">
              <span className="text-lg">{getSourceIcon(metric.source)}</span>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {metric.source}
                </p>
                <p className="text-xs text-gray-600">
                  {new Date(metric.timestamp).toLocaleTimeString()}
                </p>
              </div>
            </div>
            
            <div className="text-right">
              <div className={`text-lg font-bold px-3 py-1 rounded ${getTrustColor(metric.trustScore)}`}>
                {metric.trustScore.toFixed(1)}
              </div>
              {metric.securityFlags.length > 0 && (
                <p className="text-xs text-red-600 mt-1">
                  {metric.securityFlags.length} flag{metric.securityFlags.length !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
