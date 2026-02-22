/**
 * Overseer Archive Dashboard Page
 * 
 * Displays retrospective analysis of what SONATE would have caught
 * in 486 conversations across 7 months of platform development
 */

'use client'

import { useArchiveReport } from '@/lib/hooks/useArchiveReport'
import { TrustScoreDistribution } from './components/TrustScoreDistribution'
import { VelocityTimeline } from './components/VelocityTimeline'
import { ThemeCloud } from './components/ThemeCloud'
import { SecurityFlagsDisplay } from './components/SecurityFlagsDisplay'

export default function OverseerArchiveDashboard() {
  const { data, loading, error } = useArchiveReport()

  if (loading) {
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

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            Failed to load archive data. Please refresh the page.
          </div>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-6xl mx-auto px-8 py-12">
          <div className="mb-4">
            <span className="inline-flex items-center gap-2 px-3 py-1 bg-white bg-opacity-20 rounded-full text-sm font-medium">
              <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
              Overseer Archive Analysis
            </span>
          </div>
          <h1 className="text-4xl font-bold mb-4">What SONATE Would Have Caught</h1>
          <p className="text-lg text-blue-100 max-w-2xl">
            Retrospective validation of the SYMBI framework against {data.metadata.totalDocuments.toLocaleString()} conversations spanning 
            {' '}{new Date(data.metadata.timelineStart).toLocaleDateString()} to {new Date(data.metadata.timelineEnd).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-8 py-12">
        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="text-3xl font-bold text-blue-600 mb-1">
              {data.metadata.totalDocuments.toLocaleString()}
            </div>
            <span className="text-sm text-gray-600">Conversations Analyzed</span>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="text-3xl font-bold text-purple-600 mb-1">
              {data.metadata.totalChunks.toLocaleString()}
            </div>
            <span className="text-sm text-gray-600">Document Chunks</span>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="text-3xl font-bold text-red-600 mb-1">
              {data.drift.extreme + data.drift.critical + data.drift.moderate}
            </div>
            <span className="text-sm text-gray-600">Drift Events</span>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="text-3xl font-bold text-orange-600 mb-1">
              {data.security.total}
            </div>
            <span className="text-sm text-gray-600">Security Flags</span>
          </div>
        </div>

        {/* Main Visualizations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <TrustScoreDistribution distribution={data.trust} />
          <VelocityTimeline metrics={data.drift} />
        </div>

        {/* Secondary Visualizations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <ThemeCloud themes={data.themes} />
          <SecurityFlagsDisplay flags={data.security} totalDocs={data.metadata.totalDocuments} />
        </div>

        {/* Key Insights */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Key Insights</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border-l-4 border-green-500 pl-4">
              <h3 className="font-semibold text-gray-900 mb-2">Trust Profile</h3>
              <p className="text-gray-700 text-sm mb-3">
                {data.trust.high} conversations ({((data.trust.high / (data.trust.high + data.trust.medium + data.trust.low)) * 100).toFixed(1)}%) 
                demonstrated high trust scores, indicating stable, predictable behavior.
              </p>
              <p className="text-gray-600 text-xs">
                Average trust score: <strong>{data.stats.trustScoreAvg.toFixed(2)}/10</strong>
              </p>
            </div>

            <div className="border-l-4 border-red-500 pl-4">
              <h3 className="font-semibold text-gray-900 mb-2">Drift Detection</h3>
              <p className="text-gray-700 text-sm mb-3">
                {data.drift.critical + data.drift.extreme} critical/extreme velocity events detected,
                revealing significant behavioral shifts in AI model outputs during development.
              </p>
              <p className="text-gray-600 text-xs">
                Event rate: <strong>{(data.stats.driftEventRate * 100).toFixed(1)}% of conversations</strong>
              </p>
            </div>

            <div className="border-l-4 border-orange-500 pl-4">
              <h3 className="font-semibold text-gray-900 mb-2">Security Concerns</h3>
              <p className="text-gray-700 text-sm mb-3">
                {data.security.total} conversations ({data.stats.securityFlagRate.toFixed(1)}%) flagged for containing 
                sensitive content like API keys, credentials, or vulnerability discussions.
              </p>
              <p className="text-gray-600 text-xs">
                Most flagged: <strong>{data.security.bySystem.claude} Claude conversations</strong>
              </p>
            </div>

            <div className="border-l-4 border-blue-500 pl-4">
              <h3 className="font-semibold text-gray-900 mb-2">Framework Validation</h3>
              <p className="text-gray-700 text-sm mb-3">
                SONATE successfully identified trust, drift, and security patterns in real conversations
                that inspired its design, proving the framework's effectiveness on ground truth.
              </p>
              <p className="text-gray-600 text-xs">
                This is not theoretical—these are real problems from the platform's creation.
              </p>
            </div>
          </div>
        </div>

        {/* Metadata Footer */}
        <div className="mt-8 pt-8 border-t border-gray-200 text-center text-sm text-gray-600">
          <p>
            Report generated: {new Date(data.metadata.generatedAt).toLocaleString()} UTC
          </p>
          <p className="mt-2 text-xs">
            Analysis of {data.metadata.totalSizeMB.toLocaleString()} MB of conversation data across 
            {data.metadata.totalChunks.toLocaleString()} document chunks
          </p>
        </div>
      </div>
    </main>
  )
}
