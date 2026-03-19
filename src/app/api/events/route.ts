import { NextRequest, NextResponse } from 'next/server'
import { getUpcomingEvents, getUpcomingFeatured, getFallbackEvents } from '@/lib/events'
import { SPORTS } from '@/types'
import type { FanGlobeEvent } from '@/types'

export const runtime = 'nodejs'
export const revalidate = 300 // 5 min cache

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const sportId = url.searchParams.get('sport')
  const featuredOnly = url.searchParams.get('featured') === '1'
  const limit = Math.min(40, Number(url.searchParams.get('limit') ?? '40'))

  try {
    // Try DB first
    const { createServiceClient } = await import('@/lib/supabase-server')
    const supabase = createServiceClient()
    const today = '2026-03-19T00:00:00Z'
    
    let query = supabase
      .from('events')
      .select('*')
      .gte('kickoff_at', today)
      .in('status', ['live', 'upcoming'])
      .order('kickoff_at', { ascending: true })
      .limit(limit)

    if (sportId) query = query.eq('sport_id', sportId)
    if (featuredOnly) query = query.eq('is_featured', true)

    const { data, error } = await query

    if (error || !data || data.length < 10) throw new Error('Insufficient DB events — use static')

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const events: FanGlobeEvent[] = data.map((row: any) => ({
      id: row.id, sportId: row.sport_id, sport: SPORTS[row.sport_id],
      homeTeam: row.home_team, awayTeam: row.away_team,
      homeFlag: row.home_flag ?? '', awayFlag: row.away_flag ?? '',
      homeColor: row.home_color, awayColor: row.away_color,
      label: row.label ?? `${row.home_team} vs ${row.away_team}`,
      venue: row.venue, venueShort: row.venue_short,
      stadLat: row.stad_lat, stadLng: row.stad_lng,
      camLat: row.cam_lat ?? 20, camLng: row.cam_lng ?? 0, camAlt: row.cam_alt ?? 2.2,
      kickoffAt: row.kickoff_at, status: row.status,
      isRivalry: row.is_rivalry ?? false, isFeatured: row.is_featured ?? false,
    }))

    return NextResponse.json({ events, source: 'db' }, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' }
    })
  } catch {
    // Fallback to static upcoming events
    const events = sportId
      ? getUpcomingEvents(sportId, limit)
      : featuredOnly
      ? getUpcomingFeatured(limit)
      : getUpcomingEvents(undefined, limit)

    return NextResponse.json({ events, source: 'static' }, {
      headers: { 'Cache-Control': 'public, s-maxage=300' }
    })
  }
}
