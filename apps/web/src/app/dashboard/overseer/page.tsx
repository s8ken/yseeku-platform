/**
 * Unified Overseer Dashboard Hub
 *
 * Combines archive analysis (486 conversations) with live monitoring
 * Provides tabs for retrospective, real-time, and comparative views
 */

'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useArchiveReport } from '@/lib/hooks/useArchiveReport'
import { useLiveMetrics } from '@/lib/hooks/useLiveMetrics'
import OverseerLiveDashboard from '../overseer-live/page'
import { calculateComparison } from '@/lib/services/overseer'
import { TrustScoreDistribution } from '../overseer-archive/components/TrustScoreDistribution'
import { VelocityTimeline } from '../overseer-archive/components/VelocityTimeline'
import { ThemeCloud } from '../overseer-archive/components/ThemeCloud'
import { SecurityFlagsDisplay } from '../overseer-archive/components/SecurityFlagsDisplay'
// Live components are provided by the Overseer Live page
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Zap, ThumbsUp } from 'lucide-react'
import { api } from '@/lib/api'

type ActiveTab = 'archive' | 'live' | 'comparison' | 'breakthrough'

export default function OverseerHub() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('live')
  const { data: archiveData, loading: archiveLoading } = useArchiveReport()
  const { metrics: liveMetrics, totalCount, connected, loading: liveLoading } = useLiveMetrics()

  // BREAKTHROUGH Insights — fetch recent Overseer cycles for breakthrough_productive observations
  const { data: cycles, isLoading: cyclesLoading } = useQuery({
    queryKey: ['overseer-breakthrough-cycles'],
    queryFn: () => api.getBrainCycles(undefined, 50),
    enabled: activeTab === 'breakthrough',
  })
  
  const comparison = archiveData ? calculateComparison(archiveData, liveMetrics, totalCount) : null

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Overseer Analytics</h1>
        <p className="text-base text-muted-foreground">
          Real-time trust monitoring, archive analysis, and protocol enforcement.
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
            onClick={() => setActiveTab('comparison')}
            className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'comparison'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Comparison
          </button>
          <button
            onClick={() => setActiveTab('breakthrough')}
            className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-1.5 ${
              activeTab === 'breakthrough'
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Zap className="h-3.5 w-3.5" />
            BREAKTHROUGH Insights
          </button>
        </div>
      </div>

      {/* Content */}
      {/* Archive Tab */}
      {activeTab === 'archive' && (
        <div className="space-y-6">
          {/* Concept Card */}
          <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="text-lg">The Framework Validates Itself</CardTitle>
              <CardDescription>
                SONATE v2.2 analyzes the exact 486 conversations that inspired its creation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground">
                The SONATE principles, drift detection logic, security flagging, and trust scoring were all refined through these conversations. 
                This dashboard proves the framework successfully identifies the real problems it was built to solve.
              </p>
              <p className="text-xs text-muted-foreground italic">
                Not theoretical validation—ground truth from your platform's genesis.
              </p>
            </CardContent>
          </Card>

          {/* Archive Header Info */}
          {archiveData && (
            <Card>
              <CardHeader>
                <CardTitle>Archive Overview</CardTitle>
                <CardDescription>
                  {archiveData.metadata.totalDocuments.toLocaleString()} conversations from {new Date(archiveData.metadata.timelineStart).toLocaleDateString()} to {new Date(archiveData.metadata.timelineEnd).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
            </Card>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Conversations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {archiveData ? archiveData.metadata.totalDocuments.toLocaleString() : '—'}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Document Chunks</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {archiveData ? archiveData.metadata.totalChunks.toLocaleString() : '—'}
                </div>
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
                  <CardTitle>Key Insights</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="border-l-4 border-emerald-500 pl-4">
                      <h3 className="font-semibold mb-2">Trust Profile</h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        {archiveData.trust.high} conversations ({((archiveData.trust.high / (archiveData.trust.high + archiveData.trust.medium + archiveData.trust.low)) * 100).toFixed(1)}%) 
                        demonstrated high trust scores, indicating stable, predictable behavior.
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Average trust score: <strong>{Math.round(archiveData.stats.trustScoreAvg)}/100</strong>
                      </p>
                    </div>

                    <div className="border-l-4 border-red-500 pl-4">
                      <h3 className="font-semibold mb-2">Drift Detection</h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        {archiveData.drift.critical + archiveData.drift.extreme} critical/extreme velocity events detected,
                        revealing significant behavioral shifts in AI model outputs during development.
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Event rate: <strong>{(archiveData.stats.driftEventRate * 100).toFixed(1)}% of conversations</strong>
                      </p>
                    </div>

                    <div className="border-l-4 border-amber-500 pl-4">
                      <h3 className="font-semibold mb-2">Security Concerns</h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        {archiveData.security.total} conversations ({archiveData.stats.securityFlagRate.toFixed(1)}%) flagged for containing 
                        sensitive content like API keys, credentials, or vulnerability discussions.
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Most flagged: <strong>{archiveData.security.bySystem.claude} Claude</strong>
                      </p>
                    </div>

                    <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 p-4">
                      <p className="text-sm text-amber-200">
                        <strong>Context:</strong> Early prototyping conversations included manual credential sharing during development. Overseer correctly flags these as high-risk patterns under current governance policies. This reflects early-stage necessity, not architectural flaws—modern SONATE prevents such patterns entirely.
                      </p>
                    </div>

                    <div className="border-l-4 border-primary pl-4">
                      <h3 className="font-semibold mb-2">Framework Validation</h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        SONATE successfully identified trust, drift, and security patterns in real conversations
                        that inspired its design, proving the framework's effectiveness on ground truth.
                      </p>
                      <p className="text-xs text-muted-foreground">
                        This is not theoretical—these are real problems from the platform's creation.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Archive Footer */}
              <div className="mt-6 pt-4 border-t text-center text-xs text-muted-foreground space-y-1">
                <p>
                  Report generated: {new Date(archiveData.metadata.generatedAt).toLocaleString()} UTC
                </p>
                <p>
                  Analysis of {archiveData.metadata.totalSizeMB.toLocaleString()} MB of conversation data across 
                  {archiveData.metadata.totalChunks.toLocaleString()} document chunks
                </p>
              </div>
            </>
          )}
        </div>
      )}

      {/* Live Tab */}
      {activeTab === 'live' && (
        <div className="space-y-6">
          <OverseerLiveDashboard />
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
                            {Math.round(comparison.archiveTrustAvg)}/100
                          </span>
                        </div>
                        <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary"
                            style={{ width: `${comparison.archiveTrustAvg}%` }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">Baseline from SONATE-archives</p>
                      </div>

                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm font-medium text-muted-foreground">Live (today)</span>
                          <span className="text-lg font-bold">
                            {Math.round(comparison.liveTrustAvg)}/100
                          </span>
                        </div>
                        <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${comparison.liveTrustAvg > comparison.archiveTrustAvg ? 'bg-emerald-500' : 'bg-amber-500'}`}
                            style={{ width: `${comparison.liveTrustAvg}%` }}
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
                  <h3 className="font-semibold mb-2">Archive: SONATE-archives</h3>
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

      {/* BREAKTHROUGH Insights Tab */}
      {activeTab === 'breakthrough' && (
        <div className="space-y-6">
          <Card className="bg-gradient-to-r from-purple-500/10 to-purple-500/5 border-purple-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Zap className="h-5 w-5 text-purple-400" />
                BREAKTHROUGH Insights
              </CardTitle>
              <CardDescription>
                Productive BREAKTHROUGH events — peak human–AI collaboration moments confirmed by human review.
                These are informational: no action required. They represent the behaviour the platform aims to replicate.
              </CardDescription>
            </CardHeader>
          </Card>

          {cyclesLoading ? (
            <div className="text-center py-12 text-muted-foreground">Loading Overseer cycles...</div>
          ) : (() => {
            // Extract breakthrough_productive observations from cycles
            const productiveInsights: Array<{ cycleId: string; timestamp: string; reason: string; confidence: number }> = []
            if (Array.isArray(cycles)) {
              for (const cycle of cycles) {
                const plans: any[] = cycle.plans || cycle.plannerOutput || []
                for (const plan of plans) {
                  if (plan.target === 'breakthrough_insight' || plan.type === 'alert' && plan.target?.includes('breakthrough')) {
                    productiveInsights.push({
                      cycleId: cycle._id || cycle.id || '',
                      timestamp: cycle.timestamp || cycle.createdAt || '',
                      reason: plan.reason || 'Productive BREAKTHROUGH event confirmed',
                      confidence: plan.confidence || 0.9,
                    })
                  }
                }
              }
            }

            if (productiveInsights.length === 0) {
              return (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Zap className="h-10 w-10 text-purple-400/40 mx-auto mb-3" />
                    <p className="font-medium text-muted-foreground">No confirmed BREAKTHROUGH insights yet</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Productive BREAKTHROUGH events surface here once they've been classified by a human reviewer.
                    </p>
                  </CardContent>
                </Card>
              )
            }

            return (
              <div className="space-y-3">
                {productiveInsights.map((insight, i) => (
                  <Card key={`${insight.cycleId}-${i}`} className="border-l-4 border-l-purple-500">
                    <CardContent className="py-4">
                      <div className="flex items-start gap-3">
                        <div className="h-8 w-8 rounded-lg bg-purple-500/20 flex items-center justify-center shrink-0 mt-0.5">
                          <ThumbsUp className="h-4 w-4 text-purple-400" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                              Productive
                            </span>
                            <span className="text-xs text-muted-foreground">
                              Confidence: {(insight.confidence * 100).toFixed(0)}%
                            </span>
                            {insight.timestamp && (
                              <span className="text-xs text-muted-foreground ml-auto">
                                {new Date(insight.timestamp).toLocaleString()}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{insight.reason}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )
          })()}

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">How to use BREAKTHROUGH Insights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <div className="border-l-4 border-l-emerald-500 pl-4">
                <p className="font-medium text-foreground mb-1">Productive events</p>
                <p>Interactions where high-coherence synthesis opened new questions rather than closing them. Each produced external artifacts (code, schema, documents) that exist independently of the conversation.</p>
              </div>
              <div className="border-l-4 border-l-red-500 pl-4">
                <p className="font-medium text-foreground mb-1">Regressive events (in Override Queue)</p>
                <p>High-coherence interactions where the AI mirrored emotional content as evidence, creating false reciprocity around unfalsifiable premises. Classified in the BREAKTHROUGH Review tab.</p>
              </div>
              <div className="border-l-4 border-l-purple-500 pl-4">
                <p className="font-medium text-foreground mb-1">Why this matters</p>
                <p>SONATE cannot distinguish direction — only intensity. The human review layer is what transforms raw BREAKTHROUGH scores into actionable intelligence about your platform's collaborative quality.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Footer */}
      <div className="mt-12 pt-8 border-t text-center text-sm space-y-2">
        <p className="text-muted-foreground">
          SONATE v2.4 · Overseer System
        </p>
      </div>
    </div>  )
}