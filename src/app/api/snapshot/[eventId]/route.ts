import { NextRequest, NextResponse } from 'next/server'
import { getCachedSnapshot, setCachedSnapshot } from '@/lib/redis'
import { getFallbackEvents, getEventSeedCities } from '@/lib/events'
import { createServiceClient } from '@/lib/supabase-server'
import { fasFromSnapshot } from '@/lib/fas'
import type { Snapshot, CityData } from '@/types'

export const runtime = 'nodejs'
// No Next.js revalidation — we control caching explicitly via headers
export const revalidate = 0

export async function GET(
  _req: NextRequest,
  { params }: { params: { eventId: string } }
) {
  const { eventId } = params

  // ── 1. Redis cache hit → return immediately, 1 read, done ──────────────
  const cached = await getCachedSnapshot(eventId)
  if (cached) {
    // If cached snapshot predates FAS, compute and inject it now
    let body = cached
    try {
      const parsed = JSON.parse(cached)
      if (!parsed.fas && parsed.totalCount !== undefined) {
        const fasResult = fasFromSnapshot(parsed, parsed.sportId)
        parsed.fas = { score: fasResult.score, label: fasResult.label, color: fasResult.color }
        body = JSON.stringify(parsed)
        // Update cache with fas included
        await setCachedSnapshot(eventId, body)
      }
    } catch {}
    return new NextResponse(body, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        'X-Cache': 'HIT',
      },
    })
  }

  // ── 2. Cache miss → find event ──────────────────────────────────────────
  const allFallback = getFallbackEvents()
  let event = allFallback.find(e => e.id === eventId || e.slug === eventId)
  let seedCities: CityData[] = getEventSeedCities(eventId)

  if (!event) {
    try {
      const supabase = createServiceClient()
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(eventId)
      const { data } = await supabase
        .from('events')
        .select('*')
        .eq(isUUID ? 'id' : 'slug', eventId)
        .single()

      if (data) {
        event = {
          id: data.id, slug: data.slug, sportId: data.sport_id,
          homeTeam: data.home_team, awayTeam: data.away_team,
          homeFlag: data.home_flag ?? '', awayFlag: data.away_flag ?? '',
          homeColor: data.home_color, awayColor: data.away_color,
          label: data.label ?? `${data.home_team} vs ${data.away_team}`,
          venue: data.venue, venueShort: data.venue_short,
          stadLat: data.stad_lat, stadLng: data.stad_lng,
          camLat: data.cam_lat ?? 20, camLng: data.cam_lng ?? 0, camAlt: data.cam_alt ?? 2.2,
          kickoffAt: data.kickoff_at, status: data.status,
          isRivalry: data.is_rivalry ?? false, isFeatured: data.is_featured ?? false,
        }
        if (data.slug) seedCities = getEventSeedCities(data.slug)
        if (!seedCities.length) {
          const m = allFallback.find(f => f.sportId === data.sport_id &&
            (f.homeTeam === data.home_team || f.awayTeam === data.away_team))
          if (m) seedCities = getEventSeedCities(m.id)
        }
      }
    } catch (e) {
      console.error('DB event fetch failed:', e)
    }
  }

  if (!event) {
    // Unknown event — return empty, do NOT write to Redis
    const empty: Snapshot = {
      eventId, sportId: 'soccer', totalCount: 0, homeCount: 0, awayCount: 0,
      cities: [], pulse: { fire:0,ecstatic:0,nervous:0,crushed:0,moment:0 },
      countryCount: 0, updatedAt: new Date().toISOString(),
    }
    return new NextResponse(JSON.stringify(empty), {
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    })
  }

  // ── 3. Build snapshot from seed data (0 additional Redis reads) ─────────
  const seedTotal = seedCities.reduce((s, c) => s + c.count, 0)
  const countryCount = new Set(seedCities.map(c => c.country).filter(Boolean)).size

  const snapshot: Snapshot = {
    eventId, sportId: event.sportId,
    totalCount: seedTotal,
    homeCount: Math.floor(seedTotal * 0.48),
    awayCount: Math.floor(seedTotal * 0.47),
    cities: seedCities,
    pulse: {
      fire:     Math.floor(seedTotal * 0.35),
      ecstatic: Math.floor(seedTotal * 0.28),
      nervous:  Math.floor(seedTotal * 0.24),
      crushed:  Math.floor(seedTotal * 0.10),
      moment:   Math.floor(seedTotal * 0.03),
    },
    countryCount,
    updatedAt: new Date().toISOString(),
  }

  // Compute FAS
  const fasResult = fasFromSnapshot(snapshot, event.sportId)
  const withFas = { ...snapshot, fas: { score: fasResult.score, label: fasResult.label, color: fasResult.color } }
  const body = JSON.stringify(withFas)

  // ── 4. Write to Redis ONLY if there's real data (seed total > 0) ────────
  // This cache is updated by the cron when real checkins exist.
  // For pure seed data: cache in Redis for 5min to avoid recomputing,
  // but only if seedTotal > 0 (don't pollute Redis with empty events)
  if (seedTotal > 0) {
    await setCachedSnapshot(eventId, body)
  }

  return new NextResponse(body, {
    headers: {
      'Content-Type': 'application/json',
      // Seed data: cache at CDN for 5min, stale for 10min
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      'X-Cache': 'SEED',
    },
  })
}