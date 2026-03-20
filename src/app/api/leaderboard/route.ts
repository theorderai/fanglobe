import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'
import { getEventSeedCities } from '@/lib/events'
import { fasFromSnapshot } from '@/lib/fas'
import { SPORTS } from '@/types'

export const runtime = 'nodejs'
export const revalidate = 0  // manual cache control

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const matchSlug = url.searchParams.get('match')
  const limit = Math.min(50, Number(url.searchParams.get('limit') ?? '25'))

  try {
    const supabase = createServiceClient()

    // Get featured events for the dropdown
    const { data: events } = await supabase
      .from('events')
      .select('id, slug, home_team, away_team, home_flag, away_flag, sport_id, kickoff_at, is_featured')
      .eq('is_featured', true)
      .order('kickoff_at', { ascending: true })
      .limit(20)

    // Get target event
    let targetEvent = null
    if (matchSlug) {
      const isUUID = /^[0-9a-f-]{36}$/i.test(matchSlug)
      const { data } = await supabase.from('events').select('*').eq(isUUID ? 'id' : 'slug', matchSlug).single()
      targetEvent = data
    } else if (events?.length) {
      targetEvent = events[0]
    }

    if (!targetEvent) {
      return NextResponse.json({ cities: [], events: events ?? [], fas: null })
    }

    // Get seed cities for this event
    const seedCities = getEventSeedCities(targetEvent.slug ?? targetEvent.id)

    // Try to get real checkin data from DB
    const { data: checkins } = await supabase
      .from('checkins')
      .select('city, country, flag, lat, lng, team_side')
      .eq('match_id', targetEvent.slug ?? targetEvent.id)
      .limit(5000)

    // Aggregate by city
    const cityMap = new Map<string, {
      city: string; country: string; flag: string; count: number
      home: number; away: number; lat: number; lng: number
    }>()

    // Seed data first
    for (const s of seedCities) {
      cityMap.set(s.city, {
        city: s.city, country: s.country ?? '', flag: s.flag,
        count: s.count, home: Math.floor(s.count * 0.5), away: Math.floor(s.count * 0.5),
        lat: 0, lng: 0,
      })
    }

    // Real checkins on top
    for (const c of (checkins ?? [])) {
      if (!c.city) continue
      const existing = cityMap.get(c.city)
      if (existing) {
        existing.count += 1
        if (c.team_side === 'home') existing.home += 1
        else if (c.team_side === 'away') existing.away += 1
      } else {
        cityMap.set(c.city, {
          city: c.city, country: c.country ?? '', flag: c.flag ?? '🌍',
          count: 1, home: c.team_side === 'home' ? 1 : 0, away: c.team_side === 'away' ? 1 : 0,
          lat: c.lat ?? 0, lng: c.lng ?? 0,
        })
      }
    }

    const sorted = [...cityMap.values()]
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
      .map((c, i) => ({ ...c, rank: i + 1 }))

    const totalFans = sorted.reduce((s, c) => s + c.count, 0)
    const countryCount = new Set(sorted.map(c => c.country)).size

    const fas = fasFromSnapshot({
      totalCount: totalFans,
      pulse: { fire: 0, ecstatic: 0, nervous: 0, crushed: 0, moment: 0 },
      countryCount,
      cities: sorted,
    }, targetEvent.sport_id)

    const responseData = {
      cities: sorted,
      totalFans,
      countryCount,
      fas: { score: fas.score, label: fas.label, color: fas.color },
      event: {
        id: targetEvent.id,
        slug: targetEvent.slug,
        homeTeam: targetEvent.home_team,
        awayTeam: targetEvent.away_team,
        homeFlag: targetEvent.home_flag,
        awayFlag: targetEvent.away_flag,
        sportId: targetEvent.sport_id,
        kickoffAt: targetEvent.kickoff_at,
      },
      events: (events ?? []).map(e => ({
        id: e.id, slug: e.slug,
        homeTeam: e.home_team, awayTeam: e.away_team,
        homeFlag: e.home_flag, awayFlag: e.away_flag,
        kickoffAt: e.kickoff_at,
      })),
    }
    return NextResponse.json(responseData, {
      headers: { 'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=300' }
    })
  } catch (err) {
    console.error('leaderboard error:', err)
    return NextResponse.json({ cities:[], events:[], fas:null }, { status: 500 })
  }
}