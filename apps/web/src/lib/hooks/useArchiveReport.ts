/**
 * useArchiveReport Hook
 * 
 * Fetches and manages overseer archive analysis data
 */

'use client'

import { useEffect, useState } from 'react'
import { ArchiveReport, fetchArchiveReport } from '@/lib/services/overseer'

export function useArchiveReport() {
  const [data, setData] = useState<ArchiveReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    fetchArchiveReport()
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false))
  }, [])

  return { data, loading, error }
}
