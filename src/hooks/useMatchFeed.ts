'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { MatchFeed } from '@/types'

/**
 * Polls the match feed. The endpoint is CDN-cached for 2s, so polling scales
 * with the CDN, not the database. Pauses while the tab is hidden.
 */
export function useMatchFeed(matchId: string, initial: MatchFeed | null, intervalMs = 4000) {
  const [feed, setFeed] = useState<MatchFeed | null>(initial)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`/api/match/${encodeURIComponent(matchId)}`, { cache: 'no-store' })
      if (res.ok) setFeed(await res.json())
    } catch { /* keep last good feed */ }
  }, [matchId])

  useEffect(() => {
    let stopped = false
    const loop = async () => {
      if (!document.hidden) await refresh()
      if (!stopped) timer.current = setTimeout(loop, intervalMs)
    }
    timer.current = setTimeout(loop, initial ? intervalMs : 0)
    const onVisible = () => { if (!document.hidden) refresh() }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      stopped = true
      if (timer.current) clearTimeout(timer.current)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [refresh, intervalMs, initial])

  return { feed, refresh, setFeed }
}
