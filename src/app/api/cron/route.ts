import { NextRequest, NextResponse } from 'next/server'
import { getEventSnapshot, setCachedSnapshot, seedEventData } from '@/lib/redis'
import { createServiceClient } from '@/lib/supabase-server'
import { generateCheers } from '@/lib/claude'
import { getFallbackEvents, getEventSeedCities, MATCH_CONTEXT } from '@/lib/events'
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
  const results: Record<string, { total: number; cheersAdded: number }> = {}

  await Promise.allSettled(events.map(async (event) => {
    const seedCities = getEventSeedCities(event.id)
    await seedEventData(event.id, seedCities, event.sportId)

    const { total, homeTotal, awayTotal, cities, pulse } = await getEventSnapshot(event.id)

    const mergedCities: CityData[] = seedCities.map(seed => ({
      ...seed, count: seed.count + (Number(cities[seed.city] ?? 0)),
    })).sort((a, b) => b.count - a.count)

    const totalCount = mergedCities.reduce((s, c) => s + c.count, 0)
    const countryCount = Array.from(new Set(mergedCities.map(c => c.country))).length
    const seedTotal = seedCities.reduce((s, c) => s + c.count, 0)

    const snapshot: Snapshot = {
      eventId: event.id, sportId: event.sportId, totalCount,
      homeCount: homeTotal + Math.floor(seedTotal * 0.48),
      awayCount: awayTotal + Math.floor(seedTotal * 0.47),
      cities: mergedCities, pulse, countryCount,
      updatedAt: new Date().toISOString(),
    }

    await setCachedSnapshot(event.id, JSON.stringify(snapshot))

    void supabase.from('snapshots').insert({
      match_id: event.id, total: totalCount,
      pulse_fire: pulse.fire, pulse_ecstatic: pulse.ecstatic,
      pulse_nervous: pulse.nervous, pulse_crushed: pulse.crushed,
      city_counts: cities,
    })

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

    results[event.id] = { total: totalCount, cheersAdded }
  }))

  return NextResponse.json({ ok: true, results, ts: new Date().toISOString() })
}
