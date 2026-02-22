/**
 * ThemeCloud Component
 * 
 * Displays top themes from archive analysis as word cloud
 */

'use client'

import { Theme } from '@/lib/services/overseer'

interface ThemeCloudProps {
  themes: Theme[]
}

export function ThemeCloud({ themes }: ThemeCloudProps) {
  // Normalize sizes for visual display
  const minCount = Math.min(...themes.map(t => t.count))
  const maxCount = Math.max(...themes.map(t => t.count))
  
  const getSize = (count: number) => {
    if (maxCount === minCount) return 'text-base'
    const normalized = (count - minCount) / (maxCount - minCount)
    if (normalized > 0.8) return 'text-2xl'
    if (normalized > 0.6) return 'text-xl'
    if (normalized > 0.4) return 'text-lg'
    if (normalized > 0.2) return 'text-base'
    return 'text-sm'
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Themes in Archives</h3>
      
      <div className="flex flex-wrap gap-3 justify-center">
        {themes.map((theme) => (
          <div
            key={theme.name}
            className={`px-4 py-2 rounded-full bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 hover:border-blue-400 transition-colors cursor-default group`}
          >
            <span className={`font-semibold text-blue-700 group-hover:text-blue-900 transition-colors ${getSize(theme.count)}`}>
              [{theme.name}]
            </span>
            <span className="text-xs text-gray-600 ml-2">
              {(theme.count / 1000).toFixed(1)}k
            </span>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="text-xs text-gray-600 text-center">
          <p><strong>Total themes analyzed:</strong> 1,200+ unique terms</p>
          <p className="text-xs mt-1">Showing top 15 by mention frequency</p>
        </div>
      </div>
    </div>
  )
}
