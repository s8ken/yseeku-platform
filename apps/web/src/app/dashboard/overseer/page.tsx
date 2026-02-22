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
import { TrustScoreDistribution } from '../overseer-archive/components/TrustScoreDistribution'
import { VelocityTimeline } from '../overseer-archive/components/VelocityTimeline'
import { ThemeCloud } from '../overseer-archive/components/ThemeCloud'
import { SecurityFlagsDisplay } from '../overseer-archive/components/SecurityFlagsDisplay'
import { LiveTrustMetrics } from '../overseer-live/components/LiveTrustMetrics'
import { RecentReceiptsStream } from '../overseer-live/components/RecentReceiptsStream'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

type ActiveTab = 'archive' | 'live' | 'comparison'

export default function OverseerHub() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('archive')
  const { data: archiveData, loading: archiveLoading } = useArchiveReport()
  const { metrics: liveMetrics, connected, loading: liveLoading } = useLiveMetrics()
  
  const comparison = archiveData ? calculateComparison(archiveData, liveMetrics) : null

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Overseer Analytics</h1>
        <p className="mt-2 text-base text-muted-foreground">
          Retrospective validation + real-time monitoring across 486 conversations spanning 7 months
        </p>
      </div>

      {/* Status Badge */}
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-sm font-medium text-slate-700 dark:text-slate-300">
          <span className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
          {connected ? 'Live Connection Active' : 'Demo Mode (Archive Data)'}
        </span>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-border">
        <div className="flex gap-8">
          <button
            onClick={() => setActiveTab('archive')}
            className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'archive'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Archive Analytics
          </button>
          <button
            onClick={() => setActiveTab('live')}
            className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'live'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Live Metrics
          </button>
          <button
            onClick={() => setActiveTab('comparison')}
            className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'comparison'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Comparison
          </button>
        </div>
      </div>

      {/* Content */}
      {/* Archive Tab */}
      {activeTab === 'archive' && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Conversations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">486</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Drift Events</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {archiveData ? (archiveData.drift.extreme + archiveData.drift.critical + archiveData.drift.moderate) : '—'}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Security Flags</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {archiveData ? archiveData.security.total : '—'}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Avg Trust Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {archiveData ? archiveData.stats.trustScoreAvg.toFixed(1) : '—'}/10
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Visualizations */}
          {!archiveLoading && archiveData && (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <TrustScoreDistribution distribution={archiveData.trust} />
                <VelocityTimeline metrics={archiveData.drift} />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ThemeCloud themes={archiveData.themes} />
                <SecurityFlagsDisplay flags={archiveData.security} totalDocs={archiveData.metadata.totalDocuments} />
              </div>

              {/* Key Insights */}
              <Card>
                <CardHeader>
                  <CardTitle>Validation Insights</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="border-l-4 border-primary pl-4">
                      <h3 className="font-semibold mb-2">Framework Genesis</h3>
                      <p className="text-sm text-muted-foreground">
                        SYMBI principles emerged from conversations with you + 5 AI systems. Trust scoring logic evolved over 7 months of iterative discussion.
                      </p>
                    </div>
                    <div className="border-l-4 border-amber-500 pl-4">
                      <h3 className="font-semibold mb-2">Real-World Problems</h3>
                      <p className="text-sm text-muted-foreground">
                        370 conversations flagged security concerns. Drift events naturally occurred and were discussed. Solutions developed in conversation.
                      </p>
                    </div>
                    <div className="border-l-4 border-emerald-500 pl-4">
                      <h3 className="font-semibold mb-2">Self-Validation</h3>
                      <p className="text-sm text-muted-foreground">
                        v2.2 can now analyze the chats that created it. Framework proves it catches the issues you identified in the archives.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      )}

      {/* Live Tab */}
      {activeTab === 'live' && (
        <div className="space-y-6">
          {/* Connection Status */}
          {!connected && (
            <Card className="bg-warning/10 border-warning">
              <CardContent className="pt-6">
                <p className="text-sm"><span className="font-semibold">⚠️ Socket connection offline:</span> Live updates unavailable. Showing demo metrics.</p>
              </CardContent>
            </Card>
          )}

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Receipts Today</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{liveMetrics.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Avg Trust</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {liveMetrics.length > 0 
                    ? (liveMetrics.reduce((sum, m) => sum + m.trustScore, 0) / liveMetrics.length).toFixed(1)
                    : '—'
                  }/10
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">vs Archive</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-3xl font-bold ${comparison && comparison.improvement > 0 ? 'text-emerald-600' : 'text-muted-foreground'}`}>
                  {comparison ? `${comparison.improvement > 0 ? '+' : ''}${comparison.improvement.toFixed(1)}%` : '—'}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Live Components */}
          {!liveLoading && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <LiveTrustMetrics metrics={liveMetrics} />
                <RecentReceiptsStream metrics={liveMetrics} />
              </div>
            )}
        </div>
      )}

      {/* Comparison Tab */}
      {activeTab === 'comparison' && comparison && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Archive vs Live Performance</CardTitle>
              <CardDescription>Comparing 486 historical conversations with today's receipts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Trust Comparison */}
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold mb-4">Trust Scores</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm font-medium text-muted-foreground">Archive (486 docs)</span>
                          <span className="text-lg font-bold">
                            {comparison.archiveTrustAvg.toFixed(2)}
                          </span>
                        </div>
                        <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary"
                            style={{ width: `${(comparison.archiveTrustAvg / 10) * 100}%` }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">Baseline from symbi-archives</p>
                      </div>

                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm font-medium text-muted-foreground">Live (today)</span>
                          <span className="text-lg font-bold">
                            {comparison.liveTrustAvg.toFixed(2)}
                          </span>
                        </div>
                        <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${comparison.liveTrustAvg > comparison.archiveTrustAvg ? 'bg-emerald-500' : 'bg-amber-500'}`}
                            style={{ width: `${(comparison.liveTrustAvg / 10) * 100}%` }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">{comparison.receiptCount} receipts generated</p>
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t">
                      <p className="text-sm">
                        {comparison.improvement > 0 ? (
                          <> <span className="font-semibold text-emerald-600">✓ Improvement:</span> {' '}
                          Live conversations are {comparison.improvement.toFixed(1)}% more trustworthy</>
                        ) : (
                          <><span className="text-amber-600">⚠️ Below baseline by {Math.abs(comparison.improvement).toFixed(1)}%</span></>
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Volume & Velocity */}
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold mb-4">Scale & Velocity</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-2">Dataset Size</p>
                        <div className="flex items-baseline gap-2">
                          <span className="text-3xl font-bold">486</span>
                          <span className="text-muted-foreground">conversations analyzed</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          2.3GB across 10,149 chunks (June 2025 → Feb 2026)
                        </p>
                      </div>

                      <div className="pt-4 border-t">
                        <p className="text-sm font-medium text-muted-foreground mb-2">Consumption Rate</p>
                        <div className="space-y-1 text-xs text-muted-foreground">
                          <p><strong>Archive pace:</strong> ~2.3 conversations/day</p>
                          <p><strong>Archive total:</strong> 486 over 212 days</p>
                          <p><strong>Live receipts:</strong> {comparison.receiptCount} today</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Data Sources */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Data Sources</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border">
                  <h3 className="font-semibold mb-2">Archive: symbi-archives</h3>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• 486 conversations</li>
                    <li>• 2.3GB total</li>
                    <li>• 10,149 chunks</li>
                    <li>• 7-month timeline</li>
                  </ul>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border">
                  <h3 className="font-semibold mb-2">Live: Real-time Receipts</h3>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Ed25519 signed</li>
                    <li>• RFC 8785 canonicalized</li>
                    <li>• Trust receipts stored</li>
                    <li>• 7 industry weight policies</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Footer */}
      <div className="mt-12 pt-8 border-t text-center text-sm text-muted-foreground">
        <p>
          SONATE v2.2 · Overseer System · Full-Scale Validation
        </p>
        <p className="mt-2 text-xs">
          This dashboard compares live performance against the complete archive baseline from 486 conversations spanning the platform's evolution
        </p>
      </div>
    </div>  )
}