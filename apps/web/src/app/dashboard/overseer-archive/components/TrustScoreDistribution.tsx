/**
 * TrustScoreDistribution Component
 * 
 * Displays pie chart of trust score distribution from archive analysis
 */

'use client'

import { TrustDistribution } from '@/lib/services/overseer'

interface TrustScoreDistributionProps {
  distribution: TrustDistribution
}

export function TrustScoreDistribution({ distribution }: TrustScoreDistributionProps) {
  const total = distribution.high + distribution.medium + distribution.low
  const highPercent = ((distribution.high / total) * 100).toFixed(1)
  const mediumPercent = ((distribution.medium / total) * 100).toFixed(1)
  const lowPercent = ((distribution.low / total) * 100).toFixed(1)

  // Create simple ASCII pie chart
  const highBars = Math.round((distribution.high / total) * 20)
  const mediumBars = Math.round((distribution.medium / total) * 20)

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Trust Score Distribution</h3>
      
      <div className="space-y-4">
        {/* High Trust */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-green-600">High (8-10)</span>
            <span className="text-sm font-bold text-gray-900">
              {distribution.high} ({highPercent}%)
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-green-500 h-3 rounded-full transition-all"
              style={{ width: `${highPercent}%` }}
            />
          </div>
        </div>

        {/* Medium Trust */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-yellow-600">Medium (5-8)</span>
            <span className="text-sm font-bold text-gray-900">
              {distribution.medium} ({mediumPercent}%)
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-yellow-500 h-3 rounded-full transition-all"
              style={{ width: `${mediumPercent}%` }}
            />
          </div>
        </div>

        {/* Low Trust */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-red-600">Low (&lt;5)</span>
            <span className="text-sm font-bold text-gray-900">
              {distribution.low} ({lowPercent}%)
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-red-500 h-3 rounded-full transition-all"
              style={{ width: `${lowPercent}%` }}
            />
          </div>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="text-xs text-gray-600">
          <p className="mb-2"><strong>Total Evaluated:</strong> {total} conversations</p>
          <p><strong>Average Score:</strong> {((distribution.high * 9 + distribution.medium * 6.5 + distribution.low * 3) / total).toFixed(2)}/10</p>
        </div>
      </div>
    </div>
  )
}
