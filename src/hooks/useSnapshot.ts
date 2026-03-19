'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import type { Snapshot } from '@/types'

const POLL_MS = 3000

export function useSnapshot(eventId: string | null) {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null)
  const [loading, setLoading] = useState(true)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const fetchSnap = useCallback(async (id: string) => {
    if (abortRef.current) abortRef.current.abort()
    abortRef.current = new AbortController()
    try {
      const res = await fetch(`/api/snapshot/${id}`, { signal: abortRef.current.signal, cache: 'no-store' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data: Snapshot = await res.json()
      setSnapshot(data)
    } catch (err) {
      if ((err as Error).name !== 'AbortError') console.warn('snapshot failed')
    } finally { setLoading(false) }
  }, [])

  useEffect(() => {
    if (!eventId) return
    setLoading(true)
    fetchSnap(eventId)
    intervalRef.current = setInterval(() => fetchSnap(eventId), POLL_MS)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (abortRef.current) abortRef.current.abort()
    }
  }, [eventId, fetchSnap])

  return { snapshot, loading }
}
