import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'

export const runtime = 'nodejs'

function generateShortId(): string {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789'
  let id = ''
  for (let i = 0; i < 6; i++) id += chars[Math.floor(Math.random() * chars.length)]
  return id
}

// POST: capture a clutch moment (called internally by cron/triggers)
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    const expected = `Bearer ${process.env.CRON_SECRET}`
    if (authHeader !== expected) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { matchId, kind, title, subtitle, minute } = await req.json()
    if (!matchId || !kind) return NextResponse.json({ error: 'Invalid' }, { status: 400 })

    const supabase = createServiceClient()

    // Snapshot current state
    const { data: snap } = await supabase
      .from('snapshots')
      .select('fas_score, total, pulse_fire, pulse_ecstatic, pulse_nervous, pulse_crushed, city_counts')
      .eq('match_id', matchId)
      .order('snapped_at', { ascending: false })
      .limit(1)
      .single()

    const cityCounts = (typeof snap?.city_counts === 'object' && snap?.city_counts) ? snap.city_counts as Record<string, number> : {}
    const topCities = Object.entries(cityCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([city, count]) => ({ city, count }))
    const topCity = topCities[0]?.city

    // Sample recent cheers
    const { data: cheers } = await supabase
      .from('cheers')
      .select('city, flag, text, vibe')
      .eq('match_id', matchId)
      .eq('moderated', true)
      .order('created_at', { ascending: false })
      .limit(3)

    // Generate unique short ID
    let shortId = generateShortId()
    for (let i = 0; i < 3; i++) {
      const { data: exists } = await supabase.from('clutch_moments').select('id').eq('short_id', shortId).maybeSingle()
      if (!exists) break
      shortId = generateShortId()
    }

    const { data: moment, error } = await supabase
      .from('clutch_moments')
      .insert({
        short_id: shortId,
        match_id: matchId,
        kind,
        title: title ?? kindTitle(kind),
        subtitle: subtitle ?? null,
        minute: minute ?? null,
        fas_score: snap?.fas_score ?? 0,
        fans_at_moment: snap?.total ?? 0,
        top_city: topCity,
        cities_data: topCities,
        vibe_snapshot: {
          fire: snap?.pulse_fire ?? 0,
          ecstatic: snap?.pulse_ecstatic ?? 0,
          nervous: snap?.pulse_nervous ?? 0,
          crushed: snap?.pulse_crushed ?? 0,
        },
        cheers_sample: cheers ?? [],
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ ok: true, shortId: moment.short_id, id: moment.id })
  } catch (err) {
    console.error('clutch POST error:', err)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

// GET: fetch moment by short_id OR list recent for a match
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const shortId = url.searchParams.get('id')
    const matchId = url.searchParams.get('matchId')
    const sessionId = url.searchParams.get('sessionId')

    const supabase = createServiceClient()

    if (shortId) {
      const { data: moment } = await supabase
        .from('clutch_moments').select('*').eq('short_id', shortId).single()
      if (!moment) return NextResponse.json({ error: 'Not found' }, { status: 404 })

      // Increment view count
      await supabase.from('clutch_moments').update({ view_count: (moment.view_count ?? 0) + 1 }).eq('id', moment.id)

      // If session provided, add to collection
      if (sessionId) {
        await supabase.from('user_moment_collection').upsert({
          session_id: sessionId, moment_id: moment.id,
        }, { onConflict: 'session_id,moment_id' })
      }

      // Get match details
      const { data: event } = await supabase.from('events').select('home_team, away_team, home_flag, away_flag, kickoff_at, slug').eq('slug', moment.match_id).single()
      return NextResponse.json({ moment, event })
    }

    if (matchId) {
      const { data: moments } = await supabase
        .from('clutch_moments').select('*').eq('match_id', matchId).order('created_at', { ascending: false }).limit(20)
      return NextResponse.json({ moments: moments ?? [] })
    }

    // Default: recent viral moments across all matches
    const { data: moments } = await supabase
      .from('clutch_moments').select('*').order('share_count', { ascending: false }).limit(12)
    return NextResponse.json({ moments: moments ?? [] })
  } catch (err) {
    console.error('clutch GET error:', err)
    return NextResponse.json({ moments: [] })
  }
}

function kindTitle(kind: string): string {
  const titles: Record<string, string> = {
    goal: '⚽ Goal!',
    red_card: '🟥 Red Card',
    penalty: '🎯 Penalty',
    vibe_wave: '⚡ Atmosphere erupts',
    fas_peak: '🔥 Electric Peak',
  }
  return titles[kind] ?? '✨ Clutch moment'
}
