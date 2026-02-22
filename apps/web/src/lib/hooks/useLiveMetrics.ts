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
      .then(setMetrics)
      .finally(() => setLoading(false))

    // Try to connect to Socket.IO
    try {
      const socket = require('socket.io-client').io(
        process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'
      )

      socket.on('connect', () => {
        setConnected(true)
      })

      socket.on('trust:receipt', (data: LiveMetrics) => {
        setMetrics((prev) => [data, ...prev].slice(0, 100))
      })

      socket.on('disconnect', () => {
        setConnected(false)
      })

      return () => {
        socket.off('trust:receipt')
        socket.off('connect')
        socket.off('disconnect')
        socket.disconnect()
      }
    } catch (err) {
      console.warn('Socket.IO not available, running in fallback mode')
    }
  }, [])

  return { metrics, connected, loading }
}
