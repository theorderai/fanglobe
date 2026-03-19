'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import type { Snapshot } from '@/types'

const POLL_MS = 30000      // poll every 30 seconds
const LIVE_POLL_MS = 15000 // faster when match is live

export function useSnapshot(eventId: string | null) {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null)
  const [loading, setLoading] = useState(true)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const fetchSnap = useCallback(async (id: string) => {
    // Don't fetch when tab is hidden
    if (document.hidden) return
    if (abortRef.current) abortRef.current.abort()
    abortRef.current = new AbortController()
    try {
      const res = await fetch(`/api/snapshot/${id}`, {
        signal: abortRef.current.signal,
        cache: 'no-store',
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data: Snapshot = await res.json()
      setSnapshot(data)
    } catch (err) {
      if ((err as Error).name !== 'AbortError') console.warn('snapshot failed')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!eventId) return
    setLoading(true)

    // Determine if event is currently live
    const isLive = () => {
      if (!snapshot) return false
      // Consider live if snapshot was recently updated (rough heuristic)
      return true
    }

    fetchSnap(eventId)
    intervalRef.current = setInterval(
      () => fetchSnap(eventId),
      isLive() ? LIVE_POLL_MS : POLL_MS
    )

    // Pause polling when tab is hidden, resume when visible
    const handleVisibility = () => {
      if (!document.hidden) fetchSnap(eventId)
    }
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (abortRef.current) abortRef.current.abort()
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [eventId, fetchSnap])

  return { snapshot, loading }
}