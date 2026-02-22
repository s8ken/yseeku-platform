/**
 * SecurityFlagsDisplay Component
 * 
 * Shows security flags detected in archive analysis
 */

'use client'

import { SecurityFlags } from '@/lib/services/overseer'

interface SecurityFlagsDisplayProps {
  flags: SecurityFlags
  totalDocs: number
}

export function SecurityFlagsDisplay({ flags, totalDocs }: SecurityFlagsDisplayProps) {
  const flagPercent = ((flags.total / totalDocs) * 100).toFixed(1)
  
  // Sort systems by count
  const systems = Object.entries(flags.bySystem)
    .sort(([, a], [, b]) => b - a)
    .filter(([, count]) => count > 0)

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Security Flags Detected</h3>
      
      <div className="space-y-4">
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-lg font-bold text-red-700">{flags.total} flags</span>
            <span className="text-sm text-red-700 font-semibold">{flagPercent}% of conversations</span>
          </div>
          <div className="w-full bg-red-200 rounded-full h-3">
            <div
              className="bg-red-600 h-3 rounded-full transition-all"
              style={{ width: `${flagPercent}%` }}
            />
          </div>
        </div>

        <div className="mt-6">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">By AI System</h4>
          <div className="space-y-2">
            {systems.map(([system, count]) => (
              <div key={system} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span className="text-sm font-medium text-gray-700 capitalize">
                    {system === 'gpt4' ? 'GPT-4' : system === 'misc' ? 'Other' : system}
                  </span>
                </div>
                <span className="text-sm font-bold text-gray-900">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="text-xs text-gray-600">
          <p className="mb-1"><strong>Keywords flagged:</strong></p>
          <p className="text-gray-500">API keys, credentials, breaches, vulnerabilities, model drift indicators</p>
        </div>
      </div>
    </div>
  )
}
