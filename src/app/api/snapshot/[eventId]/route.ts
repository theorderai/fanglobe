import { NextRequest, NextResponse } from 'next/server'
import { getCachedSnapshot, setCachedSnapshot } from '@/lib/redis'
import { fasFromSnapshot } from '@/lib/fas'
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

  // If not found in fallback, fetch from DB — try slug first, then UUID
  if (!event) {
    try {
      const supabase = createServiceClient()
      // Try by slug first (frontend passes slug), then by UUID
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(eventId)
      const { data } = await supabase
        .from('events')
        .select('*')
        .eq(isUUID ? 'id' : 'slug', eventId)
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

  // Build snapshot from seed data only (no raw Redis reads)
  // Raw Redis reads only happen in the cron job which writes the cache
  const seedTotal = seedCities.reduce((s, c) => s + c.count, 0)
  const countryCount = Array.from(new Set(seedCities.map(c => c.country))).length

  const snapshot: Snapshot = {
    eventId, sportId: event.sportId,
    totalCount: seedTotal,
    homeCount: Math.floor(seedTotal * 0.48),
    awayCount: Math.floor(seedTotal * 0.47),
    cities: seedCities,
    pulse: { fire: Math.floor(seedTotal * 0.35), ecstatic: Math.floor(seedTotal * 0.28), nervous: Math.floor(seedTotal * 0.24), crushed: Math.floor(seedTotal * 0.10), moment: Math.floor(seedTotal * 0.03) },
    countryCount,
    updatedAt: new Date().toISOString(),
  }

  // Compute FAS score
  const fasResult = fasFromSnapshot(snapshot, event?.sportId)
  const snapshotWithFas = { ...snapshot, fas: { score: fasResult.score, label: fasResult.label, color: fasResult.color } }
  const body = JSON.stringify(snapshotWithFas)
  // Cache for 5 minutes — no need to refresh static seed data frequently
  await setCachedSnapshot(eventId, body)

  return new NextResponse(body, {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      'X-Cache': 'SEED',
    },
  })
}