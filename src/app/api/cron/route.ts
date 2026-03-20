import { NextRequest, NextResponse } from 'next/server'
import { getEventSnapshot, setCachedSnapshot, seedEventData } from '@/lib/redis'
import { createServiceClient } from '@/lib/supabase-server'
import { generateCheers } from '@/lib/claude'
import { getFallbackEvents, getEventSeedCities, MATCH_CONTEXT } from '@/lib/events'
import { fasFromSnapshot } from '@/lib/fas'
import type { Snapshot, CityData } from '@/types'

export const runtime = 'nodejs'
export const maxDuration = 30

const VIBES = ['fire', 'ecstatic', 'nervous', 'crushed']
const VIBE_WEIGHTS = [0.38, 0.28, 0.22, 0.12]

function pickVibe(): string {
  const r = Math.random()
  let cum = 0
  for (let i = 0; i < VIBE_WEIGHTS.length; i++) { cum += VIBE_WEIGHTS[i]; if (r < cum) return VIBES[i] }
  return 'fire'
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceClient()
  const events = getFallbackEvents()
  const results: Record<string, { total: number; hasRealData: boolean; cheersAdded: number }> = {}

  await Promise.allSettled(events.map(async (event) => {
    const seedCities = getEventSeedCities(event.id)
    const seedTotal = seedCities.reduce((s, c) => s + c.count, 0)

    // ── Check if any real checkins exist for this event ──────────────────
    // Only hit Redis if we actually have real user data to merge
    const { count: realCheckinCount } = await supabase
      .from('checkins')
      .select('id', { count: 'exact', head: true })
      .eq('match_id', event.id)

    const hasRealData = (realCheckinCount ?? 0) > 0

    if (!hasRealData) {
      // No real checkins yet — seed data is served directly by snapshot route
      // from memory. No Redis reads needed. Skip.
      results[event.id] = { total: seedTotal, hasRealData: false, cheersAdded: 0 }

      // Still generate AI cheers occasionally (1 in 3 cron runs)
      if (Math.random() < 0.33) {
        const context = MATCH_CONTEXT[event.id] ?? event.label
        const city = seedCities[Math.floor(Math.random() * Math.min(5, seedCities.length))]
        if (city) {
          const vibe = pickVibe()
          const texts = await generateCheers({ matchContext: context, city: city.city, flag: city.flag, vibe, count: 1 })
          if (texts[0]) {
            await supabase.from('cheers').insert({
              match_id: event.id, event_id: event.id, sport_id: event.sportId,
              city: city.city, country: city.country, flag: city.flag,
              text: texts[0], vibe, source: 'ai', moderated: true,
            })
            results[event.id].cheersAdded = 1
          }
        }
      }
      return
    }

    // ── Real checkins exist — build full snapshot with Redis ─────────────
    await seedEventData(event.id, seedCities, event.sportId)
    const { total, homeTotal, awayTotal, cities, pulse } = await getEventSnapshot(event.id)

    const mergedCities: CityData[] = seedCities.map(seed => ({
      ...seed, count: seed.count + (Number(cities[seed.city] ?? 0)),
    })).sort((a, b) => b.count - a.count)

    const totalCount = mergedCities.reduce((s, c) => s + c.count, 0)
    const countryCount = Array.from(new Set(mergedCities.map(c => c.country))).length

    const snapshot: Snapshot = {
      eventId: event.id, sportId: event.sportId, totalCount,
      homeCount: homeTotal + Math.floor(seedTotal * 0.48),
      awayCount: awayTotal + Math.floor(seedTotal * 0.47),
      cities: mergedCities, pulse, countryCount,
      updatedAt: new Date().toISOString(),
    }

    const fasResult = fasFromSnapshot(snapshot, event.sportId)
    const withFas = { ...snapshot, fas: { score: fasResult.score, label: fasResult.label, color: fasResult.color } }
    await setCachedSnapshot(event.id, JSON.stringify(withFas))

    // Write full snapshot to Supabase — triggers Realtime broadcast to all subscribers
    // This replaces Redis as the delivery mechanism for live updates
    void supabase.from('snapshots').insert({
      match_id: event.id,
      sport_id: event.sportId,
      total: totalCount,
      home_count: snapshot.homeCount,
      away_count: snapshot.awayCount,
      country_count: countryCount,
      pulse_fire:     pulse.fire,
      pulse_ecstatic: pulse.ecstatic,
      pulse_nervous:  pulse.nervous,
      pulse_crushed:  pulse.crushed,
      pulse_moment:   pulse.moment ?? 0,
      city_counts:    cities,          // raw Redis city counts
      cities_full:    JSON.stringify(mergedCities), // full CityData array for Realtime
      fas_score: fasResult.score,
      fas_label: fasResult.label,
      fas_color: fasResult.color,
      snapped_at: new Date().toISOString(),
    })

    // AI cheers for real-data events every cron run
    const context = MATCH_CONTEXT[event.id] ?? event.label
    const topCities = mergedCities.slice(0, 5)
    let cheersAdded = 0

    await Promise.allSettled(Array.from({ length: 2 }).map(async () => {
      const city = topCities[Math.floor(Math.random() * topCities.length)]
      if (!city) return
      const vibe = pickVibe()
      const texts = await generateCheers({ matchContext: context, city: city.city, flag: city.flag, vibe, count: 1 })
      if (!texts[0]) return
      await supabase.from('cheers').insert({
        match_id: event.id, event_id: event.id, sport_id: event.sportId,
        city: city.city, country: city.country, flag: city.flag,
        text: texts[0], vibe, source: 'ai', moderated: true,
      })
      cheersAdded++
    }))

    results[event.id] = { total: totalCount, hasRealData: true, cheersAdded }
  }))

  return NextResponse.json({ ok: true, results, ts: new Date().toISOString() })
}