import { NextRequest, NextResponse } from 'next/server'
import { getEventSnapshot, getCachedSnapshot } from '@/lib/redis'
import { getFallbackEvents, getEventSeedCities } from '@/lib/events'
import { createServiceClient } from '@/lib/supabase-server'
import type { Snapshot, CityData } from '@/types'

export const runtime = 'nodejs'
export const revalidate = 3

export async function GET(
  _req: NextRequest,
  { params }: { params: { eventId: string } }
) {
  const { eventId } = params

  // Try pre-built Redis cache first
  const cached = await getCachedSnapshot(eventId)
  if (cached) {
    return new NextResponse(cached, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, s-maxage=3, stale-while-revalidate=10',
        'X-Cache': 'HIT',
      },
    })
  }

  // Try to find event — first in fallback data (string IDs), then in DB (UUIDs)
  const allFallback = getFallbackEvents()
  let event = allFallback.find(e => e.id === eventId)
  let seedCities: CityData[] = getEventSeedCities(eventId)

  // If not found in fallback, fetch from DB (real UUID from Supabase)
  if (!event) {
    try {
      const supabase = createServiceClient()
      const { data } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single()

      if (data) {
        event = {
          id: data.id,
          slug: data.slug,
          sportId: data.sport_id,
          homeTeam: data.home_team,
          awayTeam: data.away_team,
          homeFlag: data.home_flag ?? '',
          awayFlag: data.away_flag ?? '',
          homeColor: data.home_color,
          awayColor: data.away_color,
          label: data.label ?? `${data.home_team} vs ${data.away_team}`,
          venue: data.venue,
          venueShort: data.venue_short,
          stadLat: data.stad_lat,
          stadLng: data.stad_lng,
          camLat: data.cam_lat ?? 20,
          camLng: data.cam_lng ?? 0,
          camAlt: data.cam_alt ?? 2.2,
          kickoffAt: data.kickoff_at,
          status: data.status,
          isRivalry: data.is_rivalry ?? false,
          isFeatured: data.is_featured ?? false,
        }
        // Look up seed cities by slug first, then by team name match
        if (data.slug) {
          seedCities = getEventSeedCities(data.slug)
        }
        if (seedCities.length === 0) {
          const matchingFallback = allFallback.find(f =>
            f.sportId === data.sport_id &&
            (f.homeTeam === data.home_team || f.awayTeam === data.away_team)
          )
          if (matchingFallback) {
            seedCities = getEventSeedCities(matchingFallback.id)
          }
        }
      }
    } catch (e) {
      console.error('DB event fetch failed:', e)
    }
  }

  // Still not found — return empty snapshot rather than 404
  // This prevents the polling loop from spamming errors
  if (!event) {
    const emptySnapshot: Snapshot = {
      eventId, sportId: 'soccer', totalCount: 0, homeCount: 0, awayCount: 0,
      cities: [], pulse: { fire: 0, ecstatic: 0, nervous: 0, crushed: 0, moment: 0 },
      countryCount: 0, updatedAt: new Date().toISOString(),
    }
    return NextResponse.json(emptySnapshot, {
      headers: { 'Cache-Control': 'public, s-maxage=5' }
    })
  }

  const { total, homeTotal, awayTotal, cities, pulse } = await getEventSnapshot(eventId)

  const mergedCities: CityData[] = seedCities.map(seed => ({
    ...seed,
    count: seed.count + (Number(cities[seed.city] ?? 0)),
  })).sort((a, b) => b.count - a.count)

  const totalCount = mergedCities.reduce((s, c) => s + c.count, 0)
    || (total + seedCities.reduce((s, c) => s + c.count, 0))
  const countryCount = Array.from(new Set(mergedCities.map(c => c.country))).length
  const seedTotal = seedCities.reduce((s, c) => s + c.count, 0)

  const snapshot: Snapshot = {
    eventId, sportId: event.sportId, totalCount,
    homeCount: homeTotal + Math.floor(seedTotal * 0.48),
    awayCount: awayTotal + Math.floor(seedTotal * 0.47),
    cities: mergedCities, pulse, countryCount,
    updatedAt: new Date().toISOString(),
  }

  return new NextResponse(JSON.stringify(snapshot), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, s-maxage=3, stale-while-revalidate=10',
      'X-Cache': 'MISS',
    },
  })
}