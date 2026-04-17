import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'

export const runtime = 'nodejs'
export const revalidate = 0

export async function POST(req: NextRequest) {
  try {
    const { matchId, vibe, sessionId } = await req.json()
    if (!matchId || !vibe) {
      return NextResponse.json({ error: 'Invalid' }, { status: 400 })
    }

    const validVibes = ['fire', 'ecstatic', 'nervous', 'crushed']
    if (!validVibes.includes(vibe)) {
      return NextResponse.json({ error: 'Invalid vibe' }, { status: 400 })
    }

    const supabase = createServiceClient()

    // Write to pulse_votes (existing table - deduped by session)
    await supabase.from('pulse_votes').upsert({
      match_id: matchId,
      session_id: sessionId ?? 'anon',
      vibe,
    }, { onConflict: 'session_id,match_id' })

    // Write to match_pulse (new - per-second aggregation for LiveMatchPulse)
    const bucketTs = new Date(Math.floor(Date.now() / 1000) * 1000).toISOString()
    await supabase.rpc('increment_pulse', {
      p_match_id: matchId,
      p_vibe: vibe,
      p_bucket_ts: bucketTs,
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('vote error:', err)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}