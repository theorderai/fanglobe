'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import type { Snapshot } from '@/types'

const POLL_MS = 60000      // poll every 60 seconds — CDN cache is 60s anyway
const LIVE_POLL_MS = 30000 // 30s when live — matches browser cache-control

export function useSnapshot(eventId: string | null) {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null)
  const [loading, setLoading] = useState(true)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const etagRef = useRef<string | null>(null)

  const fetchSnap = useCallback(async (id: string) => {
    if (document.hidden) return   // never poll when tab is hidden
    if (abortRef.current) abortRef.current.abort()
    abortRef.current = new AbortController()

    const headers: Record<string, string> = {}
    if (etagRef.current) headers['If-None-Match'] = etagRef.current

    try {
      const res = await fetch(`/api/snapshot/${id}`, {
        signal: abortRef.current.signal,
        headers,
      })

      // 304 = not modified, no Redis read triggered
      if (res.status === 304) return

      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const etag = res.headers.get('ETag')
      if (etag) etagRef.current = etag

      const data: Snapshot = await res.json()
      setSnapshot(data)
    } catch (err) {
      if ((err as Error).name !== 'AbortError') console.warn('snapshot failed')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!eventId) { setSnapshot(null); setLoading(false); return }

    // Reset state for new event
    setLoading(true)
    etagRef.current = null

    // Clear any existing interval
    if (intervalRef.current) clearInterval(intervalRef.current)

    fetchSnap(eventId)

    const isLive = () => snapshot?.countryCount !== undefined && snapshot.totalCount > 100

    intervalRef.current = setInterval(
      () => fetchSnap(eventId),
      isLive() ? LIVE_POLL_MS : POLL_MS
    )

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