/**
 * Unified Overseer Dashboard Hub
 * 
 * Combines archive analysis (486 conversations) with live monitoring
 * Provides tabs for retrospective, real-time, and comparative views
 */

'use client'

import { useState } from 'react'
import { useArchiveReport } from '@/lib/hooks/useArchiveReport'
import { useLiveMetrics } from '@/lib/hooks/useLiveMetrics'
import { calculateComparison } from '@/lib/services/overseer'
import { TrustScoreDistribution } from './overseer-archive/components/TrustScoreDistribution'
import { VelocityTimeline } from './overseer-archive/components/VelocityTimeline'
import { ThemeCloud } from './overseer-archive/components/ThemeCloud'
import { SecurityFlagsDisplay } from './overseer-archive/components/SecurityFlagsDisplay'
import { LiveTrustMetrics } from './overseer-live/components/LiveTrustMetrics'
import { RecentReceiptsStream } from './overseer-live/components/RecentReceiptsStream'

type ActiveTab = 'archive' | 'live' | 'comparison'

export default function OverseerHub() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('archive')
  const { data: archiveData, loading: archiveLoading } = useArchiveReport()
  const { metrics: liveMetrics, connected, loading: liveLoading } = useLiveMetrics()
  
  const comparison = archiveData ? calculateComparison(archiveData, liveMetrics) : null

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white">
        <div className="max-w-7xl mx-auto px-8 py-12">
          <div className="mb-8">
            <span className="inline-flex items-center gap-2 px-3 py-1 bg-white bg-opacity-20 rounded-full text-sm font-medium">
              <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
              SONATE Overseer v2.2
            </span>
          </div>
          <h1 className="text-4xl font-bold mb-4">Full-Scale AI Governance Platform</h1>
          <p className="text-lg text-blue-100 max-w-3xl">
            Retrospective validation + real-time monitoring across 486 conversations spanning 7 months of platform development
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-8">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab('archive')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'archive'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              📊 Archive Analysis (486 conversations)
            </button>
            <button
              onClick={() => setActiveTab('live')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'live'
                  ? 'border-green-600 text-green-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              🟢 Live Monitoring
            </button>
            <button
              onClick={() => setActiveTab('comparison')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'comparison'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              📈 Comparison
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-8 py-12">
        {/* Archive Tab */}
        {activeTab === 'archive' && (
          <div className="space-y-12">
            {/* Stats Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <div className="text-3xl font-bold text-blue-600 mb-1">486</div>
                <span className="text-sm text-gray-600">Total Conversations</span>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <div className="text-3xl font-bold text-purple-600 mb-1">
                  {archiveData ? (archiveData.drift.extreme + archiveData.drift.critical + archiveData.drift.moderate) : '—'}
                </div>
                <span className="text-sm text-gray-600">Drift Events</span>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <div className="text-3xl font-bold text-red-600 mb-1">
                  {archiveData ? archiveData.security.total : '—'}
                </div>
                <span className="text-sm text-gray-600">Security Flags</span>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <div className="text-3xl font-bold text-green-600 mb-1">
                  {archiveData ? archiveData.stats.trustScoreAvg.toFixed(1) : '—'}/10
                </div>
                <span className="text-sm text-gray-600">Avg Trust Score</span>
              </div>
            </div>

            {/* Visualizations */}
            {!archiveLoading && archiveData && (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <TrustScoreDistribution distribution={archiveData.trust} />
                  <VelocityTimeline metrics={archiveData.drift} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <ThemeCloud themes={archiveData.themes} />
                  <SecurityFlagsDisplay flags={archiveData.security} totalDocs={archiveData.metadata.totalDocuments} />
                </div>

                {/* Key Insights */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Validation Insights</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="border-l-4 border-blue-500 pl-4">
                      <h3 className="font-semibold text-gray-900 mb-2">Framework Genesis</h3>
                      <p className="text-gray-700 text-sm">
                        SYMBI principles emerged from conversations with you + 5 AI systems. Trust scoring logic evolved over 7 months of iterative discussion.
                      </p>
                    </div>
                    <div className="border-l-4 border-orange-500 pl-4">
                      <h3 className="font-semibold text-gray-900 mb-2">Real-World Problems</h3>
                      <p className="text-gray-700 text-sm">
                        370 conversations flagged security concerns. Drift events naturally occurred and were discussed. Solutions developed in conversation.
                      </p>
                    </div>
                    <div className="border-l-4 border-green-500 pl-4">
                      <h3 className="font-semibold text-gray-900 mb-2">Self-Validation</h3>
                      <p className="text-gray-700 text-sm">
                        v2.2 can now analyze the chats that created it. Framework proves it catches the issues you identified in the archives.
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Live Tab */}
        {activeTab === 'live' && (
          <div className="space-y-12">
            {/* Connection Status */}
            {!connected && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700">
                <span className="font-semibold">⚠️ Socket connection offline:</span> Live updates unavailable. Showing cached metrics.
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <div className="text-3xl font-bold text-green-600 mb-1">
                  {liveMetrics.length}
                </div>
                <span className="text-sm text-gray-600">Receipts Today</span>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <div className="text-3xl font-bold text-blue-600 mb-1">
                  {liveMetrics.length > 0 
                    ? (liveMetrics.reduce((sum, m) => sum + m.trustScore, 0) / liveMetrics.length).toFixed(1)
                    : '—'
                  }/10
                </div>
                <span className="text-sm text-gray-600">Avg Trust</span>
              </div>
              <div className={`bg-white rounded-lg shadow-sm p-6 border border-gray-200 ${comparison && comparison.improvement > 0 ? 'border-green-200' : ''}`}>
                <div className={`text-3xl font-bold mb-1 ${comparison && comparison.improvement > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                  {comparison ? `${comparison.improvement > 0 ? '+' : ''}${comparison.improvement.toFixed(1)}%` : '—'}
                </div>
                <span className="text-sm text-gray-600">vs Archive</span>
              </div>
            </div>

            {/* Live Components */}
            {!liveLoading && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <LiveTrustMetrics metrics={liveMetrics} />
                <RecentReceiptsStream metrics={liveMetrics} />
              </div>
            )}
          </div>
        )}

        {/* Comparison Tab */}
        {activeTab === 'comparison' && comparison && (
          <div className="space-y-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Archive vs Live Performance</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Trust Comparison */}
                <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-4">Trust Scores</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Archive (486 docs)</span>
                        <span className="text-lg font-bold text-gray-900">
                          {comparison.archiveTrustAvg.toFixed(2)}
                        </span>
                      </div>
                      <div className="w-full h-4 bg-gray-300 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500"
                          style={{ width: `${(comparison.archiveTrustAvg / 10) * 100}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-600 mt-2">Baseline from symbi-archives analysis</p>
                    </div>

                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Live (today)</span>
                        <span className="text-lg font-bold text-gray-900">
                          {comparison.liveTrustAvg.toFixed(2)}
                        </span>
                      </div>
                      <div className="w-full h-4 bg-gray-300 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${comparison.liveTrustAvg > comparison.archiveTrustAvg ? 'bg-green-500' : 'bg-orange-500'}`}
                          style={{ width: `${(comparison.liveTrustAvg / 10) * 100}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-600 mt-2">{comparison.receiptCount} receipts generated</p>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-blue-200">
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

                {/* Volume & Velocity */}
                <div className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-4">Scale & Velocity</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Dataset Size</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-gray-900">486</span>
                        <span className="text-gray-600">conversations analyzed</span>
                      </div>
                      <p className="text-xs text-gray-600 mt-2">
                        2.3GB across 10,149 chunks (June 2025 → Feb 2026)
                      </p>
                    </div>

                    <div className="pt-4 border-t border-purple-200">
                      <p className="text-sm font-medium text-gray-700 mb-2">Consumption Rate</p>
                      <div className="space-y-1 text-xs text-gray-700">
                        <p><strong>Archive pace:</strong> ~2.3 conversations/day</p>
                        <p><strong>Archive total:</strong> 486 over 212 days</p>
                        <p><strong>Live receipts:</strong> {comparison.receiptCount} today</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Data Sources */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Data Sources</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h3 className="font-semibold text-gray-900 mb-2">Archive: symbi-archives</h3>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• 486 conversations</li>
                    <li>• 2.3GB total</li>
                    <li>• 10,149 chunks</li>
                    <li>• 7-month timeline</li>
                  </ul>
                </div>

                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <h3 className="font-semibold text-gray-900 mb-2">Live: Real-time Receipts</h3>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• Ed25519 signed</li>
                    <li>• RFC 8785 canonicalized</li>
                    <li>• Trust receipts stored</li>
                    <li>• 7 industry weight policies</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-gray-200 text-center text-sm text-gray-600">
          <p>
            SONATE v2.2 · Overseer System · Full-Scale Validation
          </p>
          <p className="mt-2 text-xs">
            This dashboard compares live performance against the complete archive baseline from 486 conversations spanning the platform's evolution
          </p>
        </div>
      </div>
    </main>
  )
}
