'use client'
import { useState, useEffect, useRef } from 'react'
import { getSupabaseClient } from '@/lib/supabase-client'
import type { Snapshot } from '@/types'
import type { RealtimeChannel } from '@supabase/supabase-js'

export function useSnapshot(eventId: string | null) {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null)
  const [loading, setLoading] = useState(true)
  const channelRef = useRef<RealtimeChannel | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (!eventId) { setSnapshot(null); setLoading(false); return }

    setLoading(true)
    setSnapshot(null)

    // ── Step 1: one-time HTTP fetch for immediate initial state ─────────────
    // This gets seed data instantly without waiting for a Realtime event.
    // After this single fetch, all updates come via WebSocket — zero polling.
    if (abortRef.current) abortRef.current.abort()
    abortRef.current = new AbortController()

    fetch(`/api/snapshot/${eventId}`, { signal: abortRef.current.signal })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setSnapshot(data) })
      .catch(err => { if (err.name !== 'AbortError') console.warn('initial snapshot failed') })
      .finally(() => setLoading(false))

    // ── Step 2: Supabase Realtime subscription for live updates ─────────────
    // Cron writes to snapshots table when real data exists.
    // We listen for INSERT events on this match — no polling, pure push.
    const supabase = getSupabaseClient()

    channelRef.current = supabase
      .channel(`snapshot:${eventId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'snapshots',
          filter: `match_id=eq.${eventId}`,
        },
        (payload) => {
          const row = payload.new as Record<string, unknown>

          // Build Snapshot from the DB row
          const cityFull = Array.isArray(row.cities_full) ? row.cities_full : []
          const fas = row.fas_score
            ? { score: Number(row.fas_score), label: String(row.fas_label ?? 'Tepid'), color: String(row.fas_color ?? '#fff') }
            : undefined

          const snap: Snapshot = {
            eventId: String(row.match_id),
            sportId: String(row.sport_id ?? 'soccer'),
            totalCount: Number(row.total ?? 0),
            homeCount: Number(row.home_count ?? 0),
            awayCount: Number(row.away_count ?? 0),
            countryCount: Number(row.country_count ?? 0),
            cities: cityFull,
            pulse: {
              fire:     Number(row.pulse_fire ?? 0),
              ecstatic: Number(row.pulse_ecstatic ?? 0),
              nervous:  Number(row.pulse_nervous ?? 0),
              crushed:  Number(row.pulse_crushed ?? 0),
              moment:   Number(row.pulse_moment ?? 0),
            },
            updatedAt: String(row.snapped_at ?? new Date().toISOString()),
            fas,
          }

          setSnapshot(snap)
          setLoading(false)
        }
      )
      .subscribe()

    return () => {
      if (abortRef.current) abortRef.current.abort()
      channelRef.current?.unsubscribe()
    }
  }, [eventId])

  return { snapshot, loading }
}