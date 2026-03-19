'use client'
import { useState, useEffect, useRef } from 'react'
import { getSupabaseClient } from '@/lib/supabase-client'
import type { Cheer } from '@/types'
import type { RealtimeChannel } from '@supabase/supabase-js'

const MAX_CHEERS = 8

export function useRealtime(eventId: string | null) {
  const [cheers, setCheers] = useState<Cheer[]>([])
  const channelRef = useRef<RealtimeChannel | null>(null)

  useEffect(() => {
    if (!eventId) return
    const supabase = getSupabaseClient()

    supabase.from('cheers').select('*')
      .eq('match_id', eventId).eq('moderated', true)
      .order('created_at', { ascending: false }).limit(MAX_CHEERS)
      .then(({ data }) => {
        if (data) setCheers(data.map(r => ({
          id: r.id, eventId: r.event_id ?? r.match_id, sportId: r.sport_id ?? 'soccer',
          city: r.city, country: r.country ?? '', flag: r.flag, text: r.text,
          vibe: r.vibe, source: r.source, createdAt: r.created_at,
        })))
      })

    channelRef.current = supabase.channel(`cheers:${eventId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'cheers', filter: `match_id=eq.${eventId}` },
        (payload) => {
          const row = payload.new as Record<string, unknown>
          if (!row.moderated) return
          const cheer: Cheer = {
            id: String(row.id), eventId: String(row.event_id ?? row.match_id),
            sportId: String(row.sport_id ?? 'soccer'), city: String(row.city),
            country: String(row.country ?? ''), flag: String(row.flag),
            text: String(row.text), vibe: String(row.vibe ?? ''),
            source: row.source === 'user' ? 'user' : 'ai',
            createdAt: String(row.created_at),
          }
          setCheers(prev => [cheer, ...prev].slice(0, MAX_CHEERS))
        }
      ).subscribe()

    return () => { channelRef.current?.unsubscribe() }
  }, [eventId])

  return cheers
}
