/**
 * Overseer Live Dashboard Page
 * 
 * Real-time monitoring of trust receipts and comparison to archive baseline
 */

'use client'

import { useLiveMetrics } from '@/lib/hooks/useLiveMetrics'
import { useArchiveReport } from '@/lib/hooks/useArchiveReport'
import { calculateComparison } from '@/lib/services/overseer'
import { LiveTrustMetrics } from './components/LiveTrustMetrics'
import { RecentReceiptsStream } from './components/RecentReceiptsStream'

export default function OverseerLiveDashboard() {
  const { metrics: liveMetrics, connected, loading: liveLoading } = useLiveMetrics()
  const { data: archiveData, loading: archiveLoading } = useArchiveReport()

  const comparison = archiveData ? calculateComparison(archiveData, liveMetrics) : null

  if (liveLoading || archiveLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-gray-200 rounded w-1/3"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white">
        <div className="max-w-6xl mx-auto px-8 py-12">
          <div className="flex items-center justify-between mb-4">
            <span className="inline-flex items-center gap-2 px-3 py-1 bg-white bg-opacity-20 rounded-full text-sm font-medium">
              <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-300 animate-pulse' : 'bg-gray-400'}`}></span>
              {connected ? 'Connected' : 'Offline'}
            </span>
          </div>
          <h1 className="text-4xl font-bold mb-4">SONATE Overseer: Live Monitoring</h1>
          <p className="text-lg text-green-100 max-w-2xl">
            Real-time trust analysis and vulnerability detection across all active conversations
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-8 py-12">
        {/* Connection Status */}
        {!connected && (
          <div className="mb-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700">
            <span className="font-semibold">⚠️ Socket connection offline:</span> Live updates unavailable. 
            Showing cached metrics from backend.
          </div>
        )}

        {/* Stats Bar */}
        <div className="grid grid-cols-3 gap-4 mb-12">
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="text-3xl font-bold text-green-600 mb-1">
              {liveMetrics.length}
            </div>
            <span className="text-sm text-gray-600">Receipts Today</span>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="text-3xl font-bold text-blue-600 mb-1">
              {comparison ? comparison.liveTrustAvg.toFixed(1) : '—'}/10
            </div>
            <span className="text-sm text-gray-600">Avg Trust Score</span>
          </div>
          
          <div className={`bg-white rounded-lg shadow-sm p-6 border border-gray-200 ${comparison && comparison.improvement > 0 ? 'border-green-200' : ''}`}>
            <div className={`text-3xl font-bold mb-1 ${comparison && comparison.improvement > 0 ? 'text-green-600' : 'text-gray-400'}`}>
              {comparison ? (
                <>
                  {comparison.improvement > 0 ? '+' : ''}{comparison.improvement.toFixed(1)}%
                </>
              ) : '—'}
            </div>
            <span className="text-sm text-gray-600">vs Archive</span>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <LiveTrustMetrics metrics={liveMetrics} />
          <RecentReceiptsStream metrics={liveMetrics} />
        </div>

        {/* Comparison to Archive */}
        {comparison && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Live vs Archive Comparison</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Trust Scores */}
              <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-4">Trust Scores</h3>
                
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Archive Baseline</span>
                      <span className="text-lg font-bold text-gray-900">
                        {comparison.archiveTrustAvg.toFixed(2)}
                      </span>
                    </div>
                    <div className="w-full h-3 bg-gray-300 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500"
                        style={{ width: `${(comparison.archiveTrustAvg / 10) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Live Performance</span>
                      <span className="text-lg font-bold text-gray-900">
                        {comparison.liveTrustAvg.toFixed(2)}
                      </span>
                    </div>
                    <div className="w-full h-3 bg-gray-300 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${comparison.liveTrustAvg > comparison.archiveTrustAvg ? 'bg-green-500' : 'bg-orange-500'}`}
                        style={{ width: `${(comparison.liveTrustAvg / 10) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-blue-200">
                  <p className="text-sm text-gray-700">
                    {comparison.improvement > 0 ? (
                      <>
                        <span className="font-semibold text-green-700">✓ Improvement:</span> {' '}
                        Live conversations are {comparison.improvement.toFixed(1)}% more trustworthy
                      </>
                    ) : (
                      <>
                        <span className="text-orange-700">⚠️ Below baseline by {Math.abs(comparison.improvement).toFixed(1)}%</span>
                      </>
                    )}
                  </p>
                </div>
              </div>

              {/* Volume & Events */}
              <div className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-4">Volume & Velocity</h3>
                
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Receipts Generated</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {comparison.receiptCount}
                      <span className="text-sm text-gray-600 ml-2">(live)</span>
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      vs {Math.round((486 / 212) * (comparison.receiptCount || 1))} projected (archive pace)
                    </p>
                  </div>

                  <div className="pt-2 border-t border-purple-200">
                    <p className="text-xs text-gray-700">
                      <strong>Archive rate:</strong> ~2.3 conversations/day
                    </p>
                    <p className="text-xs text-gray-700 mt-1">
                      <strong>Live rate:</strong> {comparison.receiptCount ? `${Math.round(comparison.receiptCount / 1)} conversations/day` : 'Monitoring...'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Key Insights */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">What We're Monitoring</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border border-gray-200 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">📊 Trust Metrics</h3>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• Overall trust scores (0-10)</li>
                <li>• Principle compliance</li>
                <li>• Governance alignment</li>
              </ul>
            </div>

            <div className="p-4 border border-gray-200 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">🚨 Security Alerts</h3>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• API key detection</li>
                <li>• Credential leakage</li>
                <li>• Vulnerability disclosure</li>
              </ul>
            </div>

            <div className="p-4 border border-gray-200 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">🔄 Drift Detection</h3>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• Velocity anomalies</li>
                <li>• Model behavior shifts</li>
                <li>• Output consistency</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-8 border-t border-gray-200 text-center text-sm text-gray-600">
          <p>
            Last updated: {new Date().toLocaleTimeString()} UTC
          </p>
          <p className="mt-2 text-xs">
            This dashboard compares live performance against the archive baseline from {archiveData?.metadata.totalDocuments} conversations
          </p>
        </div>
      </div>
    </main>
  )
}
