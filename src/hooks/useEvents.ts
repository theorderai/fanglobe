'use client'
import { useState, useEffect } from 'react'
import { getUpcomingEvents, getFallbackEvents } from '@/lib/events'
import type { FanGlobeEvent } from '@/types'

export function useEvents(sportFilter?: string) {
  const [events, setEvents] = useState<FanGlobeEvent[]>(getUpcomingEvents(undefined, 40))
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams({ limit: '40' })
    if (sportFilter) params.set('sport', sportFilter)
    setLoading(true)
    fetch(`/api/events?${params}`)
      .then(r => r.json())
      .then(data => { if (data.events?.length) setEvents(data.events) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [sportFilter])

  return { events, loading }
}
