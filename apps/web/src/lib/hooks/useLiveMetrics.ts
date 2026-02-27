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
  const [connected, setConnected] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Load initial metrics
    fetchLiveMetrics()
      .then((data) => {
        setMetrics(data)
        setConnected(true)
      })
      .catch(() => setConnected(false))
      .finally(() => setLoading(false))

    // Poll for new metrics every 5 seconds
    const interval = setInterval(() => {
      fetchLiveMetrics()
        .then((data) => {
          setMetrics(data)
          setConnected(true)
        })
        .catch(() => setConnected(false))
    }, 5000)

    return () => {
      clearInterval(interval)
    }
  }, [])

  return { metrics, connected, loading }
}
