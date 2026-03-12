/**
 * useLiveMetrics Hook
 * 
 * Manages real-time metrics streaming from backend via Socket.IO
 */

'use client'

import { useEffect, useState } from 'react'
import { LiveMetrics, fetchLiveMetrics } from '@/lib/services/overseer'

export function useLiveMetrics() {
  const [metrics, setMetrics] = useState<LiveMetrics[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [verifiedCount, setVerifiedCount] = useState(0)
  const [connected, setConnected] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Load initial metrics
    fetchLiveMetrics()
      .then((result) => {
        setMetrics(result.metrics)
        setTotalCount(result.totalCount)
        setVerifiedCount(result.verifiedCount)
        setConnected(true)
      })
      .catch(() => setConnected(false))
      .finally(() => setLoading(false))

    // Poll for new metrics every 5 seconds
    const interval = setInterval(() => {
      fetchLiveMetrics()
        .then((result) => {
          setMetrics(result.metrics)
          setTotalCount(result.totalCount)
          setVerifiedCount(result.verifiedCount)
          setConnected(true)
        })
        .catch(() => setConnected(false))
    }, 5000)

    return () => {
      clearInterval(interval)
    }
  }, [])

  return { metrics, totalCount, verifiedCount, connected, loading }
}
