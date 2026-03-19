'use client'
import { useState, useEffect, useCallback } from 'react'
import { getUpcomingEvents } from '@/lib/events'
import { SPORTS } from '@/types'
import type { FanGlobeEvent } from '@/types'

function hydrateEvents(events: FanGlobeEvent[]): FanGlobeEvent[] {
  return events.map(e => ({ ...e, sport: e.sport ?? SPORTS[e.sportId] }))
}

export function useEvents() {
  // Start with soccer as default — loads immediately
  const [activeSport, setActiveSport] = useState('soccer')
  const [eventsBySport, setEventsBySport] = useState<Record<string, FanGlobeEvent[]>>({
    soccer: hydrateEvents(getUpcomingEvents('soccer', 60)),
  })
  const [loading, setLoading] = useState(false)

  const fetchSport = useCallback(async (sportId: string) => {
    // Already loaded — skip
    if (eventsBySport[sportId]) return
    setLoading(true)
    try {
      const res = await fetch(`/api/events?sport=${sportId}&limit=60`)
      const data = await res.json()
      if (data.events?.length) {
        setEventsBySport(prev => ({
          ...prev,
          [sportId]: hydrateEvents(data.events),
        }))
      }
    } catch { /* keep existing */ }
    finally { setLoading(false) }
  }, [eventsBySport])

  // Prefetch other sports in background after initial render
  useEffect(() => {
    const others = ['cricket', 'f1', 'nba']
    const timer = setTimeout(() => {
      others.forEach(s => fetchSport(s))
    }, 1500) // slight delay so soccer loads first
    return () => clearTimeout(timer)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const switchSport = useCallback((sportId: string) => {
    setActiveSport(sportId)
    fetchSport(sportId)
  }, [fetchSport])

  // Flat list of all loaded events for components that need it
  const allEvents = Object.values(eventsBySport).flat()

  // Active sport events
  const activeEvents = eventsBySport[activeSport] ?? []

  return {
    events: allEvents,
    activeEvents,
    activeSport,
    switchSport,
    loading,
  }
}